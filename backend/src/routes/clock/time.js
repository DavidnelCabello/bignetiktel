const { Router } = require('express');
const db = require('../../database');
const { authenticate, requirePermission } = require('../../middleware/auth');
const { log } = require('../../logger');

const router = Router();
router.use(authenticate, requirePermission('hr'));

// Reglas de horas extra (Fase 1): más de 8 h/día se pagan a 1.5×.
const REGULAR_DAY_HOURS = 8;
const OVERTIME_MULTIPLIER = 1.5;

function empName(e) { return `${e.first_name} ${e.last_name || ''}`.trim(); }

// ===== Fichar entrada =====
router.post('/check-in', (req, res) => {
  const { employee_id, method, note } = req.body;
  const emp = db.prepare('SELECT * FROM employees WHERE id = ? AND active = 1').get(employee_id);
  if (!emp) return res.status(404).json({ error: 'Empleado no encontrado o inactivo' });
  const open = db.prepare('SELECT id FROM time_entries WHERE employee_id = ? AND check_out IS NULL').get(employee_id);
  if (open) return res.status(409).json({ error: `${empName(emp)} ya tiene una entrada abierta. Debe fichar salida primero.` });
  const m = ['manual', 'kiosk', 'face'].includes(method) ? method : 'manual';
  const info = db.prepare("INSERT INTO time_entries (employee_id, check_in, method, note) VALUES (?, datetime('now', 'localtime'), ?, ?)")
    .run(employee_id, m, note || null);
  log(req.user, 'check-in', 'time_entry', info.lastInsertRowid, `Entrada: ${empName(emp)} (${emp.employee_code})`);
  const entry = db.prepare('SELECT * FROM time_entries WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ entry, employee: emp, message: `Entrada registrada para ${empName(emp)}` });
});

// ===== Fichar salida =====
router.post('/check-out', (req, res) => {
  const { employee_id } = req.body;
  const emp = db.prepare('SELECT * FROM employees WHERE id = ?').get(employee_id);
  if (!emp) return res.status(404).json({ error: 'Empleado no encontrado' });
  const open = db.prepare('SELECT * FROM time_entries WHERE employee_id = ? AND check_out IS NULL ORDER BY check_in DESC LIMIT 1').get(employee_id);
  if (!open) return res.status(409).json({ error: `${empName(emp)} no tiene una entrada abierta.` });
  db.prepare(`UPDATE time_entries
    SET check_out = datetime('now', 'localtime'),
        hours = ROUND((julianday(datetime('now', 'localtime')) - julianday(check_in)) * 24, 2)
    WHERE id = ?`).run(open.id);
  const entry = db.prepare('SELECT * FROM time_entries WHERE id = ?').get(open.id);
  log(req.user, 'check-out', 'time_entry', open.id, `Salida: ${empName(emp)} — ${entry.hours} h`);
  res.json({ entry, employee: emp, message: `Salida registrada para ${empName(emp)} (${entry.hours} h)` });
});

// ===== Quiénes están fichados ahora =====
router.get('/open', (req, res) => {
  const rows = db.prepare(`SELECT t.*, e.employee_code, e.first_name, e.last_name, e.position
    FROM time_entries t JOIN employees e ON e.id = t.employee_id
    WHERE t.check_out IS NULL ORDER BY t.check_in DESC`).all();
  res.json(rows);
});

// ===== Listado de fichajes (con filtros) =====
router.get('/', (req, res) => {
  const { employee_id, from, to } = req.query;
  let sql = `SELECT t.*, e.employee_code, e.first_name, e.last_name
    FROM time_entries t JOIN employees e ON e.id = t.employee_id WHERE 1=1`;
  const params = [];
  if (employee_id) { sql += ' AND t.employee_id = ?'; params.push(employee_id); }
  if (from) { sql += ' AND date(t.check_in) >= date(?)'; params.push(from); }
  if (to) { sql += ' AND date(t.check_in) <= date(?)'; params.push(to); }
  sql += ' ORDER BY t.check_in DESC LIMIT 500';
  res.json(db.prepare(sql).all(...params));
});

// ===== Alta / corrección manual (RRHH) =====
router.post('/', (req, res) => {
  const { employee_id, check_in, check_out, note } = req.body;
  const emp = db.prepare('SELECT * FROM employees WHERE id = ?').get(employee_id);
  if (!emp) return res.status(404).json({ error: 'Empleado no encontrado' });
  if (!check_in) return res.status(400).json({ error: 'La hora de entrada es requerida' });
  let hours = null;
  if (check_out) {
    if (new Date(check_out) <= new Date(check_in)) return res.status(400).json({ error: 'La salida debe ser posterior a la entrada' });
    hours = db.prepare("SELECT ROUND((julianday(?) - julianday(?)) * 24, 2) AS h").get(check_out, check_in).h;
  }
  const info = db.prepare('INSERT INTO time_entries (employee_id, check_in, check_out, hours, method, note) VALUES (?, ?, ?, ?, ?, ?)')
    .run(employee_id, check_in, check_out || null, hours, 'manual', note || null);
  log(req.user, 'create', 'time_entry', info.lastInsertRowid, `Fichaje manual: ${empName(emp)}`);
  res.status(201).json({ id: info.lastInsertRowid, message: 'Fichaje registrado' });
});

router.put('/:id', (req, res) => {
  const entry = db.prepare('SELECT * FROM time_entries WHERE id = ?').get(req.params.id);
  if (!entry) return res.status(404).json({ error: 'Fichaje no encontrado' });
  const check_in = req.body.check_in || entry.check_in;
  const check_out = req.body.check_out !== undefined ? req.body.check_out : entry.check_out;
  const note = req.body.note !== undefined ? req.body.note : entry.note;
  let hours = null;
  if (check_out) {
    if (new Date(check_out) <= new Date(check_in)) return res.status(400).json({ error: 'La salida debe ser posterior a la entrada' });
    hours = db.prepare("SELECT ROUND((julianday(?) - julianday(?)) * 24, 2) AS h").get(check_out, check_in).h;
  }
  db.prepare('UPDATE time_entries SET check_in = ?, check_out = ?, hours = ?, note = ? WHERE id = ?')
    .run(check_in, check_out || null, hours, note || null, req.params.id);
  log(req.user, 'update', 'time_entry', Number(req.params.id), 'Corrigió un fichaje');
  res.json({ message: 'Fichaje actualizado' });
});

router.delete('/:id', (req, res) => {
  const entry = db.prepare('SELECT * FROM time_entries WHERE id = ?').get(req.params.id);
  if (!entry) return res.status(404).json({ error: 'Fichaje no encontrado' });
  db.prepare('DELETE FROM time_entries WHERE id = ?').run(req.params.id);
  log(req.user, 'delete', 'time_entry', Number(req.params.id), 'Eliminó un fichaje');
  res.json({ message: 'Fichaje eliminado' });
});

// ===== Reporte de horas + cálculo de pago =====
// GET /api/time/report?from=YYYY-MM-DD&to=YYYY-MM-DD[&employee_id=]
router.get('/report', (req, res) => {
  const { from, to, employee_id } = req.query;
  if (!from || !to) return res.status(400).json({ error: 'Rango de fechas (from, to) requerido' });

  let sql = `SELECT t.employee_id, t.check_in, t.hours,
    e.employee_code, e.first_name, e.last_name, e.position, e.department, e.pay_type, e.pay_rate, e.currency
    FROM time_entries t JOIN employees e ON e.id = t.employee_id
    WHERE t.check_out IS NOT NULL AND date(t.check_in) >= date(?) AND date(t.check_in) <= date(?)`;
  const params = [from, to];
  if (employee_id) { sql += ' AND t.employee_id = ?'; params.push(employee_id); }
  const rows = db.prepare(sql).all(...params);

  // Agrupar por empleado → por día, para separar horas regulares de extra.
  const byEmp = new Map();
  for (const r of rows) {
    if (!byEmp.has(r.employee_id)) {
      byEmp.set(r.employee_id, {
        employee_id: r.employee_id, employee_code: r.employee_code,
        name: empName(r), position: r.position, department: r.department,
        pay_type: r.pay_type, pay_rate: r.pay_rate, currency: r.currency,
        days: new Map(),
      });
    }
    const e = byEmp.get(r.employee_id);
    const day = (r.check_in || '').slice(0, 10);
    e.days.set(day, (e.days.get(day) || 0) + (r.hours || 0));
  }

  const report = [...byEmp.values()].map(e => {
    let regular = 0, extra = 0;
    for (const h of e.days.values()) {
      regular += Math.min(h, REGULAR_DAY_HOURS);
      extra += Math.max(0, h - REGULAR_DAY_HOURS);
    }
    const total = regular + extra;
    // Pago: por hora => reg×tarifa + extra×tarifa×1.5. Mensual => se informa el salario fijo.
    const pay = e.pay_type === 'hourly'
      ? round2(regular * e.pay_rate + extra * e.pay_rate * OVERTIME_MULTIPLIER)
      : e.pay_rate;
    return {
      employee_id: e.employee_id, employee_code: e.employee_code, name: e.name,
      position: e.position, department: e.department,
      days_worked: e.days.size, regular_hours: round2(regular), extra_hours: round2(extra), total_hours: round2(total),
      pay_type: e.pay_type, pay_rate: e.pay_rate, currency: e.currency, pay,
    };
  }).sort((a, b) => a.name.localeCompare(b.name));

  res.json({ from, to, regular_day_hours: REGULAR_DAY_HOURS, overtime_multiplier: OVERTIME_MULTIPLIER, employees: report });
});

function round2(n) { return Math.round((n + Number.EPSILON) * 100) / 100; }

module.exports = router;
