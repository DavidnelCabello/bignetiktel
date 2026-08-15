import { useState, useEffect } from 'react'
import { api } from '../api'
import { LifeBuoy, Send, ArrowLeft, CheckCircle2, RotateCcw, Trash2 } from 'lucide-react'
import { stamp12 } from '../lib/time'

const STATUS_STYLE = { abierto: 'bg-emerald-50 text-emerald-700', cerrado: 'bg-slate-100 text-slate-500' }

export default function TicketsRRHH() {
  const [tickets, setTickets] = useState([])
  const [filter, setFilter] = useState('')
  const [open, setOpen] = useState(null)
  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(true)

  function load() { api.hrGetTickets(filter).then(t => { setTickets(t); setLoading(false) }).catch(() => setLoading(false)) }
  useEffect(() => { load() }, [filter])
  function openTicket(id) { api.hrGetTicket(id).then(setOpen).catch(() => {}) }

  async function sendReply(e) {
    e.preventDefault()
    if (!reply.trim()) return
    try { await api.hrReplyTicket(open.id, reply); setReply(''); openTicket(open.id); load(); window.dispatchEvent(new Event('hr-refresh')) } catch (e) { alert(e.message) }
  }
  async function toggleStatus() {
    const next = open.status === 'abierto' ? 'cerrado' : 'abierto'
    try { await api.hrTicketStatus(open.id, next); openTicket(open.id); load(); window.dispatchEvent(new Event('hr-refresh')) } catch (e) { alert(e.message) }
  }
  async function del(id, fromDetail) {
    if (!confirm('¿Eliminar este ticket cerrado? Se borrará la conversación y no se puede deshacer.')) return
    try { await api.hrDeleteTicket(id); if (fromDetail) setOpen(null); load(); window.dispatchEvent(new Event('hr-refresh')) } catch (e) { alert(e.message) }
  }

  if (open) return (
    <div className="space-y-3 max-w-2xl">
      <button onClick={() => { setOpen(null); load() }} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"><ArrowLeft size={16} /> Volver a la bandeja</button>
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-800">{open.subject}</h3>
          <p className="text-xs text-slate-400">{open.employee_name} · ID {open.employee_code}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleStatus} className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg ${open.status === 'abierto' ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>
            {open.status === 'abierto' ? <><CheckCircle2 size={15} /> Cerrar</> : <><RotateCcw size={15} /> Reabrir</>}
          </button>
          {open.status === 'cerrado' && <button onClick={() => del(open.id, true)} title="Eliminar ticket" className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"><Trash2 size={15} /> Eliminar</button>}
        </div>
      </div>
      <div className="space-y-2">
        {open.messages.map(m => (
          <div key={m.id} className={`max-w-[85%] rounded-xl px-4 py-2.5 ${m.author_type === 'admin' ? 'bg-blue-600 text-white ml-auto' : 'bg-white border border-slate-200'}`}>
            <p className={`text-[11px] mb-0.5 ${m.author_type === 'admin' ? 'text-blue-100' : 'text-slate-400'}`}>{m.author_type === 'admin' ? `RRHH · ${m.author_name}` : m.author_name} · {stamp12(m.created_at)}</p>
            <p className="text-sm whitespace-pre-wrap">{m.message}</p>
          </div>
        ))}
      </div>
      {open.status === 'abierto' && (
        <form onSubmit={sendReply} className="flex gap-2">
          <input value={reply} onChange={e => setReply(e.target.value)} className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="Responder al empleado…" />
          <button type="submit" className="px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Send size={16} /></button>
        </form>
      )}
    </div>
  )

  if (loading) return <div className="animate-pulse space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-slate-200 rounded-xl" />)}</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><LifeBuoy size={24} className="text-emerald-600" /> Tickets de Empleados</h1>
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          {[['', 'Todos'], ['abierto', 'Abiertos'], ['cerrado', 'Cerrados']].map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)} className={`px-3 py-1.5 rounded-md text-sm ${filter === v ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}>{l}</button>
          ))}
        </div>
      </div>

      {tickets.length === 0 && <p className="text-slate-400 text-sm py-10 text-center">No hay tickets {filter && `(${filter})`}.</p>}

      <div className="space-y-2">
        {tickets.map(t => (
          <div key={t.id} className="w-full bg-white rounded-xl border border-slate-200 p-4 hover:border-emerald-300 flex items-center gap-3">
            <button onClick={() => openTicket(t.id)} className="flex-1 text-left min-w-0">
              <p className="font-medium text-slate-800 truncate">{t.subject}</p>
              <p className="text-xs text-slate-400">{t.employee_name} · ID {t.employee_code}</p>
              {t.last_message && <p className="text-xs text-slate-500 mt-1 truncate">{t.last_message}</p>}
            </button>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${STATUS_STYLE[t.status]}`}>{t.status}</span>
            {t.status === 'cerrado' && <button onClick={() => del(t.id)} title="Eliminar ticket cerrado" className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg shrink-0"><Trash2 size={16} /></button>}
          </div>
        ))}
      </div>
    </div>
  )
}
