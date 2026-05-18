import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { Plus, Search, Eye, Percent, Calendar, X, User } from 'lucide-react'
import { StatusBadge } from './Clients'

const INTEREST_TIERS = [
  { months: 1, rate: 0.5 },
  { months: 2, rate: 1.5 },
  { months: 3, rate: 3 },
  { months: 4, rate: 4 },
  { months: 5, rate: 5 },
  { months: 6, rate: 6 },
  { months: 7, rate: 7 },
  { months: 8, rate: 8 },
  { months: 9, rate: 9 },
  { months: 10, rate: 10 },
  { months: 11, rate: 11 },
  { months: 12, rate: 12 },
  { months: 15, rate: 15 },
  { months: 18, rate: 18 },
  { months: 24, rate: 24 },
  { months: 36, rate: 36 },
]

export default function Sales() {
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [show, setShow] = useState(false)
  const [clients, setClients] = useState([])
  const [inventory, setInventory] = useState([])
  const [clientSearch, setClientSearch] = useState('')
  const [clientOpen, setClientOpen] = useState(false)
  const clientRef = useRef(null)
  const [itemSearchIdx, setItemSearchIdx] = useState(null)
  const [itemSearchVal, setItemSearchVal] = useState('')
  const [form, setForm] = useState({ client_id: '', items: [{ model_id: '', quantity: 1, itemSearch: '', mac_address: '' }], notes: '', payment_plan: 'full', interest_rate: 0, term_months: 0 })

  useEffect(() => { Promise.all([api.getSales(), api.getClients(), api.getInventory()]).then(([s,c,i]) => { setSales(s); setClients(c); setInventory(i.filter(x => x.available_quantity > 0)) }).catch(console.error).finally(() => setLoading(false)) }, [])
  useEffect(() => { function handleClick(e) { if (clientRef.current && !clientRef.current.contains(e.target)) setClientOpen(false) }; document.addEventListener('mousedown', handleClick); return () => document.removeEventListener('mousedown', handleClick) }, [])

  function calcTotal() {
    return form.items.reduce((s, it) => s + (Number(it.quantity) * itemPrice(it.model_id)), 0)
  }
  function calcTotalWithInterest() {
    const total = calcTotal()
    if (form.payment_plan !== 'installments' || !form.interest_rate) return total
    return +(total * (1 + Number(form.interest_rate) / 100)).toFixed(2)
  }
  function calcInstallment() {
    const twi = calcTotalWithInterest()
    const m = Number(form.term_months)
    return m > 0 ? +(twi / m).toFixed(2) : 0
  }

  async function create(e) {
    e.preventDefault()
    if (!form.client_id || form.items.length === 0) return alert('Seleccione cliente y al menos un item')
    try {
      await api.createSale({
        client_id: Number(form.client_id),
        items: form.items.map(it => ({ model_id: Number(it.model_id), quantity: Number(it.quantity), mac_address: it.mac_address || undefined })),
        notes: form.notes || undefined,
        payment_plan: form.payment_plan,
        interest_rate: form.payment_plan === 'installments' ? Number(form.interest_rate) : 0,
        term_months: form.payment_plan === 'installments' ? Number(form.term_months) : 0,
      })
      setShow(false); setForm({ client_id: '', items: [{ model_id: '', quantity: 1, itemSearch: '', mac_address: '' }], notes: '', payment_plan: 'full', interest_rate: 0, term_months: 0 }); setClientSearch('')
      setSales(await api.getSales())
    } catch (e) { alert(e.message) }
  }

  function addItem() { setForm({ ...form, items: [...form.items, { model_id: '', quantity: 1, itemSearch: '', mac_address: '' }] }) }
  function remItem(i) { if (form.items.length > 1) { const items = form.items.filter((_, idx) => idx !== i); setForm({ ...form, items }); if (itemSearchIdx === i) { setItemSearchIdx(null); setItemSearchVal('') } } }
  function updItem(i, field, v) { const items = [...form.items]; items[i][field] = v; setForm({ ...form, items }) }
  function selectItem(idx, mid) {
    const items = [...form.items]; items[idx].model_id = mid; items[idx].itemSearch = ''
    setForm({ ...form, items }); setItemSearchIdx(null); setItemSearchVal('')
  }
  function itemPrice(mid) { const x = inventory.find(i => Number(i.model_id) === Number(mid)); return x ? x.unit_price : 0 }
  function itemAvail(mid) { const x = inventory.find(i => Number(i.model_id) === Number(mid)); return x ? x.available_quantity : 0 }
  function itemCurrency(mid) { const x = inventory.find(i => Number(i.model_id) === Number(mid)); return x ? x.currency : '' }

  function handlePlanChange(plan) {
    if (plan === 'full') setForm({ ...form, payment_plan: 'full', interest_rate: 0, term_months: 0 })
    else setForm({ ...form, payment_plan: 'installments', interest_rate: 3, term_months: 3 })
  }

  function handleTierSelect(months) {
    const tier = INTEREST_TIERS.find(t => t.months === months)
    setForm({ ...form, term_months: months, interest_rate: tier ? tier.rate : 0 })
  }

  const filtered = sales.filter(s => {
    if (!search) return !statusFilter || s.status === statusFilter
    const q = search.toLowerCase()
    return (s.client_name?.toLowerCase().includes(q) || s.status?.toLowerCase().includes(q) || s.payment_plan?.toLowerCase().includes(q) || new Date(s.sale_date).toLocaleDateString().toLowerCase().includes(q)) && (!statusFilter || s.status === statusFilter)
  })
  if (loading) return <div className="animate-pulse h-32 bg-slate-200 rounded-xl" />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Ventas</h1>
        <button onClick={() => { setShow(!show); setForm({ client_id: '', items: [{ model_id: '', quantity: 1, itemSearch: '', mac_address: '' }], notes: '', payment_plan: 'full', interest_rate: 0, term_months: 0 }); setClientSearch(''); setItemSearchIdx(null); setItemSearchVal('') }} className="flex items-center gap-1 text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700"><Plus size={16} /> Nueva Venta</button>
      </div>
      {show && (
        <form onSubmit={create} className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <h3 className="font-semibold text-slate-700">Nueva Venta</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div ref={clientRef} className="relative">
              <label className="block text-sm font-medium text-slate-600 mb-1">Cliente</label>
              {form.client_id ? (
                <div className="flex items-center justify-between px-3 py-2 border border-slate-300 rounded-lg bg-slate-50">
                  <span className="text-sm text-slate-700">{clients.find(c => c.id === Number(form.client_id))?.name} {clients.find(c => c.id === Number(form.client_id))?.identity_card ? `(${clients.find(c => c.id === Number(form.client_id))?.identity_card})` : ''}</span>
                  <button type="button" onClick={() => { setForm({...form, client_id: ''}); setClientSearch('') }} className="text-slate-400 hover:text-red-500"><X size={16} /></button>
                </div>
              ) : (
                <><input value={clientSearch} onChange={e => { setClientSearch(e.target.value); setClientOpen(true) }} onFocus={() => setClientOpen(true)} placeholder="Buscar cliente..." className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" required={!form.client_id} />
                {clientOpen && (
                  <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {clients.filter(c => c.active && (c.name.toLowerCase().includes(clientSearch.toLowerCase()) || (c.identity_card || '').includes(clientSearch))).map(c => (
                      <button type="button" key={c.id} onClick={() => { setForm({...form, client_id: c.id}); setClientSearch(''); setClientOpen(false) }} className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 hover:text-blue-700 border-b border-slate-100 last:border-0">
                        <span className="font-medium">{c.name}</span>{c.identity_card ? <span className="text-slate-400 ml-1">{c.identity_card}</span> : ''}
                      </button>
                    ))}
                    {clients.filter(c => c.active && (c.name.toLowerCase().includes(clientSearch.toLowerCase()) || (c.identity_card || '').includes(clientSearch))).length === 0 && <p className="px-3 py-2 text-sm text-slate-400">Sin resultados</p>}
                  </div>
                )}</>
              )}
            </div>
            <div><label className="block text-sm font-medium text-slate-600 mb-1">Notas</label><input value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2"><label className="text-sm font-medium text-slate-600">Items</label><button type="button" onClick={addItem} className="text-xs text-blue-600 font-medium">+ Agregar</button></div>
            {form.items.map((item, idx) => (
              <div key={idx} className="flex gap-2 items-end mb-2">
                <div className="flex-1 relative">
                  {item.model_id ? (
                    <div className="flex items-center justify-between px-3 py-2 border border-slate-300 rounded-lg bg-slate-50">
                      <span className="text-sm text-slate-700">{inventory.find(i => Number(i.model_id) === Number(item.model_id))?.brand_name} {inventory.find(i => Number(i.model_id) === Number(item.model_id))?.model_name} - ${inventory.find(i => Number(i.model_id) === Number(item.model_id))?.unit_price.toFixed(2)} {inventory.find(i => Number(i.model_id) === Number(item.model_id))?.currency}</span>
                      <button type="button" onClick={() => selectItem(idx, '')} className="text-slate-400 hover:text-red-500"><X size={16} /></button>
                    </div>
                  ) : (
                    <><input value={itemSearchIdx === idx ? itemSearchVal : ''} onChange={e => { setItemSearchIdx(idx); setItemSearchVal(e.target.value) }} onFocus={() => { setItemSearchIdx(idx); setItemSearchVal(item.itemSearch || '') }} placeholder="Buscar equipo..." className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" required={!item.model_id} />
                    {itemSearchIdx === idx && (
                      <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {inventory.filter(i => i.available_quantity > 0 && (i.brand_name.toLowerCase().includes(itemSearchVal.toLowerCase()) || i.model_name.toLowerCase().includes(itemSearchVal.toLowerCase()) || i.type_name.toLowerCase().includes(itemSearchVal.toLowerCase()))).map(i => (
                          <button type="button" key={i.id} onClick={() => selectItem(idx, i.model_id)} className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 hover:text-blue-700 border-b border-slate-100 last:border-0">
                            <span className="font-medium">{i.brand_name} {i.model_name}</span>
                            <span className="text-slate-400 ml-1">${i.unit_price.toFixed(2)} {i.currency}</span>
                            <span className={`ml-2 text-xs ${i.available_quantity > 5 ? 'text-emerald-600' : 'text-amber-600'}`}>disp: {i.available_quantity}</span>
                          </button>
                        ))}
                        {inventory.filter(i => i.available_quantity > 0 && (i.brand_name.toLowerCase().includes(itemSearchVal.toLowerCase()) || i.model_name.toLowerCase().includes(itemSearchVal.toLowerCase()) || i.type_name.toLowerCase().includes(itemSearchVal.toLowerCase()))).length === 0 && <p className="px-3 py-2 text-sm text-slate-400">Sin resultados</p>}
                      </div>
                    )}</>
                  )}
                </div>
                <div className="w-24"><input type="number" min="1" max={itemAvail(item.model_id)} value={item.quantity} onChange={e => updItem(idx, 'quantity', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" required /></div>
                <div className="w-44"><input value={item.mac_address} onChange={e => updItem(idx, 'mac_address', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 font-mono" placeholder="MAC (opcional)" /></div>
                <div className="w-28 text-sm text-slate-600 py-2">${(Number(item.quantity) * itemPrice(item.model_id)).toFixed(2)} {itemPrice(item.model_id) ? itemCurrency(item.model_id) : ''}</div>
                <button type="button" onClick={() => remItem(idx)} className="p-2 text-slate-400 hover:text-red-500 text-lg">&times;</button>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-200 pt-4">
            <label className="text-sm font-medium text-slate-600 mb-3 block">Plan de Pago</label>
            <div className="flex gap-4 mb-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="plan" checked={form.payment_plan === 'full'} onChange={() => handlePlanChange('full')} className="accent-blue-600" />
                <span className="text-sm text-slate-700">Pago completo (sin interés)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="plan" checked={form.payment_plan === 'installments'} onChange={() => handlePlanChange('installments')} className="accent-blue-600" />
                <span className="text-sm text-slate-700">Cuotas / Plazos</span>
              </label>
            </div>
            {form.payment_plan === 'installments' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-1"><Calendar size={14} /> Plazo</label>
                  <select value={form.term_months} onChange={e => handleTierSelect(Number(e.target.value))} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
                    <option value={0}>Seleccionar...</option>
                    {INTEREST_TIERS.map(t => <option key={t.months} value={t.months}>{t.months} meses ({t.rate}% interés)</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-1"><Percent size={14} /> Interés (%)</label>
                  <input type="number" min="0" max="100" step="0.5" value={form.interest_rate} onChange={e => setForm({...form, interest_rate: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="flex flex-col justify-end">
                  <p className="text-xs text-slate-500 mb-1">Cuota mensual estimada</p>
                  <p className="text-lg font-bold text-blue-700">${calcInstallment().toFixed(2)}</p>
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-between items-center border-t border-slate-200 pt-4">
            <div className="space-y-1">
              <span className="text-sm text-slate-600">Subtotal: <strong>${calcTotal().toFixed(2)}</strong></span>
              {form.payment_plan === 'installments' && form.interest_rate > 0 && (
                <><br /><span className="text-sm text-slate-600">Interés ({form.interest_rate}%): <strong className="text-amber-600">+${(calcTotal() * Number(form.interest_rate) / 100).toFixed(2)}</strong></span>
                <br /><span className="text-sm font-semibold text-slate-700">Total a pagar: <strong className="text-lg">${calcTotalWithInterest().toFixed(2)}</strong></span>
                {form.term_months > 0 && <><br /><span className="text-xs text-slate-500">{form.term_months} cuotas de ${calcInstallment().toFixed(2)}</span></>}</>
              )}
            </div>
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Crear Venta</button>
              <button type="button" onClick={() => setShow(false)} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm hover:bg-slate-300">Cancelar</button>
            </div>
          </div>
        </form>
      )}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 space-y-3">
          <div className="flex gap-2">
            {['', 'active', 'completed', 'canceled'].map(st => (
              <button key={st || 'all'} onClick={() => setStatusFilter(st)} className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${statusFilter === st ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'}`}>{st ? (st.charAt(0).toUpperCase() + st.slice(1)) : 'Todos'}</button>
            ))}
          </div>
          <div className="relative"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por cliente, estado, plan o fecha..." className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50"><th className="text-left px-4 py-3 font-medium text-slate-500">#</th><th className="text-left px-4 py-3 font-medium text-slate-500">Cliente</th><th className="text-left px-4 py-3 font-medium text-slate-500">Fecha</th><th className="text-center px-4 py-3 font-medium text-slate-500">Plan</th><th className="text-right px-4 py-3 font-medium text-slate-500">Items</th><th className="text-right px-4 py-3 font-medium text-slate-500">Total a Pagar</th><th className="text-right px-4 py-3 font-medium text-slate-500">Pagado</th><th className="text-right px-4 py-3 font-medium text-slate-500">Pendiente</th><th className="text-center px-4 py-3 font-medium text-slate-500">Estado</th><th className="text-center px-4 py-3 font-medium text-slate-500">Acción</th></tr></thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-500">#{s.id}</td><td className="px-4 py-3 text-slate-800">{s.client_name}</td>
                  <td className="px-4 py-3 text-slate-500">{new Date(s.sale_date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-center"><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.payment_plan === 'installments' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>{s.payment_plan === 'installments' ? `${s.term_months}m ${s.interest_rate}%` : 'Completo'}</span></td>
                  <td className="px-4 py-3 text-right text-slate-700">{s.total_items}</td>
                  <td className="px-4 py-3 text-right font-medium">${s.total_with_interest.toFixed(2)}</td><td className="px-4 py-3 text-right text-emerald-600">${s.paid_amount.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-amber-600 font-medium">${(s.pending_amount !== undefined ? s.pending_amount : s.total_with_interest - s.paid_amount).toFixed(2)}</td>
                  <td className="px-4 py-3 text-center"><StatusBadge status={s.status} /></td>
                  <td className="px-4 py-3 text-center"><Link to={`/ventas/${s.id}`} className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-xs font-medium"><Eye size={14} /> Ver</Link></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={10} className="px-4 py-8 text-center text-slate-400">Sin ventas</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
