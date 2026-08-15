import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { WORKSPACES, WS_COLORS, wsVisible } from '../data/workspaces'
import { can } from '../data/modules'
import { ArrowRight } from 'lucide-react'

export default function SuiteHome({ user }) {
  const nav = useNavigate()
  const [stats, setStats] = useState({})

  useEffect(() => {
    // Stats en vivo, cada una según el permiso — demuestra que todo es un solo backend.
    if (can(user, 'sales')) api.getLatePaymentsCount().then(d => setStats(s => ({ ...s, late: d.count }))).catch(() => {})
    if (can(user, 'hr')) {
      api.getEmployees('?active=1').then(list => setStats(s => ({ ...s, employees: list.length }))).catch(() => {})
      api.getOpenEntries().then(list => setStats(s => ({ ...s, working: list.length }))).catch(() => {})
    }
  }, [])

  // Texto pequeño de estado por módulo.
  function subline(ws) {
    if (ws.id === 'almacen') return stats.late != null ? `${stats.late} pago${stats.late === 1 ? '' : 's'} atrasado${stats.late === 1 ? '' : 's'}` : null
    if (ws.id === 'rrhh') return stats.employees != null ? `${stats.employees} empleado${stats.employees === 1 ? '' : 's'} · ${stats.working ?? 0} fichado${stats.working === 1 ? '' : 's'} ahora` : null
    return null
  }

  const workspaces = WORKSPACES.filter(ws => wsVisible(user, ws))
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'
  const firstName = (user?.full_name || '').split(' ')[0]

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">{greeting}{firstName ? `, ${firstName}` : ''} 👋</h1>
        <p className="text-slate-500 mt-1">Elige un módulo de la Suite BigNetiK Telecom.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {workspaces.map(ws => {
          const c = WS_COLORS[ws.color] || WS_COLORS.blue
          const sub = subline(ws)
          return (
            <button key={ws.id} onClick={() => nav(ws.home)}
              className={`group text-left bg-white rounded-2xl border border-slate-200 p-5 shadow-sm transition-all hover:shadow-md ${c.hover}`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${c.tile}`}>
                <ws.icon size={24} />
              </div>
              <h2 className="mt-4 font-bold text-slate-800 text-lg">{ws.label}</h2>
              <p className="text-sm text-slate-500 mt-0.5">{ws.desc}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className={`text-xs font-medium ${sub ? c.softText : 'text-transparent'}`}>{sub || '·'}</span>
                <span className={`flex items-center gap-1 text-sm font-medium ${c.softText} opacity-0 group-hover:opacity-100 transition-opacity`}>Abrir <ArrowRight size={16} /></span>
              </div>
            </button>
          )
        })}
      </div>

      {workspaces.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-400">
          No tienes módulos asignados. Pide a un administrador que te dé permisos.
        </div>
      )}
    </div>
  )
}
