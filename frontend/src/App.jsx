import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { api } from './api'
import PortalApp from './clock/portal/PortalApp'
import KioskApp from './clock/kiosk/KioskApp'
import Layout from './components/Layout'
import Login from './shared/Login'
import Dashboard from './ventas/Dashboard'
import Inventory from './ventas/Inventory'
import Models from './ventas/Models'
import TypesBrands from './ventas/TypesBrands'
import Clients from './ventas/Clients'
import Sales from './ventas/Sales'
import SaleDetail from './ventas/SaleDetail'
import LatePayments from './ventas/LatePayments'
import Usuarios from './shared/Usuarios'
import Logs from './shared/Logs'
import Settings from './shared/Settings'
import Empleados from './clock/Empleados'
import Fichaje from './clock/Fichaje'
import ReporteHoras from './clock/ReporteHoras'
import SuiteHome from './shared/SuiteHome'
import RRHHPanel from './clock/RRHHPanel'
import Departamentos from './clock/Departamentos'
import Solicitudes from './clock/Solicitudes'
import TicketsRRHH from './clock/TicketsRRHH'
import Trabajando from './clock/Trabajando'
import Correcciones from './clock/Correcciones'
import Facturacion from './clock/Facturacion'

export default function App() {
  const loc = useLocation()
  // El portal del empleado y el kiosco son entradas aparte.
  if (loc.pathname.startsWith('/portal')) return <PortalApp />
  if (loc.pathname.startsWith('/kiosco')) return <KioskApp />
  return <AdminApp />
}

function AdminApp() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = localStorage.getItem('token')
    if (t) api.me().then(d => setUser(d.user)).catch(() => localStorage.removeItem('token')).finally(() => setLoading(false))
    else setLoading(false)
  }, [])

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-100"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>
  if (!user) return <Routes><Route path="*" element={<Login onLogin={setUser} />} /></Routes>

  return (
    <Layout user={user} onLogout={() => { localStorage.removeItem('token'); setUser(null) }}>
      <Routes>
        <Route path="/" element={<SuiteHome user={user} />} />
        <Route path="/almacen" element={<Dashboard />} />
        <Route path="/rrhh" element={<RRHHPanel />} />
        <Route path="/inventario" element={<Inventory />} />
        <Route path="/modelos" element={<Models />} />
        <Route path="/catalogos" element={<TypesBrands />} />
        <Route path="/clientes" element={<Clients />} />
        <Route path="/ventas" element={<Sales />} />
        <Route path="/ventas/:id" element={<SaleDetail />} />
        <Route path="/pagos-atrasados" element={<LatePayments />} />
        <Route path="/empleados" element={<Empleados />} />
        <Route path="/departamentos" element={<Departamentos />} />
        <Route path="/fichaje" element={<Fichaje />} />
        <Route path="/horas" element={<ReporteHoras />} />
        <Route path="/solicitudes" element={<Solicitudes />} />
        <Route path="/tickets-rrhh" element={<TicketsRRHH />} />
        <Route path="/trabajando" element={<Trabajando />} />
        <Route path="/correcciones" element={<Correcciones />} />
        <Route path="/facturacion" element={<Facturacion />} />
        <Route path="/usuarios" element={<Usuarios />} />
        <Route path="/logs" element={<Logs />} />
        <Route path="/configuracion" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  )
}
