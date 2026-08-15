import { useState, useEffect } from 'react'
import { api } from '../api'
import { CalendarClock, Download, Building2, Users } from 'lucide-react'
import { exportCSV } from '../lib/exporters'

function monthRange() {
  const now = new Date()
  const p = n => String(n).padStart(2, '0')
  const first = `${now.getFullYear()}-${p(now.getMonth() + 1)}-01`
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return { from: first, to: `${last.getFullYear()}-${p(last.getMonth() + 1)}-${p(last.getDate())}` }
}
function fmtMoney(obj) {
  const parts = Object.entries(obj || {}).filter(([, v]) => v).map(([c, v]) => `${v.toLocaleString('es')} ${c}`)
  return parts.length ? parts.join(' · ') : '—'
}

export default function ReporteHoras() {
  const init = monthRange()
  const [from, setFrom] = useState(init.from)
  const [to, setTo] = useState(init.to)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function run() {
    setLoading(true); setError('')
    try { setData(await api.hrPayroll(from, to)) } catch (e) { setError(e.message); setData(null) }
    setLoading(false)
  }
  useEffect(() => { run() }, [])

  const g = data?.general
  const rows = data?.employees || []
  const depts = data?.by_department || []
  const maxDept = Math.max(1, ...depts.map(d => d.hours))

  function exportCsv() {
    exportCSV(`horas-${from}_a_${to}.csv`,
      ['Empleado', 'Cargo', 'Departamento', 'Días', 'Horas reg.', 'Horas extra', 'Horas total', 'Pago'],
      rows.map(r => [r.name, r.position || '', r.department, r.days_worked, r.regular_hours, r.extra_hours, r.total_hours, `${r.worked_pay} ${r.currency}`]))
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><CalendarClock size={24} className="text-blue-600" /> Reporte de Horas</h1>

      <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-end gap-3 flex-wrap">
        <div><label className="block text-xs font-medium text-slate-500 mb-1">Desde</label><input type="date" value={from} onChange={e => setFrom(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
        <div><label className="block text-xs font-medium text-slate-500 mb-1">Hasta</label><input type="date" value={to} onChange={e => setTo(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
        <button onClick={run} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Generar</button>
        {rows.length > 0 && <button onClick={exportCsv} className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm hover:bg-slate-200"><Download size={16} /> Exportar CSV</button>}
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
      {loading && <p className="text-center text-slate-400 py-8">Calculando…</p>}

      {!loading && data && (
        <>
          {/* Total general */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="Empleados" value={rows.length} />
            <Stat label="Horas totales" value={g.total_hours} accent />
            <Stat label="Horas normales" value={g.regular_hours} />
            <Stat label="Horas extra" value={g.extra_hours} amber />
          </div>

          {/* Total por departamento */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2"><Building2 size={18} className="text-blue-600" /> Total de horas por departamento</h3>
            {depts.length === 0 && <p className="text-slate-400 text-sm py-4 text-center">Sin horas en este período.</p>}
            <div className="space-y-2.5">
              {depts.map(d => (
                <div key={d.department}>
                  <div className="flex justify-between text-sm mb-1"><span className="text-slate-600">{d.department}</span><span className="font-medium text-slate-800">{d.hours} h</span></div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5"><div className="bg-blue-500 h-full rounded-full" style={{ width: `${(d.hours / maxDept) * 100}%` }} /></div>
                </div>
              ))}
            </div>
          </div>

          {/* Desglose por trabajador */}
          <div className="bg-white rounded-xl border border-slate-200">
            <h3 className="font-semibold text-slate-800 p-4 pb-0 flex items-center gap-2"><Users size={18} className="text-blue-600" /> Horas por trabajador</h3>
            <div className="overflow-x-auto p-2">
              <table className="w-full text-sm min-w-[560px]">
                <thead><tr className="text-slate-500 border-b border-slate-200">
                  <th className="text-left py-2 px-2 font-medium">Empleado</th>
                  <th className="text-left py-2 px-2 font-medium">Depto.</th>
                  <th className="text-right py-2 px-2 font-medium">Días</th>
                  <th className="text-right py-2 px-2 font-medium">Reg.</th>
                  <th className="text-right py-2 px-2 font-medium">Extra</th>
                  <th className="text-right py-2 px-2 font-medium">Total</th>
                  <th className="text-right py-2 px-2 font-medium">Pago</th>
                </tr></thead>
                <tbody>
                  {rows.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-slate-400">Sin fichajes en este rango.</td></tr>}
                  {rows.map(r => (
                    <tr key={r.employee_code} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-2.5 px-2"><p className="font-medium text-slate-800">{r.name}</p><p className="text-xs text-slate-400">{r.position || r.employee_code}</p></td>
                      <td className="py-2.5 px-2 text-slate-600">{r.department}</td>
                      <td className="py-2.5 px-2 text-right text-slate-600">{r.days_worked}</td>
                      <td className="py-2.5 px-2 text-right text-slate-600">{r.regular_hours}</td>
                      <td className="py-2.5 px-2 text-right text-amber-600 font-medium">{r.extra_hours || '—'}</td>
                      <td className="py-2.5 px-2 text-right font-semibold text-slate-800">{r.total_hours}</td>
                      <td className="py-2.5 px-2 text-right text-slate-700">{r.worked_pay} {r.currency}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function Stat({ label, value, accent, amber }) {
  return (
    <div className={`rounded-xl border p-4 ${accent ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200'}`}>
      <p className={`text-xl font-bold ${accent ? 'text-white' : amber ? 'text-amber-600' : 'text-slate-800'}`}>{value}</p>
      <p className={`text-xs ${accent ? 'text-blue-100' : 'text-slate-500'}`}>{label}</p>
    </div>
  )
}
