import { useState, useRef, useEffect } from 'react'
import { kioskApi } from '../../api'
import { initFace, analyze } from '../face'
import { ScanFace, Delete, Check, X, Loader2, ArrowLeft, UserCircle, LogOut } from 'lucide-react'

export default function KioskApp() {
  const [step, setStep] = useState('id') // id | scan | confirm | result
  const [code, setCode] = useState('')
  const [emp, setEmp] = useState(null)
  const [result, setResult] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [error, setError] = useState('')

  function reset() { setStep('id'); setCode(''); setEmp(null); setResult(null); setConfirm(null); setError('') }

  async function submitId() {
    setError('')
    if (!code) return
    try {
      const e = await kioskApi.getEmployee(code)
      if (!e.has_face) { setError('Este empleado no tiene rostro registrado. Avisa a Recursos Humanos.'); return }
      setEmp(e); setStep('scan')
    } catch (e) { setError(e.message) }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950 text-white flex flex-col items-center justify-center p-6 select-none">
      {/* Resplandores de fondo */}
      <div className="pointer-events-none absolute -top-48 left-1/2 -translate-x-1/2 w-[680px] h-[680px] bg-emerald-500/15 rounded-full blur-[130px]" />
      <div className="pointer-events-none absolute -bottom-56 -right-40 w-[520px] h-[520px] bg-emerald-700/10 rounded-full blur-[130px]" />

      {step !== 'id' && <div className="absolute top-6 left-6 flex items-center gap-2 text-emerald-400 z-10"><ScanFace size={22} /> <span className="font-bold">BigNetiK · Fichaje</span></div>}

      {step === 'id' && (
        <a href="/portal?kiosk=1" className="absolute top-5 right-5 z-10 flex items-center gap-2 text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur px-4 py-2.5 rounded-xl text-sm transition-colors">
          <UserCircle size={18} /> Portal del empleado
        </a>
      )}

      {step === 'id' && <IdEntry code={code} setCode={setCode} onSubmit={submitId} error={error} />}
      {step === 'scan' && <FaceScan emp={emp} onResult={(r) => { if (r.action === 'confirm_checkout') { setConfirm(r); setStep('confirm') } else { setResult(r); setStep('result') } }} onCancel={reset} onError={(m) => { setError(m); setStep('id') }} />}
      {step === 'confirm' && <ConfirmCheckout data={confirm} onAccept={(r) => { setResult(r); setStep('result') }} onCancel={reset} />}
      {step === 'result' && <Result result={result} onDone={reset} />}
    </div>
  )
}

function Clock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => { const i = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(i) }, [])
  const h = now.getHours()
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  const time = `${h12}:${String(now.getMinutes()).padStart(2, '0')}`
  const d = now.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const dateStr = d.charAt(0).toUpperCase() + d.slice(1)
  return (
    <div className="mt-5">
      <div className="flex items-baseline justify-center gap-2">
        <span className="text-7xl font-bold tabular-nums tracking-tight bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">{time}</span>
        <span className="text-2xl font-semibold text-emerald-400">{ampm}</span>
      </div>
      <p className="text-slate-400 mt-1.5">{dateStr}</p>
    </div>
  )
}

