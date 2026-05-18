import { useState, useRef } from 'react'
import { api } from '../api'
import { X, User, Save, Camera, Lock, Key, Mail, LogOut } from 'lucide-react'

function ForgotPasswordForm() {
  const [u, setU] = useState('')
  const [token, setToken] = useState('')
  const [np, setNp] = useState('')
  const [step, setStep] = useState('request')
  const [msg, setMsg] = useState(''); const [err, setErr] = useState('')
  async function request(e) { e.preventDefault(); setErr(''); setMsg(''); try { await api.forgotPassword(u); setMsg('Si el usuario existe y tiene email, recibirás un código.'); setStep('reset') } catch (e) { setErr(e.message) } }
  async function reset(e) { e.preventDefault(); setErr(''); setMsg(''); if (np.length < 4) return setErr('Mínimo 4 caracteres'); try { await api.resetPassword(u, token, np); setMsg('Contraseña restablecida. Cierra y abre sesión.'); setStep('done') } catch (e) { setErr(e.message) } }
  return (
    <div className="space-y-2">
      {step === 'request' && <form onSubmit={request} className="flex gap-2"><input placeholder="Usuario" value={u} onChange={e => setU(e.target.value)} className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-amber-500" required /><button type="submit" className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs hover:bg-amber-700"><Mail size={14} /></button></form>}
      {step === 'reset' && <form onSubmit={reset} className="space-y-2"><input placeholder="Código de restablecimiento" value={token} onChange={e => setToken(e.target.value)} className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-amber-500 font-mono" required /><input type="password" placeholder="Nueva contraseña" value={np} onChange={e => setNp(e.target.value)} className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-amber-500" required /><button type="submit" className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs hover:bg-amber-700"><Key size={14} /> Restablecer</button></form>}
      {err && <p className="text-xs text-red-600">{err}</p>}
      {msg && <p className="text-xs text-emerald-600">{msg}</p>}
    </div>
  )
}

export default function ProfileModal({ user, onClose, onUpdate, onLogout }) {
  const [tab, setTab] = useState('profile')
  const [profile, setProfile] = useState({ full_name: user.full_name || '', email: user.email || '', phone: user.phone || '' })
  const [username, setUsername] = useState(user.username || '')
  const [avatar, setAvatar] = useState(user.avatar || '')
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [saving, setSaving] = useState(false)
  const fileRef = useRef()

  function saveToken(res) {
    if (res.token) localStorage.setItem('token', res.token)
  }

  async function saveProfile(e) {
    e.preventDefault(); setSaving(true); setErr('')
    try {
      const res = await api.updateProfile(profile)
      saveToken(res)
      onUpdate(res.user)
      setMsg('Perfil actualizado')
      setTimeout(() => setMsg(''), 3000)
    } catch (e) { setErr(e.message) }
    setSaving(false)
  }

  async function handleUsername(e) {
    e.preventDefault(); setErr('')
    try {
      const res = await api.updateUsername(username)
      saveToken(res)
      onUpdate({ ...user, username: res.username })
      setMsg('Usuario actualizado')
      setTimeout(() => setMsg(''), 3000)
    } catch (e) { setErr(e.message) }
  }

  function handleFileSelect(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) return setErr('La imagen no puede exceder 2MB')
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const canvas = document.createElement('canvas')
      let w = img.width, h = img.height
      const max = 200
      if (w > max || h > max) { if (w > h) { h = h * max / w; w = max } else { w = w * max / h; h = max } }
      canvas.width = w; canvas.height = h
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, w, h)
      const data = canvas.toDataURL('image/jpeg', 0.7)
      api.updateAvatar(data).then(res => {
        setAvatar(res.avatar)
        onUpdate({ ...user, avatar: res.avatar })
        setMsg('Avatar actualizado')
        setTimeout(() => setMsg(''), 3000)
      }).catch(e => setErr(e.message))
    }
    img.src = url
  }

  function removeAvatar() {
    if (!confirm('¿Eliminar foto de perfil?')) return
    api.updateAvatar(null).then(() => { setAvatar(''); onUpdate({ ...user, avatar: null }); setMsg('Avatar eliminado') }).catch(e => setErr(e.message))
    setTimeout(() => setMsg(''), 3000)
  }

  async function changePassword(e) {
    e.preventDefault(); setErr('')
    if (pwdForm.newPassword !== pwdForm.confirmPassword) return setErr('Las contraseñas no coinciden')
    if (pwdForm.newPassword.length < 4) return setErr('La contraseña debe tener al menos 4 caracteres')
    try {
      await api.changePassword(pwdForm.currentPassword, pwdForm.newPassword)
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setMsg('Contraseña cambiada')
      setTimeout(() => setMsg(''), 3000)
    } catch (e) { setErr(e.message) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><User size={20} /> Mi Perfil</h2>
          <div className="flex items-center gap-1">
            {onLogout && <button onClick={onLogout} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Cerrar Sesión"><LogOut size={18} /></button>}
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"><X size={20} /></button>
          </div>
        </div>

        {msg && <div className="mx-5 mt-4 px-4 py-2 bg-emerald-50 text-emerald-700 text-sm rounded-lg">{msg}</div>}
        {err && <div className="mx-5 mt-4 px-4 py-2 bg-red-50 text-red-700 text-sm rounded-lg">{err}</div>}

        <div className="flex border-b border-slate-200 px-5">
          <button onClick={() => setTab('profile')} className={`pb-3 pt-4 px-3 text-sm font-medium border-b-2 transition-colors ${tab === 'profile' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}><User size={16} className="inline mr-1.5" /> Perfil</button>
          <button onClick={() => setTab('username')} className={`pb-3 pt-4 px-3 text-sm font-medium border-b-2 transition-colors ${tab === 'username' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}><User size={16} className="inline mr-1.5" /> Usuario</button>
          <button onClick={() => setTab('password')} className={`pb-3 pt-4 px-3 text-sm font-medium border-b-2 transition-colors ${tab === 'password' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}><Lock size={16} className="inline mr-1.5" /> Contraseña</button>
        </div>

        <div className="p-5 space-y-5">
          {tab === 'profile' && (
            <>
              <div className="flex items-center gap-4">
                <div className="relative">
                  {avatar ? (
                    <img src={avatar} alt="avatar" className="w-20 h-20 rounded-full object-cover border-2 border-slate-200" />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center border-2 border-slate-200">
                      <User size={32} className="text-slate-400" />
                    </div>
                  )}
                  <button onClick={() => fileRef.current?.click()} className="absolute bottom-0 right-0 w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 shadow"><Camera size={14} /></button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{user.full_name}</p>
                  <p className="text-sm text-slate-500">@{user.username}</p>
                  {avatar && <button onClick={removeAvatar} className="text-xs text-red-500 hover:text-red-700 mt-1">Eliminar foto</button>}
                </div>
              </div>

              <form onSubmit={saveProfile} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Nombre Completo</label>
                  <input value={profile.full_name} onChange={e => setProfile({...profile, full_name: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
                    <input type="email" value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="correo@ejemplo.com" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Teléfono</label>
                    <input value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="+53 5XXXXXXX" />
                  </div>
                </div>
                <button type="submit" disabled={saving} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"><Save size={16} /> {saving ? 'Guardando...' : 'Guardar Cambios'}</button>
              </form>
            </>
          )}

          {tab === 'username' && (
            <form onSubmit={handleUsername} className="space-y-3">
              <div className="bg-blue-50 text-blue-700 text-sm p-3 rounded-lg">Cambiar tu nombre de usuario afectará el inicio de sesión.</div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Nombre de Usuario</label>
                <div className="flex items-center gap-1"><span className="text-slate-400 font-mono text-sm">@</span><input value={username} onChange={e => setUsername(e.target.value)} className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 font-mono" required minLength={3} /></div>
              </div>
              <button type="submit" className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"><Save size={16} /> Guardar Usuario</button>
            </form>
          )}

          {tab === 'password' && (
            <form onSubmit={changePassword} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Contraseña Actual</label>
                <input type="password" value={pwdForm.currentPassword} onChange={e => setPwdForm({...pwdForm, currentPassword: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Nueva Contraseña</label>
                  <input type="password" value={pwdForm.newPassword} onChange={e => setPwdForm({...pwdForm, newPassword: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Confirmar Contraseña</label>
                  <input type="password" value={pwdForm.confirmPassword} onChange={e => setPwdForm({...pwdForm, confirmPassword: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
              </div>
              <button type="submit" className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm hover:bg-amber-700"><Key size={16} /> Cambiar Contraseña</button>
              <div className="border-t border-slate-100 pt-3 mt-3">
                <p className="text-xs text-slate-500 mb-2">¿Olvidaste tu contraseña? Solicita un restablecimiento por email.</p>
                <ForgotPasswordForm />
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
