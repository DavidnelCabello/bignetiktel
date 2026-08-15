// Espacios de trabajo de la Suite BigNetiK.
// Cada workspace es un MÓDULO hermano (Almacén, RRHH, Admin...), con su propia
// barra lateral. El Inicio (/) es el lanzador desde donde se elige uno.
// Todos comparten backend, login y diseño → un solo sistema.
import { LayoutDashboard, Package, GitBranch, Tags, Users, ShoppingCart, AlertTriangle, UserCog, Clock, CalendarClock, ShieldCheck, ClipboardList, Settings as SettingsIcon, Store, Building2, Palmtree, LifeBuoy, Radio, PencilRuler, Receipt } from 'lucide-react'

export const WORKSPACES = [
  {
    id: 'almacen',
    label: 'Almacén & Ventas',
    desc: 'Inventario, ventas a plazos, clientes y pagos',
    icon: Store,
    color: 'blue',
    home: '/almacen',
    anyOf: ['inventory', 'sales', 'clients', 'payments'],
    nav: [
      { to: '/almacen', label: 'Panel', icon: LayoutDashboard, perm: null },
      { to: '/inventario', label: 'Inventario', icon: Package, perm: 'inventory' },
      { to: '/modelos', label: 'Modelos', icon: GitBranch, perm: 'inventory' },
      { to: '/catalogos', label: 'Catálogos', icon: Tags, perm: 'inventory' },
      { to: '/clientes', label: 'Clientes', icon: Users, perm: 'clients' },
      { to: '/ventas', label: 'Ventas', icon: ShoppingCart, perm: 'sales' },
      { to: '/pagos-atrasados', label: 'Pagos Atrasados', icon: AlertTriangle, perm: 'sales', badge: 'late' },
    ],
  },
  {
    id: 'rrhh',
    label: 'Reloj / RRHH',
    desc: 'Empleados, fichaje y horas trabajadas',
    icon: Clock,
    color: 'emerald',
    home: '/rrhh',
    anyOf: ['hr'],
    nav: [
      { to: '/rrhh', label: 'Panel', icon: LayoutDashboard, perm: 'hr' },
      { to: '/trabajando', label: 'Trabajando', icon: Radio, perm: 'hr' },
      { to: '/empleados', label: 'Empleados', icon: UserCog, perm: 'hr' },
      { to: '/departamentos', label: 'Departamentos', icon: Building2, perm: 'hr' },
      { to: '/fichaje', label: 'Fichaje', icon: Clock, perm: 'hr' },
      { to: '/horas', label: 'Reporte de Horas', icon: CalendarClock, perm: 'hr' },
      { to: '/facturacion', label: 'Facturación', icon: Receipt, perm: 'hr' },
      { to: '/correcciones', label: 'Correcciones', icon: PencilRuler, perm: 'hr', badge: 'timechanges' },
      { to: '/solicitudes', label: 'Solicitudes', icon: Palmtree, perm: 'hr', badge: 'leaves' },
      { to: '/tickets-rrhh', label: 'Tickets', icon: LifeBuoy, perm: 'hr', badge: 'tickets' },
    ],
  },
  {
    id: 'admin',
    label: 'Administración',
    desc: 'Usuarios, actividad y configuración del sistema',
    icon: ShieldCheck,
    color: 'slate',
    home: '/usuarios',
    superAdminOnly: true,
    nav: [
      { to: '/usuarios', label: 'Usuarios', icon: ShieldCheck, perm: null },
      { to: '/logs', label: 'Actividad', icon: ClipboardList, perm: null },
      { to: '/configuracion', label: 'Configuración', icon: SettingsIcon, perm: null },
    ],
  },
]

// Clases Tailwind por color (declaradas explícitas para que el JIT las incluya).
export const WS_COLORS = {
  blue:    { tile: 'bg-blue-100 text-blue-700',       hover: 'hover:border-blue-400 hover:shadow-blue-100', active: 'bg-blue-600', softText: 'text-blue-700' },
  emerald: { tile: 'bg-emerald-100 text-emerald-700', hover: 'hover:border-emerald-400 hover:shadow-emerald-100', active: 'bg-emerald-600', softText: 'text-emerald-700' },
  slate:   { tile: 'bg-slate-200 text-slate-700',     hover: 'hover:border-slate-400 hover:shadow-slate-100', active: 'bg-slate-700', softText: 'text-slate-700' },
}

// ¿El usuario puede ver un workspace?
export function wsVisible(user, ws) {
  if (!user) return false
  if (user.role === 'super_admin') return true
  if (ws.superAdminOnly) return false
  const perms = Array.isArray(user.permissions) ? user.permissions : []
  return (ws.anyOf || []).some(k => perms.includes(k))
}

// ¿El usuario puede ver un ítem de menú?
export function itemVisible(user, item) {
  if (!user) return false
  if (!item.perm) return true
  if (user.role === 'super_admin') return true
  return Array.isArray(user.permissions) && user.permissions.includes(item.perm)
}
