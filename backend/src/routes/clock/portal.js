const { Router } = require('express');
const bcrypt = require('bcryptjs');
const db = require('../../database');
const { authenticateEmployee, generateToken } = require('../../middleware/auth');
const { notify } = require('../../notifications');
const { log } = require('../../logger');

const router = Router();

const REGULAR_DAY_HOURS = 8;
const OVERTIME_MULTIPLIER = 1.5;

// Datos del empleado que el portal puede exponer (sin biométricos ni password).
function portalData(e) {
  const dept = e.department_id ? db.prepare('SELECT name FROM departments WHERE id = ?').get(e.department_id) : null;
  return {
    id: e.id, employee_code: e.employee_code, first_name: e.first_name, second_name: e.second_name,
    last_name: e.last_name, position: e.position, department: dept?.name || null,
    email: e.email, phone: e.phone, address: e.address, birth_date: e.birth_date,
    document_type: e.document_type, hire_date: e.hire_date,
    pay_type: e.pay_type, pay_rate: e.pay_rate, currency: e.currency,
    photo: e.photo, must_change_password: !!e.must_change_password,
  };
}

// ===== Login del empleado (con su ID de empleado + contraseña) =====
router.post('/login', (req, res) => {
  const { employee_code, password } = req.body;
  if (!employee_code || !password) return res.status(400).json({ error: 'ID de empleado y contraseña requeridos' });
  const emp = db.prepare('SELECT * FROM employees WHERE employee_code = ? AND active = 1').get(String(employee_code));
  if (!emp || !emp.password || !bcrypt.compareSync(password, emp.password)) {
    log(null, 'portal_login_failed', 'employee', null, 'Intento fallido de portal: ' + employee_code);
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }
  db.prepare("UPDATE employees SET portal_last_login = datetime('now', 'localtime') WHERE id = ?").run(emp.id);
  const token = generateToken({ emp: true, employee_id: emp.id, employee_code: emp.employee_code, token_version: emp.token_version });
  res.json({ token, employee: portalData(emp) });
});

// A partir de aquí, todo requiere sesión de empleado.
router.use(authenticateEmployee);

router.get('/me', (req, res) => {
  const emp = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.employee.employee_id);
  if (!emp) return res.status(404).json({ error: 'Empleado no encontrado' });
  res.json({ employee: portalData(emp) });
});

// Cambio de contraseña (obligatorio en el primer inicio).
router.post('/change-password', (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
  const emp = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.employee.employee_id);
  if (!bcrypt.compareSync(currentPassword || '', emp.password)) return res.status(400).json({ error: 'Contraseña actual incorrecta' });
  db.prepare('UPDATE employees SET password = ?, must_change_password = 0, token_version = token_version + 1 WHERE id = ?')
    .run(bcrypt.hashSync(newPassword, 10), emp.id);
  log({ id: null, username: emp.employee_code }, 'portal_change_password', 'employee', emp.id, `Empleado ${emp.employee_code} cambió su contraseña`);
  res.json({ message: 'Contraseña actualizada. Inicia sesión nuevamente.' });
});

// El empleado puede editar SOLO datos de contacto (no salario, no biométricos, no horas).
router.put('/profile', (req, res) => {
  const { phone, email, address } = req.body;
  db.prepare('UPDATE employees SET phone = COALESCE(?, phone), email = COALESCE(?, email), address = COALESCE(?, address) WHERE id = ?')
    .run(phone ?? null, email ?? null, address ?? null, req.employee.employee_id);
  const emp = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.employee.employee_id);
  res.json({ employee: portalData(emp), message: 'Perfil actualizado' });
});

router.put('/photo', (req, res) => {
  const { photo } = req.body;
  if (photo) {
    const ok = /^data:image\/(jpeg|png|gif|webp);base64,/.test(photo);
    if (!ok) return res.status(400).json({ error: 'Formato de imagen no válido' });
  }
  db.prepare('UPDATE employees SET photo = ? WHERE id = ?').run(photo || null, req.employee.employee_id);
  res.json({ photo: photo || null, message: 'Foto actualizada' });
});

// Mis fichajes (para el calendario). Solo lectura.
router.get('/time', (req, res) => {
  const { from, to } = req.query;
  let sql = 'SELECT id, check_in, check_out, hours, method FROM time_entries WHERE employee_id = ?';
  const params = [req.employee.employee_id];
  if (from) { sql += ' AND date(check_in) >= date(?)'; params.push(from); }
  if (to) { sql += ' AND date(check_in) <= date(?)'; params.push(to); }
  sql += ' ORDER BY check_in DESC LIMIT 500';
  res.json(db.prepare(sql).all(...params));
});

