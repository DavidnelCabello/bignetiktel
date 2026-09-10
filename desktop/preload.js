// Puente seguro entre la ventana (web) y el proceso principal de Electron.
// contextIsolation está activo: la web NO tiene acceso directo a Node, solo a
// lo que exponemos aquí.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('bignetik', {
  // Señala que corremos dentro de la app de escritorio (por si la web quiere
  // adaptar algo en el futuro).
  isDesktop: true,
  platform: process.platform,
  getServerUrl: () => ipcRenderer.invoke('server:get'),
  setServerUrl: (url) => ipcRenderer.invoke('server:set', url),
  retry: () => ipcRenderer.invoke('app:retry'),
});
