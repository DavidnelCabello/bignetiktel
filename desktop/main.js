// BigNetiK Ventas — app de escritorio (Electron).
//
// FASE 1 (lista): abre el CRM conectado al servidor.
// FASE 2 (esta): modo híbrido base. La interfaz se sirve desde un mini-servidor
//   LOCAL dentro de la app, y ese servidor hace de puente al servidor real
//   guardando copia de las lecturas. Así la app abre y muestra datos aunque no
//   haya internet (lectura offline). Ver server-proxy.js.
// FASE 3-4 (siguientes): cola de escrituras offline + sincronización.
const { app, BrowserWindow, Menu, shell, ipcMain, dialog } = require('electron');
const path = require('path');
const { getServerUrl, setServerUrl, CONFIG_PATH } = require('./config');
const { startLocalServer } = require('./server-proxy');
const { Outbox } = require('./outbox');

let win = null;
let settingsWin = null;
let localPort = null;

// Carpeta con la interfaz compilada (frontend/dist).
function resolveDistDir() {
  if (app.isPackaged) return path.join(process.resourcesPath, 'frontend-dist');
  return path.join(__dirname, '..', 'frontend', 'dist');
}

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1024,
    minHeight: 680,
    title: 'BigNetiK Ventas',
    backgroundColor: '#0f172a',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.once('ready-to-show', () => win.show());

  // Enlaces externos → navegador del sistema.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:|^mailto:/i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });

  loadApp();
}

// Cargar la app desde el mini-servidor local (mismo origen que /api).
function loadApp() {
  if (!win) return;
  win.loadURL(`http://127.0.0.1:${localPort}/`);
}

// Ventana pequeña para cambiar la dirección del servidor real.
function openServerSettings() {
  if (settingsWin) { settingsWin.focus(); return; }
  settingsWin = new BrowserWindow({
    width: 520,
    height: 420,
    resizable: false,
    minimizable: false,
    title: 'Servidor',
    parent: win,
    modal: process.platform !== 'darwin',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  settingsWin.loadFile(path.join(__dirname, 'offline.html'));
  settingsWin.on('closed', () => { settingsWin = null; });
}

// ---- Puente con las ventanas ----
ipcMain.handle('server:get', () => getServerUrl());
ipcMain.handle('server:set', (_e, url) => setServerUrl(url));
ipcMain.handle('app:retry', () => {
  // Guardó el servidor → recargar la app y cerrar la ventanita.
  loadApp();
  if (settingsWin) settingsWin.close();
});

function buildMenu() {
  const isMac = process.platform === 'darwin';
  const template = [
    ...(isMac
      ? [{
          label: app.name,
          submenu: [
            { role: 'about', label: 'Acerca de BigNetiK Ventas' },
            { type: 'separator' },
            { role: 'hide', label: 'Ocultar' },
            { role: 'hideOthers', label: 'Ocultar otros' },
            { role: 'unhide', label: 'Mostrar todo' },
            { type: 'separator' },
            { role: 'quit', label: 'Salir' },
          ],
        }]
      : []),
    {
      label: 'Archivo',
      submenu: [
        { label: 'Recargar', accelerator: 'CmdOrCtrl+R', click: () => loadApp() },
        { label: 'Cambiar servidor…', click: () => openServerSettings() },
        { type: 'separator' },
        isMac ? { role: 'close', label: 'Cerrar ventana' } : { role: 'quit', label: 'Salir' },
      ],
    },
    {
      label: 'Editar',
      submenu: [
        { role: 'undo', label: 'Deshacer' },
        { role: 'redo', label: 'Rehacer' },
        { type: 'separator' },
        { role: 'cut', label: 'Cortar' },
        { role: 'copy', label: 'Copiar' },
        { role: 'paste', label: 'Pegar' },
        { role: 'selectAll', label: 'Seleccionar todo' },
      ],
    },
    {
      label: 'Ver',
      submenu: [
        { role: 'resetZoom', label: 'Tamaño real' },
        { role: 'zoomIn', label: 'Acercar' },
        { role: 'zoomOut', label: 'Alejar' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Pantalla completa' },
        { role: 'toggleDevTools', label: 'Herramientas de desarrollo' },
      ],
    },
    {
      label: 'Ayuda',
      submenu: [
        {
          label: 'Información de conexión',
          click: () => {
            dialog.showMessageBox(win, {
              type: 'info',
              title: 'BigNetiK Ventas',
              message: 'BigNetiK Ventas — Escritorio',
              detail: `Servidor actual:\n${getServerUrl()}\n\nInterfaz local en el puerto ${localPort}\n\nConfiguración guardada en:\n${CONFIG_PATH}`,
              buttons: ['OK'],
            });
          },
        },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(async () => {
  const distDir = resolveDistDir();
  const cacheDir = path.join(app.getPath('userData'), 'cache');
  const outbox = new Outbox(path.join(app.getPath('userData'), 'outbox.jsonl'));
  const { port } = await startLocalServer({ distDir, cacheDir, outbox });
  localPort = port;

  buildMenu();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
