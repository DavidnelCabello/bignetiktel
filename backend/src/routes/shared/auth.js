const { Router } = require('express');
const bcrypt = require('bcryptjs');
const db = require('../../database');
const { authenticate, generateToken, checkVersion } = require('../../middleware/auth');
const { MODULE_KEYS } = require('../../modules');
const { log } = require('../../logger');
const nodemailer = require('nodemailer');

const router = Router();

function getSetting(key, def) {
  const r = db.prepare("SELECT value FROM settings WHERE key = ?").get(key);
  return r ? r.value : def;
}

function validatePassword(password) {
  const minLen = Number(getSetting('password_min_length', '4'));
  const reqUpper = getSetting('password_require_uppercase', '0') === '1';
  const reqNum = getSetting('password_require_numbers', '0') === '1';
  if (password.length < minLen) return `Mínimo ${minLen} caracteres`;
  if (reqUpper && !/[A-Z]/.test(password)) return 'Debe contener mayúsculas';
  if (reqNum && !/\d/.test(password)) return 'Debe contener números';
  return null;
}

function userData(user) {
  // super_admin: acceso total → devolvemos todas las claves de módulo.
  let permissions;
  if (user.role === 'super_admin') permissions = MODULE_KEYS;
  else { try { permissions = JSON.parse(user.permissions || '[]'); } catch { permissions = []; } }
  return { id: user.id, username: user.username, full_name: user.full_name, role: user.role, email: user.email, phone: user.phone, avatar: user.avatar, permissions };
}

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Credenciales requeridas' });
  const user = db.prepare('SELECT * FROM users WHERE username = ? AND active = 1').get(username);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    log(null, 'login_failed', 'user', null, 'Intento fallido de inicio de sesión: ' + username);
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }
  const token = generateToken({ id: user.id, username: user.username, role: user.role, full_name: user.full_name, token_version: user.token_version });
  log({ id: user.id, username: user.username }, 'login', 'user', user.id, 'Inició sesión');
  res.json({ token, user: userData(user) });
});

router.get('/me', authenticate, checkVersion, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(401).json({ error: 'Usuario no encontrado' });
  if (!user.active) return res.status(401).json({ error: 'Usuario desactivado' });
  res.json({ user: userData(user) });
});

router.put('/profile', authenticate, checkVersion, (req, res) => {
  const { full_name, email, phone } = req.body;
  db.prepare('UPDATE users SET full_name = COALESCE(?, full_name), email = COALESCE(?, email), phone = COALESCE(?, phone) WHERE id = ?').run(full_name || null, email || null, phone || null, req.user.id);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  log(req.user, 'update', 'user', req.user.id, 'Actualizó su perfil');
  // Re-emitir token con datos actualizados
  const token = generateToken({ id: user.id, username: user.username, role: user.role, full_name: user.full_name, token_version: user.token_version });
  res.json({ user: userData(user), token, message: 'Perfil actualizado' });
});

router.put('/profile/avatar', authenticate, checkVersion, (req, res) => {
  const { avatar } = req.body;
  if (avatar) {
    const match = avatar.match(/^data:image\/(jpeg|png|gif|webp);base64,/);
    if (!match) return res.status(400).json({ error: 'Formato de imagen no válido. Use JPEG, PNG, GIF o WebP.' });
  }
  db.prepare('UPDATE users SET avatar = ? WHERE id = ?').run(avatar || null, req.user.id);
  log(req.user, 'update', 'user', req.user.id, avatar ? 'Cambió su foto de perfil' : 'Eliminó su foto de perfil');
  res.json({ avatar, message: 'Avatar actualizado' });
});

router.put('/profile/username', authenticate, checkVersion, (req, res) => {
  const { username } = req.body;
  if (!username || username.length < 3) return res.status(400).json({ error: 'El usuario debe tener al menos 3 caracteres' });
  const exists = db.prepare('SELECT id FROM users WHERE username = ? AND id != ?').get(username, req.user.id);
  if (exists) return res.status(409).json({ error: 'El nombre de usuario ya está en uso' });
  db.prepare('UPDATE users SET username = ? WHERE id = ?').run(username, req.user.id);
  log(req.user, 'update', 'user', req.user.id, 'Cambió su nombre de usuario a @' + username);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  const token = generateToken({ id: user.id, username: user.username, role: user.role, full_name: user.full_name, token_version: user.token_version });
  res.json({ username, token, message: 'Usuario actualizado' });
});

