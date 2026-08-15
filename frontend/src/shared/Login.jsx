import { useState } from 'react'
import { api } from '../api'
import { Eye, EyeOff, Lock } from 'lucide-react'

export default function Login({ onLogin }) {
  const [u, setU] = useState('')
  const [p, setP] = useState('')
  const [show, setShow] = useState(false)
  const [err, setErr] = useState('')
  const [load, setLoad] = useState(false)
  const [forgot, setForgot] = useState(false)
  const [fu, setFu] = useState('')
  const [fmsg, setFmsg] = useState('')
  const [ftoken, setFtoken] = useState('')
  const [fnp, setFnp] = useState('')
  const [fstep, setFstep] = useState('request')

  const submit = async e => {
    e.preventDefault()
    setErr(''); setLoad(true)
    try { const d = await api.login(u, p); localStorage.setItem('token', d.token); onLogin(d.user) }
    catch (e) { setErr(e.message) }
    finally { setLoad(false) }
  }

  async function handleForgot(e) {
    e.preventDefault(); setErr(''); setFmsg('')
    if (fstep === 'request') {
      try { await api.forgotPassword(fu); setFmsg('Si el usuario existe y tiene email configurado, recibirás un código.'); setFstep('reset') }
      catch (e) { setErr(e.message) }
    } else {
      if (fnp.length < 4) return setErr('Mínimo 4 caracteres')
      try { await api.resetPassword(fu, ftoken, fnp); setFmsg('Contraseña restablecida. Ahora puedes iniciar sesión.'); setFstep('done') }
      catch (e) { setErr(e.message) }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-2xl font-bold text-blue-700">B</span>
          </div>
          <h1 className="text-3xl font-bold text-white">BigNetiK Telecom</h1>
          <p className="text-blue-200 mt-1">Sistema de Gestión de Inventario</p>
        </div>
        {!forgot ? (
          <form onSubmit={submit} className="bg-white rounded-2xl shadow-2xl p-8 space-y-5">
            <h2 className="text-xl font-semibold text-slate-800 text-center">Iniciar Sesión</h2>
            {err && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{err}</div>}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Usuario</label>
              <input type="text" value={u} onChange={e => setU(e.target.value)} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="admin" required autoFocus />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
              <div className="relative">
                <input type={show ? 'text' : 'password'} value={p} onChange={e => setP(e.target.value)} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none pr-10" placeholder="••••••" required />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={load} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50">
              {load ? 'Entrando...' : 'Entrar'}
            </button>
            <button type="button" onClick={() => { setForgot(true); setErr(''); setFmsg('') }} className="w-full text-center text-sm text-slate-500 hover:text-blue-600 flex items-center justify-center gap-1"><Lock size={14} /> ¿Olvidaste tu contraseña?</button>
          </form>
        ) : (
          <form onSubmit={handleForgot} className="bg-white rounded-2xl shadow-2xl p-8 space-y-5">
            <h2 className="text-xl font-semibold text-slate-800 text-center">Restablecer Contraseña</h2>
            {err && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{err}</div>}
            {fmsg && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm">{fmsg}</div>}
            {fstep === 'request' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nombre de Usuario</label>
                  <input value={fu} onChange={e => setFu(e.target.value)} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
                </div>
                <button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-2.5 rounded-lg transition-colors">Enviar Código</button>
              </>
            )}
            {fstep === 'reset' && (
              <>
                <p className="text-xs text-slate-500">Usuario: <strong>{fu}</strong></p>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Código de Restablecimiento</label>
                  <input value={ftoken} onChange={e => setFtoken(e.target.value)} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nueva Contraseña</label>
                  <input type="password" value={fnp} onChange={e => setFnp(e.target.value)} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
                </div>
                <button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-2.5 rounded-lg transition-colors">Restablecer</button>
              </>
            )}
            {fstep === 'done' && <button type="button" onClick={() => { setForgot(false); setFstep('request'); setFu(''); setFtoken(''); setFnp('') }} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg">Volver al inicio de sesión</button>}
            {fstep !== 'done' && <button type="button" onClick={() => { setForgot(false); setFstep('request'); setErr(''); setFmsg('') }} className="w-full text-center text-sm text-slate-500 hover:text-blue-600">Volver al inicio de sesión</button>}
          </form>
        )}
      </div>
    </div>
  )
}
