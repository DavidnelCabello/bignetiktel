import { useState, useEffect, useRef } from 'react'
import { api } from '../api'
import { Plus, Pencil, Trash2, Search, Phone, MapPin, ChevronDown, DollarSign, Receipt, CheckCircle, XCircle, Clock, Building2, Globe, Download } from 'lucide-react'
import { downloadCsv } from '../exportCsv'
import { PROVINCIAS } from '../data/cuba'

const CODES = [
  { code: '+53', country: 'Cuba', flag: '🇨🇺' },
  { code: '+1', country: 'EE.UU./Canadá', flag: '🇺🇸' },
  { code: '+1-809', country: 'República Dominicana', flag: '🇩🇴' },
  { code: '+34', country: 'España', flag: '🇪🇸' },
  { code: '+52', country: 'México', flag: '🇲🇽' },
  { code: '+54', country: 'Argentina', flag: '🇦🇷' },
  { code: '+55', country: 'Brasil', flag: '🇧🇷' },
  { code: '+56', country: 'Chile', flag: '🇨🇱' },
  { code: '+57', country: 'Colombia', flag: '🇨🇴' },
  { code: '+58', country: 'Venezuela', flag: '🇻🇪' },
  { code: '+591', country: 'Bolivia', flag: '🇧🇴' },
  { code: '+592', country: 'Guyana', flag: '🇬🇾' },
  { code: '+593', country: 'Ecuador', flag: '🇪🇨' },
  { code: '+594', country: 'Guayana Francesa', flag: '🇬🇫' },
  { code: '+595', country: 'Paraguay', flag: '🇵🇾' },
  { code: '+596', country: 'Martinica', flag: '🇲🇶' },
  { code: '+597', country: 'Surinam', flag: '🇸🇷' },
  { code: '+598', country: 'Uruguay', flag: '🇺🇾' },
  { code: '+599', country: 'Caribe Neerlandés', flag: '🇧🇶' },
  { code: '+7', country: 'Rusia', flag: '🇷🇺' },
  { code: '+33', country: 'Francia', flag: '🇫🇷' },
  { code: '+39', country: 'Italia', flag: '🇮🇹' },
  { code: '+44', country: 'Reino Unido', flag: '🇬🇧' },
  { code: '+49', country: 'Alemania', flag: '🇩🇪' },
  { code: '+86', country: 'China', flag: '🇨🇳' },
  { code: '+51', country: 'Perú', flag: '🇵🇪' },
  { code: '+503', country: 'El Salvador', flag: '🇸🇻' },
  { code: '+502', country: 'Guatemala', flag: '🇬🇹' },
  { code: '+504', country: 'Honduras', flag: '🇭🇳' },
  { code: '+505', country: 'Nicaragua', flag: '🇳🇮' },
  { code: '+506', country: 'Costa Rica', flag: '🇨🇷' },
  { code: '+507', country: 'Panamá', flag: '🇵🇦' },
  { code: '+509', country: 'Haití', flag: '🇭🇹' },
  { code: '+351', country: 'Portugal', flag: '🇵🇹' },
  { code: '+352', country: 'Luxemburgo', flag: '🇱🇺' },
]

function StatusBadge({ status }) {
  const colors = { pending: 'bg-slate-100 text-slate-700', active: 'bg-amber-50 text-amber-700', completed: 'bg-emerald-50 text-emerald-700', cancelled: 'bg-red-50 text-red-700' }
  const labels = { pending: 'Pendiente', active: 'En Pago', completed: 'Completada', cancelled: 'Cancelada' }
  return <span className={`px-2 py-1 rounded text-xs font-medium ${colors[status] || colors.pending}`}>{labels[status] || status}</span>
}

export { StatusBadge }

