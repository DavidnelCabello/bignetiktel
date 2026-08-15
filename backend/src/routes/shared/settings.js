const { Router } = require('express');
const db = require('../../database');
const { authenticate } = require('../../middleware/auth');
const { log } = require('../../logger');

const router = Router();
router.use(authenticate);

function checkSuperAdmin(req, res, next) {
  if (req.user.role !== 'super_admin') return res.status(403).json({ error: 'Solo super admin' });
  next();
}

router.get('/', checkSuperAdmin, (req, res) => {
  const rows = db.prepare('SELECT key, value FROM settings WHERE key NOT LIKE ?').all('reset_token_%');
  const settings = {};
  for (const r of rows) settings[r.key] = r.value;
  res.json(settings);
});

router.put('/', checkSuperAdmin, (req, res) => {
  const allowed = ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_from_email', 'app_name',
    'company_name', 'company_address', 'company_phone', 'company_nit',
    'usd_cup_rate',
    'password_min_length', 'password_require_uppercase', 'password_require_numbers', 'password_expiry_days',
    'company_logo',
    'welcome_email_enabled', 'welcome_email_subject', 'welcome_email_body',
    'kiosk_lock_enabled', 'kiosk_allowed_ips',
    'face_match_threshold', 'face_antispoof_min', 'face_liveness_min',
  ];
  const upsert = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');
  for (const [key, value] of Object.entries(req.body)) {
    if (allowed.includes(key)) upsert.run(key, String(value));
  }
  log(req.user, 'update', 'settings', null, 'Actualizó configuración del sistema');
  res.json({ message: 'Configuración guardada' });
});

module.exports = router;
