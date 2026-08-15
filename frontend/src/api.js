const API = '/api';

function token() { return localStorage.getItem('token') }

async function req(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const t = token();
  if (t) headers['Authorization'] = `Bearer ${t}`;
  const res = await fetch(`${API}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error');
  return data;
}

// Petición del PORTAL DEL EMPLEADO (token separado del admin).
async function preq(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const t = localStorage.getItem('emp_token');
  if (t) headers['Authorization'] = `Bearer ${t}`;
  const res = await fetch(`${API}/portal${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error');
  return data;
}

// Kiosco de fichaje facial (público, sin token; se bloquea por IP en el servidor).
async function kreq(method, path, body) {
  const res = await fetch(`${API}/kiosk${path}`, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Error')
  return data
}
export const kioskApi = {
  getEmployee: (code) => kreq('GET', `/employee/${encodeURIComponent(code)}`),
  identify: (payload) => kreq('POST', '/identify', payload),
  checkout: (token) => kreq('POST', '/checkout', { token }),
  whoami: () => kreq('GET', '/whoami'),
}

export const portalApi = {
  login: (employee_code, password) => preq('POST', '/login', { employee_code, password }),
  me: () => preq('GET', '/me'),
  changePassword: (currentPassword, newPassword) => preq('POST', '/change-password', { currentPassword, newPassword }),
  updateProfile: (d) => preq('PUT', '/profile', d),
  updatePhoto: (photo) => preq('PUT', '/photo', { photo }),
  getTime: (from, to) => preq('GET', `/time?from=${from}&to=${to}`),
  getSummary: () => preq('GET', '/summary'),
  // Correcciones de horario
  getTimeChanges: () => preq('GET', '/time-changes'),
  createTimeChange: (d) => preq('POST', '/time-changes', d),
  // Vacaciones
  getLeaves: () => preq('GET', '/leaves'),
  createLeave: (d) => preq('POST', '/leaves', d),
  cancelLeave: (id) => preq('DELETE', `/leaves/${id}`),
  // Tickets
  getTickets: () => preq('GET', '/tickets'),
  createTicket: (d) => preq('POST', '/tickets', d),
  getTicket: (id) => preq('GET', `/tickets/${id}`),
  replyTicket: (id, message) => preq('POST', `/tickets/${id}/reply`, { message }),
  deleteTicket: (id) => preq('DELETE', `/tickets/${id}`),
  // Notificaciones
  notifications: () => preq('GET', '/notifications'),
  notifUnread: () => preq('GET', '/notifications/unread-count'),
  notifRead: () => preq('POST', '/notifications/read'),
};

export const api = {
  login: (u, p) => req('POST', '/auth/login', { username: u, password: p }),
  me: () => req('GET', '/auth/me'),

  getTypes: () => req('GET', '/equipment/types'),
  createType: (d) => req('POST', '/equipment/types', d),
  updateType: (id, d) => req('PUT', `/equipment/types/${id}`, d),
  deleteType: (id) => req('DELETE', `/equipment/types/${id}`),

  getBrands: () => req('GET', '/equipment/brands'),
  createBrand: (d) => req('POST', '/equipment/brands', d),
  updateBrand: (id, d) => req('PUT', `/equipment/brands/${id}`, d),
  deleteBrand: (id) => req('DELETE', `/equipment/brands/${id}`),

  getModels: () => req('GET', '/equipment/models'),
  createModel: (d) => req('POST', '/equipment/models', d),
  updateModel: (id, d) => req('PUT', `/equipment/models/${id}`, d),
  deleteModel: (id) => req('DELETE', `/equipment/models/${id}`),

  getInventory: () => req('GET', '/equipment/inventory'),
  createInventory: (d) => req('POST', '/equipment/inventory', d),
  updateInventory: (id, d) => req('PUT', `/equipment/inventory/${id}`, d),
  deleteInventory: (id) => req('DELETE', `/equipment/inventory/${id}`),
  getEquipmentStats: () => req('GET', '/equipment/stats'),
  getLowStock: () => req('GET', '/equipment/low-stock'),

  getClients: () => req('GET', '/clients'),
  createClient: (d) => req('POST', '/clients', d),
  updateClient: (id, d) => req('PUT', `/clients/${id}`, d),
  deleteClient: (id) => req('DELETE', `/clients/${id}`),
  getClientSales: (id) => req('GET', `/clients/${id}/sales`),
  getClientSummary: (id) => req('GET', `/clients/${id}/summary`),

  getLatePayments: () => req('GET', '/sales/late'),
  getLatePaymentsCount: () => req('GET', '/sales/late/count'),
  getMonthlySales: () => req('GET', '/sales/chart/monthly'),
  getTopModels: () => req('GET', '/sales/chart/top-models'),
  getSales: () => req('GET', '/sales'),
  getSale: (id) => req('GET', `/sales/${id}`),
  createSale: (d) => req('POST', '/sales', d),
  notifyLatePayment: (id) => req('POST', `/sales/${id}/notify`),
  addPayment: (id, d) => req('POST', `/sales/${id}/payment`, d),
  cancelSale: (id) => req('POST', `/sales/${id}/cancel`),

  // ===== Reloj / RRHH =====
  getEmployees: (params = '') => req('GET', `/employees${params}`),
  getEmployee: (id) => req('GET', `/employees/${id}`),
  createEmployee: (d) => req('POST', '/employees', d),
  updateEmployee: (id, d) => req('PUT', `/employees/${id}`, d),
  deleteEmployee: (id) => req('DELETE', `/employees/${id}`),
  generatePortalAccess: (id) => req('POST', `/employees/${id}/portal-access`),
  enrollFace: (id, descriptor, photo) => req('POST', `/employees/${id}/enroll-face`, { descriptor, photo }),
  deleteFace: (id) => req('DELETE', `/employees/${id}/face`),

  getDepartments: () => req('GET', '/departments'),
  getDepartment: (id) => req('GET', `/departments/${id}`),
  createDepartment: (d) => req('POST', '/departments', d),
  updateDepartment: (id, d) => req('PUT', `/departments/${id}`, d),
  deleteDepartment: (id) => req('DELETE', `/departments/${id}`),
  assignMembers: (id, employee_ids) => req('POST', `/departments/${id}/members`, { employee_ids }),
  removeMember: (id, empId) => req('DELETE', `/departments/${id}/members/${empId}`),

  checkIn: (employee_id, d = {}) => req('POST', '/time/check-in', { employee_id, ...d }),
  checkOut: (employee_id) => req('POST', '/time/check-out', { employee_id }),
  getOpenEntries: () => req('GET', '/time/open'),
  getTimeEntries: (qs = '') => req('GET', `/time${qs}`),
  createTimeEntry: (d) => req('POST', '/time', d),
  updateTimeEntry: (id, d) => req('PUT', `/time/${id}`, d),
  deleteTimeEntry: (id) => req('DELETE', `/time/${id}`),
  getTimeReport: (from, to, employee_id) => req('GET', `/time/report?from=${from}&to=${to}${employee_id ? `&employee_id=${employee_id}` : ''}`),

  // ===== Bandeja RRHH (admin) =====
  hrGetLeaves: (status = '') => req('GET', `/hr/leaves${status ? `?status=${status}` : ''}`),
  hrDecideLeave: (id, decision, admin_note) => req('POST', `/hr/leaves/${id}/decide`, { decision, admin_note }),
  hrLeavesPendingCount: () => req('GET', '/hr/leaves/pending-count'),
  hrGetTickets: (status = '') => req('GET', `/hr/tickets${status ? `?status=${status}` : ''}`),
  hrGetTicket: (id) => req('GET', `/hr/tickets/${id}`),
  hrReplyTicket: (id, message) => req('POST', `/hr/tickets/${id}/reply`, { message }),
  hrTicketStatus: (id, status) => req('POST', `/hr/tickets/${id}/status`, { status }),
  hrDeleteTicket: (id) => req('DELETE', `/hr/tickets/${id}`),
  hrTicketsOpenCount: () => req('GET', '/hr/tickets/meta/open-count'),
  hrDashboard: (from, to) => req('GET', `/hr/dashboard${from && to ? `?from=${from}&to=${to}` : ''}`),
  hrWorking: () => req('GET', '/hr/working'),
  hrPayroll: (from, to) => req('GET', `/hr/payroll${from && to ? `?from=${from}&to=${to}` : ''}`),
  hrTimeChanges: (status = '') => req('GET', `/hr/time-changes${status ? `?status=${status}` : ''}`),
  hrDecideTimeChange: (id, decision, admin_note) => req('POST', `/hr/time-changes/${id}/decide`, { decision, admin_note }),
  hrTimeChangesPending: () => req('GET', '/hr/time-changes/pending-count'),
  hrNotifications: () => req('GET', '/hr/notifications'),
  hrNotifUnread: () => req('GET', '/hr/notifications/unread-count'),
  hrNotifRead: () => req('POST', '/hr/notifications/read'),

  getUsers: () => req('GET', '/users'),
  getUser: (id) => req('GET', `/users/${id}`),
  createUser: (d) => req('POST', '/users', d),
  updateUser: (id, d) => req('PUT', `/users/${id}`, d),
  resetUserPassword: (id, password) => req('PUT', `/users/${id}/reset-password`, { password }),

  updateProfile: (d) => req('PUT', '/auth/profile', d),
  updateAvatar: (avatar) => req('PUT', '/auth/profile/avatar', { avatar }),
  updateUsername: (username) => req('PUT', '/auth/profile/username', { username }),
  changePassword: (currentPassword, newPassword) => req('POST', '/auth/change-password', { currentPassword, newPassword }),
  forgotPassword: (username) => req('POST', '/auth/forgot-password', { username }),
  resetPassword: (username, token, newPassword) => req('POST', '/auth/reset-password', { username, token, newPassword }),

  getLogs: (page = 1) => req('GET', `/logs?page=${page}&limit=50`),
  getSettings: () => req('GET', '/settings'),
  saveSettings: (d) => req('PUT', '/settings', d),

  downloadBackup: async () => {
    const t = token();
    const res = await fetch(`${API}/backup/download`, { headers: { Authorization: `Bearer ${t}` } });
    if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Error al descargar'); }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bignetiktel-backup-${new Date().toISOString().slice(0, 10)}.db`;
    a.click();
    URL.revokeObjectURL(url);
  },
  createBackup: () => req('POST', '/backup/create'),
  restoreBackup: (backupFile) => req('POST', '/backup/restore', { backupFile }),
  deleteBackup: (name) => req('DELETE', `/backup/${encodeURIComponent(name)}`),
  listBackups: () => req('GET', '/backup/list'),
  getAutoBackupStatus: () => req('GET', '/backup/auto-status'),
  toggleAutoBackup: (enabled) => req('POST', '/backup/auto-toggle', { enabled }),
};
