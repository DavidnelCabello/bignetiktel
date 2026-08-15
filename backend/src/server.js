const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('./database');

const authRoutes = require('./routes/shared/auth');
const equipmentRoutes = require('./routes/ventas/equipment');
const clientsRoutes = require('./routes/ventas/clients');
const salesRoutes = require('./routes/ventas/sales');
const usersRoutes = require('./routes/shared/users');
const logsRoutes = require('./routes/shared/logs');
const settingsRoutes = require('./routes/shared/settings');
const backupRoutes = require('./routes/shared/backup');
const employeesRoutes = require('./routes/clock/employees');
const timeRoutes = require('./routes/clock/time');
const departmentsRoutes = require('./routes/clock/departments');
const portalRoutes = require('./routes/clock/portal');
const hrRoutes = require('./routes/clock/hr');
const kioskRoutes = require('./routes/clock/kiosk');

const app = express();
const PORT = process.env.PORT || 3001;

// Confiar en el primer proxy (Caddy/Nginx del VPS) para obtener la IP real del cliente.
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || true }));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, message: { error: 'Demasiadas peticiones. Espere 15 minutos.' } });
app.use('/api', limiter);
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5, message: { error: 'Demasiados intentos. Espere 15 minutos.' } });
app.use('/api/auth/login', authLimiter);
app.use('/api/portal/login', authLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/employees', employeesRoutes);
app.use('/api/time', timeRoutes);
app.use('/api/departments', departmentsRoutes);
app.use('/api/portal', portalRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/kiosk', kioskRoutes);

const frontendPath = path.join(__dirname, '..', '..', 'frontend', 'dist');
if (require('fs').existsSync(frontendPath)) {
  app.use(express.static(frontendPath));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) return res.sendFile(path.join(frontendPath, 'index.html'));
    res.status(404).json({ error: 'Ruta no encontrada' });
  });
}

app.use('/api', (req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));
app.use((err, req, res, next) => { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }); });

app.listen(PORT, () => console.log(`BigNetiK API en puerto ${PORT}`));