function IdEntry({ code, setCode, onSubmit, error }) {
  const keys = ['1','2','3','4','5','6','7','8','9','','0','del']
  return (
    <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
      {/* Bienvenida + reloj */}
      <div className="text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-4">
          <ScanFace size={30} />
        </div>
        <p className="text-slate-400 text-sm">Bienvenidos a</p>
        <h1 className="text-2xl font-bold tracking-tight">BigNetiK Telecom</h1>
        <Clock />
      </div>

      {/* Teclado glass */}
      <div className="mt-8 w-full bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
        <p className="text-center font-semibold text-slate-200">Marca tu asistencia</p>
        <p className="text-center text-slate-500 text-sm mb-4">Escribe tu ID de empleado</p>
        <div className="h-16 mb-4 rounded-2xl bg-black/25 border border-white/5 flex items-center justify-center text-3xl font-mono tracking-[0.3em] text-emerald-300">{code || <span className="text-slate-700 tracking-[0.3em]">····</span>}</div>
        {error && <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-xl mb-4 text-center">{error}</p>}
        <div className="grid grid-cols-3 gap-3">
          {keys.map((k, i) => k === '' ? <div key={i} /> : (
            <button key={i} onClick={() => k === 'del' ? setCode(code.slice(0, -1)) : setCode((code + k).slice(0, 8))}
              className="h-16 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/5 text-2xl font-semibold flex items-center justify-center active:scale-95 transition">
              {k === 'del' ? <Delete size={24} /> : k}
            </button>
          ))}
        </div>
        <button onClick={onSubmit} disabled={!code} className="mt-5 w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-lg font-semibold disabled:opacity-30 disabled:grayscale transition shadow-lg shadow-emerald-500/20">Continuar</button>
      </div>
    </div>
  )
}

const STABLE_FRAMES = 3   // frames buenos seguidos antes de verificar

function FaceScan({ emp, onResult, onCancel, onError }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const runningRef = useRef(true)
  const stableRef = useRef(0)
  const attemptsRef = useRef(0)
  const [status, setStatus] = useState('Iniciando cámara…')
  const [phase, setPhase] = useState('loading') // loading | scanning | sending
  const [diag, setDiag] = useState(null)
  const [warn, setWarn] = useState('')

  useEffect(() => {
    runningRef.current = true
    start()
    const timeout = setTimeout(() => { if (runningRef.current) { runningRef.current = false; stop(); onError('No se pudo verificar a tiempo. Inténtalo de nuevo.') } }, 25000)
    return () => { runningRef.current = false; clearTimeout(timeout); stop() }
  }, [])

  async function start() {
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 1280, height: 720 } })
      if (videoRef.current) { videoRef.current.srcObject = streamRef.current; await videoRef.current.play() }
      setStatus('Cargando reconocimiento…')
      await initFace(setStatus)
      setPhase('scanning'); setStatus('Mira a la cámara')
      loop()
    } catch (e) {
      onError((location.protocol === 'http:' && location.hostname !== 'localhost') ? 'La cámara requiere HTTPS. Abre el kiosco por https://'
        : e.name === 'NotAllowedError' ? 'Permiso de cámara denegado.' : 'No se pudo acceder a la cámara.')
    }
  }
  function stop() { streamRef.current?.getTracks().forEach(t => t.stop()) }

  async function verify(r) {
    runningRef.current = false
    setPhase('sending'); setStatus('Verificando…')
    try {
      const res = await kioskApi.identify({ employee_code: emp.employee_code, embedding: r.embedding, real: r.real, live: r.live, blink: true })
      stop(); onResult(res)
    } catch (e) {
      attemptsRef.current += 1
      setWarn(e.message)
      if (attemptsRef.current >= 3) { stop(); onError(e.message); return }
      // Reintentar unos segundos más
      stableRef.current = 0; setPhase('scanning'); runningRef.current = true; setTimeout(loop, 400)
    }
  }

  async function loop() {
    if (!runningRef.current || !videoRef.current) return
    try {
      const r = await analyze(videoRef.current)
      if (r.ok) {
        const spoofOk = r.real == null || r.real >= 0.45
        const liveOk = r.live == null || r.live >= 0.45
        const goodFace = r.score > 0.6
        setDiag({ score: r.score, real: r.real, live: r.live })

        if (goodFace && spoofOk && liveOk) {
          stableRef.current += 1
          setStatus(`Reconociendo… ${'●'.repeat(stableRef.current)}${'○'.repeat(Math.max(0, STABLE_FRAMES - stableRef.current))}`)
          if (stableRef.current >= STABLE_FRAMES) return verify(r)
        } else {
          stableRef.current = 0
          setStatus(!spoofOk ? '⚠️ Acércate — usa tu rostro real, no una foto' : !goodFace ? 'Acércate y mira a la cámara' : 'Mantente quieto un momento…')
        }
      } else {
        stableRef.current = 0
        setStatus(r.faces > 1 ? '⚠️ Solo una persona a la vez' : 'Acerca tu rostro')
      }
    } catch (_) {}
    if (runningRef.current) setTimeout(loop, 200)
  }

  return (
    <div className="w-full max-w-sm text-center">
      <h1 className="text-2xl font-bold mb-1">Hola, {emp.first_name} 👋</h1>
      <p className="text-slate-400 mb-4">Verificación facial</p>
      <div className="relative rounded-2xl overflow-hidden bg-slate-900 aspect-[4/3] mb-4 ring-2 ring-emerald-500/40">
        <video ref={videoRef} playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
        <div className="absolute inset-0 border-[3px] border-emerald-400/30 rounded-2xl m-8" />
        {phase !== 'scanning' && <div className="absolute inset-0 bg-slate-950/70 flex flex-col items-center justify-center"><Loader2 size={32} className="animate-spin text-emerald-400" /><p className="mt-2 text-sm">{status}</p></div>}
      </div>
      {phase === 'scanning' && <p className="text-emerald-300 mb-1 text-lg">{status}</p>}
      {warn && <p className="text-amber-300 text-sm mb-1">{warn}</p>}
      {diag && <p className="text-[11px] text-slate-500 font-mono mb-3">rostro {Math.round(diag.score * 100)}% · real {diag.real != null ? diag.real.toFixed(2) : '—'} · vivo {diag.live != null ? diag.live.toFixed(2) : '—'}</p>}
      <button onClick={() => { runningRef.current = false; stop(); onCancel() }} className="flex items-center gap-1.5 mx-auto text-slate-400 hover:text-white text-sm"><ArrowLeft size={16} /> Cancelar</button>
    </div>
  )
}

