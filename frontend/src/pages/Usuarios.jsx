import { useState, useEffect } from 'react'
import { api } from '../api'
import { UserPlus, User, Shield, ShieldCheck, Key, Power, PowerOff, Edit, X, Save } from 'lucide-react'

export default function Usuarios() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ username: '', password: '', full_name: '', role: 'admin' })
  const [editUser, setEditUser] = useState(null)
  const [editForm, setEditForm] = useState({ full_name: '', email: '', phone: '', role: '', active: 1 })
  const [error, setError] = useState('')

  async function load() {
    try { setUsers(await api.getUsers()) } catch (e) { setError(e.message) }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleCreate(e) {
    e.preventDefault(); setError('')
    try {
      await api.createUser(form)
      setForm({ username: '', password: '', full_name: '', role: 'admin' })
      setShowForm(false)
      await load()
    } catch (e) { setError(e.message) }
  }

  async function handleToggleActive(u) {
    if (!confirm(`¿${u.active ? 'Desactivar' : 'Activar'} al usuario "${u.full_name}"?`)) return
    try {
      await api.updateUser(u.id, { active: u.active ? 0 : 1 })
      await load()
    } catch (e) { alert(e.message) }
  }

  async function handleResetPassword(u) {
    const pwd = prompt('Nueva contraseña para ' + u.full_name + ':')
    if (!pwd || pwd.length < 4) return alert('La contraseña debe tener al menos 4 caracteres')
    try {
      await api.resetUserPassword(u.id, pwd)
      alert('Contraseña restablecida')
    } catch (e) { alert(e.message) }
  }

  function openEdit(u) {
    setEditUser(u)
    setEditForm({ full_name: u.full_name, email: u.email || '', phone: u.phone || '', role: u.role, active: u.active })
    setError('')
  }

  async function handleEdit(e) {
    e.preventDefault(); setError('')
    try {
      await api.updateUser(editUser.id, editForm)
      setEditUser(null)
      await load()
    } catch (e) { setError(e.message) }
  }

  if (loading) return <div className="animate-pulse space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-slate-200 rounded-xl" />)}</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><ShieldCheck size={24} className="text-blue-600" /> Usuarios</h1>
        <button onClick={() => { setShowForm(!showForm); setError('') }} className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"><UserPlus size={18} /> Nuevo Usuario</button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <h3 className="font-semibold text-slate-800">Crear Nuevo Usuario</h3>
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Nombre Completo</label>
              <input value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Usuario</label>
              <input value={form.username} onChange={e => setForm({...form, username: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Contraseña</label>
              <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Rol</label>
              <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Crear</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm hover:bg-slate-300">Cancelar</button>
          </div>
        </form>
      )}

      {editUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditUser(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Edit size={20} /> Editar Usuario</h3>
              <button onClick={() => setEditUser(null)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"><X size={20} /></button>
            </div>
            <form onSubmit={handleEdit} className="p-5 space-y-4">
              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Nombre Completo</label>
                <input value={editForm.full_name} onChange={e => setEditForm({...editForm, full_name: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
                  <input type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="correo@ejemplo.com" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Teléfono</label>
                  <input value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="+53 5XXXXXXX" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Rol</label>
                  <select value={editForm.role} onChange={e => setEditForm({...editForm, role: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Estado</label>
                  <select value={editForm.active} onChange={e => setEditForm({...editForm, active: Number(e.target.value)})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
                    <option value={1}>Activo</option>
                    <option value={0}>Inactivo</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"><Save size={16} /> Guardar</button>
                <button type="button" onClick={() => setEditUser(null)} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm hover:bg-slate-300">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 text-slate-500 font-medium">Usuario</th>
                <th className="text-left py-3 px-4 text-slate-500 font-medium">Nombre</th>
                <th className="text-left py-3 px-4 text-slate-500 font-medium">Rol</th>
                <th className="text-left py-3 px-4 text-slate-500 font-medium">Email / Teléfono</th>
                <th className="text-left py-3 px-4 text-slate-500 font-medium">Estado</th>
                <th className="text-right py-3 px-4 text-slate-500 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center"><User size={16} className="text-slate-600" /></div>
                      <span className="font-medium text-slate-800">@{u.username}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-700">{u.full_name}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${u.role === 'super_admin' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>
                      {u.role === 'super_admin' ? <ShieldCheck size={12} /> : <Shield size={12} />}
                      {u.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-500">
                    {u.email && <p>{u.email}</p>}
                    {u.phone && <p className="text-slate-400">{u.phone}</p>}
                    {!u.email && !u.phone && <span className="text-slate-300">—</span>}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${u.active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                      {u.active ? <Power size={12} /> : <PowerOff size={12} />}
                      {u.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(u)} title="Editar usuario" className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit size={16} /></button>
                      <button onClick={() => handleResetPassword(u)} title="Restablecer contraseña" className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg"><Key size={16} /></button>
                      <button onClick={() => handleToggleActive(u)} title={u.active ? 'Desactivar' : 'Activar'} className={`p-1.5 rounded-lg ${u.active ? 'text-slate-400 hover:text-red-600 hover:bg-red-50' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`}>{u.active ? <PowerOff size={16} /> : <Power size={16} />}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
