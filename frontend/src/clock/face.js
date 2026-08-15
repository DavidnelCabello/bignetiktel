// Motor de reconocimiento facial multicapa (Human de vladmandic), 100% en el navegador.
// Modelos servidos localmente desde /models/human (sin nube → funciona offline).
// Capas anti-fraude: (1) detección, (2) anti-spoofing, (3) liveness, (4) parpadeo, (5) embedding.
let human = null
let ready = false

export async function initFace(onProgress) {
  if (ready) return human
  const { Human } = await import('@vladmandic/human')
  human = new Human({
    modelBasePath: '/models/human/',
    cacheSensitivity: 0,
    filter: { enabled: true, equalization: false },
    face: {
      enabled: true,
      detector: { modelPath: 'blazeface.json', rotation: false, maxDetected: 1, minConfidence: 0.4, return: false },
      mesh: { enabled: true, modelPath: 'facemesh.json' },
      iris: { enabled: true, modelPath: 'iris.json' },
      description: { enabled: true, modelPath: 'faceres.json' },
      emotion: { enabled: false },
      antispoof: { enabled: true, modelPath: 'antispoof.json' },
      liveness: { enabled: true, modelPath: 'liveness.json' },
    },
    body: { enabled: false }, hand: { enabled: false }, object: { enabled: false },
    gesture: { enabled: false }, segmentation: { enabled: false },
  })
  onProgress?.('Cargando modelos…')
  await human.load()
  // NO hacemos warmup(): en algunas máquinas se cuelga compilando shaders y no es
  // necesario. La primera detección real inicializa todo por su cuenta.
  ready = true
  onProgress?.('Listo')
  return human
}

// Distancia de parpadeo: relación de apertura del ojo (menor = más cerrado).
function eyeOpenness(face) {
  try {
    const a = face.annotations
    if (!a?.leftEyeUpper0 || !a?.leftEyeLower0) return null
    const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1])
    const up = a.leftEyeUpper0, lo = a.leftEyeLower0
    const mid = Math.floor(up.length / 2)
    const vertical = dist(up[mid], lo[mid])
    const horizontal = dist(up[0], up[up.length - 1])
    return horizontal > 0 ? vertical / horizontal : null
  } catch { return null }
}

// Analiza un frame del video y devuelve las métricas de la cara detectada.
export async function analyze(video) {
  if (!human) return { ok: false }
  const res = await human.detect(video)
  const face = res.face?.[0]
  if (!face || !face.embedding) return { ok: false, faces: res.face?.length || 0 }
  const yawRad = face.rotation?.angle?.yaw
  return {
    ok: true,
    embedding: Array.from(face.embedding),
    real: face.real ?? null,        // anti-spoofing (1 = real)
    live: face.live ?? null,        // liveness (1 = vivo)
    score: face.faceScore ?? face.score ?? 0,
    ear: eyeOpenness(face),         // apertura del ojo (para parpadeo)
    yaw: yawRad != null ? Math.round(yawRad * 180 / Math.PI) : null, // giro horizontal (grados)
    box: face.box,                  // [x,y,w,h]
  }
}

// Similitud coseno entre dos embeddings (0..1).
export function similarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0
  let dot = 0, na = 0, nb = 0
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i] }
  return na && nb ? dot / (Math.sqrt(na) * Math.sqrt(nb)) : 0
}

// Promedia varios embeddings (para un enrolado más estable).
export function averageEmbedding(list) {
  if (!list.length) return null
  const n = list[0].length
  const out = new Array(n).fill(0)
  for (const e of list) for (let i = 0; i < n; i++) out[i] += e[i]
  for (let i = 0; i < n; i++) out[i] /= list.length
  return out
}
