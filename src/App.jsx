import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'

// Páginas
import LoginPage      from './pages/LoginPage'
import AdminLayout    from './pages/admin/AdminLayout'
import OrdersPage     from './pages/admin/OrdersPage'
import ProductsPage   from './pages/admin/ProductsPage'
import CategoriesPage from './pages/admin/CategoriesPage'
import SalesPage      from './pages/admin/SalesPage'
import TablesPage     from './pages/admin/TablesPage'
import MenuPage       from './pages/menu/MenuPage'
import CheckoutPage   from './pages/menu/CheckoutPage'
import SuccessPage    from './pages/menu/SuccessPage'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', color:'var(--text2)' }}>Cargando...</div>
  return user ? children : <Navigate to="/login" replace />
}

function AppRoutes() {
  return (
    <Routes>
      {/* Pública: menú para clientes */}
      <Route path="/menu"     element={<MenuPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/success"  element={<SuccessPage />} />

      {/* Auth */}
      <Route path="/login" element={<LoginPage />} />

      {/* Admin protegido */}
      <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
        <Route index            element={<Navigate to="orders" replace />} />
        <Route path="orders"   element={<OrdersPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="sales"    element={<SalesPage />} />
        <Route path="tables"   element={<TablesPage />} />
      </Route>

      {/* Redirect raíz */}
      <Route path="/" element={<Navigate to="/admin" replace />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            className: 'toast-custom',
            duration: 3000,
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  )
}
