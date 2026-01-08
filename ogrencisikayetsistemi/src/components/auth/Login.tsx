import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'

const API_URL = '/api/auth'

function Login() {
  const navigate = useNavigate()
  
  // Eğer zaten giriş yapılmışsa uygun sayfaya yönlendir
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(`${API_URL}/me`, {
          credentials: 'include',
        })
        if (response.ok) {
          const user = await response.json()
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
        }
      } catch (error) {
        // Giriş yapılmamış, sayfada kal
      }
    }
    checkAuth()
  }, [navigate])
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      // Response'un içeriğini kontrol et
      const text = await response.text()
      let data
      
      try {
        data = text ? JSON.parse(text) : {}
      } catch (parseError) {
        throw new Error('Sunucudan geçersiz yanıt alındı')
      }

      if (!response.ok) {
        throw new Error(data.message || 'Giriş başarısız')
      }

      // Başarılı giriş - cookie otomatik olarak set edildi
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

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Dosya tipini kontrol et
      if (!file.type.startsWith('image/')) {
        setError('Lütfen bir resim dosyası seçin')
        return
      }
      
      // Dosya boyutunu kontrol et (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Dosya boyutu 5MB\'dan küçük olmalıdır')
        return
      }

      setPhoto(file)
      setError('')
      
      // Preview oluştur
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // E-posta adresinin @university.edu ile bitmesi gerekiyor
    if (!email.toLowerCase().endsWith('@university.edu')) {
      setError('E-posta adresi @university.edu ile bitmelidir')
      return
    }

    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor')
      return
    }

    setLoading(true)

    try {
      // FormData oluştur
      const formData = new FormData()
      formData.append('firstName', firstName)
      formData.append('lastName', lastName)
      formData.append('email', email)
      formData.append('password', password)
      if (photo) {
        formData.append('photo', photo)
      }

      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      // Response'un içeriğini kontrol et
      const text = await response.text()
      let data
      
      try {
        data = text ? JSON.parse(text) : {}
      } catch (parseError) {
        throw new Error('Sunucudan geçersiz yanıt alındı')
      }

      if (!response.ok) {
        throw new Error(data.message || 'Kayıt başarısız')
      }

      // Başarılı kayıt - cookie otomatik olarak set edildi
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
    <div className="min-h-screen flex flex-col items-center justify-center px-12 py-12 bg-gradient-to-b from-[#0077BE] to-[#00427F] overflow-hidden">
      <div className="bg-white rounded-xl p-10 w-full max-w-[450px] shadow-lg relative">
        <Link
          to="/anasayfa"
          className="absolute top-4 left-4 text-gray-600 hover:text-gray-800 transition-colors flex items-center gap-2"
        >
          <span className="text-xl">←</span>
          <span className="text-sm font-medium">Anasayfaya Dön</span>
        </Link>
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
                  setFirstName('')
                  setLastName('')
                  setConfirmPassword('')
                  setPhoto(null)
                  setPhotoPreview(null)
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
              <label htmlFor="firstName" className="text-[#333] text-[0.95rem] font-medium">Ad</label>
              <input
                type="text"
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Adınızı girin"
                required
                className="px-4 py-3 border border-[#ddd] rounded-md text-base transition-colors focus:outline-none focus:border-[#0077BE] focus:ring-4 focus:ring-[#0077BE]/10"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="lastName" className="text-[#333] text-[0.95rem] font-medium">Soyad</label>
              <input
                type="text"
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Soyadınızı girin"
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
                placeholder="ornek@university.edu"
                required
                className="px-4 py-3 border border-[#ddd] rounded-md text-base transition-colors focus:outline-none focus:border-[#0077BE] focus:ring-4 focus:ring-[#0077BE]/10"
              />
              <p className="text-xs text-gray-500">E-posta adresi @university.edu ile bitmelidir</p>
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
            <div className="flex flex-col gap-2">
              <label htmlFor="photo" className="text-[#333] text-[0.95rem] font-medium">Fotoğraf (İsteğe Bağlı)</label>
              <input
                type="file"
                id="photo"
                accept="image/*"
                onChange={handlePhotoChange}
                className="px-4 py-3 border border-[#ddd] rounded-md text-base transition-colors focus:outline-none focus:border-[#0077BE] focus:ring-4 focus:ring-[#0077BE]/10"
              />
              {photoPreview && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600 mb-2">Önizleme:</p>
                  <img
                    src={photoPreview}
                    alt="Fotoğraf önizleme"
                    className="w-24 h-24 object-cover rounded-lg border border-gray-300"
                  />
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">Maksimum dosya boyutu: 5MB</p>
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
                  setFirstName('')
                  setLastName('')
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
