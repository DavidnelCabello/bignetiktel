const { Router } = require('express');
const db = require('../database');
const { authenticate } = require('../middleware/auth');
const { log } = require('../logger');
const { sendSaleConfirmation, sendPaymentReceipt, sendLatePaymentReminder } = require('../mailer');

const router = Router();
router.use(authenticate);

router.get('/chart/monthly', (req, res) => {
  const data = db.prepare(`
    SELECT strftime('%Y-%m', sale_date) as month, COUNT(*) as count, COALESCE(SUM(total_with_interest),0) as total, COALESCE(SUM(paid_amount),0) as paid
    FROM sales WHERE status != 'cancelled' GROUP BY month ORDER BY month DESC LIMIT 12
  `).all();
  res.json(data.reverse());
});

router.get('/chart/top-models', (req, res) => {
  const data = db.prepare(`
    SELECT m.name, b.name as brand, COALESCE(SUM(si.quantity),0) as qty, COALESCE(SUM(si.subtotal),0) as total
    FROM sale_items si JOIN models m ON si.model_id = m.id JOIN brands b ON m.brand_id = b.id
    GROUP BY si.model_id ORDER BY qty DESC LIMIT 10
  `).all();
  res.json(data);
});

router.get('/late/count', (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const c = db.prepare("SELECT COUNT(*) as c FROM sales WHERE status = 'active' AND payment_plan = 'installments' AND next_payment_date IS NOT NULL AND next_payment_date < ?").get(today);
  res.json({ count: c.c });
});

router.get('/late', (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const sales = db.prepare(`
    SELECT s.id, s.sale_date, s.next_payment_date, s.paid_amount, s.total_with_interest, s.installment_amount, s.interest_rate, s.term_months, s.status,
      c.id as client_id, c.name as client_name, c.phone,
      (SELECT COALESCE(SUM(si.quantity),0) FROM sale_items si WHERE si.sale_id = s.id) as total_items
    FROM sales s JOIN clients c ON s.client_id = c.id
    WHERE s.status = 'active' AND s.payment_plan = 'installments' AND s.next_payment_date IS NOT NULL AND s.next_payment_date < ?
    ORDER BY s.next_payment_date ASC
  `).all(today);
  res.json(sales.map(s => ({
    ...s,
    days_late: Math.floor((Date.now() - new Date(s.next_payment_date + 'T12:00:00').getTime()) / 86400000),
    pending_amount: +(s.total_with_interest - s.paid_amount).toFixed(2),
  })));
});

router.get('/', (req, res) => {
  res.json(db.prepare(`
    SELECT s.*, c.name as client_name,
      (SELECT COALESCE(SUM(si.quantity),0) FROM sale_items si WHERE si.sale_id = s.id) as total_items,
      (s.total_with_interest - s.paid_amount) as pending_amount
    FROM sales s JOIN clients c ON s.client_id = c.id ORDER BY s.created_at DESC
  `).all());
});

router.get('/:id', (req, res) => {
  const sale = db.prepare('SELECT s.*, c.name as client_name, c.identity_card, c.phone, c.address FROM sales s JOIN clients c ON s.client_id = c.id WHERE s.id = ?').get(req.params.id);
  if (!sale) return res.status(404).json({ error: 'No encontrada' });
  const items = db.prepare('SELECT si.*, m.name as model_name, b.name as brand_name, t.name as type_name FROM sale_items si JOIN models m ON si.model_id = m.id JOIN brands b ON m.brand_id = b.id JOIN equipment_types t ON m.equipment_type_id = t.id WHERE si.sale_id = ?').all(req.params.id);
  const payments = db.prepare('SELECT * FROM payments WHERE sale_id = ? ORDER BY payment_date ASC').all(req.params.id);
  // Calcular próxima fecha de pago si no está en BD
  if (!sale.next_payment_date && sale.payment_plan === 'installments' && sale.status === 'active') {
    if (payments.length > 0) {
      const last = payments[payments.length - 1];
      const d = new Date(last.payment_date);
      d.setMonth(d.getMonth() + 1);
      sale.next_payment_date = d.toISOString().slice(0, 10);
    } else {
      sale.next_payment_date = sale.sale_date;
    }
  }
  res.json({ ...sale, items, payments });
});

