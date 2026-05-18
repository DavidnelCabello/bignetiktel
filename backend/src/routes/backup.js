const { Router } = require('express');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const db = require('../database');
const { authenticate } = require('../middleware/auth');
const { log } = require('../logger');

const router = Router();
const SECRET = process.env.JWT_SECRET || 'BigNetiK2024SecretKey';

const DB_PATH = path.join(__dirname, '..', '..', 'bignetiktel.db');
const BACKUPS_DIR = path.join(__dirname, '..', '..', 'backups');

// Download route uses query param auth so window.open works — must be before router.use(authenticate)
router.get('/download', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1] || req.query.auth;
  if (!token) return res.status(401).json({ error: 'Token requerido' });
  try {
    const user = jwt.verify(token, SECRET);
    if (user.role !== 'super_admin') return res.status(403).json({ error: 'Solo super admin' });
    if (!fs.existsSync(DB_PATH)) return res.status(404).json({ error: 'Base de datos no encontrada' });
    res.download(DB_PATH, `bignetiktel-backup-${new Date().toISOString().slice(0, 10)}.db`);
  } catch { res.status(401).json({ error: 'Token inválido' }); }
});

router.use(authenticate);

function checkSuperAdmin(req, res, next) {
  if (req.user.role !== 'super_admin') return res.status(403).json({ error: 'Solo super admin' });
  next();
}

function ts12h() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  const h = d.getHours(), ampm = h >= 12 ? 'PM' : 'AM';
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}_${p(h%12||12)}-${p(d.getMinutes())}-${p(d.getSeconds())}-${ampm}`;
}
function createBackupFile(name) {
  if (!fs.existsSync(BACKUPS_DIR)) fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  const dest = path.join(BACKUPS_DIR, name || `bignetiktel-${ts12h()}.db`);
  fs.copyFileSync(DB_PATH, dest);
  const files = fs.readdirSync(BACKUPS_DIR).filter(f => f.endsWith('.db')).sort().reverse();
  for (let i = 30; i < files.length; i++) fs.unlinkSync(path.join(BACKUPS_DIR, files[i]));
  return dest;
}

router.post('/create', checkSuperAdmin, (req, res) => {
  try {
    const dest = createBackupFile();
    log(req.user, 'backup', 'system', null, 'Creó copia de seguridad manual');
    res.json({ message: 'Copia creada', file: path.basename(dest) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/restore', checkSuperAdmin, (req, res) => {
  const { backupFile } = req.body;
  if (!backupFile) return res.status(400).json({ error: 'Nombre de archivo requerido' });
  const src = path.join(BACKUPS_DIR, path.basename(backupFile));
  if (!fs.existsSync(src)) return res.status(404).json({ error: 'Archivo no encontrado' });
  try {
    log({ id: req.user.id, username: req.user.username }, 'restore', 'system', null, 'Restauró copia de seguridad: ' + backupFile);
    db.close();
    fs.copyFileSync(src, DB_PATH);
    res.json({ message: 'Base de datos restaurada. Debe reiniciar el servidor.' });
    process.exit(0);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/list', checkSuperAdmin, (req, res) => {
  if (!fs.existsSync(BACKUPS_DIR)) return res.json([]);
  const files = fs.readdirSync(BACKUPS_DIR).filter(f => f.endsWith('.db')).map(f => {
    const stat = fs.statSync(path.join(BACKUPS_DIR, f));
    return { name: f, size: stat.size, date: stat.mtime };
  }).sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json(files);
});

router.delete('/:name', checkSuperAdmin, (req, res) => {
  const name = path.basename(req.params.name);
  if (!name.endsWith('.db')) return res.status(400).json({ error: 'Nombre inválido' });
  const file = path.join(BACKUPS_DIR, name);
  if (!fs.existsSync(file)) return res.status(404).json({ error: 'Archivo no encontrado' });
  fs.unlinkSync(file);
  log(req.user, 'delete', 'backup', null, 'Eliminó copia: ' + name);
  res.json({ message: 'Eliminado' });
});

router.get('/auto-status', checkSuperAdmin, (req, res) => {
  const val = db.prepare("SELECT value FROM settings WHERE key = 'auto_backup'").get();
  res.json({ enabled: val?.value === '1' });
});

router.post('/auto-toggle', checkSuperAdmin, (req, res) => {
  const { enabled } = req.body;
  db.prepare("INSERT INTO settings (key, value) VALUES ('auto_backup', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(enabled ? '1' : '0');
  log(req.user, 'update', 'settings', null, (enabled ? 'Activó' : 'Desactivó') + ' las copias automáticas');
  res.json({ enabled: !!enabled });
});

module.exports = router;
