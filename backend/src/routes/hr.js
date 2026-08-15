const { Router } = require('express');
const db = require('../database');
const { authenticate, requirePermission } = require('../middleware/auth');
const { notify } = require('../notifications');
const { log } = require('../logger');

const router = Router();
router.use(authenticate, requirePermission('hr'));

function empName(r) { return `${r.first_name} ${r.last_name || ''}`.trim(); }

// ===== Vacaciones / ausencias (bandeja RRHH) =====
router.get('/leaves', (req, res) => {
  const { status } = req.query;
  let sql = `SELECT lr.*, e.employee_code, e.first_name, e.last_name, e.position
    FROM leave_requests lr JOIN employees e ON e.id = lr.employee_id`;
  const params = [];
  if (status) { sql += ' WHERE lr.status = ?'; params.push(status); }
  sql += " ORDER BY CASE lr.status WHEN 'pendiente' THEN 0 ELSE 1 END, lr.created_at DESC";
  res.json(db.prepare(sql).all(...params).map(r => ({ ...r, employee_name: empName(r) })));
});

router.post('/leaves/:id/decide', (req, res) => {
  const { decision, admin_note } = req.body; // 'aprobada' | 'rechazada'
  if (!['aprobada', 'rechazada'].includes(decision)) return res.status(400).json({ error: 'Decisión inválida' });
  const lr = db.prepare('SELECT * FROM leave_requests WHERE id = ?').get(req.params.id);
  if (!lr) return res.status(404).json({ error: 'Solicitud no encontrada' });
  db.prepare("UPDATE leave_requests SET status = ?, admin_note = ?, decided_by = ?, decided_at = datetime('now', 'localtime') WHERE id = ?")
    .run(decision, admin_note || null, req.user.full_name || req.user.username, req.params.id);
  log(req.user, 'leave_decide', 'leave_request', Number(req.params.id), `Solicitud ${decision} (empleado ${lr.employee_id})`);
  res.json({ message: `Solicitud ${decision}` });
});

// Contador de pendientes (para la insignia del menú).
router.get('/leaves/pending-count', (req, res) => {
  res.json({ count: db.prepare("SELECT COUNT(*) c FROM leave_requests WHERE status = 'pendiente'").get().c });
});

// ===== Tickets (bandeja RRHH) =====
router.get('/tickets', (req, res) => {
  const { status } = req.query;
  let sql = `SELECT t.*, e.employee_code, e.first_name, e.last_name,
    (SELECT message FROM ticket_messages m WHERE m.ticket_id = t.id ORDER BY m.id DESC LIMIT 1) AS last_message
    FROM tickets t JOIN employees e ON e.id = t.employee_id`;
  const params = [];
  if (status) { sql += ' WHERE t.status = ?'; params.push(status); }
  sql += ' ORDER BY t.updated_at DESC';
  res.json(db.prepare(sql).all(...params).map(r => ({ ...r, employee_name: empName(r) })));
});

router.get('/tickets/:id', (req, res) => {
  const t = db.prepare(`SELECT t.*, e.employee_code, e.first_name, e.last_name FROM tickets t JOIN employees e ON e.id = t.employee_id WHERE t.id = ?`).get(req.params.id);
  if (!t) return res.status(404).json({ error: 'Ticket no encontrado' });
  const messages = db.prepare('SELECT * FROM ticket_messages WHERE ticket_id = ? ORDER BY id').all(t.id);
  res.json({ ...t, employee_name: empName(t), messages });
});

router.post('/tickets/:id/reply', (req, res) => {
  const t = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id);
  if (!t) return res.status(404).json({ error: 'Ticket no encontrado' });
  if (!req.body.message) return res.status(400).json({ error: 'Mensaje requerido' });
  db.prepare('INSERT INTO ticket_messages (ticket_id, author_type, author_name, message) VALUES (?, ?, ?, ?)')
    .run(t.id, 'admin', req.user.full_name || 'RRHH', req.body.message);
  db.prepare("UPDATE tickets SET updated_at = datetime('now', 'localtime') WHERE id = ?").run(t.id);
  db.prepare("UPDATE notifications SET read = 1 WHERE audience = 'hr' AND link = ?").run(`ticket:${t.id}`);
  notify({ audience: 'employee', employee_id: t.employee_id, type: 'ticket_reply', title: 'RRHH respondió tu ticket', body: t.subject, link: `ticket:${t.id}` });
  res.json({ message: 'Respuesta enviada' });
});

