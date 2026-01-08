import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import logo from '../../assets/logo.png'

const API_URL = '/api/auth'

function Navbar() {
  const [user, setUser] = useState<{ 
    userId: number; 
    firstName: string; 
    lastName: string; 
    email: string; 
    roleType?: string;
    student?: any;
    admin?: any;
    personnel?: any;
  } | null>(null)

  useEffect(() => {
    const loadUser = async () => {
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
      }
    }

    loadUser()

    // Custom event değişikliklerini dinle
    const handleUserChange = () => loadUser()
    window.addEventListener('userLogin', handleUserChange)
    window.addEventListener('userLogout', handleUserChange)

    return () => {
      window.removeEventListener('userLogin', handleUserChange)
      window.removeEventListener('userLogout', handleUserChange)
    }
  }, [])


  return (
    <nav className="bg-white border-b border-black/10 px-8 py-4 sticky top-0 z-[100] shadow-sm flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <Link to="/anasayfa" className="cursor-pointer">
          <img src={logo} alt="Pamukkale Üniversitesi Logo" className="h-[50px] w-auto" />
        </Link>
        <h1 className="m-0 text-black text-2xl font-semibold">Pamukkale Üniversitesi Şikayet Sistemi</h1>
      </div>
      {user ? (
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-black text-base font-medium">Hoşgeldiniz, {user.firstName} {user.lastName}</span>
            {user.roleType && (
              <span className="text-gray-600 text-sm">
                {user.roleType === 'student' && 'Öğrenci'}
                {user.roleType === 'admin' && 'Yönetici'}
                {user.roleType === 'personnel' && 'Personel'}
              </span>
            )}
          </div>
          {user.roleType === 'admin' && (
            <Link
              to="/admin"
              className="px-6 py-2.5 bg-[#0077BE] text-white border-none rounded-md text-base font-medium cursor-pointer transition-colors duration-300 no-underline inline-block hover:bg-[#005a94]"
            >
              Admin Panele Git
            </Link>
          )}
          {user.roleType === 'personnel' && (
            <Link
              to="/personnel"
              className="px-6 py-2.5 bg-[#0077BE] text-white border-none rounded-md text-base font-medium cursor-pointer transition-colors duration-300 no-underline inline-block hover:bg-[#005a94]"
            >
              Personel Paneli
            </Link>
          )}
          {user.roleType === 'student' && (
            <Link
              to="/sikayet"
              className="px-6 py-2.5 bg-[#0077BE] text-white border-none rounded-md text-base font-medium cursor-pointer transition-colors duration-300 no-underline inline-block hover:bg-[#005a94]"
            >
              Şikayetlerim
            </Link>
          )}
          <Link
            to="/profil"
            className="p-2.5 bg-[#0077BE] text-white border-none rounded-md cursor-pointer transition-colors duration-300 no-underline inline-flex items-center justify-center hover:bg-[#005a94]"
            title="Profilim"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </Link>
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

