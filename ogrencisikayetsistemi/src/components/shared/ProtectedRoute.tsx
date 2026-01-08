import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'

const API_URL = '/api/auth'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'admin' | 'student' | 'personnel'
  requiredRoles?: ('admin' | 'student' | 'personnel')[]
}

function ProtectedRoute({ children, requiredRole, requiredRoles }: ProtectedRouteProps) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true)
      try {
        const response = await fetch(`${API_URL}/me`, {
          credentials: 'include',
        })
        if (response.ok) {
          const userData = await response.json()
          setUser(userData)
        } else {
          setUser(null)
        }
      } catch (error) {
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    checkAuth()

    // Kullanıcı giriş/çıkış event'lerini dinle
    const handleUserLogin = () => {
      checkAuth()
    }
    const handleUserLogout = () => {
      setUser(null)
    }

    window.addEventListener('userLogin', handleUserLogin)
    window.addEventListener('userLogout', handleUserLogout)

    return () => {
      window.removeEventListener('userLogin', handleUserLogin)
      window.removeEventListener('userLogout', handleUserLogout)
    }
  }, [])

  if (loading) {
    return <div>Yükleniyor...</div>
  }

  if (!user) {
    // Kullanıcı giriş yapmamış - sayfa yokmuş gibi anasayfaya yönlendir
    return <Navigate to="/anasayfa" replace />
  }

  // Eğer belirli bir rol gerekiyorsa kontrol et
  if (requiredRole && user.roleType !== requiredRole) {
    // Yetkisiz erişim - anasayfaya yönlendir
    return <Navigate to="/anasayfa" replace />
  }

  // Eğer birden fazla rol gerekiyorsa kontrol et
  if (requiredRoles && requiredRoles.length > 0 && !requiredRoles.includes(user.roleType)) {
    // Yetkisiz erişim - anasayfaya yönlendir
    return <Navigate to="/anasayfa" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute

