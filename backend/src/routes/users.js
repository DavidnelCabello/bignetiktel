const { Router } = require('express');
const bcrypt = require('bcryptjs');
const db = require('../database');
const { authenticate } = require('../middleware/auth');
const { log } = require('../logger');

const router = Router();
router.use(authenticate);

function requireSuperAdmin(req, res, next) {
  if (req.user.role !== 'super_admin') return res.status(403).json({ error: 'Solo el super administrador puede gestionar usuarios' });
  next();
}

router.get('/', requireSuperAdmin, (req, res) => {
  const users = db.prepare('SELECT id, username, full_name, email, phone, role, active, created_at FROM users ORDER BY created_at DESC').all();
  res.json(users);
});

router.get('/:id', requireSuperAdmin, (req, res) => {
  const user = db.prepare('SELECT id, username, full_name, email, phone, avatar, role, active, created_at FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(user);
});

router.post('/', requireSuperAdmin, (req, res) => {
  const { username, password, full_name, role } = req.body;
  if (!username || !password || !full_name) return res.status(400).json({ error: 'Usuario, contraseña y nombre requeridos' });
  const exists = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (exists) return res.status(400).json({ error: 'El nombre de usuario ya existe' });
  const userRole = role === 'super_admin' ? 'super_admin' : 'admin';
  const insert = db.prepare('INSERT INTO users (username, password, full_name, role) VALUES (?, ?, ?, ?)').run(username, bcrypt.hashSync(password, 10), full_name, userRole);
  log(req.user, 'create', 'user', insert.lastInsertRowid, 'Creó usuario: ' + username + ' (' + userRole + ')');
  res.status(201).json({ message: 'Usuario creado' });
});

router.put('/:id', requireSuperAdmin, (req, res) => {
  const { full_name, role, active, email, phone } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  if (Number(req.params.id) === req.user.id && active === 0) return res.status(400).json({ error: 'No puedes desactivarte a ti mismo' });
  const userRole = role !== undefined ? (role === 'super_admin' ? 'super_admin' : 'admin') : null;
  db.prepare('UPDATE users SET full_name = COALESCE(?, full_name), role = COALESCE(?, role), active = COALESCE(?, active), email = COALESCE(?, email), phone = COALESCE(?, phone) WHERE id = ?').run(full_name || null, userRole, active !== undefined ? (active ? 1 : 0) : null, email || null, phone || null, req.params.id);
  log(req.user, 'update', 'user', Number(req.params.id), 'Actualizó usuario ID ' + req.params.id + ' (' + user.username + ')');
  res.json({ message: 'Usuario actualizado' });
});

router.put('/:id/reset-password', requireSuperAdmin, (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Nueva contraseña requerida' });
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  db.prepare('UPDATE users SET password = ?, token_version = token_version + 1 WHERE id = ?').run(bcrypt.hashSync(password, 10), req.params.id);
  log(req.user, 'reset-password', 'user', Number(req.params.id), 'Restableció contraseña de: ' + user.username);
  res.json({ message: 'Contraseña restablecida' });
});

module.exports = router;
