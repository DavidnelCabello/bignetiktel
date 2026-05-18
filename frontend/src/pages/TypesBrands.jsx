import { useState, useEffect } from 'react'
import { api } from '../api'
import { Plus, Pencil, Trash2, Tag, Building2 } from 'lucide-react'

export default function TypesBrands() {
  const [types, setTypes] = useState([])
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('types')

  useEffect(() => { Promise.all([api.getTypes(), api.getBrands()]).then(([t,b]) => { setTypes(t); setBrands(b) }).catch(console.error).finally(() => setLoading(false)) }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Catálogos</h1>
      <div className="flex gap-2 border-b border-slate-200">
        <button onClick={() => setTab('types')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === 'types' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}><Tag size={16} className="inline mr-1" /> Tipos</button>
        <button onClick={() => setTab('brands')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === 'brands' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}><Building2 size={16} className="inline mr-1" /> Marcas</button>
      </div>
      {loading ? <div className="animate-pulse h-32 bg-slate-200 rounded-xl" /> :
        tab === 'types' ? <Table title="Tipos de Equipo" items={types} onRefresh={() => api.getTypes().then(setTypes)} apiCreate={api.createType} apiUpdate={api.updateType} apiDelete={api.deleteType} />
        : <Table title="Marcas" items={brands} onRefresh={() => api.getBrands().then(setBrands)} apiCreate={api.createBrand} apiUpdate={api.updateBrand} apiDelete={api.deleteBrand} />
      }
    </div>
  )
}

function Table({ title, items, onRefresh, apiCreate, apiUpdate, apiDelete }) {
  const [editing, setEditing] = useState(null)
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [show, setShow] = useState(false)

  async function save(e) {
    e.preventDefault()
    if (!name.trim()) return
    try {
      if (editing) await apiUpdate(editing, { name: name.trim(), description: desc.trim() || undefined })
      else await apiCreate({ name: name.trim(), description: desc.trim() || undefined })
      setName(''); setDesc(''); setEditing(null); setShow(false); onRefresh()
    } catch (e) { alert(e.message) }
  }

  function edit(item) { setEditing(item.id); setName(item.name); setDesc(item.description || ''); setShow(true) }
  async function del(id) { if (!confirm('¿Eliminar?')) return; try { await apiDelete(id); onRefresh() } catch (e) { alert(e.message) } }

  return (
    <div className="bg-white rounded-xl border border-slate-200">
      <div className="p-4 border-b border-slate-200 flex justify-between items-center">
        <h2 className="font-semibold text-slate-800">{title} ({items.length})</h2>
        <button onClick={() => { setShow(!show); setEditing(null); setName(''); setDesc('') }} className="flex items-center gap-1 text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700"><Plus size={16} /> Nuevo</button>
      </div>
      {show && (
        <form onSubmit={save} className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap gap-3">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre" className="flex-1 min-w-[200px] px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" required />
          <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Descripción (opcional)" className="flex-1 min-w-[200px] px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">{editing ? 'Guardar' : 'Crear'}</button>
          <button type="button" onClick={() => { setShow(false); setEditing(null) }} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm hover:bg-slate-300">Cancelar</button>
        </form>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="bg-slate-50"><th className="text-left px-4 py-3 font-medium text-slate-500">Nombre</th><th className="text-left px-4 py-3 font-medium text-slate-500">Descripción</th><th className="text-right px-4 py-3 font-medium text-slate-500">Acciones</th></tr></thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">{item.name}</td>
                <td className="px-4 py-3 text-slate-500">{item.description || '—'}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => edit(item)} className="p-1.5 text-slate-400 hover:text-blue-600 mr-1"><Pencil size={16} /></button>
                  <button onClick={() => del(item.id)} className="p-1.5 text-slate-400 hover:text-red-600"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-400">No hay registros</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
