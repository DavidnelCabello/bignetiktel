import { useState } from 'react'
import { portalApi } from '../api'
import { Eye, EyeOff, IdCard } from 'lucide-react'

export default function PortalLogin({ onLogin }) {
  const [code, setCode] = useState('')
  const [pwd, setPwd] = useState('')
  const [show, setShow] = useState(false)
  const [err, setErr] = useState('')
  const [load, setLoad] = useState(false)

  async function submit(e) {
    e.preventDefault(); setErr(''); setLoad(true)
    try { const d = await portalApi.login(code, pwd); onLogin(d, pwd) }
    catch (e) { setErr(e.message) }
    finally { setLoad(false) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-800 via-emerald-700 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-2xl font-bold text-emerald-700">B</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Portal del Empleado</h1>
          <p className="text-emerald-100 mt-1">BigNetiK Telecom</p>
        </div>
        <form onSubmit={submit} className="bg-white rounded-2xl shadow-2xl p-8 space-y-5">
          <h2 className="text-xl font-semibold text-slate-800 text-center">Iniciar Sesión</h2>
          {err && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{err}</div>}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">ID de empleado</label>
            <div className="relative">
              <IdCard size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={code} onChange={e => setCode(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Ej. 1024" required autoFocus />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
            <div className="relative">
              <input type={show ? 'text' : 'password'} value={pwd} onChange={e => setPwd(e.target.value)} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none pr-10" placeholder="••••••" required />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>
          </div>
          <button type="submit" disabled={load} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50">
            {load ? 'Entrando...' : 'Entrar'}
          </button>
          <p className="text-xs text-slate-400 text-center">¿No tienes acceso? Pídele a Recursos Humanos que te genere tus credenciales.</p>
        </form>
      </div>
    </div>
  )
}
