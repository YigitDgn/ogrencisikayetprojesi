import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const API_URL = 'http://localhost:3000'

function AddUser() {
  const navigate = useNavigate()
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    roleType: 'student',
    phoneNumber: '',
  })
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [addingUser, setAddingUser] = useState(false)
  const [error, setError] = useState('')

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

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddingUser(true)
    setError('')

    try {
      // Kullanıcı bilgisini al
      const userStr = localStorage.getItem('user')
      if (!userStr) {
        throw new Error('Oturum bulunamadı. Lütfen tekrar giriş yapın.')
      }
      const user = JSON.parse(userStr)

      // FormData oluştur
      const formData = new FormData()
      formData.append('username', newUser.username)
      formData.append('email', newUser.email)
      formData.append('password', newUser.password)
      formData.append('roleType', newUser.roleType)
      formData.append('userId', user.userId.toString())
      // Admin guard için user'ın roleType'ını ekle (FormData'da ayrı bir alan olarak)
      formData.append('userRoleType', user.roleType)
      if (newUser.phoneNumber) {
        formData.append('phoneNumber', newUser.phoneNumber)
      }
      if (photo) {
        formData.append('photo', photo)
      }

      const response = await fetch(`${API_URL}/admin/users`, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('Yetkisiz erişim. Lütfen tekrar giriş yapın.')
        }
        throw new Error(data.message || 'Kullanıcı oluşturulamadı')
      }

      // Başarılı - admin paneline geri dön
      navigate('/admin')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kullanıcı oluşturulurken hata oluştu')
    } finally {
      setAddingUser(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col px-12 py-8 bg-gradient-to-b from-[#0077BE] to-[#00427F] min-h-screen">
      <div className="max-w-2xl mx-auto w-full">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-semibold text-gray-800">Yeni Kullanıcı Ekle</h1>
            <button
              onClick={() => navigate('/admin')}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              ✕ Kapat
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleAddUser} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kullanıcı Adı <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0077BE] text-base"
                placeholder="Kullanıcı adını girin"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                E-posta <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0077BE] text-base"
                placeholder="E-posta adresini girin"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Şifre <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                required
                minLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0077BE] text-base"
                placeholder="En az 6 karakter"
              />
              <p className="mt-1 text-sm text-gray-500">Şifre en az 6 karakter olmalıdır</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rol <span className="text-red-500">*</span>
              </label>
              <select
                value={newUser.roleType}
                onChange={(e) => setNewUser({ ...newUser, roleType: e.target.value })}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0077BE] text-base bg-white"
              >
                <option value="student">Öğrenci</option>
                <option value="admin">Yönetici</option>
                <option value="personnel">Personel</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefon
              </label>
              <input
                type="tel"
                value={newUser.phoneNumber}
                onChange={(e) => setNewUser({ ...newUser, phoneNumber: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0077BE] text-base"
                placeholder="Telefon numarası (opsiyonel)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fotoğraf
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0077BE] text-base"
              />
              {photoPreview && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">Önizleme:</p>
                  <img
                    src={photoPreview}
                    alt="Fotoğraf önizleme"
                    className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                  />
                </div>
              )}
              <p className="mt-1 text-sm text-gray-500">Maksimum dosya boyutu: 5MB</p>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={addingUser}
                className="flex-1 px-6 py-3 bg-[#0077BE] text-white rounded-md hover:bg-[#005a94] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-base"
              >
                {addingUser ? 'Ekleniyor...' : 'Kullanıcı Ekle'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin')}
                className="flex-1 px-6 py-3 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors font-medium text-base"
              >
                İptal
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AddUser

