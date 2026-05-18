const { Router } = require('express');
const db = require('../database');
const { authenticate } = require('../middleware/auth');
const { log } = require('../logger');

const router = Router();
router.use(authenticate);

router.get('/', (req, res) => res.json(db.prepare('SELECT *, COALESCE(first_name, name) as first_name, COALESCE(last_name, \'\') as last_name FROM clients ORDER BY first_name, last_name').all()));

router.post('/', (req, res) => {
  const { first_name, last_name, name, identity_card, address, phone, email, notes, id_document_type, province, city } = req.body;
  const fn = first_name || name || '';
  const ln = last_name || '';
  if (!fn.trim()) return res.status(400).json({ error: 'Nombre requerido' });
  const fullName = `${fn}${ln ? ' ' + ln : ''}`.trim();
  try {
    const r = db.prepare('INSERT INTO clients (name, first_name, last_name, identity_card, address, phone, email, notes, id_document_type, province, city) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(fullName, fn, ln, identity_card || null, address || null, phone || null, email || null, notes || null, id_document_type || 'CI', province || null, city || null);
    const newId = Number(r.lastInsertRowid);
    log(req.user, 'create', 'client', newId, 'Creó cliente: ' + fn + ' ' + ln);
    res.status(201).json({ id: newId, name: fullName });
  } catch (e) { if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'CI ya existe' }); throw e; }
});

router.put('/:id', (req, res) => {
  const { first_name, last_name, name, identity_card, address, phone, email, notes, active, id_document_type, province, city } = req.body;
  const fn = first_name || name || '';
  const ln = last_name || '';
  if (!fn.trim()) return res.status(400).json({ error: 'Nombre requerido' });
  const fullName = `${fn}${ln ? ' ' + ln : ''}`.trim();
  db.prepare('UPDATE clients SET name=?, first_name=?, last_name=?, identity_card=COALESCE(?,identity_card), address=COALESCE(?,address), phone=COALESCE(?,phone), email=COALESCE(?,email), notes=COALESCE(?,notes), active=COALESCE(?,active), id_document_type=COALESCE(?,id_document_type), province=COALESCE(?,province), city=COALESCE(?,city) WHERE id=?')
    .run(fullName, fn, ln, identity_card || null, address || null, phone || null, email || null, notes || null, active !== undefined ? (active ? 1 : 0) : null, id_document_type || null, province || null, city || null, req.params.id);
  log(req.user, 'update', 'client', Number(req.params.id), 'Actualizó cliente ID ' + req.params.id + ': ' + fn + ' ' + ln);
  res.json({ message: 'Actualizado' });
});

router.delete('/:id', (req, res) => {
  const used = db.prepare('SELECT COUNT(*) as c FROM sales WHERE client_id = ?').get(req.params.id);
  if (used.c > 0) return res.status(400).json({ error: 'El cliente tiene ventas' });
  db.prepare('DELETE FROM clients WHERE id = ?').run(req.params.id);
  log(req.user, 'delete', 'client', Number(req.params.id), 'Eliminó cliente #' + req.params.id);
  res.json({ message: 'Eliminado' });
});

router.get('/:id/sales', (req, res) => {
  res.json(db.prepare('SELECT s.*, (SELECT COALESCE(SUM(si.quantity),0) FROM sale_items si WHERE si.sale_id = s.id) as total_items FROM sales s WHERE s.client_id = ? ORDER BY s.created_at DESC').all(req.params.id));
});

router.get('/:id/summary', (req, res) => {
  const client = db.prepare('SELECT *, COALESCE(first_name, name) as first_name, COALESCE(last_name, \'\') as last_name FROM clients WHERE id = ?').get(req.params.id);
  if (!client) return res.status(404).json({ error: 'No encontrado' });
  const stats = db.prepare(`
    SELECT
      COUNT(*) as total_sales,
      COALESCE(SUM(CASE WHEN s.status != 'cancelled' THEN s.total_with_interest ELSE 0 END), 0) as total_debt,
      COALESCE(SUM(s.paid_amount), 0) as total_paid,
      COALESCE(SUM(CASE WHEN s.status = 'active' THEN (s.total_with_interest - s.paid_amount) ELSE 0 END), 0) as pending_amount,
      COALESCE(SUM(CASE WHEN s.status = 'completed' THEN 1 ELSE 0 END), 0) as completed_sales,
      COALESCE(SUM(CASE WHEN s.status = 'active' THEN 1 ELSE 0 END), 0) as active_sales,
      COALESCE(SUM(CASE WHEN s.status = 'cancelled' THEN 1 ELSE 0 END), 0) as cancelled_sales,
      COALESCE(SUM(CASE WHEN s.status = 'pending' THEN 1 ELSE 0 END), 0) as pending_sales
    FROM sales s WHERE s.client_id = ?
  `).get(req.params.id);
  const sales = db.prepare('SELECT s.*, (SELECT COALESCE(SUM(si.quantity),0) FROM sale_items si WHERE si.sale_id = s.id) as total_items FROM sales s WHERE s.client_id = ? ORDER BY s.created_at DESC LIMIT 20').all(req.params.id);
  res.json({ ...client, stats, sales });
});

module.exports = router;
