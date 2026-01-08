import { useState, useEffect } from 'react'
import type { FormEvent, ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'

const API_URL = '/api/auth'

interface User {
  userId: number
  firstName: string
  lastName: string
  email: string
  phoneNumber?: string
  photo?: string
  roleType?: string
  student?: any
  admin?: any
  personnel?: any
}

function Profile() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    password: '',
    phoneNumber: '',
  })
  
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [removePhoto, setRemovePhoto] = useState(false)

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    try {
      const response = await fetch(`${API_URL}/me`, {
        credentials: 'include',
      })
      
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
        setFormData({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          password: '',
          phoneNumber: userData.phoneNumber || '',
        })
        if (userData.photo) {
          setPhotoPreview(userData.photo)
        } else {
          setPhotoPreview(null)
        }
        setRemovePhoto(false)
      } else {
        if (response.status === 401) {
          navigate('/login')
        } else {
          setError('Kullanıcı bilgileri yüklenemedi')
        }
      }
    } catch (err) {
      setError('Kullanıcı bilgileri yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Lütfen bir resim dosyası seçin')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Dosya boyutu 5MB\'dan küçük olmalıdır')
        return
      }
      setPhoto(file)
      setError('')
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setUpdating(true)
    setError('')
    setSuccess('')

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('firstName', formData.firstName)
      formDataToSend.append('lastName', formData.lastName)
      if (formData.password) {
        formDataToSend.append('password', formData.password)
      }
      if (formData.phoneNumber) {
        formDataToSend.append('phoneNumber', formData.phoneNumber)
      }
      if (removePhoto) {
        formDataToSend.append('removePhoto', 'true')
      } else if (photo) {
        formDataToSend.append('photo', photo)
      }

      const response = await fetch(`${API_URL}/profile`, {
        method: 'PUT',
        credentials: 'include',
        body: formDataToSend,
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('Yetkisiz erişim. Lütfen tekrar giriş yapın.')
        }
        throw new Error(data.message || 'Profil güncellenemedi')
      }

      setSuccess('Profil başarıyla güncellendi')
      setPhoto(null)
      setRemovePhoto(false)
      setFormData(prev => ({ ...prev, password: '' }))
      
      // Kullanıcı bilgilerini yenile
      await loadUser()
      
      // Navbar'ı güncellemek için event gönder
      window.dispatchEvent(new Event('userLogin'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Profil güncellenirken hata oluştu')
    } finally {
      setUpdating(false)
    }
  }

  const handleLogout = async () => {
    try {
      const response = await fetch(`${API_URL}/logout`, {
        method: 'POST',
        credentials: 'include',
      })

      if (response.ok) {
        // Navbar'ı güncellemek için event gönder
        window.dispatchEvent(new Event('userLogout'))
        // Login sayfasına yönlendir
        navigate('/login')
      } else {
        setError('Çıkış yapılırken bir hata oluştu')
      }
    } catch (err) {
      setError('Çıkış yapılırken bir hata oluştu')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0077BE] mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Kullanıcı bilgileri yüklenemedi</p>
          <button
            onClick={() => navigate('/anasayfa')}
            className="mt-4 px-4 py-2 bg-[#0077BE] text-white rounded-md hover:bg-[#005a94]"
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Profilim</h1>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md text-green-700">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Fotoğraf */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profil Fotoğrafı
              </label>
              <div className="flex items-center gap-4">
                {photoPreview && !removePhoto && (
                  <div className="relative">
                    <img
                      src={photoPreview.startsWith('data:') ? photoPreview : `/api${photoPreview}`}
                      alt="Profil fotoğrafı"
                      className="w-24 h-24 rounded-full object-cover border-2 border-gray-300"
                      onError={(e) => {
                        // Fotoğraf yüklenemezse fallback göster
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          const fallback = document.createElement('div');
                          fallback.className = 'w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300';
                          fallback.innerHTML = `<span class="text-gray-500 text-sm font-semibold">${user.firstName?.charAt(0).toUpperCase() || ''}${user.lastName?.charAt(0).toUpperCase() || ''}</span>`;
                          parent.appendChild(fallback);
                        }
                      }}
                    />
                  </div>
                )}
                {(!photoPreview || removePhoto) && (
                  <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                    <span className="text-gray-400 text-sm">Fotoğraf Yok</span>
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    disabled={removePhoto}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#0077BE] file:text-white hover:file:bg-[#005a94] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <p className="mt-1 text-xs text-gray-500">Maksimum 5MB, JPG, PNG veya GIF</p>
                  {photoPreview && !removePhoto && (
                    <button
                      type="button"
                      onClick={() => {
                        setRemovePhoto(true)
                        setPhoto(null)
                        setPhotoPreview(null)
                      }}
                      className="mt-2 px-3 py-1.5 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                    >
                      Fotoğrafı Kaldır
                    </button>
                  )}
                  {removePhoto && (
                    <button
                      type="button"
                      onClick={() => {
                        setRemovePhoto(false)
                        if (user.photo) {
                          setPhotoPreview(user.photo)
                        }
                      }}
                      className="mt-2 px-3 py-1.5 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                    >
                      İptal Et
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Ad */}
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                Ad
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0077BE] focus:border-transparent"
              />
            </div>

            {/* Soyad */}
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                Soyad
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0077BE] focus:border-transparent"
              />
            </div>

            {/* E-posta (Sadece görüntüleme) */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                E-posta
              </label>
              <input
                type="email"
                id="email"
                value={user.email}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-gray-500">E-posta adresi değiştirilemez</p>
            </div>

            {/* Telefon */}
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                Telefon Numarası
              </label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0077BE] focus:border-transparent"
              />
            </div>

            {/* Şifre */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Yeni Şifre (Değiştirmek istemiyorsanız boş bırakın)
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                minLength={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0077BE] focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500">Minimum 6 karakter</p>
            </div>

            {/* Rol Bilgisi */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rol
              </label>
              <input
                type="text"
                value={
                  user.roleType === 'student' ? 'Öğrenci' :
                  user.roleType === 'personnel' ? 'Personel' :
                  user.roleType === 'admin' ? 'Yönetici' : user.roleType || ''
                }
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed"
              />
            </div>

            {/* Butonlar */}
            <div className="flex flex-col gap-4 pt-4">
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 px-6 py-2.5 bg-[#0077BE] text-white border-none rounded-md text-base font-medium cursor-pointer transition-colors duration-300 hover:bg-[#005a94] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? 'Güncelleniyor...' : 'Profili Güncelle'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/anasayfa')}
                  className="px-6 py-2.5 bg-gray-300 text-gray-700 border-none rounded-md text-base font-medium cursor-pointer transition-colors duration-300 hover:bg-gray-400"
                >
                  İptal
                </button>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full px-6 py-2.5 bg-red-600 text-white border-none rounded-md text-base font-medium cursor-pointer transition-colors duration-300 hover:bg-red-700"
              >
                Çıkış Yap
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Profile

