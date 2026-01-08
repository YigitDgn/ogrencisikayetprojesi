import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Complaint } from '../../types/Complaint'
import { getStatusColor, getStatusText } from '../../types/Complaint'
import PersonnelTabNavigation from './PersonnelTabNavigation'
import PersonnelFilters from './PersonnelFilters'
import Pagination from '../shared/Pagination'

const API_URL = '/api'

function PersonnelPanel() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'pending' | 'answered' | 'completed'>('pending')
  const [pendingComplaints, setPendingComplaints] = useState<Complaint[]>([])
  const [answeredComplaints, setAnsweredComplaints] = useState<Complaint[]>([])
  const [completedComplaints, setCompletedComplaints] = useState<Complaint[]>([])
  const [pendingTotal, setPendingTotal] = useState(0)
  const [pendingPage, setPendingPage] = useState(1)
  const [pendingTotalPages, setPendingTotalPages] = useState(0)
  const [answeredTotal, setAnsweredTotal] = useState(0)
  const [answeredPage, setAnsweredPage] = useState(1)
  const [answeredTotalPages, setAnsweredTotalPages] = useState(0)
  const [completedTotal, setCompletedTotal] = useState(0)
  const [completedPage, setCompletedPage] = useState(1)
  const [completedTotalPages, setCompletedTotalPages] = useState(0)
  const [limit] = useState(10)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Filtreleme ve arama
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<string>('createdAt')
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC')
  const [complaintTypeId, setComplaintTypeId] = useState<string>('')
  const [complaintTypes, setComplaintTypes] = useState<Array<{ complaintTypeId: number; typeName: string }>>([])

  useEffect(() => {
    // İlk yüklemede her iki tab'ın toplam sayılarını yükle
    loadComplaintTypes()
    loadTotals()
    loadComplaints()
  }, [])

  useEffect(() => {
    loadComplaints()
  }, [activeTab, pendingPage, answeredPage, completedPage, searchTerm, sortBy, sortOrder, complaintTypeId])

  const loadComplaintTypes = async () => {
    try {
      const response = await fetch(`${API_URL}/complaint/types`, {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        setComplaintTypes(data || [])
      }
    } catch (err) {
      // Hata durumunda sessizce devam et
    }
  }

  const loadTotals = async () => {
    try {
      // Pending toplam sayısı
      const pendingResponse = await fetch(`${API_URL}/complaint/personnel/pending?page=1&limit=1`, {
        credentials: 'include',
      })
      if (pendingResponse.ok) {
        const pendingData = await pendingResponse.json()
        setPendingTotal(pendingData.total || 0)
      }

      // Answered toplam sayısı
      const answeredResponse = await fetch(`${API_URL}/complaint/personnel/my-complaints?page=1&limit=1`, {
        credentials: 'include',
      })
      if (answeredResponse.ok) {
        const answeredData = await answeredResponse.json()
        setAnsweredTotal(answeredData.total || 0)
      }

      // Completed toplam sayısı
      const completedResponse = await fetch(`${API_URL}/complaint/personnel/completed?page=1&limit=1`, {
        credentials: 'include',
      })
      if (completedResponse.ok) {
        const completedData = await completedResponse.json()
        setCompletedTotal(completedData.total || 0)
      }
    } catch (err) {
      // Hata durumunda sessizce devam et
    }
  }

  const loadComplaints = async () => {
    setLoading(true)
    setError('')
    try {
      if (activeTab === 'pending') {
        const params = new URLSearchParams({
          page: pendingPage.toString(),
          limit: limit.toString(),
          sortBy,
          sortOrder,
        })
        if (searchTerm) params.append('search', searchTerm)
        if (complaintTypeId) params.append('complaintTypeId', complaintTypeId)

        const response = await fetch(`${API_URL}/complaint/personnel/pending?${params}`, {
          credentials: 'include',
        })
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            throw new Error('Yetkisiz erişim. Lütfen tekrar giriş yapın.')
          }
          throw new Error('Şikayetler yüklenemedi')
        }
        const data = await response.json()
        const complaints = data.data || data
        const total = typeof data.total === 'number' ? data.total : (Array.isArray(complaints) ? complaints.length : 0)
        const totalPages = typeof data.totalPages === 'number' ? data.totalPages : Math.ceil(total / limit)
        
        setPendingComplaints(Array.isArray(complaints) ? complaints : [])
        setPendingTotal(total)
        setPendingTotalPages(totalPages || 1)
      } else if (activeTab === 'answered') {
        const params = new URLSearchParams({
          page: answeredPage.toString(),
          limit: limit.toString(),
          sortBy,
          sortOrder,
        })
        if (searchTerm) params.append('search', searchTerm)

        const response = await fetch(`${API_URL}/complaint/personnel/my-complaints?${params}`, {
          credentials: 'include',
        })
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            throw new Error('Yetkisiz erişim. Lütfen tekrar giriş yapın.')
          }
          throw new Error('Şikayetler yüklenemedi')
        }
        const data = await response.json()
        const complaints = data.data || data
        const total = typeof data.total === 'number' ? data.total : (Array.isArray(complaints) ? complaints.length : 0)
        const totalPages = typeof data.totalPages === 'number' ? data.totalPages : Math.ceil(total / limit)
        
        setAnsweredComplaints(Array.isArray(complaints) ? complaints : [])
        setAnsweredTotal(total)
        setAnsweredTotalPages(totalPages || 1)
      } else if (activeTab === 'completed') {
        const params = new URLSearchParams({
          page: completedPage.toString(),
          limit: limit.toString(),
          sortBy,
          sortOrder,
        })
        if (searchTerm) params.append('search', searchTerm)

        const response = await fetch(`${API_URL}/complaint/personnel/completed?${params}`, {
          credentials: 'include',
        })
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            throw new Error('Yetkisiz erişim. Lütfen tekrar giriş yapın.')
          }
          throw new Error('Şikayetler yüklenemedi')
        }
        const data = await response.json()
        const complaints = data.data || data
        const total = typeof data.total === 'number' ? data.total : (Array.isArray(complaints) ? complaints.length : 0)
        const totalPages = typeof data.totalPages === 'number' ? data.totalPages : Math.ceil(total / limit)
        
        setCompletedComplaints(Array.isArray(complaints) ? complaints : [])
        setCompletedTotal(total)
        setCompletedTotalPages(totalPages || 1)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }


  const handleTabChange = (tab: 'pending' | 'answered' | 'completed') => {
    setActiveTab(tab)
    if (tab === 'pending') {
      setPendingPage(1)
    } else if (tab === 'answered') {
      setAnsweredPage(1)
    } else {
      setCompletedPage(1)
    }
  }

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setPendingPage(1)
  }

  const handleComplaintTypeChange = (value: string) => {
    setComplaintTypeId(value)
    setPendingPage(1)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0077BE] to-[#00427F] px-12 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Personel Paneli</h1>

          <PersonnelTabNavigation
            activeTab={activeTab}
            pendingTotal={pendingTotal}
            answeredTotal={answeredTotal}
            completedTotal={completedTotal}
            onTabChange={handleTabChange}
          />

          {activeTab === 'pending' && (
            <PersonnelFilters
              searchTerm={searchTerm}
              sortBy={sortBy}
              sortOrder={sortOrder}
              complaintTypeId={complaintTypeId}
              complaintTypes={complaintTypes}
              onSearchChange={handleSearchChange}
              onSortByChange={setSortBy}
              onSortOrderChange={setSortOrder}
              onComplaintTypeChange={handleComplaintTypeChange}
            />
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
              {success}
            </div>
          )}

          {loading && (
            <div className="text-center py-8">
              <p className="text-gray-600">Yükleniyor...</p>
            </div>
          )}

          {!loading && activeTab === 'pending' && (
            <div>
              {pendingComplaints.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600 text-lg">Bekleyen şikayet bulunmamaktadır.</p>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Başlık</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Öğrenci</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tip</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarih</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {pendingComplaints.map((complaint) => (
                          <tr key={complaint.complaintId} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="text-sm font-medium text-gray-900">{complaint.title}</div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {complaint.isAnonymous
                                ? 'İsimsiz'
                                : complaint.student?.user
                                ? `${complaint.student.user.firstName} ${complaint.student.user.lastName}`
                                : 'Bilinmeyen'}
                            </td>
                            <td className="px-4 py-3">
                              {complaint.complaintType && (
                                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                  {complaint.complaintType.typeName}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {new Date(complaint.createdAt).toLocaleDateString('tr-TR', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => navigate(`/sikayet/${complaint.uniqueCode || complaint.complaintId}`)}
                                className="px-3 py-1.5 text-sm bg-[#0077BE] text-white rounded-md hover:bg-[#005a94] transition-colors font-medium cursor-pointer"
                              >
                                Detay
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <Pagination
                currentPage={pendingPage}
                totalPages={pendingTotalPages}
                total={pendingTotal}
                onPageChange={setPendingPage}
              />
            </div>
          )}

          {!loading && activeTab === 'answered' && (
            <div>
              {answeredComplaints.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600 text-lg">Henüz cevaplanmış şikayet bulunmamaktadır.</p>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Başlık</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Öğrenci</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarih</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {answeredComplaints.map((complaint) => {
                          const lastResponse = complaint.responses
                            ?.filter((r) => r.personnelResponse)
                            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
                          const hasStudentResponse = lastResponse?.studentResponse

                          return (
                            <tr key={complaint.complaintId} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3">
                                <div className="text-sm font-medium text-gray-900">{complaint.title}</div>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-700">
                                {complaint.isAnonymous
                                  ? 'İsimsiz'
                                  : complaint.student?.user
                                  ? `${complaint.student.user.firstName} ${complaint.student.user.lastName}`
                                  : 'Bilinmeyen'}
                              </td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(complaint.status)}`}>
                                  {getStatusText(complaint.status)}
                                </span>
                                {hasStudentResponse && (
                                  <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                    Öğrenci Yanıtı
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-500">
                                {complaint.resolvedAt
                                  ? new Date(complaint.resolvedAt).toLocaleDateString('tr-TR', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric',
                                    })
                                  : new Date(complaint.createdAt).toLocaleDateString('tr-TR', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric',
                                    })}
                              </td>
                              <td className="px-4 py-3">
                                <button
                                  onClick={() => navigate(`/sikayet/${complaint.uniqueCode || complaint.complaintId}`)}
                                  className="px-3 py-1.5 text-sm bg-[#0077BE] text-white rounded-md hover:bg-[#005a94] transition-colors font-medium cursor-pointer"
                                >
                                  Detay
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <Pagination
                currentPage={answeredPage}
                totalPages={answeredTotalPages}
                total={answeredTotal}
                onPageChange={setAnsweredPage}
              />
            </div>
          )}

          {!loading && activeTab === 'completed' && (
            <div>
              {completedComplaints.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600 text-lg">Henüz tamamlanan şikayet bulunmamaktadır.</p>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Başlık</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Öğrenci</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tamamlayan</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tamamlanma Tarihi</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {completedComplaints.map((complaint) => (
                          <tr key={complaint.complaintId} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="text-sm font-medium text-gray-900">{complaint.title}</div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {complaint.isAnonymous
                                ? 'İsimsiz'
                                : complaint.student?.user
                                ? `${complaint.student.user.firstName} ${complaint.student.user.lastName}`
                                : 'Bilinmeyen'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {complaint.completedByPersonnel?.user
                                ? `${complaint.completedByPersonnel.user.firstName} ${complaint.completedByPersonnel.user.lastName}`
                                : complaint.completedByUser
                                ? `${complaint.completedByUser.firstName} ${complaint.completedByUser.lastName} (Yönetici)`
                                : '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {complaint.resolvedAt
                                ? new Date(complaint.resolvedAt).toLocaleDateString('tr-TR', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                  })
                                : '-'}
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => navigate(`/sikayet/${complaint.uniqueCode || complaint.complaintId}`)}
                                className="px-3 py-1.5 text-sm bg-[#0077BE] text-white rounded-md hover:bg-[#005a94] transition-colors font-medium cursor-pointer"
                              >
                                Detay
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <Pagination
                currentPage={completedPage}
                totalPages={completedTotalPages}
                total={completedTotal}
                onPageChange={setCompletedPage}
              />
            </div>
          )}
        </div>
      </div>

    </div>
  )
}

export default PersonnelPanel

