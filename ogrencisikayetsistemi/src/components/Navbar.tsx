import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import logo from '../assets/logo.png'

function Navbar() {
  const navigate = useNavigate()
  const [user, setUser] = useState<{ 
    userId: number; 
    username: string; 
    email: string; 
    roleType?: string;
    student?: any;
    admin?: any;
    personnel?: any;
  } | null>(null)

  useEffect(() => {
    const loadUser = () => {
      const userData = localStorage.getItem('user')
      if (userData) {
        try {
          setUser(JSON.parse(userData))
        } catch (e) {
          localStorage.removeItem('user')
          setUser(null)
        }
      } else {
        setUser(null)
      }
    }

    loadUser()

    // localStorage ve custom event değişikliklerini dinle
    window.addEventListener('storage', loadUser)
    window.addEventListener('userLogin', loadUser)
    window.addEventListener('userLogout', loadUser)

    return () => {
      window.removeEventListener('storage', loadUser)
      window.removeEventListener('userLogin', loadUser)
      window.removeEventListener('userLogout', loadUser)
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('user')
    setUser(null)
    window.dispatchEvent(new Event('userLogout'))
    navigate('/login')
  }

  return (
    <nav className="bg-white border-b border-black/10 px-8 py-4 sticky top-0 z-[100] shadow-sm flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <img src={logo} alt="Pamukkale Üniversitesi Logo" className="h-[50px] w-auto" />
        <h1 className="m-0 text-black text-2xl font-semibold">Pamukkale Üniversitesi Şikayet Sistemi</h1>
      </div>
      {user ? (
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-black text-base font-medium">Hoşgeldiniz, {user.username}</span>
            {user.roleType && (
              <span className="text-gray-600 text-sm">
                {user.roleType === 'student' && 'Öğrenci'}
                {user.roleType === 'admin' && 'Yönetici'}
                {user.roleType === 'personnel' && 'Personel'}
              </span>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="px-6 py-2.5 bg-red-600 text-white border-none rounded-md text-base font-medium cursor-pointer transition-colors duration-300 hover:bg-red-700"
          >
            Çıkış
          </button>
        </div>
      ) : (
        <Link 
          to="/login" 
          className="px-6 py-2.5 bg-[#0077BE] text-white border-none rounded-md text-base font-medium cursor-pointer transition-colors duration-300 no-underline inline-block hover:bg-[#005a94]"
        >
          Giriş
        </Link>
      )}
    </nav>
  )
}

export default Navbar
