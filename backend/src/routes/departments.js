const { Router } = require('express');
const db = require('../database');
const { authenticate, requirePermission } = require('../middleware/auth');
const { log } = require('../logger');

const router = Router();
router.use(authenticate, requirePermission('hr'));

// Lista de departamentos con conteo de miembros.
router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT d.*, (SELECT COUNT(*) FROM employees e WHERE e.department_id = d.id) AS member_count
    FROM departments d ORDER BY d.name`).all();
  res.json(rows);
});

// Un departamento con sus miembros.
router.get('/:id', (req, res) => {
  const dept = db.prepare('SELECT * FROM departments WHERE id = ?').get(req.params.id);
  if (!dept) return res.status(404).json({ error: 'Departamento no encontrado' });
  const members = db.prepare('SELECT id, employee_code, first_name, last_name, position, active FROM employees WHERE department_id = ? ORDER BY first_name, last_name').all(req.params.id);
  res.json({ ...dept, members });
});

router.post('/', (req, res) => {
  const { name, description, location } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'El nombre del departamento es requerido' });
  const exists = db.prepare('SELECT id FROM departments WHERE name = ?').get(name.trim());
  if (exists) return res.status(409).json({ error: 'Ya existe un departamento con ese nombre' });
  const info = db.prepare('INSERT INTO departments (name, description, location) VALUES (?, ?, ?)').run(name.trim(), description || null, location || null);
  log(req.user, 'create', 'department', info.lastInsertRowid, `Creó departamento: ${name}`);
  res.status(201).json({ id: info.lastInsertRowid, message: 'Departamento creado' });
});

router.put('/:id', (req, res) => {
  const dept = db.prepare('SELECT * FROM departments WHERE id = ?').get(req.params.id);
  if (!dept) return res.status(404).json({ error: 'Departamento no encontrado' });
  const { name, description, location } = req.body;
  if (name && name.trim() !== dept.name) {
    const dup = db.prepare('SELECT id FROM departments WHERE name = ? AND id != ?').get(name.trim(), req.params.id);
    if (dup) return res.status(409).json({ error: 'Ya existe un departamento con ese nombre' });
  }
  db.prepare('UPDATE departments SET name = COALESCE(?, name), description = ?, location = ? WHERE id = ?')
    .run(name ? name.trim() : null, description ?? dept.description, location ?? dept.location, req.params.id);
  log(req.user, 'update', 'department', Number(req.params.id), `Actualizó departamento: ${dept.name}`);
  res.json({ message: 'Departamento actualizado' });
});

router.delete('/:id', (req, res) => {
  const dept = db.prepare('SELECT * FROM departments WHERE id = ?').get(req.params.id);
  if (!dept) return res.status(404).json({ error: 'Departamento no encontrado' });
  // Los empleados quedan sin departamento (SET NULL), no se borran.
  db.prepare('DELETE FROM departments WHERE id = ?').run(req.params.id);
  log(req.user, 'delete', 'department', Number(req.params.id), `Eliminó departamento: ${dept.name}`);
  res.json({ message: 'Departamento eliminado' });
});

// Asignar miembros (empleados existentes) a un departamento — sin duplicar.
router.post('/:id/members', (req, res) => {
  const dept = db.prepare('SELECT * FROM departments WHERE id = ?').get(req.params.id);
  if (!dept) return res.status(404).json({ error: 'Departamento no encontrado' });
  const ids = Array.isArray(req.body.employee_ids) ? req.body.employee_ids : [];
  const upd = db.prepare('UPDATE employees SET department_id = ? WHERE id = ?');
  const tx = db.transaction((list) => { for (const id of list) upd.run(req.params.id, id); });
  tx(ids);
  log(req.user, 'update', 'department', Number(req.params.id), `Asignó ${ids.length} miembro(s) a: ${dept.name}`);
  res.json({ message: `${ids.length} empleado(s) asignado(s)` });
});

// Quitar un miembro del departamento (queda sin departamento).
router.delete('/:id/members/:empId', (req, res) => {
  db.prepare('UPDATE employees SET department_id = NULL WHERE id = ? AND department_id = ?').run(req.params.empId, req.params.id);
  log(req.user, 'update', 'department', Number(req.params.id), `Quitó al empleado ${req.params.empId} del departamento`);
  res.json({ message: 'Empleado removido del departamento' });
});

module.exports = router;
