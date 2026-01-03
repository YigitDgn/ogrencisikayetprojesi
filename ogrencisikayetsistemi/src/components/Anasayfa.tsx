import { useState, useEffect } from 'react'

const API_URL = 'http://localhost:3000'

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

interface Complaint {
  complaintId: number
  title: string
  description: string
  status: string
  createdAt: string
  complaintType?: {
    typeName: string
  }
  course?: {
    courseName: string
    courseCode: string
  }
  student?: {
    user?: {
      username: string
    }
  }
  isAnonymous?: boolean
}

function Anasayfa() {
  const [user, setUser] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [complaintTypes, setComplaintTypes] = useState<ComplaintType[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [publicComplaints, setPublicComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingPublic, setLoadingPublic] = useState(false)
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
    // Kullanıcı bilgisini localStorage'dan al
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const userData = JSON.parse(userStr)
      setUser(userData)
      if (userData.roleType === 'student' && userData.userId) {
        loadComplaints(userData.userId)
      }
    } else {
      // Giriş yapılmamışsa herkese açık şikayetleri yükle
      loadPublicComplaints()
    }
  }, [])

  useEffect(() => {
    if (showForm) {
      loadComplaintTypes()
      loadCourses()
    }
  }, [showForm])

  const loadComplaintTypes = async () => {
    try {
      const response = await fetch(`${API_URL}/complaint/types`)
      if (!response.ok) throw new Error('Şikayet tipleri yüklenemedi')
      const data = await response.json()
      setComplaintTypes(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
    }
  }

  const loadCourses = async () => {
    try {
      const response = await fetch(`${API_URL}/complaint/courses`)
      if (!response.ok) throw new Error('Dersler yüklenemedi')
      const data = await response.json()
      setCourses(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
    }
  }

  const loadComplaints = async (userId: number) => {
    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/complaint/student/${userId}`)
      if (!response.ok) throw new Error('Şikayetler yüklenemedi')
      const data = await response.json()
      setComplaints(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteComplaint = async (complaintId: number) => {
    if (!user || user.roleType !== 'student') {
      setError('Sadece öğrenciler şikayet silebilir')
      return
    }

    if (!confirm('Bu şikayeti silmek istediğinize emin misiniz?')) {
      return
    }

    try {
      const response = await fetch(`${API_URL}/complaint/${complaintId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.userId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Şikayet silinemedi')
      }

      setSuccess('Şikayet başarıyla silindi')
      // Başarı mesajını 3 saniye sonra temizle
      setTimeout(() => setSuccess(''), 3000)
      // Şikayet listesini yenile
      if (user.userId) {
        loadComplaints(user.userId)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Şikayet silinirken hata oluştu')
    }
  }

  const loadPublicComplaints = async () => {
    setLoadingPublic(true)
    try {
      const response = await fetch(`${API_URL}/complaint/public`)
      if (!response.ok) throw new Error('Herkese açık şikayetler yüklenemedi')
      const data = await response.json()
      setPublicComplaints(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
    } finally {
      setLoadingPublic(false)
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          userId: user.userId,
          complaintTypeId: Number(formData.complaintTypeId),
          courseId: formData.courseId ? Number(formData.courseId) : undefined,
        }),
      })

      const data = await response.json()

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
      setShowForm(false)
      loadComplaints(user.userId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Şikayet oluşturulurken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'beklemede':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'çözüldü':
      case 'resolved':
        return 'bg-green-100 text-green-800'
      case 'reddedildi':
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const selectedComplaintType = complaintTypes.find(
    (t) => t.complaintTypeId === Number(formData.complaintTypeId)
  )

  return (
    <div className="flex-1 flex flex-col px-12 py-8 bg-gradient-to-b from-[#0077BE] to-[#00427F] min-h-screen">
      <div className="max-w-6xl mx-auto w-full">
        <div className="text-center mb-8">
          <h2 className="text-white text-4xl font-semibold mb-4">
            Öğrenci Şikayet Sistemine Hoşgeldiniz
          </h2>
          <p className="text-white text-lg leading-relaxed max-w-[600px] mx-auto">
            Üniversite ile alakalı herhangi bir şikayetiniz varsa buradan bize iletebilirsiniz.
            Sisteme kaydolarak şikayetlerinizi ve cevaplarını görebilirsiniz.
          </p>
        </div>

        {user && user.roleType === 'student' ? (
          <div className="space-y-6">
            {/* Şikayet Ekle Butonu */}
            {!showForm && (
              <div className="flex justify-center">
                <button
                  onClick={() => setShowForm(true)}
                  className="px-6 py-3 bg-white text-[#0077BE] rounded-lg hover:bg-gray-100 transition-colors font-semibold text-lg"
                >
                  + Yeni Şikayet Oluştur
                </button>
              </div>
            )}

            {/* Şikayet Formu */}
            {showForm && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-semibold text-gray-800">Yeni Şikayet</h3>
                  <button
                    onClick={() => {
                      setShowForm(false)
                      setError('')
                      setSuccess('')
                    }}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
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
                        className="mr-2"
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
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">İsimsiz</span>
                    </label>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 px-6 py-3 bg-[#0077BE] text-white rounded-md hover:bg-[#005a94] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {loading ? 'Gönderiliyor...' : 'Şikayet Oluştur'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false)
                        setError('')
                        setSuccess('')
                      }}
                      className="flex-1 px-6 py-3 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors font-medium"
                    >
                      İptal
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Şikayet Listesi */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-2xl font-semibold text-gray-800 mb-4">Şikayetlerim</h3>
              {success && (
                <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-md">
                  {success}
                </div>
              )}
              {error && !showForm && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
                  {error}
                </div>
              )}
              {loading && !showForm ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">Yükleniyor...</p>
                </div>
              ) : complaints.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Henüz şikayetiniz bulunmamaktadır</p>
              ) : (
                <div className="space-y-4">
                  {complaints.map((complaint) => (
                    <div
                      key={complaint.complaintId}
                      className="border border-gray-300 rounded-lg p-4 hover:shadow-md transition-shadow relative"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-lg font-semibold text-gray-800 flex-1 pr-2">
                          {complaint.title}
                        </h4>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                              complaint.status
                            )}`}
                          >
                            {complaint.status}
                          </span>
                          <button
                            onClick={() => handleDeleteComplaint(complaint.complaintId)}
                            className="px-3 py-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm font-medium flex items-center gap-1"
                            title="Şikayeti Sil"
                          >
                            <span>🗑️</span>
                            <span>Sil</span>
                          </button>
                        </div>
                      </div>
                      <p className="text-gray-600 mb-3">{complaint.description}</p>
                      <div className="flex gap-4 text-sm text-gray-500">
                        {complaint.complaintType && (
                          <span>Tip: {complaint.complaintType.typeName}</span>
                        )}
                        {complaint.course && (
                          <span>
                            Ders: {complaint.course.courseCode} - {complaint.course.courseName}
                          </span>
                        )}
                        <span>
                          Tarih: {new Date(complaint.createdAt).toLocaleDateString('tr-TR')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Giriş Yap Bölümü */}
            <div className="bg-white rounded-lg shadow-lg p-6 text-center">
              <p className="text-gray-600 text-lg mb-4">
                Şikayet oluşturmak için lütfen öğrenci hesabı ile giriş yapın.
              </p>
              <a
                href="/login"
                className="inline-block px-6 py-3 bg-[#0077BE] text-white rounded-lg hover:bg-[#005a94] transition-colors font-semibold"
              >
                Giriş Yap
              </a>
            </div>

            {/* Herkese Açık Şikayetler */}
            <div className="p-6">
              <h3 className="text-2xl font-semibold text-white mb-4">
                En Son 3 Şikayet
              </h3>
              {loadingPublic ? (
                // Instagram tarzı skeleton loading - Grid layout
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="border border-white/20 rounded-xl p-5 animate-pulse bg-white/90 backdrop-blur-md"
                    >
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 rounded-full bg-gray-300 mr-3 flex-shrink-0"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-300 rounded w-28 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-24"></div>
                        </div>
                      </div>
                      <div className="space-y-2 mb-4">
                        <div className="h-5 bg-gray-300 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-300 rounded w-full"></div>
                        <div className="h-4 bg-gray-300 rounded w-5/6"></div>
                      </div>
                      <div className="pt-4 border-t border-gray-200/50">
                        <div className="h-6 bg-gray-200 rounded-full w-20 mb-3"></div>
                        <div className="space-y-2">
                          <div className="h-3 bg-gray-200 rounded w-24"></div>
                          <div className="h-3 bg-gray-200 rounded w-20"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Yüklenince: Şikayetler + eksik slotlar skeleton
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Mevcut şikayetleri göster */}
                  {publicComplaints.map((complaint) => (
                    <div
                      key={complaint.complaintId}
                      className="group relative border border-white/20 rounded-xl p-5 hover:border-white/40 hover:shadow-2xl hover:shadow-black/30 hover:-translate-y-1 transition-all duration-300 bg-white/90 backdrop-blur-md flex flex-col overflow-hidden"
                    >
                      {/* Gradient overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-br from-[#0077BE]/5 to-[#00427F]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      <div className="relative z-10">
                        <div className="flex items-center mb-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0077BE] to-[#00427F] flex items-center justify-center text-white font-bold text-lg mr-3 flex-shrink-0 shadow-lg">
                            {complaint.isAnonymous
                              ? '?'
                              : complaint.student?.user?.username?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 truncate text-sm">
                              {complaint.isAnonymous
                                ? 'İsimsiz Kullanıcı'
                                : complaint.student?.user?.username || 'Bilinmeyen Kullanıcı'}
                            </p>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <span>🕒</span>
                              {new Date(complaint.createdAt).toLocaleDateString('tr-TR', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </p>
                          </div>
                        </div>
                        
                        <h4 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-[#0077BE] transition-colors">
                          {complaint.title}
                        </h4>
                        
                        <p className="text-sm text-gray-700 mb-4 line-clamp-3 flex-grow leading-relaxed">
                          {complaint.description}
                        </p>
                        
                        <div className="mt-auto pt-4 border-t border-gray-200/50">
                          <div className="flex items-center justify-between mb-3">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${getStatusColor(
                                complaint.status
                              )}`}
                            >
                              {complaint.status}
                            </span>
                          </div>
                          <div className="flex flex-col gap-2 text-xs">
                            {complaint.complaintType && (
                              <div className="flex items-center gap-2 text-gray-600">
                                <span className="text-base">📋</span>
                                <span className="truncate font-medium">{complaint.complaintType.typeName}</span>
                              </div>
                            )}
                            {complaint.course && (
                              <div className="flex items-center gap-2 text-gray-600">
                                <span className="text-base">📚</span>
                                <span className="truncate font-medium">{complaint.course.courseCode}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Eksik slotları skeleton ile doldur */}
                  {Array.from({ length: Math.max(0, 3 - publicComplaints.length) }).map((_, i) => (
                    <div
                      key={`skeleton-${i}`}
                      className="border border-white/20 rounded-xl p-5 animate-pulse bg-white/90 backdrop-blur-md"
                    >
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 rounded-full bg-gray-300 mr-3 flex-shrink-0"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-300 rounded w-28 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-24"></div>
                        </div>
                      </div>
                      <div className="space-y-2 mb-4">
                        <div className="h-5 bg-gray-300 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-300 rounded w-full"></div>
                        <div className="h-4 bg-gray-300 rounded w-5/6"></div>
                      </div>
                      <div className="pt-4 border-t border-gray-200/50">
                        <div className="h-6 bg-gray-200 rounded-full w-20 mb-3"></div>
                        <div className="space-y-2">
                          <div className="h-3 bg-gray-200 rounded w-24"></div>
                          <div className="h-3 bg-gray-200 rounded w-20"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Anasayfa
