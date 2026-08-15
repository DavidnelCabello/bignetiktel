const { Router } = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('../../database');
const { authenticate, requirePermission } = require('../../middleware/auth');
const { sendWelcomeEmail } = require('../../mailer');
const { log } = require('../../logger');

const router = Router();
router.use(authenticate, requirePermission('hr'));

const PAY_TYPES = ['hourly', 'monthly'];
const CURRENCIES = ['USD', 'CUP'];
const DOC_TYPES = ['CI', 'Licencia', 'Pasaporte'];

// Siguiente ID de empleado: número ordenado de 4 dígitos (empieza en 1001).
function nextEmployeeCode() {
  const codes = db.prepare('SELECT employee_code FROM employees').all().map(r => String(r.employee_code));
  const nums = codes.filter(c => /^\d+$/.test(c)).map(Number);
  const base = 1001;
  const next = nums.length ? Math.max(base, Math.max(...nums) + 1) : base;
  return String(next);
}

// Lista de empleados (con nombre de departamento y flag de fichaje abierto).
router.get('/', (req, res) => {
  const { active, q, department_id } = req.query;
  let sql = `SELECT e.*, d.name AS department_name FROM employees e LEFT JOIN departments d ON d.id = e.department_id`;
  const where = [];
  const params = [];
  if (active === '1' || active === '0') { where.push('e.active = ?'); params.push(Number(active)); }
  if (department_id) { where.push('e.department_id = ?'); params.push(department_id); }
  if (q) {
    where.push('(e.employee_code LIKE ? OR e.first_name LIKE ? OR e.last_name LIKE ? OR e.position LIKE ? OR e.document_number LIKE ?)');
    const like = '%' + q + '%';
    params.push(like, like, like, like, like);
  }
  if (where.length) sql += ' WHERE ' + where.join(' AND ');
  sql += ' ORDER BY e.first_name, e.last_name';
  const employees = db.prepare(sql).all(...params);
  const openIds = new Set(db.prepare('SELECT DISTINCT employee_id FROM time_entries WHERE check_out IS NULL').all().map(r => r.employee_id));
  // No enviamos el descriptor facial (grande) en la lista; solo un flag.
  res.json(employees.map(e => { const { face_descriptor, password, ...rest } = e; return { ...rest, clocked_in: openIds.has(e.id), has_face: !!face_descriptor, has_portal: !!password }; }));
});

router.get('/:id', (req, res) => {
  const emp = db.prepare(`SELECT e.*, d.name AS department_name FROM employees e LEFT JOIN departments d ON d.id = e.department_id WHERE e.id = ?`).get(req.params.id);
  if (!emp) return res.status(404).json({ error: 'Empleado no encontrado' });
  const { face_descriptor, password, ...rest } = emp;
  res.json({ ...rest, has_face: !!face_descriptor, has_portal: !!password });
});

