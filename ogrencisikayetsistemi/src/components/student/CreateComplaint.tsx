import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const API_URL = '/api'

interface ComplaintType {
  complaintTypeId: number
  typeName: string
  description: string
  requiresCourse: boolean
}

interface Course {
  courseId: number
  courseName: string
  courseCode: string
  department?: {
    departmentName: string
  }
}

function CreateComplaint() {
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [complaintTypes, setComplaintTypes] = useState<ComplaintType[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    complaintTypeId: '',
    courseId: '',
    isPublic: false,
    isAnonymous: false,
  })

  useEffect(() => {
    // Kullanıcı bilgisini backend'den al
    const loadUser = async () => {
      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          credentials: 'include',
        })
        if (response.ok) {
          const userData = await response.json()
          setUser(userData)
          if (userData.roleType !== 'student') {
            // Öğrenci değilse anasayfaya yönlendir
            navigate('/anasayfa')
          }
        } else {
          // Giriş yapılmamışsa login'e yönlendir
          navigate('/login')
        }
      } catch (error) {
        navigate('/login')
      }
    }
    loadUser()
    loadComplaintTypes()
    loadCourses()
  }, [navigate])

  const loadComplaintTypes = async () => {
    try {
      const response = await fetch(`${API_URL}/complaint/types`, {
        credentials: 'include',
      })
      if (!response.ok) throw new Error('Şikayet tipleri yüklenemedi')
      const data = await response.json()
      setComplaintTypes(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
    }
  }

  const loadCourses = async () => {
    try {
      const response = await fetch(`${API_URL}/complaint/courses`, {
        credentials: 'include',
      })
      if (!response.ok) throw new Error('Dersler yüklenemedi')
      const data = await response.json()
      setCourses(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (!user || user.roleType !== 'student') {
      setError('Sadece öğrenciler şikayet oluşturabilir')
      setLoading(false)
      return
    }

    try {
      const selectedType = complaintTypes.find(
        (t) => t.complaintTypeId === Number(formData.complaintTypeId)
      )

      if (selectedType?.requiresCourse && !formData.courseId) {
        setError('Bu şikayet tipi için ders seçimi zorunludur')
        setLoading(false)
        return
      }

      const response = await fetch(`${API_URL}/complaint`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          userId: user.userId,
          complaintTypeId: Number(formData.complaintTypeId),
          courseId: formData.courseId ? Number(formData.courseId) : undefined,
          isPublic: formData.isPublic === true, // Explicitly send boolean
          isAnonymous: formData.isAnonymous === true, // Explicitly send boolean
        }),
      })

      const text = await response.text()
      let data
      
      try {
        data = text ? JSON.parse(text) : {}
      } catch (parseError) {
        throw new Error('Sunucudan geçersiz yanıt alındı')
      }

      if (!response.ok) {
        throw new Error(data.message || 'Şikayet oluşturulamadı')
      }

      setSuccess('Şikayetiniz başarıyla oluşturuldu')
      setFormData({
        title: '',
        description: '',
        complaintTypeId: '',
        courseId: '',
        isPublic: false,
        isAnonymous: false,
      })
      
      // 2 saniye sonra şikayet sayfasına yönlendir
      setTimeout(() => {
        navigate('/sikayet')
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Şikayet oluşturulurken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const selectedComplaintType = complaintTypes.find(
    (t) => t.complaintTypeId === Number(formData.complaintTypeId)
  )

  if (!user) {
    return (
      <div className="flex-1 flex flex-col px-12 py-8 bg-gradient-to-b from-[#0077BE] to-[#00427F] min-h-screen">
        <div className="max-w-4xl mx-auto w-full">
          <div className="text-center py-8">
            <p className="text-white text-lg">Yükleniyor...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col px-12 py-8 bg-gradient-to-b from-[#0077BE] to-[#00427F] min-h-screen">
      <div className="max-w-4xl mx-auto w-full">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">Yeni Şikayet Oluştur</h2>
            <button
              onClick={() => navigate('/anasayfa')}
              className="text-gray-500 hover:text-gray-700 text-2xl cursor-pointer"
            >
              ×
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-md">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Başlık <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0077BE]"
                placeholder="Şikayet başlığını girin"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Açıklama <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={5}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0077BE]"
                placeholder="Şikayet detaylarını girin"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Şikayet Tipi <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.complaintTypeId}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    complaintTypeId: e.target.value,
                    courseId: '', // Tip değişince ders seçimini sıfırla
                  })
                }}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0077BE] bg-white"
              >
                <option value="">Şikayet tipini seçin</option>
                {complaintTypes.map((type) => (
                  <option key={type.complaintTypeId} value={type.complaintTypeId}>
                    {type.typeName}
                  </option>
                ))}
              </select>
            </div>

            {selectedComplaintType?.requiresCourse && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ders <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.courseId}
                  onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0077BE] bg-white"
                >
                  <option value="">Ders seçin</option>
                  {courses.map((course) => (
                    <option key={course.courseId} value={course.courseId}>
                      {course.courseCode} - {course.courseName}
                      {course.department && ` (${course.department.departmentName})`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {!selectedComplaintType?.requiresCourse && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ders (Opsiyonel)
                </label>
                <select
                  value={formData.courseId}
                  onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0077BE] bg-white"
                >
                  <option value="">Ders seçin (opsiyonel)</option>
                  {courses.map((course) => (
                    <option key={course.courseId} value={course.courseId}>
                      {course.courseCode} - {course.courseName}
                      {course.department && ` (${course.department.departmentName})`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isPublic}
                  onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                  className="mr-2 cursor-pointer"
                />
                <span className="text-sm text-gray-700">Herkese açık</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isAnonymous}
                  onChange={(e) =>
                    setFormData({ ...formData, isAnonymous: e.target.checked })
                  }
                  className="mr-2 cursor-pointer"
                />
                <span className="text-sm text-gray-700">İsimsiz</span>
              </label>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-[#0077BE] text-white rounded-md hover:bg-[#005a94] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium cursor-pointer"
              >
                {loading ? 'Gönderiliyor...' : 'Şikayet Oluştur'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/anasayfa')}
                className="flex-1 px-6 py-3 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors font-medium cursor-pointer"
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

export default CreateComplaint

