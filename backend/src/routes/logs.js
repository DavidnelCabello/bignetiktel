const { Router } = require('express');
const db = require('../database');
const { authenticate } = require('../middleware/auth');

const router = Router();
router.use(authenticate);

router.get('/', (req, res) => {
  if (req.user.role !== 'super_admin') return res.status(403).json({ error: 'Solo super admin' });
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(10, Number(req.query.limit) || 50));
  const offset = (page - 1) * limit;
  const total = db.prepare('SELECT COUNT(*) as c FROM activity_logs').get().c;
  const logs = db.prepare('SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT ? OFFSET ?').all(limit, offset);
  res.json({ logs, total, page, pages: Math.ceil(total / limit) });
});

module.exports = router;
