import { useState, useEffect } from 'react'
import { api } from '../api'
import { Link } from 'react-router-dom'
import { AlertTriangle, User, Phone, Calendar, DollarSign, Clock, Mail } from 'lucide-react'

export default function LatePayments() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [notifying, setNotifying] = useState({})

  useEffect(() => {
    api.getLatePayments().then(setData).catch(console.error).finally(() => setLoading(false))
  }, [])

  async function handleNotify(saleId, e) {
    e.preventDefault()
    e.stopPropagation()
    setNotifying(p => ({ ...p, [saleId]: true }))
    try {
      const r = await api.notifyLatePayment(saleId)
      alert(r.message)
    } catch (e) { alert(e.message) } finally { setNotifying(p => ({ ...p, [saleId]: false })) }
  }

  if (loading) return <div className="animate-pulse space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-slate-200 rounded-xl" />)}</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><AlertTriangle className="text-red-500" size={24} /> Pagos Atrasados</h1>
          <p className="text-sm text-slate-500">{data.length} cliente{data.length !== 1 ? 's' : ''} con pagos vencidos</p>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle size={30} className="text-emerald-600" /></div>
          <p className="text-lg font-medium text-slate-700">No hay pagos atrasados</p>
          <p className="text-sm text-slate-400 mt-1">Todos los clientes están al día con sus pagos.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.map(sale => (
            <Link key={sale.id} to={`/ventas/${sale.id}`} className="block bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0"><User size={20} className="text-red-600" /></div>
                    <div>
                      <h3 className="font-semibold text-slate-800">{sale.client_name}</h3>
                      {sale.phone && <p className="text-xs text-slate-400 flex items-center gap-1"><Phone size={12} /> {sale.phone}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                    <div>
                      <p className="text-xs text-slate-400">Vencimiento</p>
                      <p className="text-sm font-medium text-red-600 flex items-center gap-1"><Calendar size={13} /> {new Date(sale.next_payment_date + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Días de retraso</p>
                      <p className="text-sm font-bold text-red-600 flex items-center gap-1"><Clock size={13} /> {sale.days_late} día{sale.days_late !== 1 ? 's' : ''}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Cuota mensual</p>
                      <p className="text-sm font-medium text-slate-700">${Number(sale.installment_amount).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Deuda total</p>
                      <p className="text-sm font-bold text-amber-600 flex items-center gap-1"><DollarSign size={13} /> ${Number(sale.pending_amount).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <span className="inline-block bg-red-50 text-red-700 text-xs font-medium px-2.5 py-1 rounded-full">
                    {sale.installment_amount > 0 ? sale.term_months - Math.floor(sale.paid_amount / sale.installment_amount) : '—'} cuotas restantes
                  </span>
                  <button onClick={e => handleNotify(sale.id, e)} disabled={notifying[sale.id]}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50">
                    <Mail size={13} /> {notifying[sale.id] ? 'Enviando...' : 'Notificar por email'}
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
