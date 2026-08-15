import { useState, useEffect } from 'react'
import { api } from '../api'
import { Palmtree, Check, X, Clock } from 'lucide-react'

const LEAVE_LABEL = { vacaciones: 'Vacaciones', enfermedad: 'Enfermedad', personal: 'Personal' }
const STATUS_STYLE = { pendiente: 'bg-amber-50 text-amber-700', aprobada: 'bg-emerald-50 text-emerald-700', rechazada: 'bg-red-50 text-red-700' }

export default function Solicitudes() {
  const [leaves, setLeaves] = useState([])
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)

  function load() { api.hrGetLeaves(filter).then(l => { setLeaves(l); setLoading(false) }).catch(() => setLoading(false)) }
  useEffect(() => { load() }, [filter])

  async function decide(lr, decision) {
    let note = ''
    if (decision === 'rechazada') { note = prompt('Motivo del rechazo (opcional):') || '' }
    try { await api.hrDecideLeave(lr.id, decision, note); load(); window.dispatchEvent(new Event('hr-refresh')) } catch (e) { alert(e.message) }
  }

  if (loading) return <div className="animate-pulse space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-slate-200 rounded-xl" />)}</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Palmtree size={24} className="text-emerald-600" /> Solicitudes de Ausencia</h1>
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          {[['', 'Todas'], ['pendiente', 'Pendientes'], ['aprobada', 'Aprobadas'], ['rechazada', 'Rechazadas']].map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)} className={`px-3 py-1.5 rounded-md text-sm ${filter === v ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}>{l}</button>
          ))}
        </div>
      </div>

      {leaves.length === 0 && <p className="text-slate-400 text-sm py-10 text-center">No hay solicitudes {filter && `(${filter})`}.</p>}

      <div className="space-y-2">
        {leaves.map(r => (
          <div key={r.id} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <p className="font-medium text-slate-800">{r.employee_name} <span className="text-slate-400 text-xs font-normal">· {r.position || r.employee_code}</span></p>
                <p className="text-sm text-slate-600 mt-0.5">{LEAVE_LABEL[r.type]} · <strong>{r.days} día{r.days === 1 ? '' : 's'}</strong> · {r.start_date} → {r.end_date}</p>
                {r.reason && <p className="text-xs text-slate-400 mt-1">Motivo: {r.reason}</p>}
                {r.admin_note && <p className="text-xs text-slate-500 mt-1 italic">Nota: {r.admin_note}</p>}
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLE[r.status]}`}>{r.status}</span>
                {r.status === 'pendiente' && (
                  <div className="flex gap-2">
                    <button onClick={() => decide(r, 'aprobada')} className="flex items-center gap-1 text-sm bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700"><Check size={15} /> Aprobar</button>
                    <button onClick={() => decide(r, 'rechazada')} className="flex items-center gap-1 text-sm bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100"><X size={15} /> Rechazar</button>
                  </div>
                )}
                {r.decided_by && <p className="text-[11px] text-slate-400 flex items-center gap-1"><Clock size={11} /> {r.decided_by}</p>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
