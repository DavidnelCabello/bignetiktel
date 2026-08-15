import { useState, useEffect } from 'react'
import { api } from '../api'
import { UserCog, UserPlus, Edit, Trash2, X, Save, Search, Circle, KeyRound, Copy, ScanFace } from 'lucide-react'
import EnrollFaceModal from './EnrollFaceModal'

const EMPTY = { employee_code: '', first_name: '', second_name: '', last_name: '', document_type: 'CI', document_number: '', position: '', department_id: '', address: '', birth_date: '', phone: '', email: '', hire_date: '', pay_type: 'hourly', pay_rate: '', currency: 'CUP', active: 1, notes: '' }
const DOC_TYPES = ['CI', 'Licencia', 'Pasaporte']

export default function Empleados() {
  const [employees, setEmployees] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [modal, setModal] = useState(null) // 'new' | employee object
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')
  const [access, setAccess] = useState(null) // credenciales del portal generadas
  const [enroll, setEnroll] = useState(null) // empleado para registrar rostro
  const [flash, setFlash] = useState('')

  async function genAccess(emp) {
    if (!confirm(`¿Generar acceso al portal para ${emp.first_name} ${emp.last_name || ''}? Se creará una contraseña temporal.`)) return
    try { setAccess(await api.generatePortalAccess(emp.id)) } catch (e) { alert(e.message) }
  }

  async function load() {
    try { setEmployees(await api.getEmployees(q ? `?q=${encodeURIComponent(q)}` : '')) }
    catch (e) { setError(e.message) }
    setLoading(false)
  }
  useEffect(() => { load() }, [])
  useEffect(() => { api.getDepartments().then(setDepartments).catch(() => {}) }, [])
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t) }, [q])

  function openNew() { setForm(EMPTY); setModal('new'); setError('') }
  function openEdit(emp) {
    setForm({ ...EMPTY, ...emp, pay_rate: emp.pay_rate ?? '', hire_date: emp.hire_date || '', birth_date: emp.birth_date || '', department_id: emp.department_id ?? '' })
    setModal(emp); setError('')
  }

  async function save(e) {
    e.preventDefault(); setError('')
    try {
      const payload = { ...form, pay_rate: Number(form.pay_rate) || 0, department_id: form.department_id ? Number(form.department_id) : null }
      if (modal === 'new') {
        delete payload.employee_code // el backend lo genera automáticamente
        const r = await api.createEmployee(payload)
        setFlash(`✓ Empleado creado con ID ${r.employee_code}. Ahora registra su rostro.`)
        setTimeout(() => setFlash(''), 8000)
        setModal(null)
        await load()
        // Paso siguiente inmediato: registrar el rostro del nuevo empleado.
        setEnroll({ id: r.id, employee_code: r.employee_code, first_name: payload.first_name, last_name: payload.last_name })
        return
      }
      await api.updateEmployee(modal.id, payload)
      setModal(null)
      await load()
    } catch (e) { setError(e.message) }
  }

  async function remove(emp) {
    if (!confirm(`¿Eliminar al empleado "${emp.first_name} ${emp.last_name || ''}"? Se borrarán también sus fichajes.`)) return
    try { await api.deleteEmployee(emp.id); await load() } catch (e) { alert(e.message) }
  }

  if (loading) return <div className="animate-pulse space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-slate-200 rounded-xl" />)}</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><UserCog size={24} className="text-blue-600" /> Empleados</h1>
        <button onClick={openNew} className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"><UserPlus size={18} /> Nuevo Empleado</button>
      </div>

      {flash && <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-lg">{flash}</div>}

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar por nombre, código, cargo…" className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 text-slate-500 font-medium">Código</th>
                <th className="text-left py-3 px-4 text-slate-500 font-medium">Nombre</th>
                <th className="text-left py-3 px-4 text-slate-500 font-medium">Cargo / Depto.</th>
                <th className="text-left py-3 px-4 text-slate-500 font-medium">Pago</th>
                <th className="text-left py-3 px-4 text-slate-500 font-medium">Estado</th>
                <th className="text-right py-3 px-4 text-slate-500 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 && <tr><td colSpan={6} className="py-10 text-center text-slate-400">No hay empleados aún. Crea el primero con "Nuevo Empleado".</td></tr>}
              {employees.map(e => (
                <tr key={e.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono text-xs text-slate-600">{e.employee_code}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {e.clocked_in && <Circle size={9} className="text-emerald-500 fill-emerald-500" title="Fichado ahora" />}
                      <span className="font-medium text-slate-800">{e.first_name} {e.last_name || ''}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{e.position || '—'}{e.department_name ? <span className="text-slate-400 text-xs block">{e.department_name}</span> : null}</td>
                  <td className="py-3 px-4 text-slate-600">
                    {e.pay_type === 'hourly' ? `${e.pay_rate} ${e.currency}/h` : `${e.pay_rate} ${e.currency}/mes`}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${e.active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{e.active ? 'Activo' : 'Inactivo'}</span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setEnroll(e)} title={e.has_face ? 'Rostro registrado — actualizar' : 'Registrar rostro'} className={`p-1.5 rounded-lg ${e.has_face ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`}><ScanFace size={16} /></button>
                      <button onClick={() => genAccess(e)} title="Generar acceso al portal" className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"><KeyRound size={16} /></button>
                      <button onClick={() => openEdit(e)} title="Editar" className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit size={16} /></button>
                      <button onClick={() => remove(e)} title="Eliminar" className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {enroll && <EnrollFaceModal employee={enroll} onClose={() => setEnroll(null)} onDone={load} />}

      {access && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setAccess(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><KeyRound size={20} className="text-emerald-600" /> Acceso al portal</h3>
              <button onClick={() => setAccess(null)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-sm text-slate-500">Comparte estas credenciales con el empleado. La contraseña se muestra <strong>una sola vez</strong>. En su primer inicio deberá cambiarla.</p>
              {access.emailed
                ? <p className="text-sm text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg">📧 Correo de bienvenida enviado al email del empleado.</p>
                : access.has_email
                  ? <p className="text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-lg">⚠️ No se pudo enviar el correo (revisa el SMTP en Configuración). Comparte las credenciales manualmente.</p>
                  : <p className="text-sm text-slate-500 bg-slate-50 px-3 py-2 rounded-lg">El empleado no tiene email registrado; comparte las credenciales manualmente.</p>}
              <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between"><span className="text-xs text-slate-500">ID de empleado</span><span className="font-mono font-semibold text-slate-800">{access.employee_code}</span></div>
                <div className="flex items-center justify-between"><span className="text-xs text-slate-500">Contraseña temporal</span><span className="font-mono font-semibold text-slate-800">{access.temp_password}</span></div>
              </div>
              <button onClick={() => { navigator.clipboard?.writeText(`Portal BigNetiK\nID: ${access.employee_code}\nContraseña: ${access.temp_password}`); }} className="w-full flex items-center justify-center gap-2 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm text-slate-700"><Copy size={15} /> Copiar credenciales</button>
              <p className="text-xs text-slate-400">El portal del empleado está en <span className="font-mono">/portal</span>. Próximamente esto se enviará automático por correo de bienvenida.</p>
            </div>
          </div>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-200 sticky top-0 bg-white">
              <h3 className="text-lg font-bold text-slate-800">{modal === 'new' ? 'Nuevo Empleado' : 'Editar Empleado'}</h3>
              <button onClick={() => setModal(null)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"><X size={20} /></button>
            </div>
            <form onSubmit={save} className="p-5 space-y-4">
              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
              <Section title="Identificación" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="ID de empleado">
                  {modal === 'new'
                    ? <div className="w-full px-3 py-2 border border-dashed border-slate-300 rounded-lg text-sm text-slate-400 bg-slate-50">Se asignará automáticamente (4 dígitos)</div>
                    : <input value={form.employee_code} readOnly className={`${inp} bg-slate-50 text-slate-500`} title="El ID no se cambia" />}
                </Field>
                <div className="grid grid-cols-3 gap-2">
                  <Field label="Documento">
                    <select value={form.document_type} onChange={e => setForm({...form, document_type: e.target.value})} className={inp}>
                      {DOC_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </Field>
                  <div className="col-span-2"><Field label="Número de documento (del empleado)"><input value={form.document_number} onChange={e => setForm({...form, document_number: e.target.value})} className={inp} placeholder="CI / Pasaporte / Licencia" /></Field></div>
                </div>
              </div>

              <Section title="Datos personales" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Field label="Nombre *"><input value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})} className={inp} required /></Field>
                <Field label="Segundo nombre"><input value={form.second_name} onChange={e => setForm({...form, second_name: e.target.value})} className={inp} /></Field>
                <Field label="Apellidos"><input value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})} className={inp} /></Field>
                <Field label="Fecha de nacimiento"><input type="date" value={form.birth_date} onChange={e => setForm({...form, birth_date: e.target.value})} className={inp} /></Field>
                <Field label="Teléfono"><input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className={inp} placeholder="+53 5XXXXXXX" /></Field>
                <Field label="Email"><input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className={inp} placeholder="para el correo de bienvenida" /></Field>
              </div>
              <Field label="Dirección física"><input value={form.address} onChange={e => setForm({...form, address: e.target.value})} className={inp} placeholder="Calle, número, municipio, provincia" /></Field>

              <Section title="Puesto y pago" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Puesto / Cargo"><input value={form.position} onChange={e => setForm({...form, position: e.target.value})} className={inp} placeholder="Programador, Técnico…" /></Field>
                <Field label="Departamento">
                  <select value={form.department_id} onChange={e => setForm({...form, department_id: e.target.value})} className={inp}>
                    <option value="">— Sin departamento —</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </Field>
                <Field label="Tipo de pago">
                  <select value={form.pay_type} onChange={e => setForm({...form, pay_type: e.target.value})} className={inp}>
                    <option value="hourly">Por hora</option>
                    <option value="monthly">Salario mensual</option>
                  </select>
                </Field>
                <div className="grid grid-cols-2 gap-2">
                  <Field label={form.pay_type === 'hourly' ? 'Tarifa/hora' : 'Salario/mes'}><input type="number" step="0.01" min="0" value={form.pay_rate} onChange={e => setForm({...form, pay_rate: e.target.value})} className={inp} placeholder="30" /></Field>
                  <Field label="Moneda">
                    <select value={form.currency} onChange={e => setForm({...form, currency: e.target.value})} className={inp}>
                      <option value="CUP">CUP ($)</option>
                      <option value="USD">USD ($)</option>
                    </select>
                  </Field>
                </div>
                <Field label="Fecha de alta"><input type="date" value={form.hire_date} onChange={e => setForm({...form, hire_date: e.target.value})} className={inp} /></Field>
                {modal !== 'new' && (
                  <Field label="Estado">
                    <select value={form.active} onChange={e => setForm({...form, active: Number(e.target.value)})} className={inp}>
                      <option value={1}>Activo</option>
                      <option value={0}>Inactivo</option>
                    </select>
                  </Field>
                )}
              </div>
              <Field label="Notas"><textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2} className={inp} /></Field>
              {modal === 'new' && <p className="text-xs text-slate-400">Tras crear al empleado, el siguiente paso será registrar sus datos biométricos y enviarle el correo de bienvenida (próximo bloque).</p>}
              <div className="flex gap-2 pt-1">
                <button type="submit" className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"><Save size={16} /> Guardar</button>
                <button type="button" onClick={() => setModal(null)} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm hover:bg-slate-300">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

const inp = 'w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500'
function Field({ label, children }) {
  return <div><label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>{children}</div>
}
function Section({ title }) {
  return <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 border-b border-slate-100 pb-1">{title}</p>
}
