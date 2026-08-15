import { useState, useEffect } from 'react'
import { Bell, MessageSquare, Check } from 'lucide-react'
import { stamp12 } from '../lib/time'

// Campanita de notificaciones reutilizable (admin y portal).
// Props: fetchList, fetchUnread, markRead (funciones que devuelven promesas), onOpenItem(n), variant.
export default function NotificationBell({ fetchList, fetchUnread, markRead, onOpenItem, variant = 'light' }) {
  const [count, setCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [list, setList] = useState([])

  function poll() { fetchUnread().then(d => setCount(d.count || 0)).catch(() => {}) }
  useEffect(() => {
    poll()
    const i = setInterval(poll, 30000)
    window.addEventListener('hr-refresh', poll)
    return () => { clearInterval(i); window.removeEventListener('hr-refresh', poll) }
  }, [])

  async function toggle() {
    if (!open) { try { setList(await fetchList()) } catch { setList([]) } }
    setOpen(o => !o)
  }
  async function openItem(n) {
    setOpen(false)
    try { await markRead() } catch {}
    setCount(0)
    onOpenItem?.(n)
  }
  async function markAll() {
    try { await markRead() } catch {}
    setCount(0); setList(l => l.map(n => ({ ...n, read: 1 })))
  }

  const btnColor = variant === 'dark' ? 'text-white/90 hover:bg-white/15' : 'text-slate-500 hover:bg-slate-100'

  return (
    <div className="relative">
      <button onClick={toggle} className={`relative p-2 rounded-lg transition-colors ${btnColor}`} title="Notificaciones">
        <Bell size={20} />
        {count > 0 && <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{count > 9 ? '9+' : count}</span>}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <p className="font-semibold text-slate-800 text-sm">Notificaciones</p>
              {list.some(n => !n.read) && <button onClick={markAll} className="text-xs text-blue-600 hover:underline flex items-center gap-1"><Check size={13} /> Marcar leídas</button>}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {list.length === 0 && <p className="text-sm text-slate-400 text-center py-8">Sin notificaciones</p>}
              {list.map(n => (
                <button key={n.id} onClick={() => openItem(n)} className={`w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 flex gap-3 ${n.read ? '' : 'bg-blue-50/40'}`}>
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0"><MessageSquare size={15} className="text-slate-500" /></div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800">{n.title || 'Notificación'}</p>
                    {n.body && <p className="text-xs text-slate-500 truncate">{n.body}</p>}
                    <p className="text-[11px] text-slate-400 mt-0.5">{stamp12(n.created_at)}</p>
                  </div>
                  {!n.read && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
