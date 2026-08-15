import { useState, useEffect, useRef } from 'react'
import { portalApi } from '../../api'
import PortalLogin from './PortalLogin'
import PortalHome from './PortalHome'
import { KeyRound, Eye, EyeOff, Clock } from 'lucide-react'

// En modo tablet compartida (?kiosk=1) la sesión se cierra sola por inactividad.
const KIOSK_IDLE_MS = 90_000  // 90 s de inactividad
const KIOSK_WARN_MS = 20_000  // aviso en los últimos 20 s

export default function PortalApp() {
  const [emp, setEmp] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastPassword, setLastPassword] = useState('')
  const [warnLeft, setWarnLeft] = useState(0) // segundos restantes del aviso (0 = sin aviso)
  const kioskMode = useRef(new URLSearchParams(window.location.search).get('kiosk') === '1').current

  useEffect(() => {
    const t = localStorage.getItem('emp_token')
    if (t) portalApi.me().then(d => setEmp(d.employee)).catch(() => localStorage.removeItem('emp_token')).finally(() => setLoading(false))
    else setLoading(false)
  }, [])

  function logout() {
    localStorage.removeItem('emp_token'); setEmp(null); setLastPassword('')
    if (kioskMode) window.location.href = '/kiosco' // volver al marcaje en la tablet
  }

  // Auto-cierre por inactividad (solo en la tablet compartida y con sesión iniciada).
  useEffect(() => {
    if (!emp || !kioskMode || emp.must_change_password) return
    let idle, warn, tick
    const clearAll = () => { clearTimeout(idle); clearTimeout(warn); clearInterval(tick); setWarnLeft(0) }
    const reset = () => {
      clearAll()
      warn = setTimeout(() => {
        let left = Math.ceil(KIOSK_WARN_MS / 1000)
        setWarnLeft(left)
        tick = setInterval(() => { left -= 1; setWarnLeft(left) }, 1000)
      }, KIOSK_IDLE_MS - KIOSK_WARN_MS)
      idle = setTimeout(logout, KIOSK_IDLE_MS)
    }
    const evts = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll']
    evts.forEach(e => window.addEventListener(e, reset, { passive: true }))
    reset()
    return () => { clearAll(); evts.forEach(e => window.removeEventListener(e, reset)) }
  }, [emp, kioskMode])

  let content
  if (loading) content = <div className="min-h-screen flex items-center justify-center bg-slate-100"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" /></div>
  else if (!emp) content = <PortalLogin onLogin={(data, pwd) => { localStorage.setItem('emp_token', data.token); setLastPassword(pwd); setEmp(data.employee) }} />
  else if (emp.must_change_password) content = <ForcedChange currentPassword={lastPassword} onDone={logout} onLogout={logout} />
  else content = <PortalHome emp={emp} setEmp={setEmp} onLogout={logout} />

  return (
    <>
      {content}
      {warnLeft > 0 && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-xs text-center shadow-2xl">
            <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto"><Clock size={28} /></div>
            <h3 className="text-lg font-bold text-slate-800 mt-3">¿Sigues ahí?</h3>
            <p className="text-sm text-slate-500 mt-1">Por seguridad, tu sesión se cerrará en <strong className="text-slate-800">{warnLeft}s</strong> por inactividad.</p>
            <button onClick={() => setWarnLeft(0)} className="mt-4 w-full py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700">Seguir conectado</button>
          </div>
        </div>
      )}
    </>
  )
}

// Pantalla de cambio de contraseña obligatorio en el primer inicio.
function ForcedChange({ currentPassword, onDone, onLogout }) {
  const [cur, setCur] = useState(currentPassword || '')
  const [np, setNp] = useState('')
  const [np2, setNp2] = useState('')
  const [show, setShow] = useState(false)
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')

  async function submit(e) {
    e.preventDefault(); setErr('')
    if (np.length < 6) return setErr('La nueva contraseña debe tener al menos 6 caracteres')
    if (np !== np2) return setErr('Las contraseñas no coinciden')
    try {
      await portalApi.changePassword(cur, np)
      setMsg('¡Listo! Contraseña actualizada. Inicia sesión con tu nueva contraseña.')
      setTimeout(onDone, 1800)
    } catch (e) { setErr(e.message) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-800 via-emerald-700 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg"><KeyRound className="text-emerald-700" /></div>
          <h1 className="text-2xl font-bold text-white">Crea tu contraseña</h1>
          <p className="text-emerald-100 mt-1 text-sm">Por seguridad, cambia la contraseña temporal antes de continuar.</p>
        </div>
        <form onSubmit={submit} className="bg-white rounded-2xl shadow-2xl p-8 space-y-4">
          {err && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{err}</div>}
          {msg && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm">{msg}</div>}
          {!currentPassword && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña temporal</label>
              <input type="password" value={cur} onChange={e => setCur(e.target.value)} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" required />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nueva contraseña</label>
            <div className="relative">
              <input type={show ? 'text' : 'password'} value={np} onChange={e => setNp(e.target.value)} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none pr-10" required />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Repite la nueva contraseña</label>
            <input type={show ? 'text' : 'password'} value={np2} onChange={e => setNp2(e.target.value)} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" required />
          </div>
          <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-lg">Guardar y continuar</button>
          <button type="button" onClick={onLogout} className="w-full text-center text-sm text-slate-400 hover:text-slate-600">Salir</button>
        </form>
      </div>
    </div>
  )
}