// Resumen del mes en curso: horas + pago estimado.
router.get('/summary', (req, res) => {
  const emp = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.employee.employee_id);
  const rows = db.prepare(`SELECT date(check_in) AS day, SUM(hours) AS h FROM time_entries
    WHERE employee_id = ? AND check_out IS NOT NULL AND strftime('%Y-%m', check_in) = strftime('%Y-%m', 'now', 'localtime')
    GROUP BY day`).all(emp.id);
  let regular = 0, extra = 0;
  for (const r of rows) { regular += Math.min(r.h || 0, REGULAR_DAY_HOURS); extra += Math.max(0, (r.h || 0) - REGULAR_DAY_HOURS); }
  const pay = emp.pay_type === 'hourly'
    ? Math.round((regular * emp.pay_rate + extra * emp.pay_rate * OVERTIME_MULTIPLIER + Number.EPSILON) * 100) / 100
    : emp.pay_rate;
  res.json({
    days_worked: rows.length, regular_hours: round2(regular), extra_hours: round2(extra), total_hours: round2(regular + extra),
    pay, pay_type: emp.pay_type, pay_rate: emp.pay_rate, currency: emp.currency,
    open: !!db.prepare('SELECT 1 FROM time_entries WHERE employee_id = ? AND check_out IS NULL').get(emp.id),
  });
});

function round2(n) { return Math.round((n + Number.EPSILON) * 100) / 100; }

// Días inclusivos entre dos fechas YYYY-MM-DD.
function daysBetween(start, end) {
  const a = new Date(start + 'T00:00:00'), b = new Date(end + 'T00:00:00');
  return Math.floor((b - a) / 86400000) + 1;
}
function empFullName(e) { return `${e.first_name} ${e.last_name || ''}`.trim(); }

function vacationBalance(emp) {
  const year = new Date().getFullYear();
  const used = db.prepare(`SELECT COALESCE(SUM(days),0) AS d FROM leave_requests
    WHERE employee_id = ? AND type = 'vacaciones' AND status = 'aprobada' AND strftime('%Y', start_date) = ?`)
    .get(emp.id, String(year)).d;
  const allowance = emp.vacation_days_per_year || 0;
  return { year, allowance, used, remaining: Math.max(0, allowance - used) };
}

// ===== Vacaciones / ausencias (empleado) =====
router.get('/leaves', (req, res) => {
  const emp = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.employee.employee_id);
  const requests = db.prepare('SELECT * FROM leave_requests WHERE employee_id = ? ORDER BY created_at DESC').all(emp.id);
  res.json({ balance: vacationBalance(emp), requests });
});

router.post('/leaves', (req, res) => {
  const { type, start_date, end_date, reason } = req.body;
  if (!start_date || !end_date) return res.status(400).json({ error: 'Fechas de inicio y fin requeridas' });
  if (new Date(end_date) < new Date(start_date)) return res.status(400).json({ error: 'La fecha fin no puede ser anterior al inicio' });
  const t = ['vacaciones', 'enfermedad', 'personal'].includes(type) ? type : 'vacaciones';
  const days = daysBetween(start_date, end_date);
  const info = db.prepare('INSERT INTO leave_requests (employee_id, type, start_date, end_date, days, reason) VALUES (?, ?, ?, ?, ?, ?)')
    .run(req.employee.employee_id, t, start_date, end_date, days, reason || null);
  log({ id: null, username: req.employee.employee_code }, 'leave_request', 'employee', req.employee.employee_id, `Solicitó ${t} (${days}d)`);
  res.status(201).json({ id: info.lastInsertRowid, message: 'Solicitud enviada' });
});

router.delete('/leaves/:id', (req, res) => {
  const lr = db.prepare('SELECT * FROM leave_requests WHERE id = ? AND employee_id = ?').get(req.params.id, req.employee.employee_id);
  if (!lr) return res.status(404).json({ error: 'Solicitud no encontrada' });
  if (lr.status !== 'pendiente') return res.status(400).json({ error: 'Solo puedes cancelar solicitudes pendientes' });
  db.prepare('DELETE FROM leave_requests WHERE id = ?').run(req.params.id);
  res.json({ message: 'Solicitud cancelada' });
});

// ===== Tickets a RRHH (empleado) =====
router.get('/tickets', (req, res) => {
  const rows = db.prepare(`SELECT t.*,
    (SELECT message FROM ticket_messages m WHERE m.ticket_id = t.id ORDER BY m.id DESC LIMIT 1) AS last_message
    FROM tickets t WHERE t.employee_id = ? ORDER BY t.updated_at DESC`).all(req.employee.employee_id);
  res.json(rows);
});