router.post('/', (req, res) => {
  const { client_id, items: saleItems, notes, payment_plan, interest_rate, term_months } = req.body;
  if (!client_id || !saleItems || saleItems.length === 0) return res.status(400).json({ error: 'Cliente e items requeridos' });

  const create = db.transaction(() => {
    let total = 0;
    const data = [];
    for (const item of saleItems) {
      const inv = db.prepare('SELECT i.*, m.name as mn FROM inventory i JOIN models m ON i.model_id = m.id WHERE i.model_id = ?').get(item.model_id);
      if (!inv) throw new Error(`Modelo ${item.model_id} sin inventario`);
      if (inv.available_quantity < item.quantity) throw new Error(`Stock insuficiente para ${inv.mn}: disponible ${inv.available_quantity}`);
      const sub = item.quantity * inv.unit_price;
      total += sub;
      data.push({ model_id: item.model_id, quantity: item.quantity, unit_price: inv.unit_price, currency: inv.currency, subtotal: sub, mac_address: item.mac_address || null });
    }

    const plan = payment_plan === 'installments' ? 'installments' : 'full';
    const rate = plan === 'installments' ? (Number(interest_rate) || 0) : 0;
    const months = plan === 'installments' ? (Number(term_months) || 0) : 0;
    const totalWithInterest = plan === 'installments' ? +(total * (1 + rate / 100)).toFixed(2) : total;
    const installmentAmount = months > 0 ? +(totalWithInterest / months).toFixed(2) : 0;

    const initialDate = plan === 'installments' ? new Date().toISOString().slice(0, 10) : null;
    const r = db.prepare("INSERT INTO sales (client_id, total_amount, paid_amount, payment_plan, interest_rate, term_months, total_with_interest, installment_amount, status, notes, next_payment_date, sale_date, created_at, updated_at) VALUES (?, ?, 0, ?, ?, ?, ?, ?, 'active', ?, ?, datetime('now','localtime'), datetime('now','localtime'), datetime('now','localtime'))").run(client_id, total, plan, rate, months, totalWithInterest, installmentAmount, notes || null, initialDate);
    const sid = r.lastInsertRowid;
    const ins = db.prepare('INSERT INTO sale_items (sale_id, model_id, quantity, unit_price, currency, subtotal, mac_address) VALUES (?, ?, ?, ?, ?, ?, ?)');
    const upd = db.prepare('UPDATE inventory SET available_quantity = available_quantity - ?, reserved_quantity = reserved_quantity + ? WHERE model_id = ?');
    for (const d of data) { ins.run(sid, d.model_id, d.quantity, d.unit_price, d.currency, d.subtotal, d.mac_address); upd.run(d.quantity, d.quantity, d.model_id); }
    return { id: sid, total_with_interest: totalWithInterest, installment_amount: installmentAmount, interest_rate: rate, term_months: months, next_payment_date: initialDate };
  });

  try {
    const result = create();
    log(req.user, 'create', 'sale', result.id, 'Creó venta #' + result.id + ' por $' + result.total_with_interest + ' a cliente ID ' + req.body.client_id);
    // Send email confirmation
    try {
      const client = db.prepare('SELECT email, name FROM clients WHERE id = ?').get(req.body.client_id);
      if (client?.email) {
        const items = db.prepare('SELECT si.*, m.name as model_name FROM sale_items si JOIN models m ON si.model_id = m.id WHERE si.sale_id = ?').all(result.id);
        sendSaleConfirmation(client.email, client.name, { id: result.id, payment_plan: req.body.payment_plan, next_payment_date: result.next_payment_date, interest_rate: result.interest_rate, installments: result.term_months }, items, result.total_with_interest);
      }
    } catch (_) {}
    res.status(201).json(result);
  }
  catch (e) { res.status(400).json({ error: e.message }); }
});

