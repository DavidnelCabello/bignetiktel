import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, LogOut, User, LayoutGrid } from 'lucide-react'
import ProfileModal from './ProfileModal'
import NotificationBell from './NotificationBell'
import { WORKSPACES, WS_COLORS, wsVisible, itemVisible } from '../data/workspaces'
import { can } from '../data/modules'
import { api } from '../api'

export default function Layout({ children, user, onLogout }) {
  const loc = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [currentUser, setCurrentUser] = useState(user)
  const [lateCount, setLateCount] = useState(0)
  const [leaveCount, setLeaveCount] = useState(0)
  const [ticketCount, setTicketCount] = useState(0)
  const [tcCount, setTcCount] = useState(0)
  const [logo, setLogo] = useState('')
  useEffect(() => { if (can(user, 'sales')) api.getLatePaymentsCount().then(d => setLateCount(d.count)).catch(() => {}) }, [])
  useEffect(() => {
    if (!can(user, 'hr')) return
    const refresh = () => {
      api.hrLeavesPendingCount().then(d => setLeaveCount(d.count)).catch(() => {})
      api.hrTicketsOpenCount().then(d => setTicketCount(d.count)).catch(() => {})
      api.hrTimeChangesPending().then(d => setTcCount(d.count)).catch(() => {})
    }
    refresh()
    const i = setInterval(refresh, 20000)               // auto-refresco periódico
    window.addEventListener('hr-refresh', refresh)       // refresco inmediato tras una acción
    return () => { clearInterval(i); window.removeEventListener('hr-refresh', refresh) }
  }, [])
  useEffect(() => { api.getSettings().then(s => setLogo(s.company_logo || '')).catch(() => {}) }, [])

  const workspaces = WORKSPACES.filter(ws => wsVisible(user, ws))
  const isActive = (to) => loc.pathname === to || (to !== '/' && loc.pathname.startsWith(to))
  const currentWs = workspaces.find(ws => ws.nav.some(i => isActive(i.to)))
  const inHub = !currentWs

  const badges = { late: lateCount, leaves: leaveCount, tickets: ticketCount, timechanges: tcCount }

  const TopBar = (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 lg:px-6 sticky top-0 z-10">
      {!inHub && <button onClick={() => setOpen(true)} className="lg:hidden p-2 text-slate-600"><Menu size={22} /></button>}
      {inHub && (
        <div className="flex items-center gap-3">
          {logo ? <img src={logo} alt="" className="w-8 h-8 rounded-lg object-cover" /> : <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-sm text-white">B</div>}
          <div><h1 className="font-bold text-sm text-slate-800 leading-tight">BigNetiK Telecom</h1><p className="text-xs text-slate-400">Suite de Gestión</p></div>
        </div>
      )}
      <div className="ml-auto flex items-center gap-1">
        {can(user, 'hr') && <NotificationBell fetchList={api.hrNotifications} fetchUnread={api.hrNotifUnread} markRead={api.hrNotifRead} onOpenItem={() => navigate('/tickets-rrhh')} />}
        <button onClick={() => setShowProfile(true)} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors">
          {currentUser?.avatar ? <img src={currentUser.avatar} alt="" className="w-6 h-6 rounded-full object-cover" /> : <User size={16} className="text-slate-400" />}
          {currentUser?.full_name}
        </button>
      </div>
    </header>
  )

  const Chrome = (
    <>
      {showProfile && <ProfileModal user={currentUser} onClose={() => setShowProfile(false)} onUpdate={(u) => { setCurrentUser(u); setShowProfile(false) }} onLogout={onLogout} />}
    </>
  )

  // ===== Modo Inicio (lanzador de la suite): sin barra lateral de módulo =====
  if (inHub) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-100">
        {TopBar}
        <main className="flex-1 p-4 lg:p-8 overflow-auto">{children}</main>
        {Chrome}
      </div>
    )
  }

  // ===== Modo Módulo: barra lateral acotada al workspace actual =====
  const c = WS_COLORS[currentWs.color] || WS_COLORS.blue
  const items = currentWs.nav.filter(i => itemVisible(user, i))

  return (
    <div className="min-h-screen flex">
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transform transition-transform duration-200 lg:translate-x-0 lg:static ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Cabecera del módulo + volver a la Suite */}
        <div className="h-16 flex items-center px-4 border-b border-slate-700 gap-2">
          <Link to="/" onClick={() => setOpen(false)} title="Ir al inicio de la Suite" className="p-2 -ml-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg">
            <LayoutGrid size={20} />
          </Link>
          <div className="min-w-0">
            <h1 className="font-bold text-sm truncate">{currentWs.label}</h1>
            <p className="text-xs text-slate-400">BigNetiK Telecom</p>
          </div>
        </div>

        <nav className="mt-3 px-3 space-y-1 overflow-y-auto pb-40" style={{ maxHeight: 'calc(100vh - 4rem)' }}>
          {items.map(item => {
            const active = isActive(item.to)
            const badge = item.badge ? badges[item.badge] : 0
            return (
              <Link key={item.to} to={item.to} onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${active ? `${c.active} text-white` : 'text-slate-300 hover:bg-slate-800'}`}>
                <item.icon size={20} /> {item.label}
                {badge > 0 && <span className="ml-auto bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{badge}</span>}
              </Link>
            )
          })}

          {/* Cambiador rápido de módulo */}
          {workspaces.length > 1 && (
            <div className="pt-4 mt-3 border-t border-slate-800">
              <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Otros módulos</p>
              {workspaces.filter(w => w.id !== currentWs.id).map(w => (
                <Link key={w.id} to={w.home} onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
                  <w.icon size={18} /> {w.label}
                </Link>
              ))}
            </div>
          )}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700 flex items-center justify-between bg-slate-900">
          <div className="flex items-center gap-2 min-w-0">
            {currentUser?.avatar ? <img src={currentUser.avatar} alt="" className="w-8 h-8 rounded-full object-cover" /> : <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center"><User size={16} className="text-slate-300" /></div>}
            <div className="text-sm min-w-0"><p className="text-slate-300 font-medium truncate">{currentUser?.full_name}</p><p className="text-slate-500 text-xs">{currentUser?.role === 'super_admin' ? 'Super Admin' : 'Admin'}</p></div>
          </div>
          <button onClick={onLogout} className="p-2 text-slate-400 hover:text-white"><LogOut size={18} /></button>
        </div>
      </aside>

      {open && <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setOpen(false)} />}
      <div className="flex-1 flex flex-col min-w-0">
        {TopBar}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">{children}</main>
      </div>
      {Chrome}
    </div>
  )
}
