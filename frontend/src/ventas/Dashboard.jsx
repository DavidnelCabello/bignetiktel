import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { Package, ShoppingCart, DollarSign, AlertTriangle, TrendingUp, BarChart3 } from 'lucide-react'

function Bar({ data, color }) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="flex items-end gap-1.5 h-32">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className={`w-full ${color} rounded-t`} style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value > 0 ? 4 : 0 }} title={`${d.label}: ${d.value}`} />
          <span className="text-[10px] text-slate-400 truncate w-full text-center">{d.label?.slice(5)}</span>
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [monthly, setMonthly] = useState([])
  const [topModels, setTopModels] = useState([])
  const [lowStock, setLowStock] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.getEquipmentStats(),
      api.getMonthlySales().catch(() => []),
      api.getTopModels().catch(() => []),
      api.getLowStock().catch(() => []),
    ]).then(([s, m, t, l]) => { setStats(s); setMonthly(m); setTopModels(t); setLowStock(l) }).catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="animate-pulse space-y-4">{[1,2,3].map(i => <div key={i} className="h-24 bg-slate-200 rounded-xl" />)}</div>

  const cards = [
    { label: 'Total Equipos', value: stats?.totalUnits || 0, icon: Package, color: 'bg-blue-500', link: '/inventario' },
    { label: 'Disponibles', value: stats?.availableUnits || 0, icon: TrendingUp, color: 'bg-emerald-500', link: '/inventario' },
    { label: 'Reservados', value: stats?.reservedUnits || 0, icon: AlertTriangle, color: 'bg-amber-500', link: '/ventas' },
    { label: 'Tipos de Equipo', value: stats?.totalTypes || 0, icon: Package, color: 'bg-violet-500', link: '/catalogos' },
    { label: 'Modelos en Stock', value: stats?.totalModels || 0, icon: Package, color: 'bg-rose-500', link: '/modelos' },
    { label: 'Valor USD', value: `$${(stats?.inventoryValueUSD || 0).toFixed(2)}`, icon: DollarSign, color: 'bg-emerald-500', link: '/inventario' },
    { label: 'Valor CUP', value: `$${(stats?.inventoryValueCUP || 0).toFixed(2)}`, icon: DollarSign, color: 'bg-cyan-500', link: '/inventario' },
    { label: 'Equipos Vendidos', value: stats?.soldEquipment || 0, icon: ShoppingCart, color: 'bg-indigo-500', link: '/ventas' },
    { label: 'Ganancias Generadas', value: `$${(stats?.revenue || 0).toFixed(2)}`, icon: DollarSign, color: 'bg-orange-500', link: '/ventas' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-sm text-slate-500">{new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(card => (
          <Link key={card.label} to={card.link} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-slate-500">{card.label}</p><p className="text-2xl font-bold text-slate-800 mt-1">{card.value}</p></div>
              <div className={`w-12 h-12 ${card.color} rounded-xl flex items-center justify-center`}><card.icon size={22} className="text-white" /></div>
            </div>
          </Link>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {monthly.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><BarChart3 size={18} /> Ventas por Mes</h3>
            <Bar data={monthly.map(m => ({ label: m.month, value: m.total }))} color="bg-blue-500" />
          </div>
        )}
        {lowStock.length > 0 && (
          <div className="bg-white rounded-xl border border-red-200 p-5 lg:col-span-2">
            <h3 className="font-semibold text-red-700 mb-3 flex items-center gap-2"><AlertTriangle size={18} /> Stock Bajo ({lowStock.length})</h3>
            <div className="space-y-2">
              {lowStock.slice(0, 8).map(i => (
                <Link key={i.id} to="/inventario" className="flex items-center justify-between bg-red-50 rounded px-3 py-2 text-sm hover:bg-red-100">
                  <span className="text-slate-700">{i.brand_name} {i.model_name}</span>
                  <span className="text-red-600 font-medium">{i.available_quantity} / {i.min_stock} uds.</span>
                </Link>
              ))}
            </div>
          </div>
        )}
        {topModels.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><Package size={18} /> Modelos Más Vendidos</h3>
            <div className="space-y-2">
              {topModels.map((m, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-400 w-5">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 truncate">{m.brand} {m.name}</p>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1">
                      <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${(m.qty / Math.max(...topModels.map(x => x.qty))) * 100}%` }} />
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-slate-700">{m.qty} uds</span>
                  <span className="text-xs text-slate-400 w-20 text-right">${Number(m.total).toFixed(0)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
