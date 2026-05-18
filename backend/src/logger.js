const db = require('./database');
const fs = require('fs');
const path = require('path');

let logCounter = 0;

function ts12h() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  const h = d.getHours(), ampm = h >= 12 ? 'PM' : 'AM';
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}_${p(h%12||12)}-${p(d.getMinutes())}-${p(d.getSeconds())}-${ampm}`;
}

function log(user, action, entityType, entityId, description) {
  db.prepare(
    "INSERT INTO activity_logs (user_id, username, action, entity_type, entity_id, description, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))"
  ).run(user?.id || null, user?.username || 'system', action, entityType, entityId || null, description);

  // Auto-backup every 10 operations if enabled
  logCounter++;
  if (logCounter >= 10) {
    logCounter = 0;
    try {
      const val = db.prepare("SELECT value FROM settings WHERE key = 'auto_backup'").get();
      if (val?.value === '1') {
        const backupsDir = path.join(__dirname, '..', 'backups');
        if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });
        const dest = path.join(backupsDir, `auto-${ts12h()}.db`);
        fs.copyFileSync(path.join(__dirname, '..', 'bignetiktel.db'), dest);
        // Clean old auto-backups (keep last 30)
        const files = fs.readdirSync(backupsDir).filter(f => f.startsWith('auto-') && f.endsWith('.db')).sort().reverse();
        for (let i = 30; i < files.length; i++) fs.unlinkSync(path.join(backupsDir, files[i]));
      }
    } catch (_) {}
  }
}

module.exports = { log };
