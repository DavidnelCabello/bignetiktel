const db = require('./database');

// Crea una notificación. audience: 'hr' (para Recursos Humanos) o 'employee' (con employee_id).
function notify({ audience, employee_id = null, type, title = null, body = null, link = null }) {
  try {
    db.prepare('INSERT INTO notifications (audience, employee_id, type, title, body, link) VALUES (?, ?, ?, ?, ?, ?)')
      .run(audience, employee_id, type, title, body, link);
  } catch (e) { console.error('notify error:', e.message); }
}

module.exports = { notify };
