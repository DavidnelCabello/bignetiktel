import { useState, useEffect } from 'react'
import { api } from '../api'
import { Building2, Plus, Edit, Trash2, X, Save, Users, UserMinus, Check } from 'lucide-react'

const inp = 'w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500'

export default function Departamentos() {
  const [depts, setDepts] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(null) // {id?, name, description, location}
  const [manage, setManage] = useState(null) // department detail with members
  const [error, setError] = useState('')

  async function load() {
    try { setDepts(await api.getDepartments()) } catch (e) { setError(e.message) }
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function save(e) {
    e.preventDefault(); setError('')
    try {
      if (form.id) await api.updateDepartment(form.id, form)
      else await api.createDepartment(form)
      setForm(null); await load()
    } catch (e) { setError(e.message) }
  }

  async function remove(d) {
    if (!confirm(`¿Eliminar el departamento "${d.name}"? Los empleados quedarán sin departamento (no se borran).`)) return
    try { await api.deleteDepartment(d.id); await load() } catch (e) { alert(e.message) }
  }

  if (loading) return <div className="animate-pulse space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-slate-200 rounded-xl" />)}</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Building2 size={24} className="text-emerald-600" /> Departamentos</h1>
        <button onClick={() => { setForm({ name: '', description: '', location: '' }); setError('') }} className="flex items-center gap-1.5 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-emerald-700"><Plus size={18} /> Nuevo Departamento</button>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

      {depts.length === 0 && <p className="text-slate-400 text-sm py-10 text-center">No hay departamentos aún. Crea el primero (ej. Ventas, Técnicos, Administración).</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {depts.map(d => (
          <div key={d.id} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-start justify-between">
              <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center"><Building2 size={22} /></div>
              <div className="flex gap-1">
                <button onClick={() => { setForm({ ...d }); setError('') }} title="Editar" className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit size={16} /></button>
                <button onClick={() => remove(d)} title="Eliminar" className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
              </div>
            </div>
            <h2 className="mt-3 font-bold text-slate-800">{d.name}</h2>
            {d.description && <p className="text-sm text-slate-500">{d.description}</p>}
            {d.location && <p className="text-xs text-slate-400 mt-0.5">📍 {d.location}</p>}
            <button onClick={() => api.getDepartment(d.id).then(setManage)} className="mt-4 w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm bg-slate-100 text-slate-700 hover:bg-slate-200">
              <Users size={16} /> {d.member_count} miembro{d.member_count === 1 ? '' : 's'}
            </button>
          </div>
        ))}
      </div>

      {form && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setForm(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-800">{form.id ? 'Editar' : 'Nuevo'} Departamento</h3>
              <button onClick={() => setForm(null)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"><X size={20} /></button>
            </div>
            <form onSubmit={save} className="p-5 space-y-4">
              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
              <div><label className="block text-xs font-medium text-slate-500 mb-1">Nombre *</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className={inp} required placeholder="Ventas" /></div>
              <div><label className="block text-xs font-medium text-slate-500 mb-1">Descripción</label><input value={form.description || ''} onChange={e => setForm({...form, description: e.target.value})} className={inp} /></div>
              <div><label className="block text-xs font-medium text-slate-500 mb-1">Ubicación / Oficina</label><input value={form.location || ''} onChange={e => setForm({...form, location: e.target.value})} className={inp} placeholder="Oficina central, Pilón" /></div>
              <div className="flex gap-2">
                <button type="submit" className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700"><Save size={16} /> Guardar</button>
                <button type="button" onClick={() => setForm(null)} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm hover:bg-slate-300">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {manage && <MembersModal dept={manage} onClose={() => setManage(null)} onChanged={() => { api.getDepartment(manage.id).then(setManage); load() }} />}
    </div>
  )
}

// Modal para asignar/quitar miembros desde la base de empleados existente.
function MembersModal({ dept, onClose, onChanged }) {
  const [all, setAll] = useState([])
  const [picking, setPicking] = useState(false)
  const [selected, setSelected] = useState([])

  useEffect(() => { if (picking) api.getEmployees('?active=1').then(setAll).catch(() => {}) }, [picking])

  const memberIds = new Set(dept.members.map(m => m.id))
  const candidates = all.filter(e => !memberIds.has(e.id)) // no duplicar: solo los que no están ya

  async function assign() {
    if (!selected.length) return
    await api.assignMembers(dept.id, selected)
    setSelected([]); setPicking(false); onChanged()
  }
  async function removeMember(empId) {
    await api.removeMember(dept.id, empId); onChanged()
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-200 sticky top-0 bg-white">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Users size={20} className="text-emerald-600" /> {dept.name}</h3>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-3">
          {!picking && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">{dept.members.length} miembro(s)</p>
                <button onClick={() => setPicking(true)} className="flex items-center gap-1.5 text-sm bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700"><Users size={15} /> Agregar miembros</button>
              </div>
              {dept.members.length === 0 && <p className="text-slate-400 text-sm py-6 text-center">Sin miembros. Usa "Agregar miembros" para asignar empleados existentes.</p>}
              {dept.members.map(m => (
                <div key={m.id} className="flex items-center justify-between border border-slate-100 rounded-lg px-3 py-2">
                  <div><p className="text-sm font-medium text-slate-800">{m.first_name} {m.last_name || ''}</p><p className="text-xs text-slate-400">{m.position || m.employee_code}</p></div>
                  <button onClick={() => removeMember(m.id)} title="Quitar del departamento" className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><UserMinus size={16} /></button>
                </div>
              ))}
            </>
          )}
          {picking && (
            <>
              <p className="text-sm text-slate-500">Selecciona empleados a agregar (no se duplican):</p>
              <div className="space-y-1.5 max-h-72 overflow-y-auto">
                {candidates.length === 0 && <p className="text-slate-400 text-sm py-4 text-center">No hay empleados disponibles para agregar.</p>}
                {candidates.map(e => {
                  const on = selected.includes(e.id)
                  return (
                    <button key={e.id} onClick={() => setSelected(on ? selected.filter(i => i !== e.id) : [...selected, e.id])}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-left text-sm ${on ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                      <span className={`w-5 h-5 rounded flex items-center justify-center ${on ? 'bg-emerald-600 text-white' : 'border border-slate-300'}`}>{on && <Check size={14} />}</span>
                      <span className="flex-1"><span className="font-medium text-slate-800">{e.first_name} {e.last_name || ''}</span> <span className="text-slate-400 text-xs">· {e.position || e.employee_code}{e.department_name ? ` · ahora en ${e.department_name}` : ''}</span></span>
                    </button>
                  )
                })}
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={assign} disabled={!selected.length} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-50">Agregar {selected.length || ''}</button>
                <button onClick={() => { setPicking(false); setSelected([]) }} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm hover:bg-slate-300">Volver</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
