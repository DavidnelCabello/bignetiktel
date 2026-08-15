// Catálogo de módulos de la Suite BigNetiK (debe coincidir con backend/src/modules.js).
// Se usa para las casillas de permisos en Usuarios.
export const MODULES = [
  { key: 'inventory', label: 'Inventario', group: 'Almacén & Ventas' },
  { key: 'sales',     label: 'Ventas',     group: 'Almacén & Ventas' },
  { key: 'clients',   label: 'Clientes',   group: 'Almacén & Ventas' },
  { key: 'payments',  label: 'Pagos',      group: 'Almacén & Ventas' },
  { key: 'hr',        label: 'Reloj / RRHH', group: 'Personal' },
  { key: 'users',     label: 'Usuarios',      group: 'Administración' },
  { key: 'logs',      label: 'Actividad',     group: 'Administración' },
  { key: 'settings',  label: 'Configuración', group: 'Administración' },
]

// ¿El usuario tiene permiso para un módulo? super_admin siempre sí.
export function can(user, moduleKey) {
  if (!user) return false
  if (user.role === 'super_admin') return true
  return Array.isArray(user.permissions) && user.permissions.includes(moduleKey)
}
