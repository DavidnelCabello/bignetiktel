// Mini-servidor local que corre DENTRO de la app de escritorio.
// Es el corazón del modo híbrido:
//   1. Sirve la interfaz (frontend) desde el disco → la app abre siempre.
//   2. Para /api/* actúa de "puente" al servidor real:
//        - Con internet: reenvía y guarda COPIA local de las lecturas (GET).
//        - Sin internet: lecturas desde la copia local; escrituras a la BANDEJA
//          DE SALIDA (outbox.js) para subirlas al reconectar.
//   3. Mezcla lo pendiente en las listas (para verlo aunque no se haya subido).
//   4. Expone /__status (online + pendientes + sincronizando) para el aviso.
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

// Aviso flotante + Centro de Sincronización (Fase 4): estado en vivo y, al hacer
// clic, un panel para ver/reintentar/descartar lo pendiente y lo rechazado.
const BANNER_SNIPPET = `
<style>
  #bk-net-banner{position:fixed;left:0;right:0;bottom:0;z-index:2147483646;
    display:none;align-items:center;justify-content:center;gap:8px;cursor:pointer;
    padding:8px 14px;font:13px -apple-system,"Segoe UI",Roboto,sans-serif;
    color:#04231a;box-shadow:0 -2px 10px rgba(0,0,0,.15)}
  #bk-net-banner.show{display:flex}
  #bk-net-banner.offline{background:#fbbf24}
  #bk-net-banner.pending{background:#93c5fd}
  #bk-net-banner.failed{background:#fca5a5}
  #bk-net-banner b{font-weight:700}
  #bk-net-banner .bk-open{margin-left:6px;text-decoration:underline;opacity:.8}
  #bk-sync{position:fixed;right:16px;bottom:52px;z-index:2147483647;width:360px;max-height:60vh;
    display:none;flex-direction:column;background:#fff;color:#0f172a;border-radius:14px;
    box-shadow:0 12px 40px rgba(0,0,0,.28);overflow:hidden;
    font:13px -apple-system,"Segoe UI",Roboto,sans-serif}
  #bk-sync.show{display:flex}
  #bk-sync header{padding:12px 14px;background:#0f172a;color:#fff;display:flex;justify-content:space-between;align-items:center}
  #bk-sync header b{font-size:14px}
  #bk-sync .bk-x{cursor:pointer;opacity:.7;font-size:16px}
  #bk-sync .bk-body{padding:10px 14px;overflow:auto}
  #bk-sync .bk-sec{font-weight:700;margin:8px 0 4px;color:#475569;font-size:11px;text-transform:uppercase;letter-spacing:.04em}
  #bk-sync .bk-item{padding:8px 10px;border:1px solid #e2e8f0;border-radius:9px;margin-bottom:6px}
  #bk-sync .bk-item .d{font-weight:600}
  #bk-sync .bk-item .r{color:#b91c1c;font-size:12px;margin-top:2px}
  #bk-sync .bk-acts{display:flex;gap:6px;margin-top:6px}
  #bk-sync button{border:none;border-radius:7px;padding:5px 10px;font-size:12px;font-weight:600;cursor:pointer}
  #bk-sync .retry{background:#10b981;color:#04231a}
  #bk-sync .disc{background:#f1f5f9;color:#334155}
  #bk-sync .allbar{display:flex;gap:6px;margin:6px 0 2px}
  #bk-sync .empty{color:#64748b;padding:6px 0}
</style>
<div id="bk-net-banner"></div>
<div id="bk-sync">
  <header><b>Centro de sincronización</b><span class="bk-x" id="bk-sync-x">✕</span></header>
  <div class="bk-body" id="bk-sync-body"></div>
</div>
<script>
(function(){
  var el=document.getElementById('bk-net-banner');
  var panel=document.getElementById('bk-sync');
  var body=document.getElementById('bk-sync-body');
  document.getElementById('bk-sync-x').onclick=function(){panel.classList.remove('show')};
  el.onclick=function(){ if(panel.classList.contains('show')){panel.classList.remove('show')} else {panel.classList.add('show');loadPanel()} };

  async function post(u){ try{ await fetch(u,{method:'POST'}); }catch(e){} loadPanel(); check(); }
  window.__bkRetry=function(q){ post('/__retry'+(q?'?qid='+q:'')) };
  window.__bkDiscard=function(q){ post('/__discard'+(q?'?qid='+q:'')) };

  async function loadPanel(){
    try{
      var d=await (await fetch('/__outbox',{cache:'no-store'})).json();
      var h='';
      h+='<div class="bk-sec">Sin sincronizar ('+d.pending+')</div>';
      if(d.pendingItems.length){ d.pendingItems.forEach(function(it){ h+='<div class="bk-item"><div class="d">'+esc(it.desc)+'</div></div>'; }); }
      else h+='<div class="empty">Nada pendiente. Todo al día. ✅</div>';
      if(d.failed>0){
        h+='<div class="bk-sec">Rechazados por el servidor ('+d.failed+')</div>';
        h+='<div class="allbar"><button class="retry" onclick="__bkRetry()">Reintentar todo</button><button class="disc" onclick="__bkDiscard()">Descartar todo</button></div>';
        d.failedItems.forEach(function(it){
          h+='<div class="bk-item"><div class="d">'+esc(it.desc)+'</div>'+
             '<div class="r">'+esc(it.reason||('Error '+it.status))+'</div>'+
             '<div class="bk-acts"><button class="retry" onclick="__bkRetry(\\''+it.qid+'\\')">Reintentar</button>'+
             '<button class="disc" onclick="__bkDiscard(\\''+it.qid+'\\')">Descartar</button></div></div>';
        });
      }
      body.innerHTML=h;
    }catch(e){ body.innerHTML='<div class="empty">No se pudo cargar.</div>'; }
  }
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]}); }

  async function check(){
    try{
      var d=await (await fetch('/__status',{cache:'no-store'})).json();
      if(!d.online){ el.className='show offline'; el.innerHTML='<span>📴</span><span><b>Sin conexión</b> — trabajando con la copia local. Los cambios se guardan y se subirán al reconectar.</span>'; }
      else if(d.syncing){ el.className='show pending'; el.innerHTML='<span>⏳</span><span><b>Sincronizando</b> '+d.pending+' cambio(s)…</span>'; }
      else if(d.failed>0){ el.className='show failed'; el.innerHTML='<span>⚠️</span><span><b>'+d.failed+' cambio(s) rechazados</b> — <span class="bk-open">toca para revisar</span></span>'; }
      else if(d.pending>0){ el.className='show pending'; el.innerHTML='<span>🔺</span><span><b>'+d.pending+' cambio(s) sin sincronizar</b> — <span class="bk-open">ver</span></span>'; }
      else { el.className=''; }
      if(panel.classList.contains('show')) loadPanel();
    }catch(e){ el.className='show offline'; el.innerHTML='<span>📴</span><span><b>Sin conexión</b></span>'; }
  }
  check(); setInterval(check, 4000);
})();
</script>
`;