export default function Clients() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [show, setShow] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ first_name: '', last_name: '', id_document_type: 'CI', identity_card: '', address: '', phone: '', email: '', notes: '', province: '', city: '', countryCode: '+53' })

  const municipios = PROVINCIAS.find(p => p.name === form.province)?.municipios || []
  const [selected, setSelected] = useState(null)
  const [summary, setSummary] = useState(null)
  const [codeOpen, setCodeOpen] = useState(false)
  const codeRef = useRef(null)

  useEffect(() => { api.getClients().then(setClients).catch(console.error).finally(() => setLoading(false)) }, [])
  useEffect(() => { function handleClick(e) { if (codeRef.current && !codeRef.current.contains(e.target)) setCodeOpen(false) }; document.addEventListener('mousedown', handleClick); return () => document.removeEventListener('mousedown', handleClick) }, [])

  function parsePhone(phone) {
    if (!phone) return { code: '+53', number: '' }
    const c = CODES.find(c => phone.startsWith(c.code))
    if (c) return { code: c.code, number: phone.slice(c.code.length).trim() }
    return { code: '+53', number: phone }
  }

  async function save(e) {
    e.preventDefault()
    if (!form.first_name.trim()) return
    const fullPhone = form.phone ? `${form.countryCode} ${form.phone}` : ''
    const data = { ...form, phone: fullPhone, countryCode: undefined }
    try {
      if (editing) await api.updateClient(editing, data); else await api.createClient(data)
      setShow(false); setEditing(null); setForm({ first_name: '', last_name: '', id_document_type: 'CI', identity_card: '', address: '', phone: '', email: '', notes: '', province: '', city: '', countryCode: '+53' })
      setClients(await api.getClients())
    } catch (e) { alert(e.message) }
  }

  function edit(c) {
    const p = parsePhone(c.phone)
    setEditing(c.id); setForm({ first_name: c.first_name, last_name: c.last_name || '', id_document_type: c.id_document_type || 'CI', identity_card: c.identity_card || '', address: c.address || '', phone: p.number, email: c.email || '', notes: c.notes || '', province: c.province || '', city: c.city || '', countryCode: p.code }); setShow(true)
  }
  async function del(id) { if (!confirm('¿Eliminar?')) return; try { await api.deleteClient(id); setClients(await api.getClients()) } catch (e) { alert(e.message) } }

  async function viewSummary(c) {
    setSelected(c)
    try {
      const s = await api.getClientSummary(c.id)
      setSummary(s)
    } catch (e) { alert(e.message) }
  }

  const q = search.toLowerCase()
  const filtered = clients.filter(c =>
    c.first_name.toLowerCase().includes(q) ||
    (c.last_name && c.last_name.toLowerCase().includes(q)) ||
    (c.phone && c.phone.toLowerCase().includes(q)) ||
    (c.identity_card && c.identity_card.includes(q)) ||
    (c.id_document_type && c.id_document_type.toLowerCase().includes(q)) ||
    (c.province && c.province.toLowerCase().includes(q)) ||
    (c.city && c.city.toLowerCase().includes(q))
  )

  if (loading) return <div className="animate-pulse h-32 bg-slate-200 rounded-xl" />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Clientes</h1>
        <div className="flex gap-2">
          <button onClick={() => { setShow(!show); setEditing(null); setForm({ first_name: '', last_name: '', id_document_type: 'CI', identity_card: '', address: '', phone: '', email: '', notes: '', province: '', city: '', countryCode: '+53' }) }} className="flex items-center gap-1 text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700"><Plus size={16} /> Nuevo</button>
          <button onClick={() => downloadCsv('clientes.csv', ['Nombre','Apellidos','CI/Teléfono','Provincia','Ciudad','Teléfono','Email'], clients.map(c => [c.first_name,c.last_name,c.identity_card||'',c.province||'',c.city||'',c.phone||'',c.email||'']))} className="flex items-center gap-1 text-sm bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-200"><Download size={16} /> Exportar</button>
        </div>
      </div>
      {show && (
        <form onSubmit={save} className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <h3 className="font-semibold text-slate-700">{editing ? 'Editar' : 'Nuevo'} Cliente</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-slate-600 mb-1">Nombres *</label><input value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" required /></div>
            <div><label className="block text-sm font-medium text-slate-600 mb-1">Apellidos</label><input value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <div><label className="block text-sm font-medium text-slate-600 mb-1">Documento de Identidad</label>
              <div className="flex gap-2">
                <select value={form.id_document_type} onChange={e => setForm({...form, id_document_type: e.target.value})} className="w-36 px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="CI">Carné Identidad</option>
                  <option value="Pasaporte">Pasaporte</option>
                  <option value="Licencia">Licencia Conducir</option>
                </select>
                <input value={form.identity_card} onChange={e => setForm({...form, identity_card: e.target.value})} className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="Número de documento" />
              </div>
            </div>
            <div><label className="block text-sm font-medium text-slate-600 mb-1">Email</label><input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <div className="md:col-span-2"><label className="block text-sm font-medium text-slate-600 mb-1">Teléfono</label>
              <div className="flex gap-2">
                <div ref={codeRef} className="relative">
                  <button type="button" onClick={() => setCodeOpen(!codeOpen)} className="flex items-center gap-1 px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none hover:bg-slate-50 focus:ring-2 focus:ring-blue-500 whitespace-nowrap">
                    <span className="text-base leading-none">{CODES.find(c => c.code === form.countryCode)?.flag}</span>
                    <span className="text-slate-700">{form.countryCode}</span>
                    <ChevronDown size={14} className="text-slate-400" />
                  </button>
                  {codeOpen && (
                    <div className="absolute z-20 mt-1 left-0 w-64 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {CODES.map(c => (
                        <button type="button" key={c.code} onClick={() => { setForm({...form, countryCode: c.code}); setCodeOpen(false) }} className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 hover:text-blue-700 border-b border-slate-100 last:border-0 flex items-center gap-2">
                          <span className="text-base leading-none">{c.flag}</span>
                          <span className="text-slate-500 font-mono">{c.code}</span>
                          <span className="text-slate-700">{c.country}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="555-1001" />
              </div>
            </div>
          </div>
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div><label className="block text-sm font-medium text-slate-600 mb-1 flex items-center gap-1"><Globe size={14} /> Provincia</label>
                <select value={form.province} onChange={e => setForm({...form, province: e.target.value, city: ''})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Seleccionar...</option>
                  {PROVINCIAS.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                </select></div>
              <div><label className="block text-sm font-medium text-slate-600 mb-1 flex items-center gap-1"><Building2 size={14} /> Municipio</label>
                <select value={form.city} onChange={e => setForm({...form, city: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" disabled={!form.province}>
                  <option value="">Seleccionar...</option>
                  {municipios.map(m => <option key={m} value={m}>{m}</option>)}
                </select></div>
            </div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Dirección particular</label><textarea value={form.address} onChange={e => setForm({...form, address: e.target.value})} rows={2} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="Calle, #, entre calles, reparto..." /></div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">{editing ? 'Guardar' : 'Crear'}</button>
            <button type="button" onClick={() => { setShow(false); setEditing(null); setCodeOpen(false) }} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm hover:bg-slate-300">Cancelar</button>
          </div>
        </form>
      )}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <div className="relative"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre, apellido, teléfono o CI..." className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50"><th className="text-left px-4 py-3 font-medium text-slate-500">Nombre</th><th className="text-left px-4 py-3 font-medium text-slate-500">Documento</th><th className="text-left px-4 py-3 font-medium text-slate-500">Teléfono</th><th className="text-left px-4 py-3 font-medium text-slate-500">Ubicación</th><th className="text-center px-4 py-3 font-medium text-slate-500">Estado</th><th className="text-right px-4 py-3 font-medium text-slate-500">Acciones</th></tr></thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer" onClick={() => viewSummary(c)}>
                  <td className="px-4 py-3 font-medium text-slate-800">{c.first_name} {c.last_name}</td>
                  <td className="px-4 py-3 text-slate-500">{c.identity_card ? `${c.id_document_type || 'CI'}: ${c.identity_card}` : '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{c.phone || '—'}</td>
                  <td className="px-4 py-3 text-slate-500 max-w-[220px] truncate">{c.city ? `${c.city}, ${c.province}` : c.province || c.address || '—'}</td>
                  <td className="px-4 py-3 text-center"><span className={`px-2 py-1 rounded text-xs font-medium ${c.active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{c.active ? 'Activo' : 'Inactivo'}</span></td>
                  <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                    <button onClick={() => edit(c)} className="p-1.5 text-slate-400 hover:text-blue-600 mr-1"><Pencil size={16} /></button>
                    <button onClick={() => del(c.id)} className="p-1.5 text-slate-400 hover:text-red-600"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No encontrados</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      {selected && summary && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setSelected(null); setSummary(null) }}>
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-800">{summary.first_name} {summary.last_name}</h3>
                <p className="text-sm text-slate-500">{summary.identity_card ? `${summary.id_document_type || 'CI'}: ${summary.identity_card}` : ''}{summary.email ? ` — ${summary.email}` : ''}</p>
              </div>
              <button onClick={() => { setSelected(null); setSummary(null) }} className="text-slate-400 hover:text-slate-600 text-xl">&times;</button>
            </div>
            {(summary.phone || summary.province || summary.address) && (
              <div className="px-5 py-3 bg-slate-50 text-sm text-slate-600 space-y-1 border-b border-slate-200">
                {summary.phone && <p className="flex items-center gap-2"><Phone size={14} /> {summary.phone}</p>}
                {summary.province && <p className="flex items-center gap-2"><MapPin size={14} /> {summary.city ? `${summary.city}, ${summary.province}` : summary.province}</p>}
                {summary.address && <p className="flex items-center gap-2 ml-6 text-slate-400">{summary.address}</p>}
              </div>
            )}
            <div className="p-5 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <Receipt size={18} className="mx-auto text-slate-400 mb-1" />
                  <p className="text-2xl font-bold text-slate-800">{summary.stats.total_sales}</p>
                  <p className="text-xs text-slate-500">Ventas Totales</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-3 text-center">
                  <DollarSign size={18} className="mx-auto text-amber-500 mb-1" />
                  <p className="text-2xl font-bold text-amber-700">${Number(summary.stats.pending_amount).toFixed(2)}</p>
                  <p className="text-xs text-amber-600">Deuda Pendiente</p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-3 text-center">
                  <CheckCircle size={18} className="mx-auto text-emerald-500 mb-1" />
                  <p className="text-2xl font-bold text-emerald-700">${Number(summary.stats.total_paid).toFixed(2)}</p>
                  <p className="text-xs text-emerald-600">Total Pagado</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <Clock size={18} className="mx-auto text-blue-500 mb-1" />
                  <p className="text-2xl font-bold text-blue-700">{summary.stats.active_sales}</p>
                  <p className="text-xs text-blue-600">En Pago</p>
                </div>
              </div>
              <div className="flex gap-2 text-xs text-slate-500">
                <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded">{summary.stats.completed_sales} completadas</span>
                <span className="px-2 py-1 bg-red-50 text-red-700 rounded">{summary.stats.cancelled_sales} canceladas</span>
                <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded">{summary.stats.pending_sales} pendientes</span>
              </div>
              <div>
                <h4 className="font-semibold text-slate-800 mb-3">Historial de Ventas</h4>
                {summary.sales.length === 0 ? <p className="text-slate-400 text-sm text-center py-4">Sin ventas registradas.</p> : (
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-slate-200"><th className="text-left py-2 text-slate-500 font-medium">#</th><th className="text-left py-2 text-slate-500 font-medium">Fecha</th><th className="text-right py-2 text-slate-500 font-medium">Items</th><th className="text-right py-2 text-slate-500 font-medium">Total</th><th className="text-right py-2 text-slate-500 font-medium">Pagado</th><th className="text-right py-2 text-slate-500 font-medium">Pendiente</th><th className="text-center py-2 text-slate-500 font-medium">Estado</th></tr></thead>
                    <tbody>{summary.sales.map(s => (
                      <tr key={s.id} className="border-b border-slate-100">
                        <td className="py-2 text-slate-500">#{s.id}</td>
                        <td className="py-2 text-slate-700">{new Date(s.sale_date).toLocaleDateString()}</td>
                        <td className="py-2 text-right text-slate-700">{s.total_items}</td>
                        <td className="py-2 text-right font-medium">${Number(s.total_with_interest || s.total_amount).toFixed(2)}</td>
                        <td className="py-2 text-right text-emerald-600">${Number(s.paid_amount).toFixed(2)}</td>
                        <td className="py-2 text-right text-amber-600 font-medium">${Number((s.total_with_interest || s.total_amount) - s.paid_amount).toFixed(2)}</td>
                        <td className="py-2 text-center"><StatusBadge status={s.status} /></td>
                      </tr>
                    ))}</tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
