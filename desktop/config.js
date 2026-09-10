// Configuración persistente de la app de escritorio.
// Guarda a qué servidor se conecta el CRM. Vive en la carpeta de datos del
// usuario (fuera del código), así cada PC puede apuntar a su propio servidor.
const { app } = require('electron');
const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(app.getPath('userData'), 'config.json');

// Servidor por defecto: el backend local. En producción se cambia desde el
// menú "Servidor…" al dominio real (ej: https://almacen.bignetik.com).
const DEFAULT_SERVER = 'http://localhost:3001';

function read() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  } catch {
    return {};
  }
}

function write(data) {
  try {
    fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('No se pudo guardar la configuración:', e);
  }
}

function getServerUrl() {
  const { serverUrl } = read();
  return normalize(serverUrl || DEFAULT_SERVER);
}

function setServerUrl(url) {
  const data = read();
  data.serverUrl = normalize(url);
  write(data);
  return data.serverUrl;
}

// Limpia la URL: agrega http:// si falta y quita la barra final.
function normalize(url) {
  let u = String(url || '').trim();
  if (!u) return DEFAULT_SERVER;
  if (!/^https?:\/\//i.test(u)) u = 'http://' + u;
  return u.replace(/\/+$/, '');
}

module.exports = { getServerUrl, setServerUrl, DEFAULT_SERVER, CONFIG_PATH };