function ConfirmCheckout({ data, onAccept, onCancel }) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const firstName = (data.employee?.name || '').split(' ')[0]
  const elapsed = (() => {
    if (!data.since) return ''
    const start = new Date(data.since.replace(' ', 'T')).getTime()
    const mins = Math.max(0, Math.floor((Date.now() - start) / 60000))
    const h = Math.floor(mins / 60), m = mins % 60
    return h > 0 ? `${h}h ${m}m` : `${m} min`
  })()
  async function accept() {
    setBusy(true); setErr('')
    try { const res = await kioskApi.checkout(data.token); onAccept(res) }
    catch (e) { setErr(e.message); setBusy(false) }
  }
  return (
    <div className="relative z-10 w-full max-w-sm text-center">
      <div className="w-20 h-20 rounded-full bg-amber-500/15 text-amber-400 flex items-center justify-center mx-auto"><LogOut size={36} /></div>
      <h1 className="text-2xl font-bold mt-4">Hola de nuevo{firstName ? `, ${firstName}` : ''} 👋</h1>
      <p className="text-slate-400 mt-1">Tu tiempo ya está corriendo{elapsed ? ` · llevas ${elapsed}` : ''}.</p>
      <div className="mt-6 bg-white/[0.04] border border-white/10 rounded-3xl p-6">
        <p className="text-lg">¿Quieres <strong className="text-white">cerrar tu tiempo</strong> ahora?</p>
        <p className="text-sm text-slate-500 mt-1">Si cancelas, tu tiempo sigue corriendo.</p>
        {err && <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-xl mt-3">{err}</p>}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button onClick={onCancel} disabled={busy} className="py-4 rounded-2xl bg-white/5 border border-white/10 text-lg font-semibold hover:bg-white/10 active:scale-95 transition disabled:opacity-50">Cancelar</button>
          <button onClick={accept} disabled={busy} className="py-4 rounded-2xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-lg font-semibold active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-2">{busy ? <Loader2 size={20} className="animate-spin" /> : 'Aceptar'}</button>
        </div>
      </div>
    </div>
  )
}

function Result({ result, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 4000); return () => clearTimeout(t) }, [])
  const ok = result?.ok
  return (
    <div className="w-full max-w-sm text-center">
      <div className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center ${ok ? 'bg-emerald-600' : 'bg-red-600'}`}>
        {ok ? <Check size={48} /> : <X size={48} />}
      </div>
      {ok ? (
        <>
          <h1 className="text-3xl font-bold mt-5">{result.action === 'entrada' ? '¡Bienvenido!' : '¡Hasta luego!'}</h1>
          <p className="text-xl text-slate-300 mt-1">{result.employee.name}</p>
          <p className="text-emerald-400 mt-3 text-lg font-medium">{result.action === 'entrada' ? 'Marcaste tu entrada' : `Cerraste tu tiempo${result.hours != null ? ` · ${result.hours} h` : ''}`}</p>
        </>
      ) : (
        <h1 className="text-2xl font-bold mt-5">No se pudo verificar</h1>
      )}
      <div className="mt-8 flex items-center justify-center gap-3">
        {ok && <a href="/portal?kiosk=1" className="flex items-center gap-2 px-5 py-3 bg-emerald-700 hover:bg-emerald-600 rounded-xl"><UserCircle size={18} /> Ver mi cuenta</a>}
        <button onClick={onDone} className="px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl">Listo</button>
      </div>
    </div>
  )
}
