import { useState, useEffect } from 'react'
import { api } from '../api'
import { Settings as SettingsIcon, Save, Mail, Server, Lock, Globe, User, Building2, DollarSign, Key, ShieldCheck, Database, DownloadCloud, Upload, RotateCw, HardDrive } from 'lucide-react'

const defaults = {
  smtp_host: '', smtp_port: '587', smtp_user: '', smtp_pass: '', smtp_from_email: '',
  app_name: 'BigNetiK Telecom',
  company_name: '', company_address: '', company_phone: '', company_nit: '',
  usd_cup_rate: '1',
  password_min_length: '4', password_require_uppercase: '0', password_require_numbers: '0', password_expiry_days: '0',
  company_logo: '',
}

export default function Settings() {
  const [form, setForm] = useState(defaults)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  const [backups, setBackups] = useState([])
  const [autoBackup, setAutoBackup] = useState(false)
  const [creating, setCreating] = useState(false)
  const [restoring, setRestoring] = useState(null)

  useEffect(() => {
    api.getSettings().then(s => {
      const next = { ...defaults }
      for (const k of Object.keys(defaults)) { if (s[k]) next[k] = s[k] }
      setForm(next)
    }).catch(console.error).finally(() => setLoading(false))
    loadBackups()
  }, [])

  async function loadBackups() {
    try { setBackups(await api.listBackups()) } catch {}
    try { const r = await api.getAutoBackupStatus(); setAutoBackup(r.enabled) } catch {}
  }

  async function handleSave(e) {
    e.preventDefault()
    try {
      await api.saveSettings(form)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) { alert(e.message) }
  }

  function set(k, v) { setForm(p => ({ ...p, [k]: v })) }

  async function handleCreateBackup() {
    setCreating(true)
    try { await api.createBackup(); await loadBackups(); alert('Copia creada correctamente') }
    catch (e) { alert(e.message) } finally { setCreating(false) }
  }

  async function handleRestore(name) {
    if (!confirm(`¿Restaurar "${name}"? El servidor se reiniciará automáticamente.`)) return
    setRestoring(name)
    try {
      const r = await api.restoreBackup(name)
      alert(r.message + ' El servidor se reiniciará.')
      setTimeout(() => window.location.reload(), 1000)
    } catch (e) { alert(e.message) } finally { setRestoring(null) }
  }

  async function handleDelete(name) {
    if (!confirm(`¿Eliminar la copia "${name}"?`)) return
    try { await api.deleteBackup(name); await loadBackups() }
    catch (e) { alert(e.message) }
  }

  async function handleToggleAuto() {
    try { const r = await api.toggleAutoBackup(!autoBackup); setAutoBackup(r.enabled) }
    catch (e) { alert(e.message) }
  }

  function formatSize(s) {
    if (s < 1024) return s + ' B'
    if (s < 1048576) return (s / 1024).toFixed(1) + ' KB'
    return (s / 1048576).toFixed(1) + ' MB'
  }

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-8 bg-slate-200 rounded w-48" /><div className="h-64 bg-slate-200 rounded-xl" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><SettingsIcon size={24} className="text-slate-600" /> Configuración del Sistema</h1>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-xl border border-slate-200 p-5 space-y-6">
        <div>
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2"><Globe size={18} className="text-blue-600" /> General</h3>
          <div className="space-y-3">
            <div className="max-w-md">
              <label className="block text-xs font-medium text-slate-500 mb-1">Nombre de la Aplicación</label>
              <input value={form.app_name} onChange={e => set('app_name', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Logo de la Empresa (aparece en el menú lateral)</label>
              <div className="flex items-center gap-3">
                {form.company_logo ? (
                  <img src={form.company_logo} alt="logo" className="w-10 h-10 rounded-lg object-cover border border-slate-200" />
                ) : (
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-sm text-white">B</div>
                )}
                <input type="file" accept="image/*" onChange={e => {
                  const file = e.target.files[0]
                  if (!file) return
                  const reader = new FileReader()
                  reader.onload = () => set('company_logo', reader.result)
                  reader.readAsDataURL(file)
                }} className="text-sm text-slate-500 file:mr-2 file:px-3 file:py-1 file:rounded-lg file:border-0 file:text-xs file:bg-slate-100 file:text-slate-600 hover:file:bg-slate-200" />
                {form.company_logo && <button type="button" onClick={() => set('company_logo', '')} className="text-xs text-red-500 hover:text-red-700">Eliminar</button>}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-5">
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2"><Building2 size={18} className="text-slate-600" /> Información de la Empresa</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Nombre de la Empresa</label>
              <input value={form.company_name} onChange={e => set('company_name', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Dirección</label>
              <input value={form.company_address} onChange={e => set('company_address', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Teléfono</label>
              <input value={form.company_phone} onChange={e => set('company_phone', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">NIT / RUC</label>
              <input value={form.company_nit} onChange={e => set('company_nit', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none" />
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-5">
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2"><DollarSign size={18} className="text-emerald-600" /> Tipo de Cambio</h3>
          <div className="max-w-xs">
            <label className="block text-xs font-medium text-slate-500 mb-1">1 USD = ? CUP</label>
            <input type="number" step="0.01" min="0" value={form.usd_cup_rate} onChange={e => set('usd_cup_rate', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div className="border-t border-slate-100 pt-5">
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2"><ShieldCheck size={18} className="text-purple-600" /> Política de Contraseñas</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Longitud mínima</label>
              <input type="number" min="4" max="32" value={form.password_min_length} onChange={e => set('password_min_length', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Requerir mayúsculas</label>
              <select value={form.password_require_uppercase} onChange={e => set('password_require_uppercase', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none">
                <option value="0">No</option><option value="1">Sí</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Requerir números</label>
              <select value={form.password_require_numbers} onChange={e => set('password_require_numbers', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none">
                <option value="0">No</option><option value="1">Sí</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Expiración (días, 0 = nunca)</label>
              <input type="number" min="0" max="365" value={form.password_expiry_days} onChange={e => set('password_expiry_days', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none" />
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-5">
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2"><Mail size={18} className="text-amber-600" /> Configuración SMTP (Correo)</h3>
          <p className="text-xs text-slate-500 mb-4">Necesario para la recuperación de contraseñas por email.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-1"><Server size={12} /> Servidor SMTP</label>
              <input value={form.smtp_host} onChange={e => set('smtp_host', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none" placeholder="smtp.gmail.com" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Puerto</label>
              <input value={form.smtp_port} onChange={e => set('smtp_port', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none" placeholder="587" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-1"><Mail size={12} /> Email desde</label>
              <input value={form.smtp_from_email} onChange={e => set('smtp_from_email', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none" placeholder="noreply@bignetiktel.cu" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-1"><User size={12} /> Usuario SMTP</label>
              <input value={form.smtp_user} onChange={e => set('smtp_user', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none" placeholder="tu@email.com" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-1"><Lock size={12} /> Contraseña SMTP</label>
              <input type="password" value={form.smtp_pass} onChange={e => set('smtp_pass', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none" placeholder="Contraseña de aplicación" />
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-5">
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2"><Database size={18} className="text-cyan-600" /> Copia de Seguridad</h3>
          <p className="text-xs text-slate-500 mb-4">Respaldo completo de toda la base de datos (inventarios, clientes, ventas, logs, usuarios, fotos de perfil).</p>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <div className={`w-10 h-5 rounded-full transition-colors ${autoBackup ? 'bg-emerald-500' : 'bg-slate-300'} relative`} onClick={handleToggleAuto}>
                <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${autoBackup ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-sm text-slate-700">Copias automáticas (cada 10 operaciones)</span>
            </label>
            <button type="button" onClick={handleCreateBackup} disabled={creating} className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 text-white rounded-lg text-xs hover:bg-cyan-700 disabled:opacity-50">
              <RotateCw size={14} className={creating ? 'animate-spin' : ''} /> Crear copia manual
            </button>
            <button type="button" onClick={api.downloadBackup} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-600 text-white rounded-lg text-xs hover:bg-slate-700">
              <DownloadCloud size={14} /> Descargar DB actual
            </button>
          </div>
          {backups.length > 0 && (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              <p className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1"><HardDrive size={12} /> Copias guardadas ({backups.length})</p>
              {backups.map(b => (
                <div key={b.name} className="flex items-center justify-between bg-slate-50 rounded px-2.5 py-1.5 text-xs">
                  <span className="text-slate-600" title={b.date}>{b.name.replace(/^auto-|^bignetiktel-|\.db$/g, '') || b.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400">{formatSize(b.size)}</span>
                    <button type="button" onClick={api.downloadBackup} className="text-blue-600 hover:text-blue-800">Descargar</button>
                    <button type="button" onClick={() => handleRestore(b.name)} disabled={restoring === b.name} className="text-amber-600 hover:text-amber-800 disabled:opacity-50">
                      {restoring === b.name ? 'Restaurando...' : 'Restaurar'}
                    </button>
                    <button type="button" onClick={() => handleDelete(b.name)} className="text-red-500 hover:text-red-700">Eliminar</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {backups.length === 0 && <p className="text-xs text-slate-400 italic">No hay copias guardadas aún.</p>}
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"><Save size={16} /> Guardar Configuración</button>
          {saved && <span className="text-sm text-emerald-600 font-medium">✓ Guardado</span>}
        </div>
      </form>
    </div>
  )
}