function startLocalServer({ distDir, cacheDir, outbox }) {
  fs.mkdirSync(cacheDir, { recursive: true });

  const server = http.createServer((req, res) => {
    const url = req.url || '/';
    if (url === '/__status' || url === '/__net') return handleStatus(res, outbox);
    if (url === '/__outbox') return sendJson(res, 200, outbox.detail());
    if (url.split('?')[0] === '/__retry') return sendJson(res, 200, outbox.retryFailed(qparam(url, 'qid')));
    if (url.split('?')[0] === '/__discard') return sendJson(res, 200, outbox.discardFailed(qparam(url, 'qid')));
    if (url.startsWith('/api')) return handleApi(req, res, cacheDir, outbox);
    return serveStatic(req, res, distDir);
  });

  // Bucle de sincronización: si hay conexión y cosas pendientes, subirlas.
  setInterval(async () => {
    if (outbox.status().pending === 0 || outbox.syncing) return;
    if (await pingUpstream()) {
      outbox.sync(getServerUrl, fetch, () => {}).then(() => {
        // Al terminar, limpiar la caché de listas para forzar datos frescos.
        try {
          for (const f of fs.readdirSync(cacheDir)) fs.unlinkSync(path.join(cacheDir, f));
        } catch {}
      });
    }
  }, 6000);

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
  });
}

// ---- Estado: conexión + pendientes ----
async function handleStatus(res, outbox) {
  const online = await pingUpstream();
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ online, ...outbox.status() }));
}

function sendJson(res, status, obj) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(obj));
}

function qparam(url, key) {
  const m = url.split('?')[1];
  if (!m) return null;
  for (const kv of m.split('&')) {
    const [k, v] = kv.split('=');
    if (k === key) return decodeURIComponent(v || '');
  }
  return null;
}

async function pingUpstream() {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 3000);
    const r = await fetch(getServerUrl() + '/api', { signal: ctrl.signal });
    clearTimeout(t);
    return r.status > 0;
  } catch {
    return false;
  }
}

