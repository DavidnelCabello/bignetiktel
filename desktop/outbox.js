// Bandeja de salida (outbox) — Fase 3 del modo híbrido.
//
// Cuando NO hay conexión, las escrituras (POST/PUT/DELETE a /api) no se pierden
// ni se rechazan: se guardan aquí en una cola local y la app responde un
// "guardado localmente" con un id temporal. Cuando vuelve el internet, se suben
// en orden al servidor real, mapeando el id temporal al id real que asigna el
// servidor (para que, p.ej., una venta hecha offline apunte al cliente correcto).
//
// Además, las listas que se ven offline se "mezclan" con lo pendiente, para que
// el usuario vea de inmediato lo que registró sin conexión (marcado _pending).
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function uid() {
  return 'off_' + crypto.randomBytes(8).toString('hex');
}

class Outbox {
  constructor(filePath) {
    this.file = filePath;
    this.failedFile = filePath.replace(/\.jsonl$/, '') + '.failed.jsonl';
    this.entries = this._load(this.file);
    this.failed = this._load(this.failedFile);
    this.syncing = false;
  }

  _load(f) {
    try {
      return fs.readFileSync(f, 'utf8')
        .split('\n').filter(Boolean).map((l) => JSON.parse(l));
    } catch { return []; }
  }

  _persist() {
    try {
      fs.writeFileSync(this.file, this.entries.map((e) => JSON.stringify(e)).join('\n') + (this.entries.length ? '\n' : ''));
      fs.writeFileSync(this.failedFile, this.failed.map((e) => JSON.stringify(e)).join('\n') + (this.failed.length ? '\n' : ''));
    } catch (e) { console.error('outbox persist:', e); }
  }

  status() {
    return { pending: this.entries.length, failed: this.failed.length, syncing: this.syncing };
  }

  // Detalle legible para el Centro de Sincronización.
  detail() {
    return {
      ...this.status(),
      pendingItems: this.entries.map((e) => ({ qid: e.qid, ts: e.ts, desc: describe(e) })),
      failedItems: this.failed.map((e) => ({ qid: e.qid, ts: e.ts, desc: describe(e), reason: e.reason || '', status: e.status || 0 })),
    };
  }

  // Reintentar: mover fallidos de vuelta a la cola (uno o todos).
  retryFailed(qid) {
    const move = (e) => { delete e.failedAt; delete e.status; delete e.reason; this.entries.push(e); };
    if (qid) {
      const i = this.failed.findIndex((e) => e.qid === qid);
      if (i >= 0) move(this.failed.splice(i, 1)[0]);
    } else {
      this.failed.forEach(move);
      this.failed = [];
    }
    this._persist();
    return this.status();
  }

  // Descartar fallidos (uno o todos).
  discardFailed(qid) {
    if (qid) this.failed = this.failed.filter((e) => e.qid !== qid);
    else this.failed = [];
    this._persist();
    return this.status();
  }

