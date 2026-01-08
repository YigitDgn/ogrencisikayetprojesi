import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const API_URL = '/api'

interface ComplaintResponse {
  responseId: number
  complaintId: number
  respondedByPersonnelId?: number | null
  respondedByUserId?: number | null
  personnelResponse?: string | null
  studentResponse?: string | null
  createdAt: string
  updatedAt: string
  respondedByPersonnel?: {
    user?: {
      firstName: string
      lastName: string
    }
  }
  respondedByUser?: {
    firstName: string
    lastName: string
  }
}

interface Complaint {
  complaintId: number
  title: string
  description: string
  status: string
  responses?: ComplaintResponse[]
  createdAt: string
  resolvedAt?: string | null
  complaintType?: {
    complaintTypeId: number
    typeName: string
  }
  course?: {
    courseId: number
    courseName: string
    courseCode: string
  }
  handledByPersonnel?: {
    user?: {
      firstName: string
      lastName: string
    }
  }
  completedByPersonnelId?: number | null
  uniqueCode?: string
  isAnonymous?: boolean
  isPublic?: boolean
}

interface ComplaintType {
  complaintTypeId: number
  typeName: string
  requiresCourse: boolean
}

interface Course {
  courseId: number
  courseName: string
  courseCode: string
}

function Sikayet() {
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Filtreleme ve arama
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [sortBy, setSortBy] = useState<string>('createdAt')
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC')

  // Modal durumları
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null)
  const [selectedResponseId, setSelectedResponseId] = useState<number | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showResponseModal, setShowResponseModal] = useState(false)

  // Düzenleme formu
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    complaintTypeId: '',
    courseId: '',
    isPublic: false,
    isAnonymous: false,
  })
  const [complaintTypes, setComplaintTypes] = useState<ComplaintType[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [submitting, setSubmitting] = useState(false)

  // Öğrenci yanıtı
  const [studentResponseText, setStudentResponseText] = useState('')

  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          credentials: 'include',
        })
        if (response.ok) {
          const userData = await response.json()
          setUser(userData)
          if (userData.roleType === 'student' && userData.userId) {
            loadComplaintTypes()
            loadCourses()
            loadComplaints(userData.userId)
          } else {
            navigate('/anasayfa')
          }
        } else {
          navigate('/login')
        }
      } catch (error) {
        navigate('/login')
      }
    }
    loadUser()
  }, [navigate])

  useEffect(() => {
    if (user?.userId) {
      loadComplaints(user.userId)
    }
  }, [page, statusFilter, searchTerm, sortBy, sortOrder])

  const loadComplaintTypes = async () => {
    try {
      const response = await fetch(`${API_URL}/complaint/types`, {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        setComplaintTypes(data)
      }
    } catch (err) {
      // Hata durumunda sessizce devam et
    }
  }

  const loadCourses = async () => {
    try {
      const response = await fetch(`${API_URL}/complaint/courses`, {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        setCourses(data)
      }
    } catch (err) {
      // Hata durumunda sessizce devam et
    }
  }

  const loadComplaints = async (userId: number) => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder,
      })
      if (statusFilter) params.append('status', statusFilter)
      if (searchTerm) params.append('search', searchTerm)

      const response = await fetch(`${API_URL}/complaint/student/${userId}?${params}`, {
        credentials: 'include',
      })
      if (!response.ok) throw new Error('Şikayetler yüklenemedi')
      const data = await response.json()
      setComplaints(data.data || data)
      setTotal(data.total || data.length)
      setTotalPages(data.totalPages || Math.ceil((data.total || data.length) / limit))
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
        credentials: 'include',
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
      setTimeout(() => setSuccess(''), 3000)
      if (user.userId) {
        loadComplaints(user.userId)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Şikayet silinirken hata oluştu')
    }
  }

  const handleEditClick = (complaint: Complaint) => {
    if (complaint.status !== 'beklemede') {
      setError('Sadece beklemede durumundaki şikayetler düzenlenebilir')
      return
    }
    setSelectedComplaint(complaint)
    setEditFormData({
      title: complaint.title,
      description: complaint.description,
      complaintTypeId: complaint.complaintType?.complaintTypeId?.toString() || '',
      courseId: complaint.course?.courseId?.toString() || '',
      isPublic: complaint.isPublic || false,
      isAnonymous: complaint.isAnonymous || false,
    })
    setShowEditModal(true)
    setError('')
  }

  const handleUpdateComplaint = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedComplaint || !user) return

    setSubmitting(true)
    setError('')

    try {
      const selectedType = complaintTypes.find(
        (t) => t.complaintTypeId === Number(editFormData.complaintTypeId)
      )

      if (selectedType?.requiresCourse && !editFormData.courseId) {
        setError('Bu şikayet tipi için ders seçimi zorunludur')
        setSubmitting(false)
        return
      }

      const response = await fetch(`${API_URL}/complaint/${selectedComplaint.complaintId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...editFormData,
          userId: user.userId,
          complaintTypeId: Number(editFormData.complaintTypeId),
          courseId: editFormData.courseId ? Number(editFormData.courseId) : undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Şikayet güncellenemedi')
      }

      setSuccess('Şikayet başarıyla güncellendi')
      setShowEditModal(false)
      setSelectedComplaint(null)
      setTimeout(() => setSuccess(''), 3000)
      if (user.userId) {
        loadComplaints(user.userId)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Şikayet güncellenirken hata oluştu')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddStudentResponse = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedComplaint || !selectedResponseId || !user || !studentResponseText.trim()) return

    setSubmitting(true)
    setError('')

    try {
      const response = await fetch(`${API_URL}/complaint/${selectedComplaint.complaintId}/student-response`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          response: studentResponseText,
          userId: user.userId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Yanıt eklenemedi')
      }

      setSuccess('Yanıtınız başarıyla eklendi')
      setShowResponseModal(false)
      setStudentResponseText('')
      setSelectedComplaint(null)
      setTimeout(() => setSuccess(''), 3000)
      if (user.userId) {
        loadComplaints(user.userId)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Yanıt eklenirken hata oluştu')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'beklemede':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'cevaplandı':
      case 'çözüldü':
      case 'resolved':
        return 'bg-green-100 text-green-800'
      case 'reddedildi':
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'tamamlandı':
      case 'completed':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'beklemede':
        return 'Beklemede'
      case 'cevaplandı':
        return 'Cevaplandı'
      case 'çözüldü':
        return 'Çözüldü'
      case 'reddedildi':
        return 'Reddedildi'
      case 'tamamlandı':
        return 'Tamamlandı'
      default:
        return status
    }
  }

  const selectedComplaintType = complaintTypes.find(
    (t) => t.complaintTypeId === Number(editFormData.complaintTypeId)
  )

  if (!user) {
    return (
      <div className="flex-1 flex flex-col px-12 py-8 bg-gradient-to-b from-[#0077BE] to-[#00427F] min-h-screen">
        <div className="max-w-6xl mx-auto w-full">
          <div className="text-center py-8">
            <p className="text-white text-lg">Yükleniyor...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col px-12 py-8 bg-gradient-to-b from-[#0077BE] to-[#00427F] min-h-screen">
      <div className="max-w-6xl mx-auto w-full">
        <div className="text-center mb-8">
          <h2 className="text-white text-4xl font-semibold mb-4">
            Şikayetlerim
          </h2>
          <p className="text-white text-lg leading-relaxed max-w-[600px] mx-auto">
            Şikayetlerinizi buradan görüntüleyebilir ve yeni şikayet oluşturabilirsiniz.
          </p>
        </div>

        <div className="space-y-6">
          {/* Şikayet Ekle Butonu */}
          <div className="flex justify-center">
            <Link
              to="/sikayet-olustur"
              className="px-6 py-3 bg-white text-[#0077BE] rounded-lg hover:bg-gray-100 transition-colors font-semibold text-lg cursor-pointer no-underline inline-block"
            >
              + Yeni Şikayet Oluştur
            </Link>
          </div>

          {/* Filtreleme ve Arama */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ara</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setPage(1)
                  }}
                  placeholder="Başlık veya açıklama ara..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0077BE]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Durum</label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value)
                    setPage(1)
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0077BE] bg-white"
                >
                  <option value="">Tümü</option>
                  <option value="beklemede">Beklemede</option>
                  <option value="cevaplandı">Cevaplandı</option>
                  <option value="reddedildi">Reddedildi</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sırala</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0077BE] bg-white"
                >
                  <option value="createdAt">Tarih</option>
                  <option value="title">Başlık</option>
                  <option value="status">Durum</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sıra</label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as 'ASC' | 'DESC')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0077BE] bg-white"
                >
                  <option value="DESC">Azalan</option>
                  <option value="ASC">Artan</option>
                </select>
              </div>
            </div>
          </div>

          {/* Şikayet Listesi */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">Şikayetlerim</h3>
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
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Yükleniyor...</p>
              </div>
            ) : complaints.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Henüz şikayetiniz bulunmamaktadır</p>
            ) : (
              <>
                <div className="space-y-4">
                  {complaints.map((complaint) => (
                    <div
                      key={complaint.complaintId}
                      className="border border-gray-300 rounded-lg p-4 hover:shadow-md transition-shadow relative"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 
                          className="text-lg font-semibold text-gray-800 flex-1 pr-2 cursor-pointer hover:text-[#0077BE]"
                          onClick={() => {
                            setSelectedComplaint(complaint)
                            setShowDetailModal(true)
                          }}
                        >
                          {complaint.title}
                        </h4>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                              complaint.status
                            )}`}
                          >
                            {getStatusText(complaint.status)}
                          </span>
                          {complaint.status === 'beklemede' && (
                            <button
                              onClick={() => handleEditClick(complaint)}
                              className="px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm font-medium cursor-pointer"
                              title="Düzenle"
                            >
                              ✏️
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteComplaint(complaint.complaintId)}
                            className="px-3 py-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm font-medium flex items-center gap-1 cursor-pointer"
                            title="Şikayeti Sil"
                          >
                            <span>🗑️</span>
                            <span>Sil</span>
                          </button>
                        </div>
                      </div>
                      <p className="text-gray-600 mb-3 line-clamp-2">{complaint.description}</p>
                      
                      {/* Cevap göster */}
                      {complaint.responses && complaint.responses.length > 0 && (
                        <>
                          {complaint.responses
                            .filter((r) => r.personnelResponse)
                            .map((response, idx, arr) => {
                              const isLastResponse = idx === arr.length - 1
                              return (
                                <div key={response.responseId} className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                  <p className="text-sm font-semibold text-[#0077BE] mb-2">
                                    {response.respondedByPersonnel?.user
                                      ? `${response.respondedByPersonnel.user.firstName} ${response.respondedByPersonnel.user.lastName}`
                                      : response.respondedByUser
                                      ? `${response.respondedByUser.firstName} ${response.respondedByUser.lastName}`
                                      : complaint.handledByPersonnel?.user
                                      ? `${complaint.handledByPersonnel.user.firstName} ${complaint.handledByPersonnel.user.lastName}`
                                      : 'Personel'} Cevabı:
                                  </p>
                                  <p className="text-gray-700 whitespace-pre-wrap">{response.personnelResponse}</p>
                                  {response.createdAt && (
                                    <p className="text-xs text-gray-500 mt-2">
                                      Cevaplanma Tarihi: {new Date(response.createdAt).toLocaleDateString('tr-TR', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </p>
                                  )}
                                  {complaint.status === 'cevaplandı' && !response.studentResponse && isLastResponse && !complaint.completedByPersonnelId && (
                                    <button
                                      onClick={() => {
                                        setSelectedComplaint(complaint)
                                        setSelectedResponseId(response.responseId)
                                        setShowResponseModal(true)
                                      }}
                                      className="mt-3 px-4 py-2 bg-[#0077BE] text-white rounded-md hover:bg-[#005a94] transition-colors text-sm font-medium cursor-pointer"
                                    >
                                      Yanıt Ver
                                    </button>
                                  )}
                                  {complaint.completedByPersonnelId && (
                                    <p className="mt-2 text-sm text-purple-600 font-medium">
                                      Bu şikayet bitirilmiş, yanıt verilemez.
                                    </p>
                                  )}
                                  {response.studentResponse && (
                                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                                      <p className="text-sm font-semibold text-green-700 mb-2">Yanıtınız:</p>
                                      <p className="text-gray-700 whitespace-pre-wrap">{response.studentResponse}</p>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                        </>
                      )}
                      
                      <div className="flex gap-4 text-sm text-gray-500 mt-3">
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

                {/* Sayfalama */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-6">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Önceki
                    </button>
                    <span className="text-gray-700">
                      Sayfa {page} / {totalPages} (Toplam: {total})
                    </span>
                    <button
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Sonraki
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Detay Modal */}
      {showDetailModal && selectedComplaint && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold text-gray-800">{selectedComplaint.title}</h2>
                <button
                  onClick={() => {
                    setShowDetailModal(false)
                    setSelectedComplaint(null)
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl cursor-pointer"
                >
                  ×
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">Açıklama:</p>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedComplaint.description}</p>
                </div>
                <div className="flex gap-4 text-sm">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedComplaint.status)}`}>
                    {getStatusText(selectedComplaint.status)}
                  </span>
                  {selectedComplaint.complaintType && (
                    <span className="text-gray-600">Tip: {selectedComplaint.complaintType.typeName}</span>
                  )}
                  {selectedComplaint.course && (
                    <span className="text-gray-600">
                      Ders: {selectedComplaint.course.courseCode} - {selectedComplaint.course.courseName}
                    </span>
                  )}
                </div>
                {selectedComplaint.responses && selectedComplaint.responses.length > 0 && (
                  <>
                    {selectedComplaint.responses
                      .filter((r) => r.personnelResponse)
                      .map((response) => (
                        <div key={response.responseId} className="space-y-3">
                          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm font-semibold text-[#0077BE] mb-2">
                              {response.respondedByPersonnel?.user
                                ? `${response.respondedByPersonnel.user.firstName} ${response.respondedByPersonnel.user.lastName}`
                                : response.respondedByUser
                                ? `${response.respondedByUser.firstName} ${response.respondedByUser.lastName}`
                                : selectedComplaint.handledByPersonnel?.user
                                ? `${selectedComplaint.handledByPersonnel.user.firstName} ${selectedComplaint.handledByPersonnel.user.lastName}`
                                : 'Personel'} Cevabı:
                            </p>
                            <p className="text-gray-700 whitespace-pre-wrap">{response.personnelResponse}</p>
                          </div>
                          {response.studentResponse && (
                            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                              <p className="text-sm font-semibold text-green-700 mb-2">Yanıtınız:</p>
                              <p className="text-gray-700 whitespace-pre-wrap">{response.studentResponse}</p>
                            </div>
                          )}
                        </div>
                      ))}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Düzenleme Modal */}
      {showEditModal && selectedComplaint && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">Şikayeti Düzenle</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false)
                    setSelectedComplaint(null)
                    setError('')
                  }}
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

              <form onSubmit={handleUpdateComplaint} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Başlık <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editFormData.title}
                    onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0077BE]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Açıklama <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    required
                    rows={5}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0077BE]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Şikayet Tipi <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editFormData.complaintTypeId}
                    onChange={(e) => {
                      setEditFormData({
                        ...editFormData,
                        complaintTypeId: e.target.value,
                        courseId: '',
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
                      value={editFormData.courseId}
                      onChange={(e) => setEditFormData({ ...editFormData, courseId: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0077BE] bg-white"
                    >
                      <option value="">Ders seçin</option>
                      {courses.map((course) => (
                        <option key={course.courseId} value={course.courseId}>
                          {course.courseCode} - {course.courseName}
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
                      value={editFormData.courseId}
                      onChange={(e) => setEditFormData({ ...editFormData, courseId: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0077BE] bg-white"
                    >
                      <option value="">Ders seçin (opsiyonel)</option>
                      {courses.map((course) => (
                        <option key={course.courseId} value={course.courseId}>
                          {course.courseCode} - {course.courseName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editFormData.isPublic}
                      onChange={(e) => setEditFormData({ ...editFormData, isPublic: e.target.checked })}
                      className="mr-2 cursor-pointer"
                    />
                    <span className="text-sm text-gray-700">Herkese açık</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editFormData.isAnonymous}
                      onChange={(e) => setEditFormData({ ...editFormData, isAnonymous: e.target.checked })}
                      className="mr-2 cursor-pointer"
                    />
                    <span className="text-sm text-gray-700">İsimsiz</span>
                  </label>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-6 py-3 bg-[#0077BE] text-white rounded-md hover:bg-[#005a94] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium cursor-pointer"
                  >
                    {submitting ? 'Güncelleniyor...' : 'Güncelle'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false)
                      setSelectedComplaint(null)
                      setError('')
                    }}
                    className="flex-1 px-6 py-3 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors font-medium cursor-pointer"
                  >
                    İptal
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Öğrenci Yanıt Modal */}
      {showResponseModal && selectedComplaint && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">Yanıt Ver</h2>
                <button
                  onClick={() => {
                    setShowResponseModal(false)
                    setSelectedComplaint(null)
                    setStudentResponseText('')
                    setError('')
                  }}
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

              <form onSubmit={handleAddStudentResponse} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Yanıtınız <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={studentResponseText}
                    onChange={(e) => setStudentResponseText(e.target.value)}
                    required
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0077BE]"
                    placeholder="Personel cevabına yanıtınızı yazın..."
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={submitting || !studentResponseText.trim()}
                    className="flex-1 px-6 py-3 bg-[#0077BE] text-white rounded-md hover:bg-[#005a94] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium cursor-pointer"
                  >
                    {submitting ? 'Gönderiliyor...' : 'Gönder'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowResponseModal(false)
                      setSelectedComplaint(null)
                      setStudentResponseText('')
                      setError('')
                    }}
                    className="flex-1 px-6 py-3 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors font-medium cursor-pointer"
                  >
                    İptal
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Sikayet
