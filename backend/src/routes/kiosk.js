const { Router } = require('express');
const jwt = require('jsonwebtoken');
const db = require('../database');
const { SECRET } = require('../middleware/auth');
const { log } = require('../logger');

const router = Router();

const getSetting = (k, def) => db.prepare('SELECT value FROM settings WHERE key = ?').get(k)?.value ?? def;

// IP normalizada del solicitante (quita el prefijo IPv6-mapeado).
function clientIp(req) {
  return String(req.ip || req.socket?.remoteAddress || '').replace(/^::ffff:/, '');
}

// Muestra al solicitante su propia IP (útil para saber la IP de la tablet).
router.get('/whoami', (req, res) => res.json({ ip: clientIp(req) }));

// Candado por IP: si está activado y hay IPs permitidas, solo esas pasan.
function ipGuard(req, res, next) {
  if (getSetting('kiosk_lock_enabled', '0') !== '1') return next();
  const allowed = String(getSetting('kiosk_allowed_ips', '') || '').split(',').map(s => s.trim()).filter(Boolean);
  if (allowed.length === 0) return next(); // aún sin configurar
  if (allowed.includes(clientIp(req))) return next();
  return res.status(403).json({ error: 'Este dispositivo no está autorizado para el kiosco.' });
}
router.use(ipGuard);

// Similitud coseno entre dos embeddings.
function cosine(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return na && nb ? dot / (Math.sqrt(na) * Math.sqrt(nb)) : 0;
}

function empName(e) { return `${e.first_name} ${e.last_name || ''}`.trim(); }

// Info mínima del empleado para el kiosco (tras teclear su ID).
router.get('/employee/:code', (req, res) => {
  const e = db.prepare('SELECT id, employee_code, first_name, last_name, photo, face_descriptor, active FROM employees WHERE employee_code = ?').get(String(req.params.code));
  if (!e || !e.active) return res.status(404).json({ error: 'Empleado no encontrado' });
  const open = !!db.prepare('SELECT 1 FROM time_entries WHERE employee_id = ? AND check_out IS NULL').get(e.id);
  res.json({ employee_code: e.employee_code, first_name: e.first_name, last_name: e.last_name, photo: e.photo, has_face: !!e.face_descriptor, clocked_in: open });
});

// Verificación facial + fichaje. Todas las capas anti-fraude se validan aquí.
router.post('/identify', (req, res) => {
  const { employee_code, embedding, real, live, blink } = req.body;
  if (!employee_code || !Array.isArray(embedding)) return res.status(400).json({ error: 'Datos incompletos' });
  const e = db.prepare('SELECT * FROM employees WHERE employee_code = ? AND active = 1').get(String(employee_code));
  if (!e) return res.status(404).json({ error: 'Empleado no encontrado' });
  if (!e.face_descriptor) return res.status(400).json({ error: 'Este empleado no tiene rostro registrado. Avisa a Recursos Humanos.' });

  const matchMin = Number(getSetting('face_match_threshold', '0.5'));
  const spoofMin = Number(getSetting('face_antispoof_min', '0.5'));
  const liveMin = Number(getSetting('face_liveness_min', '0.5'));

  // Capa 1: anti-spoofing (foto/pantalla).
  if (real != null && real < spoofMin) {
    log(null, 'kiosk_spoof', 'employee', e.id, `Rechazo anti-spoof (${employee_code})`);
    return res.status(403).json({ error: 'No se detectó una persona real. Intenta de nuevo mirando a la cámara.' });
  }
  // Capa 2: liveness (modelo de vivacidad).
  if (live != null && live < liveMin) return res.status(403).json({ error: 'Prueba de vivacidad no superada. Muévete un poco e intenta otra vez.' });
  // Capa 3: coincidencia del rostro contra TODAS las plantillas (mejor coincidencia).
  let stored; try { stored = JSON.parse(e.face_descriptor); } catch { stored = null; }
  const templates = Array.isArray(stored) && Array.isArray(stored[0]) ? stored : (Array.isArray(stored) ? [stored] : []);
  let sim = 0;
  for (const t of templates) sim = Math.max(sim, cosine(t, embedding));
  if (sim < matchMin) {
    log(null, 'kiosk_nomatch', 'employee', e.id, `Rostro no coincide (${employee_code}, sim ${sim.toFixed(3)})`);
    return res.status(403).json({ error: 'El rostro no coincide con el ID. Verifica tu número de empleado.' });
  }

  const who = { name: empName(e), photo: e.photo, position: e.position };
  const open = db.prepare('SELECT * FROM time_entries WHERE employee_id = ? AND check_out IS NULL ORDER BY check_in DESC LIMIT 1').get(e.id);

  if (open) {
    // Ya está fichado → NO cerrar todavía; pedir confirmación con un token corto (2 min).
    const token = jwt.sign({ kioskCheckout: true, employee_id: e.id, entry_id: open.id }, SECRET, { expiresIn: '2m' });
    return res.json({ ok: true, action: 'confirm_checkout', token, since: open.check_in, employee: who, similarity: Number(sim.toFixed(3)) });
  }

  // No estaba fichado → marcar entrada (el tiempo empieza a correr).
  const info = db.prepare("INSERT INTO time_entries (employee_id, check_in, method) VALUES (?, datetime('now','localtime'), 'face')").run(e.id);
  const entry = db.prepare('SELECT * FROM time_entries WHERE id = ?').get(info.lastInsertRowid);
  log(null, 'check-in', 'time_entry', info.lastInsertRowid, `Kiosco: entrada ${empName(e)}`);
  res.json({ ok: true, action: 'entrada', employee: who, hours: entry.hours, similarity: Number(sim.toFixed(3)) });
});

// Confirmar la salida (tras aceptar en el kiosco). Requiere el token de la verificación facial.
router.post('/checkout', (req, res) => {
  let payload;
  try { payload = jwt.verify(req.body.token || '', SECRET); } catch { return res.status(400).json({ error: 'La confirmación expiró. Vuelve a marcar con tu rostro.' }); }
  if (!payload.kioskCheckout) return res.status(400).json({ error: 'Confirmación inválida' });
  const open = db.prepare('SELECT * FROM time_entries WHERE id = ? AND employee_id = ? AND check_out IS NULL').get(payload.entry_id, payload.employee_id);
  if (!open) return res.status(400).json({ error: 'Ya no hay una entrada abierta.' });
  db.prepare(`UPDATE time_entries SET check_out = datetime('now','localtime'),
    hours = ROUND((julianday(datetime('now','localtime')) - julianday(check_in)) * 24, 2) WHERE id = ?`).run(open.id);
  const entry = db.prepare('SELECT * FROM time_entries WHERE id = ?').get(open.id);
  const e = db.prepare('SELECT * FROM employees WHERE id = ?').get(payload.employee_id);
  log(null, 'check-out', 'time_entry', open.id, `Kiosco: salida ${empName(e)} — ${entry.hours} h`);
  res.json({ ok: true, action: 'salida', employee: { name: empName(e), photo: e.photo, position: e.position }, hours: entry.hours });
});

module.exports = router;
