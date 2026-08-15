const jwt = require('jsonwebtoken');
const db = require('../database');

const SECRET = process.env.JWT_SECRET;
if (!SECRET) {
  console.error('FATAL: La variable de entorno JWT_SECRET no está configurada.');
  process.exit(1);
}

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return res.status(401).json({ error: 'Token requerido' });
  try { req.user = jwt.verify(header.split(' ')[1], SECRET); next(); }
  catch { res.status(401).json({ error: 'Token inválido' }); }
}

function generateToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: '24h' });
}

// Autenticación del PORTAL DEL EMPLEADO (token marcado con emp:true).
function authenticateEmployee(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return res.status(401).json({ error: 'Token requerido' });
  try {
    const payload = jwt.verify(header.split(' ')[1], SECRET);
    if (!payload.emp) return res.status(401).json({ error: 'Token inválido' });
    const emp = db.prepare('SELECT id, employee_code, active, token_version FROM employees WHERE id = ?').get(payload.employee_id);
    if (!emp || !emp.active) return res.status(401).json({ error: 'Cuenta de empleado inactiva' });
    if (emp.token_version !== (payload.token_version || 0)) return res.status(401).json({ error: 'Sesión expirada. Inicie sesión nuevamente.' });
    req.employee = payload;
    next();
  } catch { res.status(401).json({ error: 'Token inválido' }); }
}

function checkVersion(req, res, next) {
  const user = db.prepare('SELECT token_version FROM users WHERE id = ?').get(req.user.id);
  if (!user || user.token_version !== (req.user.token_version || 0)) return res.status(401).json({ error: 'Sesión expirada. Inicie sesión nuevamente.' });
  next();
}

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'No autorizado' });
  }
  next();
}

// Devuelve la lista de permisos efectiva de un usuario (siempre fresca desde la BD).
function getUserPermissions(userId) {
  const u = db.prepare('SELECT role, permissions, active FROM users WHERE id = ?').get(userId);
  if (!u || !u.active) return null;
  if (u.role === 'super_admin') return { all: true };
  try { return { all: false, list: JSON.parse(u.permissions || '[]') }; }
  catch { return { all: false, list: [] }; }
}

// Exige que el usuario tenga permiso sobre un módulo concreto (super_admin siempre pasa).
function requirePermission(module) {
  return (req, res, next) => {
    const perms = getUserPermissions(req.user.id);
    if (!perms) return res.status(401).json({ error: 'Sesión inválida' });
    if (perms.all || perms.list.includes(module)) return next();
    return res.status(403).json({ error: 'No tienes permiso para acceder a este módulo' });
  };
}

module.exports = { authenticate, authenticateEmployee, generateToken, checkVersion, requireAdmin, requirePermission, getUserPermissions, SECRET };