router.post('/tickets/:id/status', (req, res) => {
  const { status } = req.body; // 'abierto' | 'cerrado'
  if (!['abierto', 'cerrado'].includes(status)) return res.status(400).json({ error: 'Estado inválido' });
  db.prepare("UPDATE tickets SET status = ?, updated_at = datetime('now', 'localtime') WHERE id = ?").run(status, req.params.id);
  // Al cerrar, sus notificaciones de RRHH dejan de estar sin leer.
  if (status === 'cerrado') db.prepare("UPDATE notifications SET read = 1 WHERE audience = 'hr' AND link = ?").run(`ticket:${req.params.id}`);
  res.json({ message: `Ticket ${status}` });
});

// Borrar un ticket — solo si está CERRADO (los abiertos no se borran).
router.delete('/tickets/:id', (req, res) => {
  const t = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id);
  if (!t) return res.status(404).json({ error: 'Ticket no encontrado' });
  if (t.status !== 'cerrado') return res.status(400).json({ error: 'Solo puedes borrar tickets cerrados. Ciérralo primero.' });
  db.prepare('DELETE FROM tickets WHERE id = ?').run(t.id); // los mensajes se borran en cascada
  db.prepare('DELETE FROM notifications WHERE link = ?').run(`ticket:${t.id}`);
  log(req.user, 'delete', 'ticket', Number(req.params.id), `Eliminó ticket cerrado #${req.params.id}`);
  res.json({ message: 'Ticket eliminado' });
});

router.get('/tickets/meta/open-count', (req, res) => {
  res.json({ count: db.prepare("SELECT COUNT(*) c FROM tickets WHERE status = 'abierto'").get().c });
});

// ===== Notificaciones de RRHH =====
router.get('/notifications', (req, res) => {
  res.json(db.prepare("SELECT * FROM notifications WHERE audience = 'hr' ORDER BY created_at DESC LIMIT 30").all());
});
router.get('/notifications/unread-count', (req, res) => {
  res.json({ count: db.prepare("SELECT COUNT(*) c FROM notifications WHERE audience = 'hr' AND read = 0").get().c });
});
router.post('/notifications/read', (req, res) => {
  db.prepare("UPDATE notifications SET read = 1 WHERE audience = 'hr'").run();
  res.json({ message: 'ok' });
});

// ===== Empleados trabajando hoy =====
router.get('/working', (req, res) => {
  const working = db.prepare(`SELECT t.id, t.check_in, e.employee_code, e.first_name, e.last_name, e.position, e.photo,
      e.pay_type, e.pay_rate, e.currency, COALESCE(d.name, '') AS department,
      (SELECT COALESCE(SUM(x.hours), 0) FROM time_entries x
        WHERE x.employee_id = e.id AND x.check_out IS NOT NULL
        AND strftime('%Y-%m', x.check_in) = strftime('%Y-%m', 'now', 'localtime')) AS month_hours
    FROM time_entries t JOIN employees e ON e.id = t.employee_id LEFT JOIN departments d ON d.id = e.department_id
    WHERE t.check_out IS NULL ORDER BY t.check_in DESC`).all();
  const left = db.prepare(`SELECT t.id, t.check_in, t.check_out, t.hours, e.employee_code, e.first_name, e.last_name, e.position, e.photo,
      COALESCE(d.name, '') AS department
    FROM time_entries t JOIN employees e ON e.id = t.employee_id LEFT JOIN departments d ON d.id = e.department_id
    WHERE t.check_out IS NOT NULL AND date(t.check_out) = date('now','localtime') ORDER BY t.check_out DESC`).all();
  res.json({ working, left });
});

