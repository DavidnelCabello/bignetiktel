// Catálogo central de módulos de la Suite BigNetiK.
// Cada módulo es una "casilla" de permiso que el super_admin asigna a un usuario.
// El menú del frontend y los permisos del backend se basan en estas claves.

const MODULES = [
  { key: 'inventory', label: 'Inventario', group: 'Almacén & Ventas' },
  { key: 'sales',     label: 'Ventas',     group: 'Almacén & Ventas' },
  { key: 'clients',   label: 'Clientes',   group: 'Almacén & Ventas' },
  { key: 'payments',  label: 'Pagos',      group: 'Almacén & Ventas' },
  { key: 'hr',        label: 'Reloj / RRHH', group: 'Personal' },
  { key: 'users',     label: 'Usuarios',      group: 'Administración' },
  { key: 'logs',      label: 'Actividad',     group: 'Administración' },
  { key: 'settings',  label: 'Configuración', group: 'Administración' },
];

const MODULE_KEYS = MODULES.map(m => m.key);

module.exports = { MODULES, MODULE_KEYS };
