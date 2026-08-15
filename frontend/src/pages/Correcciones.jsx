import { useState, useEffect } from 'react'
import { api } from '../api'
import { PencilRuler, Check, X, Clock, ArrowRight } from 'lucide-react'
import { time12 as hm } from '../lib/time'

const STATUS_STYLE = { pendiente: 'bg-amber-50 text-amber-700', aprobada: 'bg-emerald-50 text-emerald-700', rechazada: 'bg-red-50 text-red-700' }

export default function Correcciones() {
  const [rows, setRows] = useState([])
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState(null)

  function load() { api.hrTimeChanges(filter).then(r => { setRows(r); setLoading(false) }).catch(() => setLoading(false)) }
  useEffect(() => { load() }, [filter])

  async function decide(r, decision) {
    let note = ''
    if (decision === 'rechazada') note = prompt('Motivo del rechazo (opcional):') || ''
    else if (!confirm('¿Aprobar y aplicar esta corrección al fichaje del empleado?')) return
    try { await api.hrDecideTimeChange(r.id, decision, note); setDetail(null); load(); window.dispatchEvent(new Event('hr-refresh')) } catch (e) { alert(e.message) }
  }

  if (loading) return <div className="animate-pulse space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 bg-slate-200 rounded-xl" />)}</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><PencilRuler size={24} className="text-emerald-600" /> Correcciones de Horario</h1>
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          {[['', 'Todas'], ['pendiente', 'Pendientes'], ['aprobada', 'Aprobadas'], ['rechazada', 'Rechazadas']].map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)} className={`px-3 py-1.5 rounded-md text-sm ${filter === v ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}>{l}</button>
          ))}
        </div>
      </div>

      {rows.length === 0 && <p className="text-slate-400 text-sm py-10 text-center">No hay solicitudes de corrección {filter && `(${filter})`}.</p>}

      <div className="space-y-2">
        {rows.map(r => (
          <div key={r.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-start justify-between gap-3 flex-wrap hover:border-emerald-300 transition-colors">
            <button onClick={() => setDetail(r)} className="text-left flex-1 min-w-0">
              <p className="font-medium text-slate-800">{r.employee_name} <span className="text-slate-400 text-xs font-normal">· ID {r.employee_code}</span></p>
              <p className="text-sm text-slate-600 mt-1">Fecha: <strong>{r.date}</strong></p>
              <div className="text-sm text-slate-600 mt-1 space-y-0.5">
                {r.requested_check_in && <p>Poner <strong>entrada</strong> a las <strong className="text-emerald-700">{hm(r.requested_check_in)}</strong></p>}
                {r.requested_check_out && <p>Poner <strong>salida</strong> a las <strong className="text-emerald-700">{hm(r.requested_check_out)}</strong></p>}
              </div>
              {(r.reason_type || r.reason) && <p className="text-xs text-slate-500 mt-1">Motivo: {r.reason_type ? <span className="font-medium">{r.reason_type}</span> : ''}{r.reason ? ` — ${r.reason}` : ''}</p>}
              {r.admin_note && <p className="text-xs text-slate-500 mt-1 italic">Nota RRHH: {r.admin_note}</p>}
              <p className="text-xs text-emerald-600 mt-1.5 font-medium">Ver detalle →</p>
            </button>
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
        ))}
      </div>

      {detail && <DetailModal r={detail} onClose={() => setDetail(null)} onDecide={decide} />}
    </div>
  )
}

// Modal con el antes/después del cambio pedido.
function DetailModal({ r, onClose, onDecide }) {
  const changeIn = !!r.requested_check_in
  const changeOut = !!r.requested_check_out
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><PencilRuler size={20} className="text-emerald-600" /> Corrección de horario</h3>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <p className="font-semibold text-slate-800">{r.employee_name}</p>
            <p className="text-sm text-slate-500">ID {r.employee_code} · Fecha {r.date}</p>
          </div>

          {!r.entry_id && <p className="text-xs bg-amber-50 text-amber-700 px-3 py-2 rounded-lg">No había fichaje ese día — se creará uno nuevo con estas horas.</p>}

          {/* Antes → Después */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">El cambio</p>
            {changeIn && <BeforeAfter label="Entrada" before={r.current_check_in} after={r.requested_check_in} />}
            {changeOut && <BeforeAfter label="Salida" before={r.current_check_out} after={r.requested_check_out} />}
          </div>

          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-xs text-slate-500">Motivo</p>
            <p className="text-sm text-slate-800 font-medium">{r.reason_type || '—'}</p>
            {r.reason && <p className="text-sm text-slate-600 mt-0.5">{r.reason}</p>}
          </div>

          {r.admin_note && <p className="text-sm text-slate-500 italic">Nota RRHH: {r.admin_note}</p>}

          {r.status === 'pendiente' ? (
            <div className="flex gap-2 pt-1">
              <button onClick={() => onDecide(r, 'aprobada')} className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700"><Check size={18} /> Aprobar y aplicar</button>
              <button onClick={() => onDecide(r, 'rechazada')} className="flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100"><X size={18} /> Rechazar</button>
            </div>
          ) : (
            <p className="text-center text-sm"><span className={`px-3 py-1.5 rounded-full font-medium ${STATUS_STYLE[r.status]}`}>Ya {r.status}{r.decided_by ? ` por ${r.decided_by}` : ''}</span></p>
          )}
        </div>
      </div>
    </div>
  )
}

function BeforeAfter({ label, before, after }) {
  return (
    <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-3 py-2.5">
      <span className="text-sm text-slate-500 w-16">{label}</span>
      <span className="text-sm text-slate-400 line-through">{before ? hm(before) : 'sin marca'}</span>
      <ArrowRight size={16} className="text-slate-400" />
      <span className="text-base font-bold text-emerald-700">{hm(after)}</span>
    </div>
  )
}