// ===== Correcciones de horario (bandeja RRHH) =====
router.get('/time-changes', (req, res) => {
  const { status } = req.query;
  let sql = `SELECT tc.*, e.employee_code, e.first_name, e.last_name,
      te.check_in AS current_check_in, te.check_out AS current_check_out, te.hours AS current_hours
    FROM time_change_requests tc JOIN employees e ON e.id = tc.employee_id
    LEFT JOIN time_entries te ON te.id = tc.entry_id`;
  const params = [];
  if (status) { sql += ' WHERE tc.status = ?'; params.push(status); }
  sql += " ORDER BY CASE tc.status WHEN 'pendiente' THEN 0 ELSE 1 END, tc.created_at DESC";
  res.json(db.prepare(sql).all(...params).map(r => ({ ...r, employee_name: `${r.first_name} ${r.last_name || ''}`.trim() })));
});

router.get('/time-changes/pending-count', (req, res) => {
  res.json({ count: db.prepare("SELECT COUNT(*) c FROM time_change_requests WHERE status = 'pendiente'").get().c });
});

router.post('/time-changes/:id/decide', (req, res) => {
  const { decision, admin_note } = req.body;
  if (!['aprobada', 'rechazada'].includes(decision)) return res.status(400).json({ error: 'Decisión inválida' });
  const tc = db.prepare('SELECT * FROM time_change_requests WHERE id = ?').get(req.params.id);
  if (!tc) return res.status(404).json({ error: 'Solicitud no encontrada' });
  if (tc.status !== 'pendiente') return res.status(400).json({ error: 'Esta solicitud ya fue resuelta' });

  if (decision === 'aprobada') {
    // Aplicar el cambio al fichaje.
    if (tc.entry_id) {
      const entry = db.prepare('SELECT * FROM time_entries WHERE id = ? AND employee_id = ?').get(tc.entry_id, tc.employee_id);
      if (entry) {
        const ci = tc.requested_check_in || entry.check_in;
        const co = tc.requested_check_out !== null ? tc.requested_check_out : entry.check_out;
        const hours = co ? db.prepare('SELECT ROUND((julianday(?) - julianday(?)) * 24, 2) AS h').get(co, ci).h : null;
        db.prepare('UPDATE time_entries SET check_in = ?, check_out = ?, hours = ? WHERE id = ?').run(ci, co, hours, entry.id);
      }
    } else if (tc.requested_check_in) {
      // No había fichaje: crear uno.
      const co = tc.requested_check_out;
      const hours = co ? db.prepare('SELECT ROUND((julianday(?) - julianday(?)) * 24, 2) AS h').get(co, tc.requested_check_in).h : null;
      db.prepare("INSERT INTO time_entries (employee_id, check_in, check_out, hours, method, note) VALUES (?, ?, ?, ?, 'manual', 'Corrección aprobada')")
        .run(tc.employee_id, tc.requested_check_in, co, hours);
    }
  }

  db.prepare("UPDATE time_change_requests SET status = ?, admin_note = ?, decided_by = ?, decided_at = datetime('now','localtime') WHERE id = ?")
    .run(decision, admin_note || null, req.user.full_name || req.user.username, req.params.id);
  // Ya resuelta → la notificación de RRHH de esta solicitud deja de estar sin leer.
  db.prepare("UPDATE notifications SET read = 1 WHERE audience = 'hr' AND link = ?").run(`timechange:${tc.id}`);
  notify({ audience: 'employee', employee_id: tc.employee_id, type: 'time_change_decided', title: `Corrección ${decision}`, body: `Tu solicitud del ${tc.date} fue ${decision}`, link: `timechange:${tc.id}` });
  log(req.user, 'time_change_decide', 'time_change_request', Number(req.params.id), `Corrección ${decision} (empleado ${tc.employee_id})`);
  res.json({ message: `Solicitud ${decision}` });
});

// ===== Dashboard / reportes de RRHH =====
const REGULAR_DAY_HOURS = 8;
const OVERTIME_MULTIPLIER = 1.5;
function round2(n) { return Math.round((n + Number.EPSILON) * 100) / 100; }
function addMoney(map, currency, amount) { map[currency] = round2((map[currency] || 0) + amount); }
function overlapDays(s, e, from, to) {
  const a = new Date(Math.max(new Date(s + 'T00:00:00'), new Date(from + 'T00:00:00')));
  const b = new Date(Math.min(new Date(e + 'T00:00:00'), new Date(to + 'T00:00:00')));
  const d = Math.floor((b - a) / 86400000) + 1;
  return d > 0 ? d : 0;
}

