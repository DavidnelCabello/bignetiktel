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