  // ---- Analizar la URL para saber colección / id / subruta ----
  // /api/clients        -> { col:'clients' }
  // /api/clients/5      -> { col:'clients', id:'5' }
  // /api/sales/5/payment-> { col:'sales', id:'5', sub:'payment' }
  static parse(url) {
    const clean = (url || '').split('?')[0].replace(/^\/api\//, '');
    const parts = clean.split('/').filter(Boolean);
    return { col: parts[0], id: parts[1], sub: parts[2] };
  }

  // ---- Encolar una escritura offline y devolver respuesta optimista ----
  enqueue({ method, url, body, auth }) {
    const p = Outbox.parse(url);
    let bodyObj = null;
    try { bodyObj = body ? JSON.parse(body.toString('utf8')) : null; } catch {}

    // Editar/eliminar algo que TODAVÍA está pendiente (id temporal) → se aplica
    // sobre la propia cola, sin crear una segunda operación para el servidor.
    if (p.id && String(p.id).startsWith('off_') && !p.sub) {
      const idx = this.entries.findIndex((e) => e.tempId === p.id);
      if (idx >= 0) {
        if (method === 'DELETE') this.entries.splice(idx, 1);
        else if (method === 'PUT') this.entries[idx].body = { ...this.entries[idx].body, ...(bodyObj || {}) };
        this._persist();
        return { status: 200, body: { message: 'Cambio local aplicado', _pending: true } };
      }
    }

    const entry = {
      qid: uid(),
      ts: Date.now(),
      method,
      url,
      body: bodyObj,
      auth: auth || null, // token del usuario para reenviar al subir
      col: p.col,
      op: !p.id ? 'create' : (method === 'DELETE' ? 'delete' : 'update'),
      targetId: p.id || null,
      sub: p.sub || null,
    };
    // A los "create" les damos un id temporal para mostrarlos ya en las listas.
    if (entry.op === 'create' && !entry.sub) entry.tempId = uid();

    this.entries.push(entry);
    this._persist();

    // Respuesta optimista para que la interfaz siga su curso.
    if (entry.op === 'create' && !entry.sub) {
      const item = { ...(bodyObj || {}), id: entry.tempId, _pending: true };
      // Compat: el backend de clientes responde {id, name}; el de ventas un objeto.
      return { status: 201, body: item };
    }
    return { status: 200, body: { message: 'Guardado localmente. Se subirá al reconectar.', _pending: true } };
  }

  // ---- Mezclar lo pendiente en una lista cacheada (GET /api/<col>) ----
  overlayList(url, arr) {
    const p = Outbox.parse(url);
    if (p.id || p.sub) return arr; // solo listas base
    if (!Array.isArray(arr)) return arr;
    let out = arr.slice();

    for (const e of this.entries) {
      if (e.col !== p.col || e.sub) continue;
      if (e.op === 'create') {
        out.push({ ...(e.body || {}), id: e.tempId, _pending: true });
      } else if (e.op === 'update') {
        out = out.map((it) => (String(it.id) === String(e.targetId) ? { ...it, ...(e.body || {}), _pending: true } : it));
      } else if (e.op === 'delete') {
        out = out.filter((it) => String(it.id) !== String(e.targetId));
      }
    }
    return out;
  }

  // ---- Subir la cola al servidor real, en orden ----
  async sync(getServerUrl, fetchImpl, onProgress) {
    if (this.syncing || this.entries.length === 0) return;
    this.syncing = true;
    const idMap = {}; // tempId -> id real que asigna el servidor

    try {
      while (this.entries.length) {
        const e = this.entries[0];
        // Sustituir ids temporales ya resueltos (dependencias entre operaciones).
        const url = substitute(e.url, idMap, false);
        const body = e.body != null ? JSON.stringify(deepSub(e.body, idMap)) : undefined;

        const headers = { 'Content-Type': 'application/json' };
        if (e.auth) headers['Authorization'] = e.auth; // reenviar el token del usuario

        let res;
        try {
          res = await fetchImpl(getServerUrl() + url, {
            method: e.method,
            headers,
            body,
          });
        } catch (netErr) {
          break; // se cayó la conexión otra vez → reintentar luego
        }

        if (res.ok) {
          // Capturar el id real para mapear el temporal.
          if (e.op === 'create' && e.tempId) {
            try {
              const data = await res.clone().json();
              if (data && (data.id != null)) idMap[e.tempId] = data.id;
            } catch {}
          }
          this.entries.shift();
          this._persist();
          if (onProgress) onProgress(this.status());
        } else if (res.status >= 400 && res.status < 500) {
          // El servidor rechazó (validación/conflicto) → apartar y seguir.
          let reason = '';
          try { reason = (await res.clone().json()).error || ''; } catch {}
          const bad = this.entries.shift();
          this.failed.push({ ...bad, failedAt: Date.now(), status: res.status, reason });
          this._persist();
          if (onProgress) onProgress(this.status());
        } else {
          break; // 5xx u otros → reintentar luego
        }
      }
    } finally {
      this.syncing = false;
    }
  }
}

// Descripción legible de una operación en cola (para el Centro de Sincronización).
const COL_NOUN = {
  clients: 'cliente', sales: 'venta', equipment: 'equipo', models: 'modelo',
  departments: 'departamento', employees: 'empleado', users: 'usuario',
};
function describe(e) {
  const noun = COL_NOUN[e.col] || e.col || 'registro';
  if (e.sub) return `${e.sub} en ${noun}${e.targetId ? ' #' + e.targetId : ''}`;
  const verb = e.op === 'create' ? 'Crear' : e.op === 'delete' ? 'Eliminar' : 'Editar';
  const name = e.body && (e.body.first_name || e.body.name || e.body.full_name);
  return `${verb} ${noun}${name ? ' “' + name + '”' : (e.targetId ? ' #' + e.targetId : '')}`;
}

// Reemplaza un tempId dentro de una cadena (URL).
function substitute(str, idMap, _b) {
  let s = String(str);
  for (const [t, real] of Object.entries(idMap)) s = s.split(t).join(String(real));
  return s;
}

// Reemplaza recursivamente cualquier valor === tempId por el id real (tipado).
function deepSub(obj, idMap) {
  if (obj == null) return obj;
  if (typeof obj === 'string') return idMap[obj] != null ? idMap[obj] : obj;
  if (Array.isArray(obj)) return obj.map((x) => deepSub(x, idMap));
  if (typeof obj === 'object') {
    const o = {};
    for (const [k, v] of Object.entries(obj)) o[k] = deepSub(v, idMap);
    return o;
  }
  return obj;
}

module.exports = { Outbox };
