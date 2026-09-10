// Mini-servidor local que corre DENTRO de la app de escritorio.
// Es el corazón del modo híbrido:
//   1. Sirve la interfaz (frontend) desde el disco → la app abre siempre,
//      con o sin internet.
//   2. Para /api/* actúa de "puente" al servidor real:
//        - Con internet: reenvía al servidor y guarda una COPIA local de las
//          lecturas (GET). Devuelve la respuesta real.
//        - Sin internet: responde las lecturas con la última copia local
//          (modo lectura offline). Las escrituras (POST/PUT/DELETE) se
//          rechazan con un aviso claro — la Fase 3 las pondrá en cola.
//   3. Expone /__net para saber si hay conexión (para el aviso en pantalla).
//
// Como el frontend se sirve desde el mismo origen (localhost), sus llamadas
// relativas a `/api` siguen funcionando sin tocar una línea del código web.
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { getServerUrl } = require('./config');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.wasm': 'application/wasm',
  '.bin': 'application/octet-stream',
  '.map': 'application/json; charset=utf-8',
};

// Aviso flotante que se inyecta en la interfaz cuando no hay conexión.
const BANNER_SNIPPET = `
<style>
  #bk-net-banner{position:fixed;left:0;right:0;bottom:0;z-index:2147483647;
    display:none;align-items:center;justify-content:center;gap:8px;
    padding:8px 14px;font:13px -apple-system,"Segoe UI",Roboto,sans-serif;
    color:#04231a;background:#fbbf24;box-shadow:0 -2px 10px rgba(0,0,0,.15)}
  #bk-net-banner.show{display:flex}
  #bk-net-banner b{font-weight:700}
</style>
<div id="bk-net-banner"><span>📴</span><span><b>Sin conexión</b> — trabajando con la copia local. Los cambios se guardarán cuando vuelva el internet.</span></div>
<script>
(function(){
  var el=document.getElementById('bk-net-banner');
  async function check(){
    try{
      var r=await fetch('/__net',{cache:'no-store'});
      var d=await r.json();
      el.classList.toggle('show', !d.online);
    }catch(e){ el.classList.add('show'); }
  }
  check(); setInterval(check, 5000);
})();
</script>
`;

function startLocalServer({ distDir, cacheDir }) {
  fs.mkdirSync(cacheDir, { recursive: true });

  const server = http.createServer((req, res) => {
    const url = req.url || '/';
    if (url === '/__net') return handleNet(res);
    if (url.startsWith('/api')) return handleApi(req, res, cacheDir);
    return serveStatic(req, res, distDir);
  });

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      resolve({ server, port: server.address().port });
    });
  });
}

// ---- ¿Hay conexión con el servidor real? ----
async function handleNet(res) {
  const online = await pingUpstream();
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ online }));
}

async function pingUpstream() {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 3000);
    const r = await fetch(getServerUrl() + '/api', { signal: ctrl.signal });
    clearTimeout(t);
    return r.status > 0; // cualquier respuesta = el servidor está vivo
  } catch {
    return false;
  }
}

// ---- Puente /api con caché local ----
function cacheFile(cacheDir, method, url) {
  const key = crypto.createHash('sha1').update(method + ' ' + url).digest('hex');
  return path.join(cacheDir, key + '.json');
}

async function handleApi(req, res, cacheDir) {
  const method = req.method || 'GET';
  const upstream = getServerUrl() + req.url;
  const isRead = method === 'GET' || method === 'HEAD';

  // Reunir el cuerpo para métodos con datos.
  const bodyChunks = [];
  for await (const c of req) bodyChunks.push(c);
  const body = bodyChunks.length ? Buffer.concat(bodyChunks) : undefined;

  const headers = {};
  if (req.headers['authorization']) headers['authorization'] = req.headers['authorization'];
  if (req.headers['content-type']) headers['content-type'] = req.headers['content-type'];

  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 12000);
    const r = await fetch(upstream, { method, headers, body, signal: ctrl.signal });
    clearTimeout(t);

    const buf = Buffer.from(await r.arrayBuffer());
    const ctype = r.headers.get('content-type') || 'application/json; charset=utf-8';

    // Guardar copia local de las lecturas correctas (para verlas offline).
    if (isRead && r.status === 200) {
      try {
        fs.writeFileSync(
          cacheFile(cacheDir, method, req.url),
          JSON.stringify({ status: r.status, ctype, body: buf.toString('base64'), at: Date.now() })
        );
      } catch {}
    }

    // Al iniciar sesión con éxito, guardar una copia de la sesión (/me) para
    // que la app te mantenga dentro al recargar sin conexión.
    if (method === 'POST' && req.url.split('?')[0] === '/api/auth/login' && r.status === 200) {
      try {
        const data = JSON.parse(buf.toString('utf8'));
        if (data && data.user) {
          fs.writeFileSync(
            cacheFile(cacheDir, 'GET', '/api/auth/me'),
            JSON.stringify({
              status: 200,
              ctype: 'application/json; charset=utf-8',
              body: Buffer.from(JSON.stringify({ user: data.user })).toString('base64'),
              at: Date.now(),
            })
          );
        }
      } catch {}
    }

    res.writeHead(r.status, { 'Content-Type': ctype });
    res.end(buf);
  } catch (err) {
    // Falló la red → estamos offline.
    if (isRead) {
      const cached = readCache(cacheDir, method, req.url);
      if (cached) {
        res.writeHead(cached.status, {
          'Content-Type': cached.ctype,
          'X-BigNetiK-Offline': '1', // marca: esto viene de la copia local
        });
        return res.end(Buffer.from(cached.body, 'base64'));
      }
      res.writeHead(503, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ error: 'Sin conexión y sin copia local de estos datos todavía.' }));
    }
    // Escritura sin conexión → Fase 3 la pondrá en cola. Por ahora, aviso claro.
    res.writeHead(503, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'Sin conexión: este cambio no se puede guardar ahora. Inténtalo cuando vuelva el internet.' }));
  }
}

function readCache(cacheDir, method, url) {
  try {
    return JSON.parse(fs.readFileSync(cacheFile(cacheDir, method, url), 'utf8'));
  } catch {
    return null;
  }
}

// ---- Servir la interfaz desde el disco (con enrutado SPA) ----
function serveStatic(req, res, distDir) {
  let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';

  let filePath = path.join(distDir, urlPath);
  // Seguridad: no salir de distDir.
  if (!filePath.startsWith(distDir)) filePath = path.join(distDir, 'index.html');

  const ext = path.extname(filePath);
  const isFile = ext && fs.existsSync(filePath);
  // El HTML (incluido index.html) y las rutas SPA (/almacen, /ventas…) pasan
  // por sendIndex para inyectarles el aviso de "sin conexión".
  if (!isFile || ext === '.html') return sendIndex(res, distDir);

  fs.readFile(filePath, (err, data) => {
    if (err) return sendIndex(res, distDir);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
}

function sendIndex(res, distDir) {
  fs.readFile(path.join(distDir, 'index.html'), 'utf8', (err, html) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('No se encontró la interfaz (frontend/dist).');
    }
    // Inyectar el aviso de "sin conexión" antes de cerrar el body.
    const out = html.includes('</body>')
      ? html.replace('</body>', BANNER_SNIPPET + '</body>')
      : html + BANNER_SNIPPET;
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(out);
  });
}

module.exports = { startLocalServer };