router.post('/:id/payment', (req, res) => {
  const { amount, payment_method, notes } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Monto inválido' });

  const process = db.transaction(() => {
    const sale = db.prepare('SELECT * FROM sales WHERE id = ?').get(req.params.id);
    if (!sale) throw new Error('Venta no encontrada');
    if (sale.status === 'completed') throw new Error('Ya completada');
    if (sale.status === 'cancelled') throw new Error('Cancelada');
    const debt = sale.total_with_interest;
    const newPaid = +(sale.paid_amount + amount).toFixed(2);
    if (newPaid > debt) throw new Error(`Excede el saldo. Pendiente: ${+(debt - sale.paid_amount).toFixed(2)}`);

    db.prepare("INSERT INTO payments (sale_id, amount, payment_method, notes, payment_date, created_at) VALUES (?, ?, ?, ?, datetime('now','localtime'), datetime('now','localtime'))").run(req.params.id, amount, payment_method || 'cash', notes || null);
    const newStatus = newPaid >= debt ? 'completed' : 'active';
    let nextDate = null;
    if (newStatus === 'active' && sale.payment_plan === 'installments' && sale.term_months > 0) {
      const lastPay = db.prepare("SELECT payment_date FROM payments WHERE sale_id = ? ORDER BY payment_date DESC LIMIT 1").get(req.params.id);
      if (lastPay) {
        const d = new Date(lastPay.payment_date);
        d.setMonth(d.getMonth() + 1);
        nextDate = d.toISOString().slice(0, 10);
      }
    }
    db.prepare('UPDATE sales SET paid_amount = ?, status = ?, next_payment_date = ? WHERE id = ?').run(newPaid, newStatus, nextDate, req.params.id);

    if (newStatus === 'completed') {
      const items = db.prepare('SELECT * FROM sale_items WHERE sale_id = ?').all(req.params.id);
      const rel = db.prepare('UPDATE inventory SET total_quantity = total_quantity - ?, reserved_quantity = reserved_quantity - ? WHERE model_id = ?');
      for (const item of items) rel.run(item.quantity, item.quantity, item.model_id);
    }
    log(req.user, 'payment', 'sale', Number(req.params.id), 'Registró pago de $' + amount + ' en venta #' + req.params.id + (newStatus === 'completed' ? ' (COMPLETADA)' : ''));
    return { newPaid, newStatus, debt, next_payment_date: nextDate };
  });

  try {
    const result = process();
    // Send payment receipt
    try {
      const client = db.prepare('SELECT email, name FROM clients WHERE id = ?').get(db.prepare('SELECT client_id FROM sales WHERE id = ?').get(req.params.id).client_id);
      if (client?.email) {
        const payments = db.prepare('SELECT * FROM payments WHERE sale_id = ? ORDER BY payment_date ASC').all(req.params.id);
        const paidSoFar = payments.reduce((a, p) => a + p.amount, 0);
        const remaining = +(result.debt - result.newPaid).toFixed(2);
        const termMonths = db.prepare('SELECT term_months FROM sales WHERE id = ?').get(req.params.id).term_months;
        sendPaymentReceipt(client.email, client.name, Number(req.params.id), amount, remaining, payments.length, termMonths || 1, paidSoFar);
      }
    } catch (_) {}
    res.json(result);
  }
  catch (e) { res.status(400).json({ error: e.message }); }
});

router.post('/:id/notify', (req, res) => {
  const sale = db.prepare('SELECT s.*, c.name as client_name, c.email FROM sales s JOIN clients c ON s.client_id = c.id WHERE s.id = ?').get(req.params.id);
  if (!sale) return res.status(404).json({ error: 'No encontrada' });
  if (!sale.email) return res.status(400).json({ error: 'El cliente no tiene email registrado' });
  const daysLate = Math.floor((Date.now() - new Date(sale.next_payment_date + 'T12:00:00').getTime()) / 86400000);
  const pending = +(sale.total_with_interest - sale.paid_amount).toFixed(2);
  sendLatePaymentReminder(sale.email, sale.client_name, sale.id, daysLate, pending, sale.next_payment_date)
    .then(sent => {
      log(req.user, 'notify', 'sale', Number(req.params.id), 'Envió recordatorio de pago atrasado a ' + sale.client_name);
      res.json({ sent, message: sent ? 'Recordatorio enviado' : 'Error al enviar. Verifique configuración SMTP.' });
    });
});

router.post('/:id/cancel', (req, res) => {
  const cancel = db.transaction(() => {
    const sale = db.prepare('SELECT * FROM sales WHERE id = ?').get(req.params.id);
    if (!sale) throw new Error('No encontrada');
    if (sale.status === 'completed') throw new Error('No se puede cancelar una completada');
    if (sale.status === 'cancelled') throw new Error('Ya cancelada');
    const items = db.prepare('SELECT * FROM sale_items WHERE sale_id = ?').all(req.params.id);
    const resInv = db.prepare('UPDATE inventory SET available_quantity = available_quantity + ?, reserved_quantity = reserved_quantity - ? WHERE model_id = ?');
    for (const item of items) resInv.run(item.quantity, item.quantity, item.model_id);
    db.prepare("UPDATE sales SET status = 'cancelled' WHERE id = ?").run(req.params.id);
    log(req.user, 'cancel', 'sale', Number(req.params.id), 'Canceló venta #' + req.params.id);
  });
  try { cancel(); res.json({ message: 'Venta cancelada. Inventario restaurado.' }); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

module.exports = router;
