const jwt = require('jsonwebtoken');
const db = require('../database');
const SECRET = process.env.JWT_SECRET || 'BigNetiK2024SecretKey';

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

module.exports = { authenticate, generateToken, checkVersion };