// ---- Puente /api con caché local + bandeja de salida ----
function cacheFile(cacheDir, method, url) {
  const key = crypto.createHash('sha1').update(method + ' ' + url).digest('hex');
  return path.join(cacheDir, key + '.json');
}

async function handleApi(req, res, cacheDir, outbox) {
  const method = req.method || 'GET';
  const isRead = method === 'GET' || method === 'HEAD';

  const bodyChunks = [];
  for await (const c of req) bodyChunks.push(c);
  const body = bodyChunks.length ? Buffer.concat(bodyChunks) : undefined;

  const headers = {};
  if (req.headers['authorization']) headers['authorization'] = req.headers['authorization'];
  if (req.headers['content-type']) headers['content-type'] = req.headers['content-type'];

  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 12000);
    const r = await fetch(getServerUrl() + req.url, { method, headers, body, signal: ctrl.signal });
    clearTimeout(t);

    let buf = Buffer.from(await r.arrayBuffer());
    const ctype = r.headers.get('content-type') || 'application/json; charset=utf-8';

    if (isRead && r.status === 200) {
      try {
        fs.writeFileSync(
          cacheFile(cacheDir, method, req.url),
          JSON.stringify({ status: r.status, ctype, body: buf.toString('base64'), at: Date.now() })
        );
      } catch {}
      // Aunque estemos online, mezclar lo que aún está en la cola para que no
      // "parpadee" (aparezca/desaparezca) hasta que termine de sincronizar.
      buf = maybeOverlay(req.url, buf, ctype, outbox);
    }

    // Guardar copia de la sesión (/me) desde un login exitoso → sesión offline.
    if (method === 'POST' && req.url.split('?')[0] === '/api/auth/login' && r.status === 200) {
      try {
        const data = JSON.parse(buf.toString('utf8'));
        if (data && data.user) {
          fs.writeFileSync(
            cacheFile(cacheDir, 'GET', '/api/auth/me'),
            JSON.stringify({ status: 200, ctype: 'application/json; charset=utf-8', body: Buffer.from(JSON.stringify({ user: data.user })).toString('base64'), at: Date.now() })
          );
        }
      } catch {}
    }

    res.writeHead(r.status, { 'Content-Type': ctype });
    res.end(buf);
  } catch (err) {
    // Sin conexión.
    if (isRead) {
      const cached = readCache(cacheDir, method, req.url);
      if (cached) {
        let buf = Buffer.from(cached.body, 'base64');
        buf = maybeOverlay(req.url, buf, cached.ctype, outbox);
        res.writeHead(cached.status, { 'Content-Type': cached.ctype, 'X-BigNetiK-Offline': '1' });
        return res.end(buf);
      }
      res.writeHead(503, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ error: 'Sin conexión y sin copia local de estos datos todavía.' }));
    }
    // Algunas escrituras NO tienen sentido offline (login, recuperar/restablecer
    // contraseña): dependen del servidor en el momento. No se encolan.
    const noQueue = ['/api/auth/login', '/api/auth/forgot-password', '/api/auth/reset-password'];
    if (noQueue.includes(req.url.split('?')[0])) {
      res.writeHead(503, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ error: 'Esta acción necesita conexión. Inténtalo cuando vuelva el internet.' }));
    }

    // Escritura sin conexión → a la bandeja de salida (se sube al reconectar).
    const result = outbox.enqueue({ method, url: req.url, body, auth: req.headers['authorization'] });
    res.writeHead(result.status, { 'Content-Type': 'application/json; charset=utf-8', 'X-BigNetiK-Queued': '1' });
    res.end(JSON.stringify(result.body));
  }
}

// Si la respuesta es una LISTA (array) de una colección, mezclar lo pendiente.
function maybeOverlay(url, buf, ctype, outbox) {
  if (!outbox || outbox.status().pending === 0) return buf;
  if (!/json/i.test(ctype)) return buf;
  try {
    const data = JSON.parse(buf.toString('utf8'));
    if (!Array.isArray(data)) return buf;
    const merged = outbox.overlayList(url, data);
    return Buffer.from(JSON.stringify(merged));
  } catch {
    return buf;
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
  if (!filePath.startsWith(distDir)) filePath = path.join(distDir, 'index.html');

  const ext = path.extname(filePath);
  const isFile = ext && fs.existsSync(filePath);
  // HTML y rutas SPA pasan por sendIndex (para inyectar el aviso).
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
    const out = html.includes('</body>')
      ? html.replace('</body>', BANNER_SNIPPET + '</body>')
      : html + BANNER_SNIPPET;
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(out);
  });
}

module.exports = { startLocalServer };
