# BigNetiK Ventas — App de escritorio (Mac / Windows)

App de escritorio (Electron) del CRM de **Almacén & Ventas** de BigNetiK Telecom.
Reusa el mismo frontend y backend del proyecto: solo lo envuelve en una ventana
nativa con icono propio. El mismo código genera la app de **Mac** y la de **Windows**.

## Fases

- **Fase 1 (LISTA)** — La app abre el CRM conectada al servidor (online, tiempo
  real). Si el servidor no responde, muestra una pantalla para reintentar o
  cambiar la dirección del servidor.
- **Fase 2-4 (pendientes)** — Copia local (offline) + cola de pendientes +
  motor de sincronización a la nube. El modo híbrido: online cuando hay
  conexión, guarda local cuando se cae, y sube al volver la conexión.

## Requisitos

- El servidor del CRM corriendo (por defecto `http://localhost:3001`).
  Desde la raíz del proyecto: `npm run build` (compila el frontend) y
  `npm start` (levanta el backend, que sirve el frontend).

## Correr en desarrollo

```bash
cd desktop
npm install
npm start
```

## Cambiar el servidor

Menú **Archivo → Cambiar servidor…** (o la pantalla que aparece si no conecta).
Ahí se pone el dominio real, por ejemplo `https://almacen.bignetik.com`.
La configuración se guarda por PC en la carpeta de datos del usuario.

## Generar el instalador

> El icono `.icns`/`.ico` se genera solo desde `assets/icon.png` (electron-builder).

**Mac** (`.dmg`) — se puede hacer en esta misma Mac:

```bash
cd desktop
npm install
npm run dist:mac
# resultado en desktop/release/
```

**Windows** (`.exe` instalador NSIS) — por el módulo nativo de SQLite conviene
generarlo **en una PC Windows** (o CI):

```bash
cd desktop
npm install
npm run dist:win
# resultado en desktop/release/
```
