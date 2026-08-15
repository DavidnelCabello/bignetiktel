import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { Clock, UserCog, CalendarClock, Users, CheckCircle2, ArrowRight, Building2, Palmtree, LifeBuoy, TrendingUp } from 'lucide-react'

export default function RRHHPanel() {
  const [d, setD] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { api.hrDashboard().then(x => { setD(x); setLoading(false) }).catch(() => setLoading(false)) }, [])

  const kpis = [
    { label: 'Empleados activos', value: d?.headcount, icon: Users, color: 'text-blue-600 bg-blue-50' },
    { label: 'Fichados ahora', value: d?.clocked_in, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Departamentos', value: d?.departments, icon: Building2, color: 'text-indigo-600 bg-indigo-50' },
    { label: 'Solicitudes pendientes', value: d?.pending_leaves, icon: Palmtree, color: 'text-amber-600 bg-amber-50', to: '/solicitudes' },
    { label: 'Tickets abiertos', value: d?.open_tickets, icon: LifeBuoy, color: 'text-rose-600 bg-rose-50', to: '/tickets-rrhh' },
  ]
  const shortcuts = [
    { to: '/empleados', label: 'Empleados', desc: 'Fichas, biometría y acceso', icon: UserCog },
    { to: '/fichaje', label: 'Fichaje', desc: 'Marcar entrada y salida', icon: Clock },
    { to: '/horas', label: 'Reporte de Horas', desc: 'Horas y pago por empleado', icon: CalendarClock },
  ]
  const maxDept = Math.max(1, ...(d?.by_department || []).map(x => x.hours))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Clock size={24} className="text-emerald-600" /> Reloj / RRHH</h1>
        {d && <span className="text-xs text-slate-400">Período: {d.from} → {d.to}</span>}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {kpis.map(k => {
          const card = (
            <div className="bg-white rounded-xl border border-slate-200 p-4 h-full">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${k.color}`}><k.icon size={18} /></div>
              <p className="text-2xl font-bold text-slate-800 mt-3">{loading ? '—' : (k.value ?? 0)}</p>
              <p className="text-xs text-slate-500">{k.label}</p>
            </div>
          )
          return k.to ? <Link key={k.label} to={k.to} className="hover:opacity-90">{card}</Link> : <div key={k.label}>{card}</div>
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-800 mb-1 flex items-center gap-2"><TrendingUp size={18} className="text-emerald-600" /> Horas por departamento</h3>
          <p className="text-xs text-slate-400 mb-4">Total del mes: <strong>{d?.total_hours ?? 0} h</strong> · Extra: <strong className="text-amber-600">{d?.extra_hours ?? 0} h</strong></p>
          {(!d || d.by_department.length === 0) && <p className="text-slate-400 text-sm py-6 text-center">Sin horas registradas este mes.</p>}
          <div className="space-y-2.5">
            {d?.by_department.map(dep => (
              <div key={dep.department}>
                <div className="flex justify-between text-sm mb-1"><span className="text-slate-600">{dep.department}</span><span className="font-medium text-slate-800">{dep.hours} h</span></div>
                <div className="w-full bg-slate-100 rounded-full h-2.5"><div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(dep.hours / maxDept) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-800 mb-4">Top empleados (horas)</h3>
          {(!d || d.top_employees.length === 0) && <p className="text-slate-400 text-sm py-6 text-center">—</p>}
          <div className="space-y-3">
            {d?.top_employees.map((e, i) => (
              <div key={e.name} className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>{i + 1}</span>
                <span className="text-sm text-slate-700 flex-1 truncate">{e.name}</span>
                <span className="text-sm font-semibold text-slate-800">{e.hours} h</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {shortcuts.map(s => (
          <Link key={s.to} to={s.to} className="group bg-white rounded-xl border border-slate-200 p-5 hover:border-emerald-400 hover:shadow-sm transition-all">
            <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center"><s.icon size={22} /></div>
            <p className="mt-3 font-semibold text-slate-800">{s.label}</p>
            <p className="text-sm text-slate-500">{s.desc}</p>
            <span className="mt-2 inline-flex items-center gap-1 text-sm text-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity">Abrir <ArrowRight size={15} /></span>
          </Link>
        ))}
      </div>
    </div>
  )
}