router.post('/change-password', authenticate, checkVersion, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const pwdErr = validatePassword(newPassword);
  if (pwdErr) return res.status(400).json({ error: pwdErr });
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!bcrypt.compareSync(currentPassword, user.password)) return res.status(400).json({ error: 'Contraseña actual incorrecta' });
  db.prepare('UPDATE users SET password = ?, token_version = token_version + 1 WHERE id = ?').run(bcrypt.hashSync(newPassword, 10), req.user.id);
  log(req.user, 'change-password', 'user', req.user.id, 'Cambió su contraseña');
  res.json({ message: 'Contraseña actualizada. Debe iniciar sesión nuevamente.' });
});

router.post('/forgot-password', (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: 'Usuario requerido' });
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user || !user.email) return res.status(400).json({ error: 'Usuario no encontrado o sin email configurado' });
  const smtpHost = db.prepare("SELECT value FROM settings WHERE key = 'smtp_host'").get();
  const smtpPort = db.prepare("SELECT value FROM settings WHERE key = 'smtp_port'").get();
  const smtpUser = db.prepare("SELECT value FROM settings WHERE key = 'smtp_user'").get();
  const smtpPass = db.prepare("SELECT value FROM settings WHERE key = 'smtp_pass'").get();
  const fromEmail = db.prepare("SELECT value FROM settings WHERE key = 'smtp_from_email'").get();
  if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) return res.status(400).json({ error: 'SMTP no configurado. Contacte al super administrador.' });
  const token = require('crypto').randomBytes(32).toString('hex');
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run('reset_token_' + user.id, JSON.stringify({ token, expires: Date.now() + 3600000 }));
  const transporter = nodemailer.createTransport({
    host: smtpHost.value, port: Number(smtpPort.value), secure: Number(smtpPort.value) === 465,
    auth: { user: smtpUser.value, pass: smtpPass.value }
  });
  const resetLink = process.env.FRONTEND_URL || 'http://localhost:5173';
  transporter.sendMail({
    from: fromEmail?.value || smtpUser.value, to: user.email,
    subject: 'Restablecer contraseña - BigNetiK Telecom',
    html: `<p>Hola ${user.full_name},</p><p>Has solicitado restablecer tu contraseña.</p><p>Tu código de restablecimiento es:</p><h2>${token}</h2><p>Ingresa este código en <a href="${resetLink}">${resetLink}</a> para crear una nueva contraseña.</p><p>Este código expira en 1 hora.</p>`
  }).then(() => res.json({ message: 'Email enviado si el usuario existe y tiene email configurado.' }))
    .catch(e => { console.error('Email error:', e); res.status(500).json({ error: 'Error al enviar email. Verifique configuración SMTP.' }); });
});

router.post('/reset-password', (req, res) => {
  const { username, token, newPassword } = req.body;
  if (!username || !token || !newPassword) return res.status(400).json({ error: 'Usuario, token y nueva contraseña requeridos' });
  const pwdErr = validatePassword(newPassword);
  if (pwdErr) return res.status(400).json({ error: pwdErr });
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  const stored = db.prepare("SELECT value FROM settings WHERE key = ?").get('reset_token_' + user.id);
  if (!stored) return res.status(400).json({ error: 'No hay solicitud de restablecimiento pendiente' });
  try {
    const data = JSON.parse(stored.value);
    if (data.token !== token) return res.status(400).json({ error: 'Token inválido' });
    if (Date.now() > data.expires) { db.prepare("DELETE FROM settings WHERE key = ?").run('reset_token_' + user.id); return res.status(400).json({ error: 'Token expirado' }); }
    db.prepare('UPDATE users SET password = ?, token_version = token_version + 1 WHERE id = ?').run(bcrypt.hashSync(newPassword, 10), user.id);
    db.prepare("DELETE FROM settings WHERE key = ?").run('reset_token_' + user.id);
    res.json({ message: 'Contraseña restablecida exitosamente' });
  } catch { res.status(400).json({ error: 'Token inválido' }); }
});

module.exports = router;
