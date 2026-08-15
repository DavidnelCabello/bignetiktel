import { useState, useEffect } from 'react'
import { api } from '../api'
import { Clock, LogIn, LogOut, Search, CheckCircle2 } from 'lucide-react'

// Calcula tiempo transcurrido "hace X" desde una hora de entrada local.
function elapsed(checkIn) {
  const start = new Date(checkIn.replace(' ', 'T')).getTime()
  const mins = Math.max(0, Math.floor((Date.now() - start) / 60000))
  const h = Math.floor(mins / 60), m = mins % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export default function Fichaje() {
  const [employees, setEmployees] = useState([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')
  const [busy, setBusy] = useState(null)

  async function load() {
    try { setEmployees(await api.getEmployees('?active=1')) } catch (e) { /* noop */ }
    setLoading(false)
  }
  useEffect(() => { load() }, [])
  // Refresca los contadores de tiempo cada minuto.
  useEffect(() => { const t = setInterval(() => setEmployees(e => [...e]), 60000); return () => clearInterval(t) }, [])

  function flash(msg) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  async function toggle(emp) {
    setBusy(emp.id)
    try {
      if (emp.clocked_in) { const r = await api.checkOut(emp.id); flash(r.message) }
      else { const r = await api.checkIn(emp.id, { method: 'manual' }); flash(r.message) }
      await load()
    } catch (e) { flash(e.message) }
    setBusy(null)
  }

  const filtered = employees.filter(e => {
    const s = (q || '').toLowerCase()
    return !s || `${e.first_name} ${e.last_name || ''} ${e.employee_code}`.toLowerCase().includes(s)
  })
  const working = employees.filter(e => e.clocked_in)

  if (loading) return <div className="animate-pulse grid grid-cols-2 sm:grid-cols-3 gap-3">{[1,2,3,4,5,6].map(i => <div key={i} className="h-28 bg-slate-200 rounded-xl" />)}</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Clock size={24} className="text-blue-600" /> Fichaje</h1>
        <span className="text-sm text-slate-500 flex items-center gap-1.5"><CheckCircle2 size={16} className="text-emerald-500" /> {working.length} fichado{working.length === 1 ? '' : 's'} ahora</span>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar empleado…" className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      {filtered.length === 0 && <p className="text-slate-400 text-sm py-8 text-center">No hay empleados activos. Agrégalos en la sección Empleados.</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(e => (
          <div key={e.id} className={`rounded-xl border p-4 transition-colors ${e.clocked_in ? 'border-emerald-300 bg-emerald-50/50' : 'border-slate-200 bg-white'}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-slate-800">{e.first_name} {e.last_name || ''}</p>
                <p className="text-xs text-slate-500">{e.position || e.employee_code}</p>
              </div>
              {e.clocked_in && <span className="text-[11px] font-medium text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Trabajando</span>}
            </div>
            <button
              onClick={() => toggle(e)}
              disabled={busy === e.id}
              className={`mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${e.clocked_in ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}>
              {e.clocked_in ? <><LogOut size={16} /> Fichar salida</> : <><LogIn size={16} /> Fichar entrada</>}
            </button>
          </div>
        ))}
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-sm px-4 py-2.5 rounded-lg shadow-lg z-50">{toast}</div>
      )}
    </div>
  )
}
