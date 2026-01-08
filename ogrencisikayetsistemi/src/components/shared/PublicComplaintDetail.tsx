import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

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

function PublicComplaintDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [complaint, setComplaint] = useState<Complaint | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (id) {
      loadComplaint(id)
    }
  }, [id])

  const loadComplaint = async (complaintId: string) => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`${API_URL}/complaint/public/${complaintId}`, {
        credentials: 'include',
      })

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Şikayet bulunamadı')
        }
        throw new Error('Şikayet yüklenemedi')
      }

      const data = await response.json()
      setComplaint(data)
      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Şikayet yüklenemedi')
      setLoading(false)
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

  if (loading) {
    return (
      <div className="flex-1 flex flex-col px-12 py-8 bg-gradient-to-b from-[#0077BE] to-[#00427F] min-h-screen">
        <div className="max-w-4xl mx-auto w-full">
          <div className="bg-white/90 backdrop-blur-md rounded-xl p-8 animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col px-12 py-8 bg-gradient-to-b from-[#0077BE] to-[#00427F] min-h-screen">
        <div className="max-w-4xl mx-auto w-full">
          <div className="bg-white/90 backdrop-blur-md rounded-xl p-8 text-center">
            <p className="text-red-600 text-lg mb-4">{error}</p>
            <button
              onClick={() => navigate('/anasayfa')}
              className="px-6 py-2 bg-[#0077BE] text-white rounded-lg hover:bg-[#005a94] transition-colors"
            >
              Anasayfaya Dön
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!complaint) {
    return null
  }

  return (
    <div className="flex-1 flex flex-col px-12 py-8 bg-gradient-to-b from-[#0077BE] to-[#00427F] min-h-screen">
      <div className="max-w-4xl mx-auto w-full">
        <button
          onClick={() => navigate('/anasayfa')}
          className="mb-6 text-white hover:text-gray-200 transition-colors flex items-center gap-2"
        >
          <span>←</span>
          <span>Anasayfaya Dön</span>
        </button>

        <div className="bg-white/90 backdrop-blur-md rounded-xl p-8 shadow-xl">
          {/* Başlık ve Durum */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                {complaint.title}
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  {complaint.isAnonymous
                    ? 'İsimsiz Kullanıcı'
                    : `${complaint.student?.user?.firstName || ''} ${complaint.student?.user?.lastName || ''}`.trim() || 'Bilinmeyen Kullanıcı'}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <span>🕒</span>
                  {new Date(complaint.createdAt).toLocaleDateString('tr-TR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
            <span
              className={`px-4 py-2 rounded-full text-sm font-semibold shadow-sm ${getStatusColor(
                complaint.status
              )}`}
            >
              {complaint.status}
            </span>
          </div>

          {/* Meta Bilgiler */}
          <div className="flex flex-wrap gap-4 mb-6 pb-6 border-b border-gray-200">
            {complaint.complaintType && (
              <div className="flex items-center gap-2 text-gray-700">
                <span className="text-lg">📋</span>
                <span className="font-medium">{complaint.complaintType.typeName}</span>
              </div>
            )}
            {complaint.course && (
              <div className="flex items-center gap-2 text-gray-700">
                <span className="text-lg">📚</span>
                <span className="font-medium">
                  {complaint.course.courseCode} - {complaint.course.courseName}
                </span>
              </div>
            )}
          </div>

          {/* Açıklama */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Açıklama</h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {complaint.description}
            </p>
          </div>

          {/* Cevaplar */}
          {complaint.responses && complaint.responses.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Cevaplar</h2>
              <div className="space-y-4">
                {complaint.responses.map((response) => (
                  <div
                    key={response.responseId}
                    className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                  >
                    {response.personnelResponse && (
                      <div className="mb-3">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-[#0077BE]">
                            {response.respondedByPersonnel?.user
                              ? `${response.respondedByPersonnel.user.firstName} ${response.respondedByPersonnel.user.lastName}`
                              : response.respondedByUser
                              ? `${response.respondedByUser.firstName} ${response.respondedByUser.lastName}`
                              : complaint.handledByPersonnel?.user
                              ? `${complaint.handledByPersonnel.user.firstName} ${complaint.handledByPersonnel.user.lastName}`
                              : 'Personel'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(response.createdAt).toLocaleDateString('tr-TR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {response.personnelResponse}
                        </p>
                      </div>
                    )}
                    {response.studentResponse && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-gray-900">
                            {complaint.isAnonymous
                              ? 'İsimsiz Kullanıcı'
                              : `${complaint.student?.user?.firstName || ''} ${complaint.student?.user?.lastName || ''}`.trim() || 'Öğrenci'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(response.updatedAt).toLocaleDateString('tr-TR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {response.studentResponse}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Çözüldü Tarihi */}
          {complaint.resolvedAt && (
            <div className="pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Çözüldü:</span>{' '}
                {new Date(complaint.resolvedAt).toLocaleDateString('tr-TR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PublicComplaintDetail

