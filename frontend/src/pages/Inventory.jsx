import { useState, useEffect, useRef } from 'react'
import { api } from '../api'
import { Plus, Pencil, Trash2, Package, X, Download } from 'lucide-react'
import { downloadCsv } from '../exportCsv'

export default function Inventory() {
  const [inv, setInv] = useState([])
  const [models, setModels] = useState([])
  const [loading, setLoading] = useState(true)
  const [show, setShow] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ model_id: '', total_quantity: '', unit_price: '', currency: 'USD', warehouse_location: '', notes: '', min_stock: '0' })
  const [modelSearch, setModelSearch] = useState('')
  const [modelOpen, setModelOpen] = useState(false)
  const modelRef = useRef(null)

  useEffect(() => { Promise.all([api.getInventory(), api.getModels()]).then(([i,m]) => { setInv(i); setModels(m) }).catch(console.error).finally(() => setLoading(false)) }, [])
  useEffect(() => { function handleClick(e) { if (modelRef.current && !modelRef.current.contains(e.target)) setModelOpen(false) }; document.addEventListener('mousedown', handleClick); return () => document.removeEventListener('mousedown', handleClick) }, [])

  async function load() { setInv(await api.getInventory()) }
  function avail(i) { return i.total_quantity - i.reserved_quantity }

  async function save(e) {
    e.preventDefault()
    if (!form.model_id || !form.total_quantity) return
    const min_stock = Number(form.min_stock) || 0
    const data = { model_id: Number(form.model_id), total_quantity: Number(form.total_quantity), unit_price: Number(form.unit_price) || 0, currency: form.currency, warehouse_location: form.warehouse_location || undefined, notes: form.notes || undefined, min_stock }
    try {
      if (editing) await api.updateInventory(editing, data); else await api.createInventory(data)
      setShow(false); setEditing(null); setForm({ model_id: '', total_quantity: '', unit_price: '', currency: 'USD', warehouse_location: '', notes: '', min_stock: '0' }); setModelSearch(''); await load()
    } catch (e) { alert(e.message) }
  }

  function edit(item) { setEditing(item.id); setForm({ model_id: item.model_id, total_quantity: item.total_quantity, unit_price: item.unit_price, currency: item.currency, warehouse_location: item.warehouse_location || '', notes: item.notes || '', min_stock: item.min_stock || '0' }); setShow(true) }
  async function del(id) { if (!confirm('¿Eliminar?')) return; try { await api.deleteInventory(id); await load() } catch (e) { alert(e.message) } }

  if (loading) return <div className="animate-pulse h-32 bg-slate-200 rounded-xl" />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Inventario</h1>
        <div className="flex gap-2">
          <button onClick={() => { setShow(!show); setEditing(null); setForm({ model_id: '', total_quantity: '', unit_price: '', currency: 'USD', warehouse_location: '', notes: '', min_stock: '0' }); setModelSearch('') }} className="flex items-center gap-1 text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700"><Plus size={16} /> Agregar Stock</button>
          <button onClick={() => downloadCsv('inventario.csv', ['Modelo','Marca','Tipo','Total','Disponible','Reservado','Precio','Moneda','Ubicación'], inv.map(i => [i.model_name,i.brand_name,i.type_name,i.total_quantity,i.total_quantity - i.reserved_quantity,i.reserved_quantity,i.unit_price,i.currency,i.warehouse_location]))} className="flex items-center gap-1 text-sm bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-200"><Download size={16} /> Exportar</button>
        </div>
      </div>
      {show && (
        <form onSubmit={save} className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <h3 className="font-semibold text-slate-700">{editing ? 'Editar' : 'Nuevo'} Registro</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div ref={modelRef} className="relative">
              <label className="block text-sm font-medium text-slate-600 mb-1">Modelo</label>
              {form.model_id ? (
                <div className="flex items-center justify-between px-3 py-2 border border-slate-300 rounded-lg bg-slate-50">
                  <span className="text-sm text-slate-700">{models.find(m => m.id === Number(form.model_id))?.brand_name} {models.find(m => m.id === Number(form.model_id))?.name} ({models.find(m => m.id === Number(form.model_id))?.type_name})</span>
                  <button type="button" onClick={() => { setForm({...form, model_id: ''}); setModelSearch('') }} className="text-slate-400 hover:text-red-500"><X size={16} /></button>
                </div>
              ) : (
                <><input value={modelSearch} onChange={e => { setModelSearch(e.target.value); setModelOpen(true) }} onFocus={() => setModelOpen(true)} placeholder="Buscar por marca, modelo o tipo..." className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" required={!form.model_id} />
                {modelOpen && (
                  <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {models.filter(m => m.brand_name.toLowerCase().includes(modelSearch.toLowerCase()) || m.name.toLowerCase().includes(modelSearch.toLowerCase()) || m.type_name.toLowerCase().includes(modelSearch.toLowerCase())).map(m => (
                      <button type="button" key={m.id} onClick={() => { setForm({...form, model_id: m.id}); setModelSearch(''); setModelOpen(false) }} className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 hover:text-blue-700 border-b border-slate-100 last:border-0">
                        <span className="font-medium">{m.brand_name} {m.name}</span>
                        <span className="text-slate-400 ml-1">{m.type_name}</span>
                      </button>
                    ))}
                    {models.filter(m => m.brand_name.toLowerCase().includes(modelSearch.toLowerCase()) || m.name.toLowerCase().includes(modelSearch.toLowerCase()) || m.type_name.toLowerCase().includes(modelSearch.toLowerCase())).length === 0 && <p className="px-3 py-2 text-sm text-slate-400">Sin resultados</p>}
                  </div>
                )}</>
              )}
            </div>
            <div><label className="block text-sm font-medium text-slate-600 mb-1">Cantidad</label>
              <input type="number" min="0" value={form.total_quantity} onChange={e => setForm({...form, total_quantity: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" required /></div>
            <div><label className="block text-sm font-medium text-slate-600 mb-1">Precio</label>
              <input type="number" min="0" step="0.01" value={form.unit_price} onChange={e => setForm({...form, unit_price: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <div><label className="block text-sm font-medium text-slate-600 mb-1">Moneda</label>
              <select value={form.currency} onChange={e => setForm({...form, currency: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
                <option value="USD">USD</option><option value="CUP">CUP</option></select></div>
            <div><label className="block text-sm font-medium text-slate-600 mb-1">Ubicación</label>
              <input value={form.warehouse_location} onChange={e => setForm({...form, warehouse_location: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="Almacén A" /></div>
            <div><label className="block text-sm font-medium text-slate-600 mb-1">Stock mínimo (alerta)</label>
              <input type="number" min="0" value={form.min_stock} onChange={e => setForm({...form, min_stock: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="0 = sin alerta" /></div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">{editing ? 'Guardar' : 'Crear'}</button>
            <button type="button" onClick={() => { setShow(false); setEditing(null); setModelSearch('') }} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm hover:bg-slate-300">Cancelar</button>
          </div>
        </form>
      )}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50"><th className="text-left px-4 py-3 font-medium text-slate-500">Equipo</th><th className="text-right px-4 py-3 font-medium text-slate-500">Total</th><th className="text-right px-4 py-3 font-medium text-slate-500">Disp.</th><th className="text-right px-4 py-3 font-medium text-slate-500">Reserv.</th><th className="text-right px-4 py-3 font-medium text-slate-500">Mínimo</th><th className="text-right px-4 py-3 font-medium text-slate-500">Precio</th><th className="text-center px-4 py-3 font-medium text-slate-500">Moneda</th><th className="text-left px-4 py-3 font-medium text-slate-500">Ubic.</th><th className="text-right px-4 py-3 font-medium text-slate-500">Acciones</th></tr></thead>
            <tbody>
              {inv.map(i => {
                const a = avail(i)
                const low = i.min_stock > 0 && a <= i.min_stock
                return (
                <tr key={i.id} className={`border-t border-slate-100 hover:bg-slate-50 ${low ? 'bg-red-50' : ''}`}>
                  <td className="px-4 py-3"><div className="flex items-center gap-2"><Package size={16} className="text-slate-400" /><div><p className="font-medium text-slate-800">{i.brand_name} {i.model_name}</p><p className="text-xs text-slate-400">{i.type_name}</p></div></div></td>
                  <td className="px-4 py-3 text-right font-medium">{i.total_quantity}</td>
                  <td className="px-4 py-3 text-right"><span className={`font-medium ${a > 0 ? (low ? 'text-red-600' : 'text-emerald-600') : 'text-red-500'}`}>{a}</span></td>
                  <td className="px-4 py-3 text-right text-amber-600 font-medium">{i.reserved_quantity}</td>
                  <td className="px-4 py-3 text-right">{i.min_stock > 0 ? <span className={`font-medium ${low ? 'text-red-600' : 'text-slate-500'}`}>{i.min_stock}</span> : <span className="text-slate-300">—</span>}</td>
                  <td className="px-4 py-3 text-right font-medium">${Number(i.unit_price).toFixed(2)}</td>
                  <td className="px-4 py-3 text-center"><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${i.currency === 'USD' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>{i.currency}</span></td>
                  <td className="px-4 py-3 text-slate-500">{i.warehouse_location || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => edit(i)} className="p-1.5 text-slate-400 hover:text-blue-600 mr-1"><Pencil size={16} /></button>
                    <button onClick={() => del(i.id)} className="p-1.5 text-slate-400 hover:text-red-600"><Trash2 size={16} /></button>
                  </td>
                </tr>
              )})}
              {inv.length === 0 && <tr><td colSpan={9} className="px-4 py-8 text-center text-slate-400">Sin inventario</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
