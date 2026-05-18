import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Package, GitBranch, Tags, Users, ShoppingCart, AlertTriangle, ShieldCheck, ClipboardList, Settings as SettingsIcon, Menu, LogOut, User } from 'lucide-react'
import ProfileModal from './ProfileModal'
import { api } from '../api'

export default function Layout({ children, user, onLogout }) {
  const isSuperAdmin = user?.role === 'super_admin'
  const [open, setOpen] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [currentUser, setCurrentUser] = useState(user)
  const [lateCount, setLateCount] = useState(0)
  const [logo, setLogo] = useState('')
  useEffect(() => { api.getLatePaymentsCount().then(d => setLateCount(d.count)).catch(() => {}) }, [])
  useEffect(() => { api.getSettings().then(s => setLogo(s.company_logo || '')).catch(() => {}) }, [])
  const nav = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/inventario', label: 'Inventario', icon: Package },
    { to: '/modelos', label: 'Modelos', icon: GitBranch },
    { to: '/catalogos', label: 'Catálogos', icon: Tags },
    { to: '/clientes', label: 'Clientes', icon: Users },
    { to: '/ventas', label: 'Ventas', icon: ShoppingCart },
    { to: '/pagos-atrasados', label: 'Pagos Atrasados', icon: AlertTriangle, badge: lateCount },
    ...(isSuperAdmin ? [
      { to: '/usuarios', label: 'Usuarios', icon: ShieldCheck },
      { to: '/logs', label: 'Actividad', icon: ClipboardList },
      { to: '/configuracion', label: 'Configuración', icon: SettingsIcon },
    ] : []),
  ]
  const loc = useLocation()

  return (
    <div className="min-h-screen flex">
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transform transition-transform duration-200 lg:translate-x-0 lg:static ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center px-6 border-b border-slate-700 gap-3">
          {logo ? <img src={logo} alt="" className="w-8 h-8 rounded-lg object-cover" /> : <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-sm">B</div>}
          <div><h1 className="font-bold text-sm">BigNetiK Telecom</h1><p className="text-xs text-slate-400">Sistema de Inventario</p></div>
        </div>
        <nav className="mt-4 px-3 space-y-1">
          {nav.map(item => {
            const active = loc.pathname === item.to || (item.to !== '/' && loc.pathname.startsWith(item.to))
            return (
              <Link key={item.to} to={item.to} onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${active ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
                <item.icon size={20} /> {item.label}
                {item.badge > 0 && <span className="ml-auto bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{item.badge}</span>}
              </Link>
            )
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {currentUser?.avatar ? <img src={currentUser.avatar} alt="" className="w-8 h-8 rounded-full object-cover" /> : <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center"><User size={16} className="text-slate-300" /></div>}
            <div className="text-sm"><p className="text-slate-300 font-medium">{currentUser?.full_name}</p><p className="text-slate-500 text-xs">{currentUser?.role === 'super_admin' ? 'Super Admin' : 'Admin'}</p></div>
          </div>
          <button onClick={onLogout} className="p-2 text-slate-400 hover:text-white"><LogOut size={18} /></button>
        </div>
      </aside>
      {open && <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setOpen(false)} />}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 lg:px-6 sticky top-0 z-10">
          <button onClick={() => setOpen(true)} className="lg:hidden p-2 text-slate-600"><Menu size={22} /></button>
          <button onClick={() => setShowProfile(true)} className="ml-auto flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors">
            {currentUser?.avatar ? <img src={currentUser.avatar} alt="" className="w-6 h-6 rounded-full object-cover" /> : <User size={16} className="text-slate-400" />}
            {currentUser?.full_name}
          </button>
        </header>
        {showProfile && <ProfileModal user={currentUser} onClose={() => setShowProfile(false)} onUpdate={(u) => { setCurrentUser(u); setShowProfile(false) }} onLogout={onLogout} />}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
