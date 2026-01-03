import { Navigate } from 'react-router-dom'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'admin' | 'student' | 'personnel'
}

function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const userStr = localStorage.getItem('user')
  
  if (!userStr) {
    // Kullanıcı giriş yapmamış - sayfa yokmuş gibi anasayfaya yönlendir
    return <Navigate to="/anasayfa" replace />
  }

  try {
    const user = JSON.parse(userStr)

    // Kullanıcı objesi geçerli değilse
    if (!user || typeof user !== 'object') {
      localStorage.removeItem('user')
      // Sayfa yokmuş gibi anasayfaya yönlendir
      return <Navigate to="/anasayfa" replace />
    }

    // Eğer belirli bir rol gerekiyorsa kontrol et
    if (requiredRole && user.roleType !== requiredRole) {
      // Yetkisiz erişim - anasayfaya yönlendir
      return <Navigate to="/anasayfa" replace />
    }

    return <>{children}</>
  } catch (error) {
    // JSON parse hatası - localStorage'ı temizle ve anasayfaya yönlendir
    localStorage.removeItem('user')
    return <Navigate to="/anasayfa" replace />
  }
}

export default ProtectedRoute

