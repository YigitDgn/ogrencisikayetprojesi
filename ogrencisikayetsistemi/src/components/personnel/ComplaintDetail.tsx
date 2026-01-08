import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { Complaint } from '../../types/Complaint'
import { getStatusColor, getStatusText } from '../../types/Complaint'
import ResponseForm from './ResponseForm'
import RejectForm from './RejectForm'

const API_URL = '/api'

function ComplaintDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [complaint, setComplaint] = useState<Complaint | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [respondingTo, setRespondingTo] = useState<number | null>(null)
  const [rejectingTo, setRejectingTo] = useState<number | null>(null)
  const [responseText, setResponseText] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    loadCurrentUser()
    if (id) {
      loadComplaint(id)
    }
  }, [id])

  const loadCurrentUser = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        credentials: 'include',
      })
      if (response.ok) {
        const userData = await response.json()
        setCurrentUser(userData)
      }
    } catch (err) {
      // Hata durumunda sessizce devam et
    }
  }

  const loadComplaint = async (code: string) => {
    setLoading(true)
    setError('')
    try {
      // uniqueCode ile şikayeti getir
      const response = await fetch(`${API_URL}/complaint/code/${code}`, {
        credentials: 'include',
      })

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Şikayet bulunamadı')
        }
        if (response.status === 401 || response.status === 403) {
          throw new Error('Yetkisiz erişim. Lütfen tekrar giriş yapın.')
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

  const handleRespond = async (complaintId: number) => {
    if (!responseText.trim()) {
      setError('Lütfen bir cevap yazın')
      return
    }

    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`${API_URL}/complaint/personnel/${complaintId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ response: responseText }),
      })

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('Yetkisiz erişim. Lütfen tekrar giriş yapın.')
        }
        const errorData = await response.json()
        throw new Error(errorData.message || 'Şikayet cevaplanamadı')
      }

      setSuccess('Şikayet başarıyla cevaplandı')
      setResponseText('')
      setRespondingTo(null)
      if (id) {
        await loadComplaint(id)
      }
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReject = async (complaintId: number) => {
    if (!rejectReason.trim()) {
      setError('Lütfen reddetme sebebini yazın')
      return
    }

    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`${API_URL}/complaint/personnel/${complaintId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ reason: rejectReason }),
      })

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('Yetkisiz erişim. Lütfen tekrar giriş yapın.')
        }
        const errorData = await response.json()
        throw new Error(errorData.message || 'Şikayet reddedilemedi')
      }

      setSuccess('Şikayet başarıyla reddedildi')
      setRejectReason('')
      setRejectingTo(null)
      if (id) {
        await loadComplaint(id)
      }
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
    } finally {
      setSubmitting(false)
    }
  }

  const handleComplete = async (complaintId: number) => {
    if (!window.confirm('Bu şikayeti bitirmek istediğinize emin misiniz? Bitirilen şikayetlerde öğrenci ve personel artık işlem yapamaz.')) {
      return
    }

    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`${API_URL}/complaint/personnel/${complaintId}/complete`, {
        method: 'POST',
        credentials: 'include',
      })

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('Yetkisiz erişim. Lütfen tekrar giriş yapın.')
        }
        const errorData = await response.json()
        throw new Error(errorData.message || 'Şikayet bitirilemedi')
      }

      setSuccess('Şikayet başarıyla bitirildi')
      if (id) {
        await loadComplaint(id)
      }
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (complaintId: number) => {
    if (!window.confirm('Bu şikayeti silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) {
      return
    }

    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`${API_URL}/complaint/${complaintId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('Yetkisiz erişim. Lütfen tekrar giriş yapın.')
        }
        const errorData = await response.json()
        throw new Error(errorData.message || 'Şikayet silinemedi')
      }

      setSuccess('Şikayet başarıyla silindi')
      setTimeout(() => {
        // Admin panel veya anasayfaya yönlendir
        const backPath = currentUser?.roleType === 'admin' ? '/admin' : '/anasayfa'
        navigate(backPath)
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center px-12 py-8 bg-gradient-to-b from-[#0077BE] to-[#00427F] min-h-screen">
        <p className="text-white text-lg">Yükleniyor...</p>
      </div>
    )
  }

  if (error && !complaint) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-12 py-8 bg-gradient-to-b from-[#0077BE] to-[#00427F] min-h-screen">
        <p className="text-white text-lg mb-4">{error}</p>
        <button
          onClick={() => {
            const backPath = currentUser?.roleType === 'admin' ? '/admin' : '/personnel'
            navigate(backPath)
          }}
          className="px-6 py-2 bg-white text-[#0077BE] rounded-md hover:bg-gray-100 transition-colors font-medium cursor-pointer"
        >
          Geri Dön
        </button>
      </div>
    )
  }

  if (!complaint) {
    return null
  }

  return (
    <div className="flex-1 flex flex-col px-12 py-8 bg-gradient-to-b from-[#0077BE] to-[#00427F] min-h-screen">
      <div className="max-w-4xl mx-auto w-full">
        <div className="mb-6">
          <button
            onClick={() => {
              const backPath = currentUser?.roleType === 'admin' ? '/admin' : '/personnel'
              navigate(backPath)
            }}
            className="text-white hover:text-gray-200 mb-4 flex items-center gap-2 cursor-pointer"
          >
            ← Geri Dön
          </button>
          <h1 className="text-white text-3xl font-semibold">{complaint.title}</h1>
        </div>

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

        <div className="bg-white rounded-lg shadow-xl p-6">
          <div className="space-y-4">
            {/* Şikayet Bilgileri */}
            <div className="bg-gray-50 p-4 rounded-lg min-w-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">Öğrenci:</p>
                  <p className="text-gray-700">
                    {complaint.isAnonymous
                      ? 'İsimsiz'
                      : complaint.student?.user
                      ? `${complaint.student.user.firstName} ${complaint.student.user.lastName}`
                      : 'Bilinmeyen'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">Durum:</p>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(complaint.status)}`}>
                      {getStatusText(complaint.status)}
                    </span>
                    {(complaint.completedByPersonnel || complaint.completedByUser) && (
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                        ✓ {complaint.completedByPersonnel?.user 
                          ? `${complaint.completedByPersonnel.user.firstName} ${complaint.completedByPersonnel.user.lastName} tarafından bitirildi`
                          : complaint.completedByUser
                          ? `${complaint.completedByUser.firstName} ${complaint.completedByUser.lastName} (Yönetici) tarafından bitirildi`
                          : 'Bitirildi'}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">Şikayet Tipi:</p>
                  <p className="text-gray-700">{complaint.complaintType?.typeName || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">Ders:</p>
                  <p className="text-gray-700">
                    {complaint.course ? `${complaint.course.courseCode} - ${complaint.course.courseName}` : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">Oluşturulma Tarihi:</p>
                  <p className="text-gray-700">
                    {new Date(complaint.createdAt).toLocaleDateString('tr-TR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                {complaint.resolvedAt && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-1">Cevaplanma Tarihi:</p>
                    <p className="text-gray-700">
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
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-700 mb-2">Açıklama:</p>
                <p className="text-gray-700 whitespace-pre-wrap break-words">{complaint.description}</p>
              </div>
            </div>

            {/* Response'lar */}
            {complaint.responses && complaint.responses.length > 0 && (
              <div className="space-y-4">
                {complaint.responses
                  .filter((r) => r.personnelResponse)
                  .map((response) => (
                    <div key={response.responseId} className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-sm font-semibold text-[#0077BE]">
                          {response.respondedByPersonnel?.user
                            ? `${response.respondedByPersonnel.user.firstName} ${response.respondedByPersonnel.user.lastName}`
                            : response.respondedByUser
                            ? `${response.respondedByUser.firstName} ${response.respondedByUser.lastName}`
                            : complaint.handledByPersonnel?.user
                            ? `${complaint.handledByPersonnel.user.firstName} ${complaint.handledByPersonnel.user.lastName}`
                            : 'Personel'} Cevabı:
                        </p>
                        <span className="text-xs text-gray-500">
                          {new Date(response.createdAt).toLocaleDateString('tr-TR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap break-words mb-3">{response.personnelResponse}</p>
                      {response.studentResponse && (
                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm font-semibold text-green-700 mb-2">Öğrenci Yanıtı:</p>
                          <p className="text-gray-700 whitespace-pre-wrap break-words">{response.studentResponse}</p>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}

            {/* Bitirme Butonu */}
            {currentUser && (currentUser.roleType === 'personnel' || currentUser.roleType === 'admin') && complaint.status !== 'tamamlandı' && !complaint.completedByPersonnelId && (
              <div className="border-t pt-4 mb-4">
                <button
                  onClick={() => handleComplete(complaint.complaintId)}
                  disabled={submitting}
                  className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Bitiriliyor...' : '✓ Bitir'}
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  Bitirilen şikayetlerde öğrenci ve personel artık işlem yapamaz.
                </p>
              </div>
            )}

            {/* Silme Butonu (Sadece Admin için) */}
            {currentUser && currentUser.roleType === 'admin' && (
              <div className="border-t pt-4 mb-4">
                <button
                  onClick={() => handleDelete(complaint.complaintId)}
                  disabled={submitting}
                  className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Siliniyor...' : '🗑️ Sil'}
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  Şikayet kalıcı olarak silinecektir. Bu işlem geri alınamaz.
                </p>
              </div>
            )}

            {/* Cevap Verme/Reddetme (Sadece beklemede durumundaki şikayetler için) */}
            {complaint.status === 'beklemede' && !complaint.completedByPersonnelId && (
              <div className="border-t pt-4">
                {respondingTo === complaint.complaintId ? (
                  <ResponseForm
                    responseText={responseText}
                    submitting={submitting}
                    onResponseChange={setResponseText}
                    onSubmit={() => handleRespond(complaint.complaintId)}
                    onCancel={() => {
                      setRespondingTo(null)
                      setResponseText('')
                    }}
                  />
                ) : rejectingTo === complaint.complaintId ? (
                  <RejectForm
                    rejectReason={rejectReason}
                    submitting={submitting}
                    onReasonChange={setRejectReason}
                    onSubmit={() => handleReject(complaint.complaintId)}
                    onCancel={() => {
                      setRejectingTo(null)
                      setRejectReason('')
                    }}
                  />
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setRespondingTo(complaint.complaintId)
                        setResponseText('')
                        setRejectingTo(null)
                      }}
                      className="px-6 py-2 bg-[#0077BE] text-white rounded-md hover:bg-[#005a94] transition-colors font-medium cursor-pointer"
                    >
                      Cevap Yaz
                    </button>
                    <button
                      onClick={() => {
                        setRejectingTo(complaint.complaintId)
                        setRejectReason('')
                        setRespondingTo(null)
                      }}
                      className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium cursor-pointer"
                    >
                      Reddet
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Öğrenci yanıtına cevap verme (Cevaplanmış şikayetler için) */}
            {complaint.status === 'cevaplandı' && !complaint.completedByPersonnelId && (
              <div className="border-t pt-4">
                {(() => {
                  const lastResponse = complaint.responses
                    ?.filter((r) => r.personnelResponse)
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
                  const hasStudentResponse = lastResponse?.studentResponse

                  if (hasStudentResponse && respondingTo !== complaint.complaintId) {
                    return (
                      <button
                        onClick={() => {
                          setRespondingTo(complaint.complaintId)
                          setResponseText('')
                          setRejectingTo(null)
                        }}
                        className="px-6 py-2 bg-[#0077BE] text-white rounded-md hover:bg-[#005a94] transition-colors font-medium cursor-pointer"
                      >
                        Yanıt Ver
                      </button>
                    )
                  }

                  if (respondingTo === complaint.complaintId) {
                    return (
                      <ResponseForm
                        responseText={responseText}
                        submitting={submitting}
                        onResponseChange={setResponseText}
                        onSubmit={() => handleRespond(complaint.complaintId)}
                        onCancel={() => {
                          setRespondingTo(null)
                          setResponseText('')
                        }}
                      />
                    )
                  }

                  return null
                })()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ComplaintDetail