router.post('/tickets', (req, res) => {
  const { subject, message } = req.body;
  if (!subject || !message) return res.status(400).json({ error: 'Asunto y mensaje requeridos' });
  const emp = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.employee.employee_id);
  const info = db.prepare('INSERT INTO tickets (employee_id, subject) VALUES (?, ?)').run(emp.id, subject);
  db.prepare('INSERT INTO ticket_messages (ticket_id, author_type, author_name, message) VALUES (?, ?, ?, ?)')
    .run(info.lastInsertRowid, 'empleado', empFullName(emp), message);
  notify({ audience: 'hr', type: 'ticket_new', title: 'Nuevo ticket', body: `${empFullName(emp)}: ${subject}`, link: `ticket:${info.lastInsertRowid}` });
  res.status(201).json({ id: info.lastInsertRowid, message: 'Ticket enviado a Recursos Humanos' });
});

router.get('/tickets/:id', (req, res) => {
  const t = db.prepare('SELECT * FROM tickets WHERE id = ? AND employee_id = ?').get(req.params.id, req.employee.employee_id);
  if (!t) return res.status(404).json({ error: 'Ticket no encontrado' });
  const messages = db.prepare('SELECT * FROM ticket_messages WHERE ticket_id = ? ORDER BY id').all(t.id);
  res.json({ ...t, messages });
});

// El empleado puede borrar sus propios tickets CERRADOS.
router.delete('/tickets/:id', (req, res) => {
  const t = db.prepare('SELECT * FROM tickets WHERE id = ? AND employee_id = ?').get(req.params.id, req.employee.employee_id);
  if (!t) return res.status(404).json({ error: 'Ticket no encontrado' });
  if (t.status !== 'cerrado') return res.status(400).json({ error: 'Solo puedes borrar tickets cerrados.' });
  db.prepare('DELETE FROM tickets WHERE id = ?').run(t.id); // mensajes en cascada
  db.prepare('DELETE FROM notifications WHERE link = ?').run(`ticket:${t.id}`);
  res.json({ message: 'Ticket eliminado' });
});

router.post('/tickets/:id/reply', (req, res) => {
  const t = db.prepare('SELECT * FROM tickets WHERE id = ? AND employee_id = ?').get(req.params.id, req.employee.employee_id);
  if (!t) return res.status(404).json({ error: 'Ticket no encontrado' });
  if (!req.body.message) return res.status(400).json({ error: 'Mensaje requerido' });
  const emp = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.employee.employee_id);
  db.prepare('INSERT INTO ticket_messages (ticket_id, author_type, author_name, message) VALUES (?, ?, ?, ?)')
    .run(t.id, 'empleado', empFullName(emp), req.body.message);
  db.prepare("UPDATE tickets SET updated_at = datetime('now', 'localtime'), status = 'abierto' WHERE id = ?").run(t.id);
  notify({ audience: 'hr', type: 'ticket_reply', title: 'Respuesta en ticket', body: `${empFullName(emp)} respondió: ${t.subject}`, link: `ticket:${t.id}` });
  res.json({ message: 'Respuesta enviada' });
});

// ===== Solicitudes de corrección de horario (empleado) =====
router.get('/time-changes', (req, res) => {
  res.json(db.prepare('SELECT * FROM time_change_requests WHERE employee_id = ? ORDER BY created_at DESC LIMIT 50').all(req.employee.employee_id));
});

router.post('/time-changes', (req, res) => {
  const { entry_id, date, check_in, check_out, reason_type, reason } = req.body;
  if (!date) return res.status(400).json({ error: 'Falta la fecha a corregir' });
  const rci = check_in ? `${date} ${check_in}:00` : null;
  const rco = check_out ? `${date} ${check_out}:00` : null;
  if (!rci && !rco) return res.status(400).json({ error: 'Indica al menos una hora a corregir (entrada o salida)' });
  const emp = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.employee.employee_id);
  const info = db.prepare(`INSERT INTO time_change_requests
    (employee_id, entry_id, date, requested_check_in, requested_check_out, reason_type, reason)
    VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(emp.id, entry_id || null, date, rci, rco, reason_type || null, reason || null);
  notify({ audience: 'hr', type: 'time_change', title: 'Solicitud de corrección', body: `${empFullName(emp)}: horario del ${date}`, link: `timechange:${info.lastInsertRowid}` });
  res.status(201).json({ id: info.lastInsertRowid, message: 'Solicitud enviada a Recursos Humanos' });
});

// ===== Notificaciones del empleado =====
router.get('/notifications', (req, res) => {
  res.json(db.prepare('SELECT * FROM notifications WHERE audience = ? AND employee_id = ? ORDER BY created_at DESC LIMIT 30').all('employee', req.employee.employee_id));
});
router.get('/notifications/unread-count', (req, res) => {
  res.json({ count: db.prepare('SELECT COUNT(*) c FROM notifications WHERE audience = ? AND employee_id = ? AND read = 0').get('employee', req.employee.employee_id).c });
});
router.post('/notifications/read', (req, res) => {
  db.prepare('UPDATE notifications SET read = 1 WHERE audience = ? AND employee_id = ?').run('employee', req.employee.employee_id);
  res.json({ message: 'ok' });
});

module.exports = router;
