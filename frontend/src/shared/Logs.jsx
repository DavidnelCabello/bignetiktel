import { useState, useEffect } from 'react'
import { api } from '../api'
import { ClipboardList, ChevronLeft, ChevronRight, User, Activity, ShoppingCart, Package, Users, Settings, DollarSign, XCircle, Key } from 'lucide-react'

function ActionIcon({ action }) {
  const props = { size: 16 }
  switch (action) {
    case 'create': return <Package {...props} className="text-emerald-600" />
    case 'update': return <Settings {...props} className="text-blue-600" />
    case 'delete': return <XCircle {...props} className="text-red-600" />
    case 'login': return <User {...props} className="text-blue-600" />
    case 'payment': return <DollarSign {...props} className="text-green-600" />
    case 'cancel': return <XCircle {...props} className="text-red-600" />
    case 'change-password': case 'reset-password': return <Key {...props} className="text-amber-600" />
    default: return <Activity {...props} className="text-slate-500" />
  }
}

export default function Logs() {
  const [logs, setLogs] = useState([])
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.getLogs(page).then(d => { setLogs(d.logs); setPages(d.pages) }).catch(console.error).finally(() => setLoading(false))
  }, [page])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><ClipboardList size={24} className="text-purple-600" /> Registro de Actividad</h1>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="h-14 bg-slate-200 rounded-lg" />)}</div>
      ) : logs.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center"><p className="text-slate-500">No hay actividad registrada aún.</p></div>
      ) : (
        <div className="space-y-2">
          {logs.map(log => (
            <div key={log.id} className="bg-white rounded-lg border border-slate-200 px-4 py-3 flex items-center gap-3 hover:border-slate-300 transition-colors">
              <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0"><ActionIcon action={log.action} /></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-700">
                  <span className="font-semibold text-slate-800">@{log.username}</span>
                  {' '}{log.description}
                </p>
              </div>
              <div className="text-xs text-slate-400 flex-shrink-0 whitespace-nowrap">
                {new Date(log.created_at).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })}
              </div>
            </div>
          ))}
          {pages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-3">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg disabled:opacity-30"><ChevronLeft size={18} /></button>
              <span className="text-sm text-slate-500">Pág {page} de {pages}</span>
              <button disabled={page >= pages} onClick={() => setPage(page + 1)} className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg disabled:opacity-30"><ChevronRight size={18} /></button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
