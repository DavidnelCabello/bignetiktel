import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api'
import { StatusBadge } from './Clients'
import { ArrowLeft, DollarSign, XCircle, Receipt, User, Phone, MapPin, Percent, Calendar, Printer } from 'lucide-react'

export default function SaleDetail() {
  const { id } = useParams()
  const [sale, setSale] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showPay, setShowPay] = useState(false)
  const [payForm, setPayForm] = useState({ amount: '', payment_method: 'cash', notes: '' })

  useEffect(() => { api.getSale(id).then(setSale).catch(console.error).finally(() => setLoading(false)) }, [id])

  async function handlePay(e) {
    e.preventDefault()
    if (!payForm.amount || Number(payForm.amount) <= 0) return
    try {
      await api.addPayment(id, { amount: Number(payForm.amount), payment_method: payForm.payment_method, notes: payForm.notes || undefined })
      setPayForm({ amount: '', payment_method: 'cash', notes: '' }); setShowPay(false)
      setSale(await api.getSale(id))
    } catch (e) { alert(e.message) }
  }

  async function handleCancel() {
    if (!confirm('¿Cancelar venta? Se restaurará el inventario.')) return
    try { await api.cancelSale(id); setSale(await api.getSale(id)) } catch (e) { alert(e.message) }
  }

  function handlePrint() {
    const companyName = 'BigNetiK Telecom'
    const win = window.open('', '_blank')
    if (!win) return
    const itemsHtml = sale.items.map(item => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #ddd;font-size:13px">${item.brand_name} ${item.model_name} (${item.type_name})</td>
        <td style="padding:8px 12px;border-bottom:1px solid #ddd;font-size:12px;font-family:monospace">${item.mac_address || '—'}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #ddd;text-align:right;font-size:13px">${item.quantity}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #ddd;text-align:right;font-size:13px">$${Number(item.unit_price).toFixed(2)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #ddd;text-align:right;font-size:13px">$${Number(item.subtotal).toFixed(2)}</td>
      </tr>
    `).join('')
    const interest = isInstallments && sale.interest_rate > 0 ? debt - sale.total_amount : 0
    const interestRow = isInstallments && sale.interest_rate > 0 ? `
      <tr>
        <td colspan="4" style="padding:8px 12px;text-align:right;font-size:13px;color:#d97706">Interés (${sale.interest_rate}%)</td>
        <td style="padding:8px 12px;text-align:right;font-size:13px;color:#d97706">+$${interest.toFixed(2)}</td>
      </tr>
    ` : ''
    const planHtml = isInstallments ? `
      <tr><td colspan="2" style="padding:6px 12px;font-size:13px"><strong>Plazo:</strong> ${sale.term_months} meses</td><td colspan="3" style="padding:6px 12px;font-size:13px"><strong>Cuota mensual:</strong> $${Number(sale.installment_amount).toFixed(2)}</td></tr>
    ` : ''
    win.document.write(`
      <html><head><title>Recibo Venta #${sale.id}</title>
      <style>
        @page { margin: 15mm }
        * { margin:0; padding:0; box-sizing:border-box }
        body { font-family:'Helvetica',Arial,sans-serif; color:#1e293b; padding:20px; font-size:14px; line-height:1.5 }
        .header { text-align:center; margin-bottom:24px; border-bottom:2px solid #1e3a5f; padding-bottom:16px }
        .header h1 { font-size:22px; color:#1e3a5f; margin-bottom:4px }
        .header p { color:#64748b; font-size:13px }
        .info-grid { display:flex; justify-content:space-between; margin-bottom:20px }
        .info-box { background:#f8fafc; border-radius:6px; padding:12px 16px; width:48% }
        .info-box h3 { font-size:12px; color:#94a3b8; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px }
        .info-box p { font-size:14px; color:#1e293b; margin-bottom:2px }
        table { width:100%; border-collapse:collapse; margin-bottom:16px }
        th { background:#f1f5f9; padding:8px 12px; text-align:left; font-size:12px; color:#64748b; text-transform:uppercase; letter-spacing:0.5px }
        th.r, td.r { text-align:right }
        .totals { border-top:2px solid #1e3a5f; padding-top:12px; margin-bottom:20px }
        .total-row { display:flex; justify-content:space-between; padding:4px 0; font-size:14px }
        .total-row.final { font-size:18px; font-weight:bold; color:#1e3a5f; border-top:1px solid #ddd; padding-top:8px; margin-top:4px }
        .payments { margin-bottom:20px }
        .payments h3 { font-size:14px; color:#1e3a5f; margin-bottom:8px }
        .footer { text-align:center; margin-top:24px; padding-top:16px; border-top:1px solid #e2e8f0; font-size:13px; color:#64748b }
        .footer p { margin-bottom:4px }
        @media print { body { padding:0 } }
      </style></head><body>
        <div class="header">
          <h1>${companyName}</h1>
          <p>Recibo de Venta #${sale.id}</p>
          <p>${new Date(sale.sale_date).toLocaleString('es-ES', { day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit', hour12: true })}</p>
        </div>
        <div class="info-grid">
          <div class="info-box">
            <h3>Cliente</h3>
            <p><strong>${sale.client_name}</strong></p>
            ${sale.identity_card ? `<p>CI: ${sale.identity_card}</p>` : ''}
            ${sale.phone ? `<p>Tel: ${sale.phone}</p>` : ''}
            ${sale.address ? `<p>Dir: ${sale.address}</p>` : ''}
          </div>
          <div class="info-box">
            <h3>Resumen</h3>
            <p>Subtotal: $${sale.total_amount.toFixed(2)}</p>
            ${isInstallments && sale.interest_rate > 0 ? `<p>Interés (${sale.interest_rate}%): +$${interest.toFixed(2)}</p>` : ''}
            <p><strong>Total: $${debt.toFixed(2)}</strong></p>
            <p>Pagado: $${sale.paid_amount.toFixed(2)}</p>
            <p>Pendiente: $${pending.toFixed(2)}</p>
          </div>
        </div>
        <table>
          <thead><tr><th>Equipo</th><th>MAC</th><th class="r">Cant.</th><th class="r">Precio</th><th class="r">Subtotal</th></tr></thead>
          <tbody>${itemsHtml}</tbody>
          <tfoot>
            <tr><td colspan="4" style="padding:8px 12px;text-align:right;font-weight:bold">Subtotal</td><td style="padding:8px 12px;text-align:right;font-weight:bold">$${sale.total_amount.toFixed(2)}</td></tr>
            ${interestRow}
            <tr><td colspan="4" style="padding:8px 12px;text-align:right;font-weight:bold;font-size:16px">Total a Pagar</td><td style="padding:8px 12px;text-align:right;font-weight:bold;font-size:16px">$${debt.toFixed(2)}</td></tr>
          </tfoot>
        </table>
        ${isInstallments ? `
        <div class="payments">
          <h3>Plan de Pagos</h3>
          <table>${planHtml}</table>
        </div>
        ` : ''}
        <div class="footer">
          <p>Gracias por su compra</p>
          <p style="font-size:11px;color:#94a3b8">${companyName} — Factura original</p>
        </div>
        <script>window.onload=function(){window.print();window.close()}</script>
      </body></html>
    `)
    win.document.close()
  }

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-8 bg-slate-200 rounded w-48" /><div className="h-64 bg-slate-200 rounded-xl" /></div>
  if (!sale) return <p className="text-slate-500">Venta no encontrada</p>

  const debt = sale.total_with_interest || sale.total_amount
  const pending = +(debt - sale.paid_amount).toFixed(2)
  const isInstallments = sale.payment_plan === 'installments'
  const paidMonths = isInstallments && sale.installment_amount > 0 ? Math.floor(sale.paid_amount / sale.installment_amount) : 0
  const totalMonths = isInstallments ? sale.term_months : 0
  const progressPct = debt > 0 ? Math.min(100, +(sale.paid_amount / debt * 100).toFixed(1)) : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/ventas" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg"><ArrowLeft size={20} /></Link>
        <div><h1 className="text-2xl font-bold text-slate-800">Venta #{sale.id}</h1><p className="text-sm text-slate-500">{new Date(sale.sale_date).toLocaleString('es-ES', { day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit', hour12: true })}</p></div>
        <div className="ml-auto flex items-center gap-2">
          <StatusBadge status={sale.status} />
          {sale.status !== 'cancelled' && <button onClick={handlePrint} className="flex items-center gap-1 text-sm bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-100"><Printer size={16} /> Imprimir Recibo</button>}
          {(sale.status === 'active' || sale.status === 'pending') && <button onClick={handleCancel} className="flex items-center gap-1 text-sm bg-red-50 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-100"><XCircle size={16} /> Cancelar</button>}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 mb-4">Equipos</h3>
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead><tr className="border-b border-slate-200"><th className="text-left py-2 text-slate-500 font-medium">Equipo</th><th className="text-left py-2 text-slate-500 font-medium">MAC</th><th className="text-right py-2 text-slate-500 font-medium">Cant.</th><th className="text-right py-2 text-slate-500 font-medium">Precio</th><th className="text-right py-2 text-slate-500 font-medium">Subtotal</th></tr></thead>
              <tbody>{sale.items.map(item => (
                <tr key={item.id} className="border-b border-slate-100">
                  <td className="py-3"><p className="font-medium text-slate-800">{item.brand_name} {item.model_name}</p><p className="text-xs text-slate-400">{item.type_name}</p></td>
                  <td className="py-3"><span className="font-mono text-xs text-slate-500">{item.mac_address || '—'}</span></td>
                  <td className="py-3 text-right text-slate-700">{item.quantity}</td>
                  <td className="py-3 text-right text-slate-700">${Number(item.unit_price).toFixed(2)} <span className="text-xs font-semibold text-slate-400">{item.currency}</span></td>
                  <td className="py-3 text-right font-medium">${Number(item.subtotal).toFixed(2)}</td>
                </tr>
              ))}</tbody>
              <tfoot><tr><td colSpan={4} className="py-3 text-right font-semibold text-slate-700">Subtotal</td><td className="py-3 text-right font-bold">${sale.total_amount.toFixed(2)}</td></tr>
                {isInstallments && sale.interest_rate > 0 && (
                  <tr><td colSpan={4} className="py-1 text-right text-sm text-slate-500">Interés ({sale.interest_rate}%)</td><td className="py-1 text-right font-medium text-amber-600">+${(debt - sale.total_amount).toFixed(2)}</td></tr>
                )}
                <tr className="border-t border-slate-200"><td colSpan={4} className="py-3 text-right font-semibold text-slate-700">Total a Pagar</td><td className="py-3 text-right font-bold text-lg">${debt.toFixed(2)}</td></tr>
              </tfoot>
            </table></div>
          </div>
          {isInstallments && (
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><Calendar size={18} /> Plan de Pagos</h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-4">
                <div className="bg-slate-50 rounded-lg p-3 text-center"><p className="text-xs text-slate-500">Cuota Mensual</p><p className="text-lg font-bold text-blue-700">${Number(sale.installment_amount).toFixed(2)}</p></div>
                <div className="bg-slate-50 rounded-lg p-3 text-center"><p className="text-xs text-slate-500">Plazo</p><p className="text-lg font-bold text-slate-700">{sale.term_months} meses</p></div>
                <div className="bg-slate-50 rounded-lg p-3 text-center"><p className="text-xs text-slate-500">Interés</p><p className="text-lg font-bold text-amber-600">{sale.interest_rate}%</p></div>
                <div className="bg-slate-50 rounded-lg p-3 text-center"><p className="text-xs text-slate-500">Próximo Pago</p><p className="text-lg font-bold text-purple-700">{sale.next_payment_date ? new Date(sale.next_payment_date + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}</p></div>
              </div>
              <div className="mb-2"><div className="flex justify-between text-sm text-slate-600 mb-1"><span>Progreso: {paidMonths} de {totalMonths} cuotas</span><span>{progressPct}%</span></div>
                <div className="w-full bg-slate-200 rounded-full h-2.5"><div className="bg-blue-600 h-2.5 rounded-full transition-all" style={{ width: `${progressPct}%` }}></div></div></div>
            </div>
          )}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2"><Receipt size={18} /> Pagos</h3>
              {(sale.status === 'active' || sale.status === 'pending') && <button onClick={() => setShowPay(!showPay)} className="flex items-center gap-1 text-sm bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700"><DollarSign size={16} /> Registrar Pago</button>}
            </div>
            {showPay && (
              <form onSubmit={handlePay} className="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                <h4 className="text-sm font-medium text-slate-700">Nuevo Pago</h4>
                {isInstallments && sale.installment_amount > 0 && (
                  <p className="text-xs text-slate-500">Cuota sugerida: <strong>${Number(sale.installment_amount).toFixed(2)}</strong></p>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div><label className="block text-xs font-medium text-slate-500 mb-1">Monto</label>
                    <input type="number" step="0.01" min="0.01" max={pending} value={payForm.amount} onChange={e => setPayForm({...payForm, amount: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500" placeholder="0.00" required /></div>
                  <div><label className="block text-xs font-medium text-slate-500 mb-1">Método</label>
                    <select value={payForm.payment_method} onChange={e => setPayForm({...payForm, payment_method: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500">
                      <option value="cash">Efectivo</option><option value="transfer">Transferencia</option><option value="card">Tarjeta</option></select></div>
                  <div><label className="block text-xs font-medium text-slate-500 mb-1">Notas</label>
                    <input value={payForm.notes} onChange={e => setPayForm({...payForm, notes: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500" /></div>
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700">Registrar</button>
                  <button type="button" onClick={() => setShowPay(false)} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm hover:bg-slate-300">Cancelar</button>
                </div>
              </form>
            )}
            {sale.payments.length === 0 ? <p className="text-sm text-slate-400 text-center py-4">Sin pagos</p> : (
              <table className="w-full text-sm">
                <thead><tr className="border-b border-slate-200"><th className="text-left py-2 text-slate-500 font-medium">#</th><th className="text-left py-2 text-slate-500 font-medium">Fecha</th><th className="text-right py-2 text-slate-500 font-medium">Monto</th><th className="text-left py-2 text-slate-500 font-medium">Método</th><th className="text-left py-2 text-slate-500 font-medium">Notas</th></tr></thead>
                <tbody>{sale.payments.map((p, idx) => (
                  <tr key={p.id} className="border-b border-slate-100">
                    <td className="py-2 text-slate-400 font-medium">#{idx + 1}</td>
                    <td className="py-2 text-slate-700">{new Date(p.payment_date).toLocaleString('es-ES', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit', hour12: true })}</td>
                    <td className="py-2 text-right font-medium text-emerald-600">${Number(p.amount).toFixed(2)}</td>
                    <td className="py-2 text-slate-600 capitalize">{p.payment_method}</td>
                    <td className="py-2 text-slate-500">{p.notes || '—'}</td>
                  </tr>
                ))}</tbody>
              </table>
            )}
          </div>
        </div>
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2"><User size={18} /> Cliente</h3>
            <p className="font-medium text-slate-800">{sale.client_name}</p>
            {sale.identity_card && <p className="text-sm text-slate-500 mt-1">CI: {sale.identity_card}</p>}
            {sale.phone && <p className="text-sm text-slate-500 mt-1 flex items-center gap-1"><Phone size={13} /> {sale.phone}</p>}
            {sale.address && <p className="text-sm text-slate-500 mt-1 flex items-center gap-1"><MapPin size={13} /> {sale.address}</p>}
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 mb-3">Resumen</h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-sm text-slate-600">Subtotal</span><span className="font-semibold">${sale.total_amount.toFixed(2)}</span></div>
              {isInstallments && sale.interest_rate > 0 && (
                <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-sm text-slate-600">Interés ({sale.interest_rate}%)</span><span className="font-semibold text-amber-600">+${(debt - sale.total_amount).toFixed(2)}</span></div>
              )}
              <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-sm text-slate-600">Total a Pagar</span><span className="font-semibold">${debt.toFixed(2)}</span></div>
              <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-sm text-slate-600">Pagado</span><span className="font-semibold text-emerald-600">${sale.paid_amount.toFixed(2)}</span></div>
              <div className="flex justify-between py-2"><span className="text-sm text-slate-600">Pendiente</span><span className="font-semibold text-amber-600 text-lg">${pending.toFixed(2)}</span></div>
            </div>
          </div>
          {isInstallments && (
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2"><Percent size={18} /> Plan</h3>
              <p className="text-sm text-slate-700"><strong>Plazo:</strong> {sale.term_months} meses</p>
              <p className="text-sm text-slate-700"><strong>Interés:</strong> {sale.interest_rate}%</p>
              <p className="text-sm text-slate-700"><strong>Cuota mensual:</strong> ${Number(sale.installment_amount).toFixed(2)}</p>
              <p className="text-sm text-slate-700"><strong>Próximo pago:</strong> {sale.next_payment_date ? new Date(sale.next_payment_date + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}</p>
            </div>
          )}
          {sale.status === 'completed' && <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5"><div className="flex items-center gap-2 text-emerald-800"><span className="text-lg">&#10003;</span><div><p className="font-semibold">Completada</p><p className="text-sm text-emerald-600">Equipos liberados del inventario de la empresa.</p></div></div></div>}
          {sale.notes && <div className="bg-white rounded-xl border border-slate-200 p-5"><h4 className="text-sm font-medium text-slate-600 mb-1">Notas</h4><p className="text-sm text-slate-700">{sale.notes}</p></div>}
        </div>
      </div>
    </div>
  )
}
