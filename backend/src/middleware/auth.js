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

module.exports = { authenticate, generateToken, checkVersion, requireAdmin, SECRET };
