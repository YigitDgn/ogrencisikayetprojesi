import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Navbar from './components/shared/Navbar'
import Footer from './components/shared/Footer'
import Anasayfa from './components/Anasayfa'
import Login from './components/auth/Login'
import AdminPanel from './components/admin/AdminPanel'
import AddUser from './components/admin/AddUser'
import PersonnelPanel from './components/personnel/PersonnelPanel'
import ComplaintDetail from './components/personnel/ComplaintDetail'
import PublicComplaintDetail from './components/shared/PublicComplaintDetail'
import Profile from './components/shared/Profile'
import CreateComplaint from './components/student/CreateComplaint'
import Sikayet from './components/student/Sikayet'
import ProtectedRoute from './components/shared/ProtectedRoute'

function AppContent() {
  const location = useLocation()
  const showNavbar = location.pathname !== '/login'

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {showNavbar && <Navbar />}
      <main className="flex-grow">
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
          <Route
            path="/personnel"
            element={
              <ProtectedRoute requiredRole="personnel">
                <PersonnelPanel />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sikayet/:id"
            element={
              <ProtectedRoute requiredRoles={['personnel', 'admin']}>
                <ComplaintDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sikayet"
            element={
              <ProtectedRoute requiredRole="student">
                <Sikayet />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sikayet-olustur"
            element={
              <ProtectedRoute requiredRole="student">
                <CreateComplaint />
              </ProtectedRoute>
            }
          />
          <Route path="/public-sikayet/:id" element={<PublicComplaintDetail />} />
          <Route
            path="/profil"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/anasayfa" replace />} />
          {/* Geçersiz route'lar için Anasayfaya yönlendir */}
          <Route path="*" element={<Navigate to="/anasayfa" replace />} />
        </Routes>
      </main>
      {showNavbar && <Footer />}
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
