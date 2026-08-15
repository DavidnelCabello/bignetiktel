import { useState, useEffect } from 'react'
import { api } from '../api'
import { Radio, LogOut, User, RefreshCw, X, Clock, Wallet, Timer, Building2 } from 'lucide-react'
import { time12 as hm } from '../lib/time'

function startMs(checkIn) { return new Date((checkIn || '').replace(' ', 'T')).getTime() }
function elapsed(checkIn) {
  const mins = Math.max(0, Math.floor((Date.now() - startMs(checkIn)) / 60000))
  const h = Math.floor(mins / 60), m = mins % 60
  return h > 0 ? `${h}h ${m}m` : `${m} min`
}

export default function Trabajando() {
  const [data, setData] = useState({ working: [], left: [] })
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState(null)

  function load() { api.hrWorking().then(d => { setData(d); setLoading(false) }).catch(() => setLoading(false)) }
  useEffect(() => { load(); const i = setInterval(load, 30000); return () => clearInterval(i) }, [])

  if (loading) return <div className="animate-pulse space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-slate-200 rounded-xl" />)}</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Radio size={24} className="text-emerald-600" /> Empleados Trabajando</h1>
        <button onClick={load} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"><RefreshCw size={15} /> Actualizar</button>
      </div>

      {/* Trabajando ahora */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <h2 className="font-semibold text-slate-700">Trabajando ahora <span className="text-slate-400 font-normal">({data.working.length})</span></h2>
        </div>
        {data.working.length === 0 && <p className="text-slate-400 text-sm bg-white border border-slate-200 rounded-xl p-6 text-center">Nadie está fichado en este momento.</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.working.map(e => (
            <button key={e.id} onClick={() => setDetail(e)} className="text-left bg-white rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 flex items-center gap-3 hover:border-emerald-400 hover:shadow-sm transition-all">
              {e.photo ? <img src={e.photo} alt="" className="w-11 h-11 rounded-full object-cover" /> : <div className="w-11 h-11 rounded-full bg-slate-200 flex items-center justify-center"><User size={20} className="text-slate-500" /></div>}
              <div className="min-w-0">
                <p className="font-medium text-slate-800 truncate">{e.first_name} {e.last_name || ''}</p>
                <p className="text-xs text-slate-500">{e.position || e.department || `ID ${e.employee_code}`}</p>
                <p className="text-xs text-emerald-700 mt-0.5">Entró {hm(e.check_in)} · lleva {elapsed(e.check_in)}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Ya salieron hoy */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <LogOut size={16} className="text-slate-400" />
          <h2 className="font-semibold text-slate-700">Ya salieron hoy <span className="text-slate-400 font-normal">({data.left.length})</span></h2>
        </div>
        {data.left.length === 0 && <p className="text-slate-400 text-sm bg-white border border-slate-200 rounded-xl p-6 text-center">Nadie ha cerrado su tiempo hoy todavía.</p>}
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          {data.left.map(e => (
            <div key={e.id} className="flex items-center gap-3 p-3">
              {e.photo ? <img src={e.photo} alt="" className="w-9 h-9 rounded-full object-cover" /> : <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center"><User size={16} className="text-slate-500" /></div>}
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-800 text-sm truncate">{e.first_name} {e.last_name || ''}</p>
                <p className="text-xs text-slate-400">{e.position || `ID ${e.employee_code}`}</p>
              </div>
              <div className="text-right text-xs text-slate-500">
                <p>{hm(e.check_in)} → {hm(e.check_out)}</p>
                <p className="font-semibold text-slate-700">{e.hours} h</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {detail && <WorkingDetail e={detail} onClose={() => setDetail(null)} />}
    </div>
  )
}

// Detalle en vivo del trabajador: entrada, tiempo, horas acumuladas y salario en tiempo real.
function WorkingDetail({ e, onClose }) {
  const [, tick] = useState(0)
  useEffect(() => { const i = setInterval(() => tick(t => t + 1), 1000); return () => clearInterval(i) }, [])

  const now = Date.now()
  const elapsedMs = Math.max(0, now - startMs(e.check_in))
  const sh = Math.floor(elapsedMs / 3600000)
  const sm = Math.floor((elapsedMs % 3600000) / 60000)
  const ss = Math.floor((elapsedMs % 60000) / 1000)
  const sessionHours = elapsedMs / 3600000
  const totalHours = (e.month_hours || 0) + sessionHours   // acumulado del mes + sesión en curso
  const pay = e.pay_type === 'hourly' ? totalHours * e.pay_rate : e.pay_rate
  const cur = e.currency || 'CUP'

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden" onClick={ev => ev.stopPropagation()}>
        <div className="bg-emerald-600 text-white p-5 flex items-center gap-3 relative">
          <button onClick={onClose} className="absolute top-3 right-3 p-1.5 hover:bg-white/15 rounded-lg"><X size={18} /></button>
          {e.photo ? <img src={e.photo} alt="" className="w-14 h-14 rounded-full object-cover border-2 border-white/40" /> : <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center"><User size={26} /></div>}
          <div className="min-w-0">
            <p className="font-bold text-lg leading-tight truncate">{e.first_name} {e.last_name || ''}</p>
            <p className="text-emerald-100 text-sm">{e.position || `ID ${e.employee_code}`}</p>
          </div>
        </div>
        <div className="p-5 space-y-3">
          <Row icon={Clock} label="Entró a las" value={hm(e.check_in)} />
          <Row icon={Timer} label="Lleva trabajando" value={`${sh}h ${String(sm).padStart(2,'0')}m ${String(ss).padStart(2,'0')}s`} live />
          <Row icon={Building2} label="Departamento" value={e.department || '—'} />
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-center">
              <p className="text-2xl font-bold text-slate-800 tabular-nums">{totalHours.toFixed(2)}</p>
              <p className="text-xs text-slate-500">Horas acumuladas (mes)</p>
            </div>
            <div className="rounded-xl bg-emerald-600 text-white p-3 text-center">
              <p className="text-2xl font-bold tabular-nums">{pay.toLocaleString('es', { maximumFractionDigits: 2 })}</p>
              <p className="text-xs text-emerald-100">{cur} · {e.pay_type === 'hourly' ? 'en vivo' : 'salario mensual'}</p>
            </div>
          </div>
          {e.pay_type === 'hourly' && <p className="text-xs text-slate-400 text-center">Tarifa {e.pay_rate} {cur}/h · el salario sube en tiempo real mientras trabaja.</p>}
        </div>
      </div>
    </div>
  )
}

function Row({ icon: Icon, label, value, live }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center"><Icon size={16} className="text-slate-500" /></div>
      <span className="text-sm text-slate-500">{label}</span>
      <span className={`ml-auto font-semibold ${live ? 'text-emerald-600 tabular-nums' : 'text-slate-800'}`}>{value}</span>
    </div>
  )
}
