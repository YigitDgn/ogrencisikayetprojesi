import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

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
    typeName: string
  }
  course?: {
    courseName: string
    courseCode: string
  }
  student?: {
    user?: {
      firstName: string
      lastName: string
      photo?: string
    }
  }
  handledByPersonnel?: {
    user?: {
      firstName: string
      lastName: string
    }
  }
  isAnonymous?: boolean
}

function Anasayfa() {
  const navigate = useNavigate()
  const [publicComplaints, setPublicComplaints] = useState<Complaint[]>([])
  const [loadingPublic, setLoadingPublic] = useState(false)
  const [user, setUser] = useState<{ roleType?: string } | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<Complaint[]>([])
  const [loadingSearch, setLoadingSearch] = useState(false)
  const [allPublicComplaints, setAllPublicComplaints] = useState<Complaint[]>([])
  const [loadingAllPublic, setLoadingAllPublic] = useState(false)

  useEffect(() => {
    // Her zaman herkese açık şikayetleri yükle
    loadPublicComplaints()
    // Tüm herkese açık şikayetleri yükle
    loadAllPublicComplaints()
    // Kullanıcı bilgisini yükle
    loadUser()
  }, [])

  const loadUser = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        credentials: 'include',
      })
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      }
    } catch (err) {
      // Hata durumunda sessizce devam et
    }
  }

  const loadPublicComplaints = async () => {
    setLoadingPublic(true)
    try {
      const response = await fetch(`${API_URL}/complaint/public`, {
        credentials: 'include',
      })
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Public complaints fetch error:', response.status, errorText)
        throw new Error('Herkese açık şikayetler yüklenemedi')
      }
      const data = await response.json()
      console.log('Public complaints loaded:', data)
      setPublicComplaints(data || [])
    } catch (err) {
      console.error('Error loading public complaints:', err)
      setPublicComplaints([])
    } finally {
      setLoadingPublic(false)
    }
  }

  const loadAllPublicComplaints = async () => {
    setLoadingAllPublic(true)
    try {
      const params = new URLSearchParams({
        limit: '100', // Yeterince büyük bir limit
      })
      const response = await fetch(`${API_URL}/complaint/public?${params}`, {
        credentials: 'include',
      })
      if (!response.ok) {
        const errorText = await response.text()
        console.error('All public complaints fetch error:', response.status, errorText)
        throw new Error('Tüm herkese açık şikayetler yüklenemedi')
      }
      const data = await response.json()
      console.log('All public complaints loaded:', data)
      setAllPublicComplaints(data || [])
    } catch (err) {
      console.error('Error loading all public complaints:', err)
      setAllPublicComplaints([])
    } finally {
      setLoadingAllPublic(false)
    }
  }

  const searchPublicComplaints = async (search: string) => {
    if (!search.trim()) {
      setSearchResults([])
      return
    }

    setLoadingSearch(true)
    try {
      const params = new URLSearchParams({
        search: search.trim(),
        limit: '20',
      })
      const response = await fetch(`${API_URL}/complaint/public?${params}`, {
        credentials: 'include',
      })
      if (!response.ok) {
        throw new Error('Arama yapılamadı')
      }
      const data = await response.json()
      setSearchResults(data || [])
    } catch (err) {
      console.error('Error searching public complaints:', err)
      setSearchResults([])
    } finally {
      setLoadingSearch(false)
    }
  }

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    if (value.trim()) {
      searchPublicComplaints(value)
    } else {
      setSearchResults([])
      // Arama temizlendiğinde tüm şikayetleri yeniden yükle
      loadAllPublicComplaints()
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
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const renderComplaintListItem = (complaint: Complaint) => (
    <div
      key={complaint.complaintId}
      className="group border border-white/20 rounded-lg p-4 hover:border-white/40 hover:shadow-lg hover:shadow-black/20 transition-all duration-300 bg-white/90 backdrop-blur-md"
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {complaint.student?.user?.photo && !complaint.isAnonymous ? (
            <img
              src={`/api${complaint.student.user.photo}`}
              alt={`${complaint.student?.user?.firstName || ''} ${complaint.student?.user?.lastName || ''}`.trim() || 'Bilinmeyen Kullanıcı'}
              className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-md"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  const fallback = document.createElement('div');
                  fallback.className = 'w-10 h-10 rounded-full bg-gradient-to-br from-[#0077BE] to-[#00427F] flex items-center justify-center text-white font-bold text-sm border-2 border-white shadow-md';
                  fallback.innerHTML = `<span>${complaint.student?.user?.firstName?.charAt(0).toUpperCase() || '?'}</span>`;
                  parent.appendChild(fallback);
                }
              }}
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0077BE] to-[#00427F] flex items-center justify-center text-white font-bold text-sm shadow-md">
              {complaint.isAnonymous
                ? '?'
                : complaint.student?.user?.firstName?.charAt(0).toUpperCase() || '?'}
            </div>
          )}
        </div>

        {/* İçerik */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex-1 min-w-0">
              <h4 className="text-base font-bold text-gray-900 mb-1 group-hover:text-[#0077BE] transition-colors">
                {complaint.title}
              </h4>
              <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                <span className="flex items-center gap-1">
                  {complaint.isAnonymous
                    ? 'İsimsiz Kullanıcı'
                    : `${complaint.student?.user?.firstName || ''} ${complaint.student?.user?.lastName || ''}`.trim() || 'Bilinmeyen Kullanıcı'}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <span>🕒</span>
                  {new Date(complaint.createdAt).toLocaleDateString('tr-TR', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm flex-shrink-0 ${getStatusColor(
                complaint.status
              )}`}
            >
              {complaint.status}
            </span>
          </div>

          <p className="text-sm text-gray-700 mb-3 line-clamp-2 leading-relaxed">
            {complaint.description}
          </p>

          {/* Cevap göster */}
          {complaint.responses && complaint.responses.length > 0 && (
            <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs font-semibold text-[#0077BE] mb-1">
                {complaint.responses[0]?.respondedByPersonnel?.user
                  ? `${complaint.responses[0].respondedByPersonnel.user.firstName} ${complaint.responses[0].respondedByPersonnel.user.lastName}`
                  : complaint.responses[0]?.respondedByUser
                  ? `${complaint.responses[0].respondedByUser.firstName} ${complaint.responses[0].respondedByUser.lastName}`
                  : complaint.handledByPersonnel?.user
                  ? `${complaint.handledByPersonnel.user.firstName} ${complaint.handledByPersonnel.user.lastName}`
                  : 'Personel'} Cevabı:
              </p>
              <p className="text-xs text-gray-700 line-clamp-1">
                {complaint.responses.find((r) => r.personnelResponse)?.personnelResponse || ''}
              </p>
            </div>
          )}

          {/* Meta bilgiler */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-gray-600">
              {complaint.complaintType && (
                <div className="flex items-center gap-1">
                  <span>📋</span>
                  <span className="font-medium">{complaint.complaintType.typeName}</span>
                </div>
              )}
              {complaint.course && (
                <div className="flex items-center gap-1">
                  <span>📚</span>
                  <span className="font-medium">{complaint.course.courseCode}</span>
                </div>
              )}
            </div>
            <button
              onClick={() => navigate(`/public-sikayet/${complaint.complaintId}`)}
              className="px-4 py-2 text-sm bg-[#0077BE] text-white rounded-lg hover:bg-[#005a94] transition-colors font-medium cursor-pointer flex-shrink-0"
            >
              Detay
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderComplaintCard = (complaint: Complaint) => (
    <div
      className="group relative border border-white/20 rounded-xl p-5 hover:border-white/40 hover:shadow-2xl hover:shadow-black/30 hover:-translate-y-1 transition-all duration-300 bg-white/90 backdrop-blur-md flex flex-col overflow-hidden"
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0077BE]/5 to-[#00427F]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      <div className="relative z-10">
        <div className="flex items-center mb-4">
          {complaint.student?.user?.photo && !complaint.isAnonymous ? (
            <img
              src={`/api${complaint.student.user.photo}`}
              alt={`${complaint.student?.user?.firstName || ''} ${complaint.student?.user?.lastName || ''}`.trim() || 'Bilinmeyen Kullanıcı'}
              className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-lg mr-3 flex-shrink-0"
              onError={(e) => {
                // Fotoğraf yüklenemezse fallback göster
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  const fallback = document.createElement('div');
                  fallback.className = 'w-12 h-12 rounded-full bg-gradient-to-br from-[#0077BE] to-[#00427F] flex items-center justify-center text-white font-bold text-lg border-2 border-white shadow-lg mr-3 flex-shrink-0';
                  fallback.innerHTML = `<span>${complaint.student?.user?.firstName?.charAt(0).toUpperCase() || '?'}</span>`;
                  parent.appendChild(fallback);
                }
              }}
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0077BE] to-[#00427F] flex items-center justify-center text-white font-bold text-lg mr-3 flex-shrink-0 shadow-lg">
              {complaint.isAnonymous
                ? '?'
                : complaint.student?.user?.firstName?.charAt(0).toUpperCase() || '?'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 truncate text-sm">
              {complaint.isAnonymous
                ? 'İsimsiz Kullanıcı'
                : `${complaint.student?.user?.firstName || ''} ${complaint.student?.user?.lastName || ''}`.trim() || 'Bilinmeyen Kullanıcı'}
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
        
        {/* Cevap göster */}
        {complaint.responses && complaint.responses.length > 0 && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs font-semibold text-[#0077BE] mb-1">
              {complaint.responses[0]?.respondedByPersonnel?.user
                ? `${complaint.responses[0].respondedByPersonnel.user.firstName} ${complaint.responses[0].respondedByPersonnel.user.lastName}`
                : complaint.responses[0]?.respondedByUser
                ? `${complaint.responses[0].respondedByUser.firstName} ${complaint.responses[0].respondedByUser.lastName}`
                : complaint.handledByPersonnel?.user
                ? `${complaint.handledByPersonnel.user.firstName} ${complaint.handledByPersonnel.user.lastName}`
                : 'Personel'} Cevabı:
            </p>
            <p className="text-xs text-gray-700 line-clamp-2">
              {complaint.responses.find((r) => r.personnelResponse)?.personnelResponse || ''}
            </p>
          </div>
        )}
        
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
          <div className="flex flex-col gap-2 text-xs mb-3">
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
          <button
            onClick={() => navigate(`/public-sikayet/${complaint.complaintId}`)}
            className="w-full px-4 py-2 text-sm bg-[#0077BE] text-white rounded-lg hover:bg-[#005a94] transition-colors font-medium cursor-pointer"
          >
            Detay
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex-1 flex flex-col px-12 py-8 bg-gradient-to-b from-[#0077BE] to-[#00427F] min-h-screen">
      <div className="max-w-6xl mx-auto w-full">
        <div className="text-center mb-8">
          <h2 className="text-white text-4xl font-semibold mb-4">
            Öğrenci Şikayet Sistemine Hoşgeldiniz
          </h2>
          <p className="text-white text-lg leading-relaxed max-w-[600px] mx-auto mb-6">
            {user?.roleType === 'student' ? (
              <>
                Üniversite ile alakalı herhangi bir şikayetiniz varsa bize iletebilirsiniz.
                Şikayetlerinizi ve personel cevaplarını takip edebilir, gerekirse yanıt verebilirsiniz.
              </>
            ) : user?.roleType === 'personnel' ? (
              <>
                Öğrenci şikayetlerini görüntüleyebilir, cevaplayabilir ve yönetebilirsiniz.
                Bekleyen şikayetleri inceleyip öğrencilere destek sağlayabilirsiniz.
              </>
            ) : (
              <>
                Üniversite ile alakalı herhangi bir şikayetiniz varsa buradan bize iletebilirsiniz.
                Sisteme kaydolarak şikayetlerinizi ve cevaplarını görebilirsiniz.
              </>
            )}
          </p>
          {user?.roleType === 'student' && (
            <button
              onClick={() => navigate('/sikayet')}
              className="px-8 py-3 bg-white text-[#0077BE] border-none rounded-lg text-lg font-semibold cursor-pointer transition-all duration-300 hover:bg-gray-100 hover:shadow-xl hover:scale-105 transform"
            >
              Şikayetlerim
            </button>
          )}
        </div>

        <div className="space-y-6">
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
                  {publicComplaints.map((complaint) => renderComplaintCard(complaint))}
                  
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

          {/* Herkese Açık Şikayet Arama */}
          <div className="p-6 mt-8">
            <h3 className="text-2xl font-semibold text-white mb-4">
              Herkese Açık Şikayet Arama
            </h3>
            
            {/* Arama Input */}
            <div className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Şikayet başlığı veya açıklamasında ara..."
                  className="w-full px-4 py-3 pl-12 pr-4 rounded-lg border-2 border-white/30 bg-white/90 backdrop-blur-md text-gray-900 placeholder-gray-500 focus:outline-none focus:border-white focus:ring-2 focus:ring-white/50 transition-all duration-300"
                />
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-xl">
                  🔍
                </span>
                {searchTerm && (
                  <button
                    onClick={() => {
                      setSearchTerm('')
                      setSearchResults([])
                    }}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Arama Sonuçları */}
            {loadingSearch || loadingAllPublic ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="border border-white/20 rounded-lg p-4 animate-pulse bg-white/90 backdrop-blur-md"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-gray-300 flex-shrink-0"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-3 bg-gray-200 rounded w-full"></div>
                        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : searchTerm.trim() ? (
              searchResults.length > 0 ? (
                <div className="space-y-4">
                  {searchResults.map((complaint) => renderComplaintListItem(complaint))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white/90 backdrop-blur-md rounded-xl border border-white/20">
                  <p className="text-gray-600 text-lg">
                    "{searchTerm}" için sonuç bulunamadı.
                  </p>
                  <p className="text-gray-500 text-sm mt-2">
                    Farklı bir arama terimi deneyin.
                  </p>
                </div>
              )
            ) : (
              allPublicComplaints.length > 0 ? (
                <div className="space-y-4">
                  {allPublicComplaints.map((complaint) => renderComplaintListItem(complaint))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white/90 backdrop-blur-md rounded-xl border border-white/20">
                  <p className="text-gray-600 text-lg">
                    Henüz herkese açık şikayet bulunmamaktadır.
                  </p>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Anasayfa
