import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const API_URL = 'http://localhost:3000/auth'

function Login() {
  const navigate = useNavigate()
  
  // Eğer zaten giriş yapılmışsa uygun sayfaya yönlendir
  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      try {
        const user = JSON.parse(userData)
        // Kullanıcı zaten giriş yapmışsa uygun sayfaya yönlendir
        if (user && typeof user === 'object' && user.roleType) {
          // Admin ise admin paneline, diğer tüm kullanıcılar anasayfaya
          if (user.roleType === 'admin') {
            navigate('/admin', { replace: true })
          } else {
            // student, personnel veya diğer tüm roller için anasayfa
            navigate('/anasayfa', { replace: true })
          }
        }
      } catch (error) {
        // Geçersiz veri - localStorage'ı temizle
        localStorage.removeItem('user')
      }
    }
  }, [navigate])
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Giriş başarısız')
      }

      // Başarılı giriş
      localStorage.setItem('user', JSON.stringify(data))
      window.dispatchEvent(new Event('userLogin'))
      
      // Admin ise admin paneline, değilse anasayfaya yönlendir
      if (data.roleType === 'admin') {
        navigate('/admin')
      } else {
        navigate('/anasayfa')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Kayıt başarısız')
      }

      // Başarılı kayıt - otomatik giriş yap
      localStorage.setItem('user', JSON.stringify(data))
      window.dispatchEvent(new Event('userLogin'))
      
      // Admin ise admin paneline, değilse anasayfaya yönlendir
      if (data.roleType === 'admin') {
        navigate('/admin')
      } else {
        navigate('/anasayfa')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-12 py-12 bg-gradient-to-b from-[#0077BE] to-[#00427F] overflow-hidden">
      <div className="bg-white rounded-xl p-10 w-full max-w-[450px] shadow-lg">
        <h2 className="text-black text-3xl font-semibold mb-8 m-0 text-center">
          {isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
        </h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}
        
        {isLogin ? (
          <form onSubmit={handleLoginSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-[#333] text-[0.95rem] font-medium">E-posta</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-posta adresinizi girin"
                required
                className="px-4 py-3 border border-[#ddd] rounded-md text-base transition-colors focus:outline-none focus:border-[#0077BE] focus:ring-4 focus:ring-[#0077BE]/10"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="text-[#333] text-[0.95rem] font-medium">Şifre</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Şifrenizi girin"
                required
                className="px-4 py-3 border border-[#ddd] rounded-md text-base transition-colors focus:outline-none focus:border-[#0077BE] focus:ring-4 focus:ring-[#0077BE]/10"
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="px-4 py-3.5 bg-[#0077BE] text-white border-none rounded-md text-base font-semibold cursor-pointer transition-colors duration-300 mt-2 hover:bg-[#005a94] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </button>
            <p className="text-center mt-6 text-[#666] text-[0.95rem]">
              Hesabınız yok mu?{' '}
              <button
                type="button"
                className="bg-transparent border-none text-[#0077BE] font-semibold cursor-pointer p-0 underline text-[0.95rem] transition-colors duration-300 hover:text-[#005a94] inline w-fit"
                onClick={() => {
                  setIsLogin(false)
                  setEmail('')
                  setPassword('')
                  setError('')
                }}
              >
                Kayıt Ol
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="text-[#333] text-[0.95rem] font-medium">Ad Soyad</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Adınızı ve soyadınızı girin"
                required
                className="px-4 py-3 border border-[#ddd] rounded-md text-base transition-colors focus:outline-none focus:border-[#0077BE] focus:ring-4 focus:ring-[#0077BE]/10"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="register-email" className="text-[#333] text-[0.95rem] font-medium">E-posta</label>
              <input
                type="email"
                id="register-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-posta adresinizi girin"
                required
                className="px-4 py-3 border border-[#ddd] rounded-md text-base transition-colors focus:outline-none focus:border-[#0077BE] focus:ring-4 focus:ring-[#0077BE]/10"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="register-password" className="text-[#333] text-[0.95rem] font-medium">Şifre</label>
              <input
                type="password"
                id="register-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Şifrenizi girin"
                required
                className="px-4 py-3 border border-[#ddd] rounded-md text-base transition-colors focus:outline-none focus:border-[#0077BE] focus:ring-4 focus:ring-[#0077BE]/10"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="confirm-password" className="text-[#333] text-[0.95rem] font-medium">Şifre Tekrar</label>
              <input
                type="password"
                id="confirm-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Şifrenizi tekrar girin"
                required
                className="px-4 py-3 border border-[#ddd] rounded-md text-base transition-colors focus:outline-none focus:border-[#0077BE] focus:ring-4 focus:ring-[#0077BE]/10"
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="px-4 py-3.5 bg-[#0077BE] text-white border-none rounded-md text-base font-semibold cursor-pointer transition-colors duration-300 mt-2 hover:bg-[#005a94] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
            </button>
            <p className="text-center mt-6 text-[#666] text-[0.95rem]">
              Zaten hesabınız var mı?{' '}
              <button
                type="button"
                className="bg-transparent border-none text-[#0077BE] font-semibold cursor-pointer p-0 underline text-[0.95rem] transition-colors duration-300 hover:text-[#005a94] inline w-fit"
                onClick={() => {
                  setIsLogin(true)
                  setEmail('')
                  setPassword('')
                  setName('')
                  setConfirmPassword('')
                  setError('')
                }}
              >
                Giriş Yap
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}

export default Login
