import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { api } from './api'
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

export default function App() {
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
        <Route path="/" element={<Dashboard />} />
        <Route path="/inventario" element={<Inventory />} />
        <Route path="/modelos" element={<Models />} />
        <Route path="/catalogos" element={<TypesBrands />} />
        <Route path="/clientes" element={<Clients />} />
        <Route path="/ventas" element={<Sales />} />
        <Route path="/ventas/:id" element={<SaleDetail />} />
        <Route path="/pagos-atrasados" element={<LatePayments />} />
        <Route path="/usuarios" element={<Usuarios />} />
        <Route path="/logs" element={<Logs />} />
        <Route path="/configuracion" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  )
}
