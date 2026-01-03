import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Anasayfa from './components/Anasayfa'
import Login from './components/Login'
import AdminPanel from './components/AdminPanel'
import AddUser from './components/AddUser'
import ProtectedRoute from './components/ProtectedRoute'

function AppContent() {
  const location = useLocation()
  const showNavbar = location.pathname !== '/login'

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {showNavbar && <Navbar />}
      <Routes>
        <Route path="/anasayfa" element={<Anasayfa />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminPanel />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/add-user"
          element={
            <ProtectedRoute requiredRole="admin">
              <AddUser />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/anasayfa" replace />} />
        {/* Geçersiz route'lar için Anasayfaya yönlendir */}
        <Route path="*" element={<Navigate to="/anasayfa" replace />} />
      </Routes>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

export default App
