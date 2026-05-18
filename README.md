# BigNetiK Telecom — Inventory & Sales System

Sistema de gestión de inventario y ventas para **BigNetiK Telecom (Cuba)**. Control de stock, ventas a plazos con interés, pagos parciales, clientes, usuarios, copias de seguridad automáticas y notificaciones por email.

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Backend | Node.js + Express |
| Frontend | React + Vite + Tailwind v4 |
| Base de datos | SQLite (embedded, zero-config) |
| Autenticación | JWT + bcryptjs |

---

## Requisitos

- **Node.js** 18+ (recomendado 20)
- **npm** 9+

---

## Instalación rápida

```bash
git clone https://github.com/DavidnelCabello/bignetiktel.git
cd bignetiktel
npm install
npm install --prefix backend
npm run build --prefix frontend
npm run seed --prefix backend
npm run dev
```

Esto inicia el backend en `http://localhost:3001` y el frontend en `http://localhost:5173`.

### Credenciales por defecto

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| admin | admin123 | super_admin |

---

## Funcionalidades

### Gestión de inventario
- CRUD completo de tipos, marcas, modelos y stock
- Precios en USD o CUP
- Stock mínimo configurable con alertas visuales
- Búsqueda por cualquier campo

### Ventas
- Creación de ventas con uno o múltiples equipos
- Planes de pago: contado o a plazos (1–36 meses)
- Cálculo automático de intereses (16 tasas progresivas)
- MAC address opcional por equipo vendido

### Pagos
- Registro de pagos parciales
- Liberación automática del inventario al completar
- Fecha del próximo pago calculada automáticamente
- Sección de pagos atrasados con contador de días

### Clientes
- Nombres y apellidos separados
- Tipo de documento (CI / Pasaporte / Licencia)
- Selector de país con banderas (+53 Cuba por defecto)
- Provincias y municipios cubanos con cascada
- Resumen de compras del cliente

### Usuarios y roles
- **super_admin**: acceso total, gestiona usuarios, logs y configuración
- **admin**: operaciones diarias (ventas, inventario, clientes)

### Seguridad
- Rate limiting en login (5 intentos / 15 min)
- Helmet para headers HTTP seguros
- CORS restringido
- Token versionado (sesión inválida al cambiar contraseña)
- Logs de intentos fallidos de inicio de sesión
- Validación de formato de imagen en avatar
- JWT con expiración de 24h

### Copias de seguridad
- Manuales con un clic
- Automáticas cada 10 operaciones (configurable)
- Descarga del archivo `.db` completo
- Restauración desde backup previo
- Eliminación individual de backups

### Notificaciones por email
- Confirmación de venta al cliente
- Recibo de pago con saldo restante
- Recordatorio de pago atrasado (manual desde la UI)
- Recuperación de contraseña por código

### Otros
- Dashboard con KPIs, gráfico de ventas mensuales y modelos más vendidos
- Logo de empresa personalizable desde Configuración
- Exportación a CSV (inventario y clientes)
- Impresión de recibo de venta
- Historial de actividad (logs)
- Todas las horas en formato 12h AM/PM

---

## Despliegue en producción

### VPS con PM2

```bash
npm run build --prefix frontend
npm install -g pm2
pm2 start backend/src/server.js --name bignetiktel
pm2 save
pm2 startup
```

### Nginx (recomendado para producción con SSL)

```nginx
server {
    listen 443 ssl;
    server_name tudominio.com;
    location / { proxy_pass http://127.0.0.1:3001; }
}
```

### Variables de entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| `PORT` | Puerto del servidor | 3001 |
| `JWT_SECRET` | Clave secreta para JWT | fijo en desarrollo |
| `FRONTEND_URL` | URL del frontend para CORS y enlaces en emails | http://localhost:5173 |

---

## Estructura del proyecto

```
bignetiktel/
├── backend/
│   ├── src/
│   │   ├── routes/        → API endpoints
│   │   ├── middleware/     → Autenticación JWT
│   │   ├── database.js    → Esquema SQLite + migraciones
│   │   ├── logger.js      → Registro de actividad + auto-backup
│   │   ├── mailer.js      → Envío de emails
│   │   ├── seed.js        → Datos iniciales (admin + catálogo)
│   │   └── server.js      → Punto de entrada
│   └── backups/           → Copias de seguridad (auto-generado)
├── frontend/
│   └── src/
│       ├── components/    → Layout, ProfileModal
│       ├── pages/         → Dashboard, Inventory, Sales, etc.
│       ├── api.js         → Cliente HTTP
│       └── exportCsv.js   → Utilidad CSV
├── package.json           → Script raíz con concurrently
└── README.md
```

---

## Resetear la base de datos

```bash
rm backend/bignetiktel.db
npm run seed --prefix backend
```

---

## Licencia

Uso interno — BigNetiK Telecom