// ===== Facturación / Nómina (conectada a las horas) =====
// GET /api/hr/payroll?from&to  → salarios por persona, departamento y general, + vacaciones.
router.get('/payroll', (req, res) => {
  const now = new Date();
  const p = n => String(n).padStart(2, '0');
  const from = req.query.from || `${now.getFullYear()}-${p(now.getMonth() + 1)}-01`;
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const to = req.query.to || `${lastDay.getFullYear()}-${p(lastDay.getMonth() + 1)}-${p(lastDay.getDate())}`;

  const rows = db.prepare(`SELECT t.employee_id, t.check_in, t.hours,
      e.employee_code, e.first_name, e.last_name, e.position, e.pay_type, e.pay_rate, e.currency,
      COALESCE(d.name, 'Sin departamento') AS department
    FROM time_entries t JOIN employees e ON e.id = t.employee_id
    LEFT JOIN departments d ON d.id = e.department_id
    WHERE t.check_out IS NOT NULL AND date(t.check_in) >= date(?) AND date(t.check_in) <= date(?)`).all(from, to);

  const byEmp = new Map();
  for (const r of rows) {
    if (!byEmp.has(r.employee_id)) byEmp.set(r.employee_id, {
      employee_id: r.employee_id, employee_code: r.employee_code, name: `${r.first_name} ${r.last_name || ''}`.trim(),
      position: r.position, department: r.department, pay_type: r.pay_type, pay_rate: r.pay_rate, currency: r.currency, days: new Map(),
    });
    const e = byEmp.get(r.employee_id);
    const day = (r.check_in || '').slice(0, 10);
    e.days.set(day, (e.days.get(day) || 0) + (r.hours || 0));
  }

  // Vacaciones aprobadas que solapan el período (para el pago de vacaciones).
  const vacs = db.prepare(`SELECT employee_id, start_date, end_date FROM leave_requests
    WHERE type = 'vacaciones' AND status = 'aprobada' AND NOT (date(end_date) < date(?) OR date(start_date) > date(?))`).all(from, to);
  const vacDaysByEmp = new Map();
  for (const v of vacs) vacDaysByEmp.set(v.employee_id, (vacDaysByEmp.get(v.employee_id) || 0) + overlapDays(v.start_date, v.end_date, from, to));

  // Empleados con vacaciones pero sin horas también deben aparecer.
  for (const [empId] of vacDaysByEmp) {
    if (!byEmp.has(empId)) {
      const e = db.prepare('SELECT e.*, COALESCE(d.name, \'Sin departamento\') AS department FROM employees e LEFT JOIN departments d ON d.id = e.department_id WHERE e.id = ?').get(empId);
      if (e) byEmp.set(empId, { employee_id: empId, employee_code: e.employee_code, name: `${e.first_name} ${e.last_name || ''}`.trim(), position: e.position, department: e.department, pay_type: e.pay_type, pay_rate: e.pay_rate, currency: e.currency, days: new Map() });
    }
  }

  const general = { worked: {}, vacation: {}, total: {}, total_hours: 0, regular_hours: 0, extra_hours: 0 };
  const deptMap = new Map();

  const employees = [...byEmp.values()].map(e => {
    let regular = 0, extra = 0;
    for (const h of e.days.values()) { regular += Math.min(h, REGULAR_DAY_HOURS); extra += Math.max(0, h - REGULAR_DAY_HOURS); }
    const worked_pay = e.pay_type === 'hourly'
      ? round2(regular * e.pay_rate + extra * e.pay_rate * OVERTIME_MULTIPLIER)
      : e.pay_rate; // salario mensual fijo
    const vacDays = vacDaysByEmp.get(e.employee_id) || 0;
    const vacation_pay = vacDays > 0
      ? (e.pay_type === 'hourly' ? round2(vacDays * REGULAR_DAY_HOURS * e.pay_rate) : round2((e.pay_rate / 30) * vacDays))
      : 0;
    const total = round2(worked_pay + vacation_pay);
    const totalHours = round2(regular + extra);

    general.total_hours = round2(general.total_hours + totalHours);
    general.regular_hours = round2(general.regular_hours + regular);
    general.extra_hours = round2(general.extra_hours + extra);
    addMoney(general.worked, e.currency, worked_pay);
    addMoney(general.vacation, e.currency, vacation_pay);
    addMoney(general.total, e.currency, total);

    if (!deptMap.has(e.department)) deptMap.set(e.department, { department: e.department, hours: 0, total: {} });
    const dep = deptMap.get(e.department);
    dep.hours = round2(dep.hours + totalHours);
    addMoney(dep.total, e.currency, total);

    return {
      employee_code: e.employee_code, name: e.name, position: e.position, department: e.department,
      days_worked: e.days.size, regular_hours: round2(regular), extra_hours: round2(extra), total_hours: totalHours,
      pay_type: e.pay_type, pay_rate: e.pay_rate, currency: e.currency,
      worked_pay, vacation_days: vacDays, vacation_pay, total,
    };
  }).sort((a, b) => a.name.localeCompare(b.name));

  const by_department = [...deptMap.values()].sort((a, b) => a.department.localeCompare(b.department));
  res.json({ from, to, general, by_department, employees });
});

