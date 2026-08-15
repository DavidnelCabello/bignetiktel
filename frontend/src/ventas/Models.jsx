import { useState, useEffect } from 'react'
import { api } from '../api'
import { Plus, Pencil, Trash2 } from 'lucide-react'

export default function Models() {
  const [models, setModels] = useState([])
  const [types, setTypes] = useState([])
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)
  const [show, setShow] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', brand_id: '', equipment_type_id: '', description: '' })

  useEffect(() => { Promise.all([api.getModels(), api.getTypes(), api.getBrands()]).then(([m,t,b]) => { setModels(m); setTypes(t); setBrands(b) }).catch(console.error).finally(() => setLoading(false)) }, [])

  async function save(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.brand_id || !form.equipment_type_id) return
    try {
      if (editing) await api.updateModel(editing, form); else await api.createModel(form)
      setShow(false); setEditing(null); setForm({ name: '', brand_id: '', equipment_type_id: '', description: '' })
      setModels(await api.getModels())
    } catch (e) { alert(e.message) }
  }

  function edit(item) { setEditing(item.id); setForm({ name: item.name, brand_id: item.brand_id, equipment_type_id: item.equipment_type_id, description: item.description || '' }); setShow(true) }
  async function del(id) { if (!confirm('¿Eliminar?')) return; try { await api.deleteModel(id); setModels(await api.getModels()) } catch (e) { alert(e.message) } }

  if (loading) return <div className="animate-pulse h-32 bg-slate-200 rounded-xl" />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Modelos</h1>
        <button onClick={() => { setShow(!show); setEditing(null); setForm({ name: '', brand_id: '', equipment_type_id: '', description: '' }) }} className="flex items-center gap-1 text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700"><Plus size={16} /> Nuevo</button>
      </div>
      {show && (
        <form onSubmit={save} className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <h3 className="font-semibold text-slate-700">{editing ? 'Editar' : 'Nuevo'} Modelo</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="block text-sm font-medium text-slate-600 mb-1">Tipo</label>
              <select value={form.equipment_type_id} onChange={e => setForm({...form, equipment_type_id: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" required>
                <option value="">Seleccionar...</option>{types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-slate-600 mb-1">Marca</label>
              <select value={form.brand_id} onChange={e => setForm({...form, brand_id: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" required>
                <option value="">Seleccionar...</option>{brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-slate-600 mb-1">Nombre</label>
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" required /></div>
          </div>
          <div><label className="block text-sm font-medium text-slate-600 mb-1">Descripción</label>
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">{editing ? 'Guardar' : 'Crear'}</button>
            <button type="button" onClick={() => { setShow(false); setEditing(null) }} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm hover:bg-slate-300">Cancelar</button>
          </div>
        </form>
      )}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50"><th className="text-left px-4 py-3 font-medium text-slate-500">Tipo</th><th className="text-left px-4 py-3 font-medium text-slate-500">Marca</th><th className="text-left px-4 py-3 font-medium text-slate-500">Modelo</th><th className="text-left px-4 py-3 font-medium text-slate-500">Descripción</th><th className="text-right px-4 py-3 font-medium text-slate-500">Acciones</th></tr></thead>
            <tbody>
              {models.map(m => (
                <tr key={m.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3"><span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">{m.type_name}</span></td>
                  <td className="px-4 py-3 text-slate-700">{m.brand_name}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{m.name}</td>
                  <td className="px-4 py-3 text-slate-500">{m.description || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => edit(m)} className="p-1.5 text-slate-400 hover:text-blue-600 mr-1"><Pencil size={16} /></button>
                    <button onClick={() => del(m.id)} className="p-1.5 text-slate-400 hover:text-red-600"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
              {models.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No hay modelos</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
