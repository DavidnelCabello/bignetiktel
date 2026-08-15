import { useState, useEffect, useRef } from 'react'
import { api } from '../api'
import { initFace, analyze, averageEmbedding } from '../lib/face'
import { X, ScanFace, Check, Loader2 } from 'lucide-react'

const SAMPLES_PER_POSE = 5
const YAW_CENTER = 12      // |yaw| <= 12° = de frente
const YAW_TURN = 16        // |yaw| >= 16° = girado a un lado

// Pasos guiados: al frente, a un lado y al otro (giro real = prueba de vida).
const POSES = [
  { key: 'center', label: 'Mira al frente 🙂', hint: 'Rostro centrado y bien iluminado' },
  { key: 'right', label: 'Gira despacio a la DERECHA ➡️', hint: 'Gira solo la cabeza, sin mover el cuerpo' },
  { key: 'left', label: 'Ahora a la IZQUIERDA ⬅️', hint: 'Despacio, mantén la cara visible' },
]

export default function EnrollFaceModal({ employee, onClose, onDone }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const runningRef = useRef(true)
  const poseRef = useRef(0)
  const bufRef = useRef([])          // muestras de la pose actual
  const templatesRef = useRef([])    // 1 plantilla promediada por pose
  const firstSignRef = useRef(0)     // signo del primer giro (para exigir el opuesto)
  const photoRef = useRef(null)

  const [status, setStatus] = useState('Iniciando cámara…')
  const [ready, setReady] = useState(false)
  const [poseIdx, setPoseIdx] = useState(0)
  const [poseCount, setPoseCount] = useState(0)
  const [diag, setDiag] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => { runningRef.current = true; start(); return () => { runningRef.current = false; stopCamera() } }, [])

  async function start() {
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 1280, height: 720 } })
      if (videoRef.current) { videoRef.current.srcObject = streamRef.current; await videoRef.current.play() }
      setStatus('Cargando modelos de reconocimiento…')
      await initFace(setStatus)
      setReady(true)
      loop()
    } catch (e) {
      setError(e.name === 'NotAllowedError' ? 'Permiso de cámara denegado. Actívalo para continuar.'
        : e.name === 'NotFoundError' ? 'No se encontró cámara.'
        : (location.protocol === 'http:' && location.hostname !== 'localhost') ? 'La cámara requiere HTTPS. Abre el sistema por https:// o localhost.'
        : 'No se pudo acceder a la cámara: ' + e.message)
    }
  }
  function stopCamera() { streamRef.current?.getTracks().forEach(t => t.stop()) }

  function snapshot() {
    const v = videoRef.current; if (!v) return null
    const c = document.createElement('canvas'); c.width = v.videoWidth; c.height = v.videoHeight
    c.getContext('2d').drawImage(v, 0, 0); return c.toDataURL('image/jpeg', 0.85)
  }

  async function loop() {
    if (!runningRef.current || !videoRef.current) return
    try {
      const r = await analyze(videoRef.current)
      const idx = poseRef.current
      if (!r.ok) {
        setDiag(null)
        setStatus(r.faces > 1 ? '⚠️ Solo una persona a la vez' : 'Acerca tu rostro a la cámara')
      } else {
        const liveOk = r.real == null || r.real >= 0.45   // persona real (no foto) durante el enrolado
        const goodFace = r.score > 0.6
        setDiag({ score: r.score, real: r.real, yaw: r.yaw })

        let poseOk = false
        if (r.yaw == null) poseOk = true                                   // sin ángulo: no bloquear
        else if (idx === 0) poseOk = Math.abs(r.yaw) <= YAW_CENTER
        else if (idx === 1) poseOk = Math.abs(r.yaw) >= YAW_TURN
        else poseOk = Math.abs(r.yaw) >= YAW_TURN && Math.sign(r.yaw) === -firstSignRef.current

        if (goodFace && liveOk && poseOk) {
          if (idx === 0 && !photoRef.current) photoRef.current = snapshot()
          if (idx === 1 && firstSignRef.current === 0 && r.yaw != null) firstSignRef.current = Math.sign(r.yaw)
          bufRef.current.push(r.embedding)
          setPoseCount(bufRef.current.length)
          setStatus(`Capturando ${POSES[idx].label.split(' ')[0]}… (${bufRef.current.length}/${SAMPLES_PER_POSE})`)

          if (bufRef.current.length >= SAMPLES_PER_POSE) {
            templatesRef.current.push(averageEmbedding(bufRef.current))
            bufRef.current = []
            if (idx + 1 >= POSES.length) { runningRef.current = false; return finish() }
            poseRef.current = idx + 1; setPoseIdx(idx + 1); setPoseCount(0)
          }
        } else if (!liveOk) setStatus('⚠️ Parece una foto/pantalla. Usa un rostro real.')
        else if (!goodFace) setStatus('Acércate y mira bien a la cámara')
        else setStatus(POSES[idx].label + (r.yaw != null ? ` (giro ${r.yaw}°)` : ''))
      }
    } catch (_) {}
    if (runningRef.current) setTimeout(loop, 200)
  }

  async function finish() {
    setSaving(true); setError('')
    try {
      await api.enrollFace(employee.id, templatesRef.current, photoRef.current)
      setDone(true); stopCamera()
      setTimeout(() => { onDone?.(); onClose() }, 1300)
    } catch (e) { setError(e.message); setSaving(false); runningRef.current = true; loop() }
  }

  const overallPct = Math.round(((poseIdx + poseCount / SAMPLES_PER_POSE) / POSES.length) * 100)

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><ScanFace size={20} className="text-emerald-600" /> Registrar rostro</h3>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm text-slate-500">Empleado: <strong>{employee.first_name} {employee.last_name || ''}</strong> (ID {employee.employee_code})</p>

          <div className="flex items-center justify-center gap-2">
            {POSES.map((p, i) => (
              <div key={p.key} className={`flex-1 h-1.5 rounded-full ${i < poseIdx ? 'bg-emerald-500' : i === poseIdx ? 'bg-emerald-300' : 'bg-slate-200'}`} />
            ))}
          </div>

          <div className="relative rounded-xl overflow-hidden bg-slate-900 aspect-[4/3] flex items-center justify-center">
            <video ref={videoRef} playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
            <div className="absolute inset-0 border-[3px] border-emerald-400/40 rounded-xl m-6" />
            {done && <div className="absolute inset-0 bg-emerald-600/90 flex flex-col items-center justify-center text-white"><Check size={48} /><p className="mt-2 font-semibold">Rostro registrado</p></div>}
            {(!ready || saving) && !error && !done && <div className="absolute inset-0 bg-slate-900/70 flex flex-col items-center justify-center text-white"><Loader2 size={32} className="animate-spin" /><p className="mt-2 text-sm">{saving ? 'Guardando…' : status}</p></div>}
          </div>

          {!done && (
            <>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden"><div className="bg-emerald-500 h-full transition-all" style={{ width: `${overallPct}%` }} /></div>
              <div className="text-center">
                <p className="text-base font-semibold text-emerald-700">{POSES[poseIdx].label}</p>
                <p className="text-xs text-slate-500">{POSES[poseIdx].hint}</p>
                <p className="text-sm text-slate-600 mt-1">{status}</p>
              </div>
              {diag && <p className="text-[11px] text-slate-400 text-center font-mono">rostro {Math.round(diag.score * 100)}% · real {diag.real != null ? diag.real.toFixed(2) : '—'} · giro {diag.yaw ?? '—'}°</p>}
            </>
          )}

          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <button onClick={onClose} className="w-full py-2 bg-slate-100 text-slate-600 rounded-lg text-sm hover:bg-slate-200">Cerrar</button>
        </div>
      </div>
    </div>
  )
}