router.get('/dashboard', (req, res) => {
  // Período: por defecto el mes en curso.
  const now = new Date();
  const p = n => String(n).padStart(2, '0');
  const from = req.query.from || `${now.getFullYear()}-${p(now.getMonth() + 1)}-01`;
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const to = req.query.to || `${lastDay.getFullYear()}-${p(lastDay.getMonth() + 1)}-${p(lastDay.getDate())}`;

  const headcount = db.prepare("SELECT COUNT(*) c FROM employees WHERE active = 1").get().c;
  const departments = db.prepare("SELECT COUNT(*) c FROM departments").get().c;
  const clocked_in = db.prepare("SELECT COUNT(*) c FROM time_entries WHERE check_out IS NULL").get().c;
  const pending_leaves = db.prepare("SELECT COUNT(*) c FROM leave_requests WHERE status = 'pendiente'").get().c;
  const open_tickets = db.prepare("SELECT COUNT(*) c FROM tickets WHERE status = 'abierto'").get().c;

  // Fichajes completos del período con departamento.
  const rows = db.prepare(`SELECT t.employee_id, t.check_in, t.hours, e.first_name, e.last_name,
      COALESCE(d.name, 'Sin departamento') AS department
    FROM time_entries t JOIN employees e ON e.id = t.employee_id
    LEFT JOIN departments d ON d.id = e.department_id
    WHERE t.check_out IS NOT NULL AND date(t.check_in) >= date(?) AND date(t.check_in) <= date(?)`).all(from, to);

  // Total, regular/extra (agrupando por empleado→día), por departamento y top empleados.
  const perEmpDay = new Map();  // key emp|day -> hours
  const byDept = new Map();
  const byEmp = new Map();
  let total = 0;
  for (const r of rows) {
    const h = r.hours || 0;
    total += h;
    byDept.set(r.department, (byDept.get(r.department) || 0) + h);
    const nm = `${r.first_name} ${r.last_name || ''}`.trim();
    byEmp.set(nm, (byEmp.get(nm) || 0) + h);
    const k = r.employee_id + '|' + (r.check_in || '').slice(0, 10);
    perEmpDay.set(k, (perEmpDay.get(k) || 0) + h);
  }
  let regular = 0, extra = 0;
  for (const h of perEmpDay.values()) { regular += Math.min(h, REGULAR_DAY_HOURS); extra += Math.max(0, h - REGULAR_DAY_HOURS); }

  const by_department = [...byDept.entries()].map(([department, hours]) => ({ department, hours: round2(hours) })).sort((a, b) => b.hours - a.hours);
  const top_employees = [...byEmp.entries()].map(([name, hours]) => ({ name, hours: round2(hours) })).sort((a, b) => b.hours - a.hours).slice(0, 5);

  res.json({
    from, to,
    headcount, departments, clocked_in, pending_leaves, open_tickets,
    total_hours: round2(total), regular_hours: round2(regular), extra_hours: round2(extra),
    by_department, top_employees,
  });
});

module.exports = router;