router.post('/', (req, res) => {
  const { first_name, second_name, last_name, document_type, document_number, position, department_id,
    address, birth_date, phone, email, hire_date, pay_type, pay_rate, currency, photo, notes } = req.body;
  if (!first_name) return res.status(400).json({ error: 'El nombre es requerido' });
  // ID de empleado automático (o el que envíen, por compatibilidad).
  let employee_code = req.body.employee_code && String(req.body.employee_code).trim();
  if (!employee_code) employee_code = nextEmployeeCode();
  const exists = db.prepare('SELECT id FROM employees WHERE employee_code = ?').get(employee_code);
  if (exists) return res.status(409).json({ error: 'Ya existe un empleado con ese ID' });
  const payType = PAY_TYPES.includes(pay_type) ? pay_type : 'hourly';
  const curr = CURRENCIES.includes(currency) ? currency : 'CUP';
  const docType = DOC_TYPES.includes(document_type) ? document_type : 'CI';
  const info = db.prepare(`INSERT INTO employees
    (employee_code, first_name, second_name, last_name, document_type, document_number, position, department_id,
     address, birth_date, phone, email, hire_date, pay_type, pay_rate, currency, photo, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(employee_code, first_name, second_name || null, last_name || null, docType, document_number || null,
         position || null, department_id || null, address || null, birth_date || null, phone || null, email || null,
         hire_date || null, payType, Number(pay_rate) || 0, curr, photo || null, notes || null);
  log(req.user, 'create', 'employee', info.lastInsertRowid, `Creó empleado: ${first_name} ${last_name || ''} (${employee_code})`);
  res.status(201).json({ id: info.lastInsertRowid, employee_code, message: `Empleado creado con ID ${employee_code}` });
});

router.put('/:id', (req, res) => {
  const emp = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.params.id);
  if (!emp) return res.status(404).json({ error: 'Empleado no encontrado' });
  const { employee_code, first_name, second_name, last_name, document_type, document_number, position, department_id,
    address, birth_date, phone, email, hire_date, pay_type, pay_rate, currency, photo, active, notes } = req.body;
  if (employee_code && employee_code !== emp.employee_code) {
    const dup = db.prepare('SELECT id FROM employees WHERE employee_code = ? AND id != ?').get(employee_code, req.params.id);
    if (dup) return res.status(409).json({ error: 'Ya existe un empleado con ese ID' });
  }
  const payType = pay_type !== undefined ? (PAY_TYPES.includes(pay_type) ? pay_type : emp.pay_type) : null;
  const curr = currency !== undefined ? (CURRENCIES.includes(currency) ? currency : emp.currency) : null;
  const docType = document_type !== undefined ? (DOC_TYPES.includes(document_type) ? document_type : emp.document_type) : null;
  db.prepare(`UPDATE employees SET
    employee_code = COALESCE(?, employee_code),
    first_name = COALESCE(?, first_name),
    second_name = COALESCE(?, second_name),
    last_name = COALESCE(?, last_name),
    document_type = COALESCE(?, document_type),
    document_number = COALESCE(?, document_number),
    position = COALESCE(?, position),
    department_id = COALESCE(?, department_id),
    address = COALESCE(?, address),
    birth_date = COALESCE(?, birth_date),
    phone = COALESCE(?, phone),
    email = COALESCE(?, email),
    hire_date = COALESCE(?, hire_date),
    pay_type = COALESCE(?, pay_type),
    pay_rate = COALESCE(?, pay_rate),
    currency = COALESCE(?, currency),
    photo = COALESCE(?, photo),
    active = COALESCE(?, active),
    notes = COALESCE(?, notes)
    WHERE id = ?`)
    .run(employee_code || null, first_name || null, second_name ?? null, last_name ?? null, docType, document_number ?? null,
         position ?? null, department_id ?? null, address ?? null, birth_date ?? null, phone ?? null, email ?? null,
         hire_date ?? null, payType, pay_rate !== undefined ? Number(pay_rate) : null,
         curr, photo ?? null, active !== undefined ? (active ? 1 : 0) : null, notes ?? null, req.params.id);
  log(req.user, 'update', 'employee', Number(req.params.id), `Actualizó empleado: ${emp.employee_code}`);
  res.json({ message: 'Empleado actualizado' });
});

router.delete('/:id', (req, res) => {
  const emp = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.params.id);
  if (!emp) return res.status(404).json({ error: 'Empleado no encontrado' });
  db.prepare('DELETE FROM employees WHERE id = ?').run(req.params.id);
  log(req.user, 'delete', 'employee', Number(req.params.id), `Eliminó empleado: ${emp.employee_code}`);
  res.json({ message: 'Empleado eliminado' });
});

// Enrola (guarda) el descriptor facial del empleado. El descriptor es un embedding
// (array de floats) calculado en el navegador con Human. Opcionalmente guarda una foto.
router.post('/:id/enroll-face', (req, res) => {
  const emp = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.params.id);
  if (!emp) return res.status(404).json({ error: 'Empleado no encontrado' });
  // Acepta una plantilla (array de números) o varias (array de arrays). Guardamos siempre como array de plantillas.
  let templates = req.body.descriptors || req.body.descriptor;
  if (Array.isArray(templates) && typeof templates[0] === 'number') templates = [templates];
  if (!Array.isArray(templates) || templates.length === 0 || !templates.every(t => Array.isArray(t) && t.length >= 64))
    return res.status(400).json({ error: 'Descriptor facial inválido' });
  db.prepare('UPDATE employees SET face_descriptor = ?, photo = COALESCE(?, photo) WHERE id = ?')
    .run(JSON.stringify(templates), req.body.photo || null, emp.id);
  log(req.user, 'enroll_face', 'employee', emp.id, `Registró biometría facial (${templates.length} plantillas) de: ${emp.employee_code}`);
  res.json({ message: 'Rostro registrado correctamente', templates: templates.length });
});

router.delete('/:id/face', (req, res) => {
  const emp = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.params.id);
  if (!emp) return res.status(404).json({ error: 'Empleado no encontrado' });
  db.prepare('UPDATE employees SET face_descriptor = NULL WHERE id = ?').run(emp.id);
  log(req.user, 'delete_face', 'employee', emp.id, `Eliminó biometría facial de: ${emp.employee_code}`);
  res.json({ message: 'Biometría eliminada' });
});

// Genera (o regenera) una contraseña temporal de acceso al portal del empleado.
// Devuelve la contraseña en claro UNA sola vez y envía el correo de bienvenida.
router.post('/:id/portal-access', async (req, res) => {
  const emp = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.params.id);
  if (!emp) return res.status(404).json({ error: 'Empleado no encontrado' });
  // Contraseña temporal legible de 8 caracteres.
  const temp = crypto.randomBytes(6).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 8) || 'BigN' + Math.floor(1000 + (crypto.randomBytes(2).readUInt16BE(0) % 9000));
  db.prepare('UPDATE employees SET password = ?, must_change_password = 1, token_version = token_version + 1 WHERE id = ?')
    .run(bcrypt.hashSync(temp, 10), emp.id);
  log(req.user, 'portal_access', 'employee', emp.id, `Generó acceso al portal para: ${emp.employee_code}`);
  // Correo de bienvenida automático (si hay email + SMTP + habilitado).
  const portalUrl = (process.env.FRONTEND_URL || '') + '/portal';
  let emailed = false;
  try { emailed = await sendWelcomeEmail(emp, temp, portalUrl); } catch (_) { emailed = false; }
  res.json({ employee_code: emp.employee_code, temp_password: temp, emailed, has_email: !!emp.email,
    message: emailed ? 'Acceso generado y correo de bienvenida enviado.' : 'Acceso generado. Comparte estas credenciales con el empleado.' });
});

module.exports = router;
