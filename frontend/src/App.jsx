import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { api } from './api'
import PortalApp from './portal/PortalApp'
import KioskApp from './kiosk/KioskApp'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Inventory from './pages/Inventory'
import Models from './pages/Models'
import TypesBrands from './pages/TypesBrands'
import Clients from './pages/Clients'
import Sales from './pages/Sales'
import SaleDetail from './pages/SaleDetail'
import LatePayments from './pages/LatePayments'
import Usuarios from './pages/Usuarios'
import Logs from './pages/Logs'
import Settings from './pages/Settings'
import Empleados from './pages/Empleados'
import Fichaje from './pages/Fichaje'
import ReporteHoras from './pages/ReporteHoras'
import SuiteHome from './pages/SuiteHome'
import RRHHPanel from './pages/RRHHPanel'
import Departamentos from './pages/Departamentos'
import Solicitudes from './pages/Solicitudes'
import TicketsRRHH from './pages/TicketsRRHH'
import Trabajando from './pages/Trabajando'
import Correcciones from './pages/Correcciones'
import Facturacion from './pages/Facturacion'

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
