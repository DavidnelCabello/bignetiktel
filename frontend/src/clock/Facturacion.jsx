import { useState, useEffect } from 'react'
import { api } from '../api'
import { exportCSV, reportHTML, exportWord, printPDF } from '../lib/exporters'
import { Receipt, ChevronLeft, ChevronRight, FileSpreadsheet, FileText, Printer, Building2, Users, Palmtree, Wallet } from 'lucide-react'

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const pad = n => String(n).padStart(2, '0')
function fmtMoney(obj) {
  const parts = Object.entries(obj || {}).filter(([, v]) => v).map(([c, v]) => `${v.toLocaleString('es')} ${c}`)
  return parts.length ? parts.join(' · ') : '0'
}

export default function Facturacion() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const from = `${year}-${pad(month + 1)}-01`
  const to = `${year}-${pad(month + 1)}-${pad(new Date(year, month + 1, 0).getDate())}`

  useEffect(() => { setLoading(true); api.hrPayroll(from, to).then(d => { setData(d); setLoading(false) }).catch(() => setLoading(false)) }, [year, month])

  function prev() { if (month === 0) { setMonth(11); setYear(year - 1) } else setMonth(month - 1) }
  function next() { if (month === 11) { setMonth(0); setYear(year + 1) } else setMonth(month + 1) }
  const periodLabel = `${MONTHS[month]} ${year}`

  function buildSections() {
    const g = data.general
    return [
      { heading: 'Resumen general', headers: ['Concepto', 'Valor'], rows: [
        ['Total a pagar', fmtMoney(g.total)],
        ['Pago por horas trabajadas', fmtMoney(g.worked)],
        ['Pago por vacaciones', fmtMoney(g.vacation)],
        ['Horas totales', g.total_hours],
      ]},
      { heading: 'Por departamento', headers: ['Departamento', 'Horas', 'Total'], rows: data.by_department.map(d => [d.department, d.hours, fmtMoney(d.total)]) },
      { heading: 'Por empleado', headers: ['Empleado', 'Departamento', 'Horas', 'Pago horas', 'Días vac.', 'Pago vac.', 'Total'],
        rows: data.employees.map(e => [e.name, e.department, e.total_hours, `${e.worked_pay} ${e.currency}`, e.vacation_days, `${e.vacation_pay} ${e.currency}`, `${e.total} ${e.currency}`]) },
    ]
  }
  function doExcel() {
    exportCSV(`facturacion-${year}-${pad(month + 1)}.csv`,
      ['Empleado', 'Departamento', 'Cargo', 'Horas reg.', 'Horas extra', 'Horas total', 'Pago horas', 'Moneda', 'Días vacaciones', 'Pago vacaciones', 'Total'],
      data.employees.map(e => [e.name, e.department, e.position || '', e.regular_hours, e.extra_hours, e.total_hours, e.worked_pay, e.currency, e.vacation_days, e.vacation_pay, e.total]))
  }
  const html = () => reportHTML(`Facturación — ${periodLabel}`, `Período: ${from} a ${to} · BigNetiK Telecom`, buildSections())
  function doWord() { exportWord(`facturacion-${year}-${pad(month + 1)}.doc`, html()) }
  function doPDF() { printPDF(html()) }

  const g = data?.general
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Receipt size={24} className="text-emerald-600" /> Facturación / Nómina</h1>
        <div className="flex items-center gap-2">
          <button onClick={prev} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-500"><ChevronLeft size={18} /></button>
          <span className="font-semibold text-slate-700 w-36 text-center">{periodLabel}</span>
          <button onClick={next} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-500"><ChevronRight size={18} /></button>
        </div>
      </div>

      {data && data.employees.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button onClick={doExcel} className="flex items-center gap-1.5 text-sm bg-emerald-600 text-white px-3 py-2 rounded-lg hover:bg-emerald-700"><FileSpreadsheet size={16} /> Excel</button>
          <button onClick={doPDF} className="flex items-center gap-1.5 text-sm bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700"><Printer size={16} /> PDF</button>
          <button onClick={doWord} className="flex items-center gap-1.5 text-sm bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700"><FileText size={16} /> Word</button>
        </div>
      )}

      {loading && <div className="animate-pulse space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 bg-slate-200 rounded-xl" />)}</div>}

      {!loading && data && (
        <>
          {/* Resumen general */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Big label="Total a pagar este mes" value={fmtMoney(g.total)} icon={Wallet} accent />
            <Big label="Pago por horas" value={fmtMoney(g.worked)} icon={Users} />
            <Big label="Pago por vacaciones" value={fmtMoney(g.vacation)} icon={Palmtree} />
          </div>

          {/* Por departamento */}
          <Card title="Por departamento / oficina" icon={Building2}>
            {data.by_department.length === 0 && <Empty />}
            {data.by_department.map(d => (
              <div key={d.department} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
                <span className="text-slate-700">{d.department}</span>
                <div className="text-right"><span className="text-xs text-slate-400 mr-3">{d.hours} h</span><span className="font-semibold text-slate-800">{fmtMoney(d.total)}</span></div>
              </div>
            ))}
          </Card>

          {/* Por empleado */}
          <Card title="Por empleado" icon={Users}>
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-sm min-w-[640px]">
                <thead><tr className="text-slate-500 border-b border-slate-200">
                  <th className="text-left py-2 px-2 font-medium">Empleado</th>
                  <th className="text-left py-2 px-2 font-medium">Depto.</th>
                  <th className="text-right py-2 px-2 font-medium">Horas</th>
                  <th className="text-right py-2 px-2 font-medium">Pago horas</th>
                  <th className="text-right py-2 px-2 font-medium">Vac.</th>
                  <th className="text-right py-2 px-2 font-medium">Total</th>
                </tr></thead>
                <tbody>
                  {data.employees.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-slate-400">Sin datos este mes.</td></tr>}
                  {data.employees.map(e => (
                    <tr key={e.employee_code} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-2.5 px-2"><p className="font-medium text-slate-800">{e.name}</p><p className="text-xs text-slate-400">{e.position || e.employee_code}</p></td>
                      <td className="py-2.5 px-2 text-slate-600">{e.department}</td>
                      <td className="py-2.5 px-2 text-right text-slate-600">{e.total_hours}{e.extra_hours > 0 && <span className="text-amber-600 text-xs"> (+{e.extra_hours})</span>}</td>
                      <td className="py-2.5 px-2 text-right text-slate-700">{e.worked_pay} {e.currency}</td>
                      <td className="py-2.5 px-2 text-right text-slate-500">{e.vacation_pay ? `${e.vacation_pay} ${e.currency}` : '—'}</td>
                      <td className="py-2.5 px-2 text-right font-semibold text-slate-800">{e.total} {e.currency}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <p className="text-xs text-slate-400">Cambia de mes con las flechas para ver el historial. Los montos se calculan de las horas fichadas + vacaciones aprobadas.</p>
        </>
      )}
    </div>
  )
}

function Big({ label, value, icon: Icon, accent }) {
  return (
    <div className={`rounded-xl border p-4 ${accent ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-200'}`}>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${accent ? 'bg-white/20' : 'bg-emerald-50 text-emerald-600'}`}><Icon size={18} /></div>
      <p className={`text-xl font-bold mt-2 ${accent ? 'text-white' : 'text-slate-800'}`}>{value}</p>
      <p className={`text-xs ${accent ? 'text-emerald-100' : 'text-slate-500'}`}>{label}</p>
    </div>
  )
}
function Card({ title, icon: Icon, children }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2"><Icon size={18} className="text-emerald-600" /> {title}</h3>
      {children}
    </div>
  )
}
function Empty() { return <p className="text-slate-400 text-sm py-4 text-center">Sin datos este mes.</p> }
