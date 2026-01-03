import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const API_URL = 'http://localhost:3000'

interface User {
  userId: number
  username: string
  email: string
  roleType: string
  createdAt: string
  photo?: string | null
  student?: any
  admin?: any
  personnel?: any
}

interface Complaint {
  complaintId: number
  title: string
  description: string
  status: string
  createdAt: string
  student?: {
    studentNumber: string
    user?: {
      username: string
      email: string
    }
  }
  complaintType?: {
    typeName: string
  }
}

function AdminPanel() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'users' | 'complaints'>('users')
  const [users, setUsers] = useState<User[]>([])
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers()
    } else {
      loadComplaints()
    }
  }, [activeTab])

  // Sayfa yüklendiğinde veya admin paneline dönüldüğünde kullanıcıları yükle
  useEffect(() => {
    loadUsers()
  }, [])

  const getAuthHeaders = (): Record<string, string> => {
    const userStr = localStorage.getItem('user')
    if (!userStr) {
      return {}
    }
    const user = JSON.parse(userStr)
    return {
      'x-user-id': user.userId.toString(),
      'x-role-type': user.roleType,
    }
  }

  const loadUsers = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`${API_URL}/admin/users`, {
        headers: {
          ...getAuthHeaders(),
        },
      })
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('Yetkisiz erişim. Lütfen tekrar giriş yapın.')
        }
        throw new Error('Kullanıcılar yüklenemedi')
      }
      const data = await response.json()
      setUsers(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const loadComplaints = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`${API_URL}/admin/complaints`, {
        headers: {
          ...getAuthHeaders(),
        },
      })
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('Yetkisiz erişim. Lütfen tekrar giriş yapın.')
        }
        throw new Error('Şikayetler yüklenemedi')
      }
      const data = await response.json()
      setComplaints(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) {
      return
    }

    try {
      const response = await fetch(`${API_URL}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          ...getAuthHeaders(),
        },
      })

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('Yetkisiz erişim. Lütfen tekrar giriş yapın.')
        }
        throw new Error('Kullanıcı silinemedi')
      }

      // Kullanıcı listesini yenile
      loadUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kullanıcı silinirken hata oluştu')
    }
  }

  const getRoleLabel = (roleType: string) => {
    switch (roleType) {
      case 'student':
        return 'Öğrenci'
      case 'admin':
        return 'Yönetici'
      case 'personnel':
        return 'Personel'
      default:
        return roleType
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
      case 'beklemede':
        return 'bg-yellow-100 text-yellow-800'
      case 'resolved':
      case 'çözüldü':
        return 'bg-green-100 text-green-800'
      case 'rejected':
      case 'reddedildi':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="flex-1 flex flex-col px-12 py-8 bg-gradient-to-b from-[#0077BE] to-[#00427F] min-h-screen">
      <div className="max-w-7xl mx-auto w-full">
        <h1 className="text-white text-4xl font-semibold mb-8">Admin Paneli</h1>

        {/* Tab Buttons */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'users'
                ? 'bg-white text-[#0077BE]'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            Kullanıcılar
          </button>
          <button
            onClick={() => setActiveTab('complaints')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'complaints'
                ? 'bg-white text-[#0077BE]'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            Şikayetler
          </button>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Yükleniyor...</p>
            </div>
          ) : activeTab === 'users' ? (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-800">Kullanıcı Listesi</h2>
                <button
                  onClick={() => navigate('/admin/add-user')}
                  className="px-4 py-2 bg-[#0077BE] text-white rounded-lg hover:bg-[#005a94] transition-colors font-medium"
                >
                  + Kullanıcı Ekle
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-2 py-3 text-center text-gray-700 font-semibold w-20">
                        Fotoğraf
                      </th>
                      <th className="border border-gray-300 px-4 py-3 text-left text-gray-700 font-semibold">
                        ID
                      </th>
                      <th className="border border-gray-300 px-4 py-3 text-left text-gray-700 font-semibold">
                        Kullanıcı Adı
                      </th>
                      <th className="border border-gray-300 px-4 py-3 text-left text-gray-700 font-semibold">
                        E-posta
                      </th>
                      <th className="border border-gray-300 px-4 py-3 text-left text-gray-700 font-semibold">
                        Rol
                      </th>
                      <th className="border border-gray-300 px-4 py-3 text-left text-gray-700 font-semibold">
                        Kayıt Tarihi
                      </th>
                      <th className="border border-gray-300 px-4 py-3 text-left text-gray-700 font-semibold">
                        İşlemler
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                          Kullanıcı bulunamadı
                        </td>
                      </tr>
                    ) : (
                      users.map((user) => (
                        <tr key={user.userId} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-2 py-3">
                            <div className="flex items-center justify-center w-12 h-12 mx-auto">
                              {user.photo ? (
                                <img
                                  src={user.photo}
                                  alt={user.username}
                                  className="w-12 h-12 rounded-full object-cover border border-gray-300"
                                  onError={(e) => {
                                    // Fotoğraf yüklenemezse fallback göster
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    const parent = target.parentElement;
                                    if (parent) {
                                      const fallback = document.createElement('div');
                                      fallback.className = 'w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center border border-gray-300';
                                      fallback.innerHTML = `<span class="text-gray-500 text-sm font-semibold">${user.username.charAt(0).toUpperCase()}</span>`;
                                      parent.appendChild(fallback);
                                    }
                                  }}
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center border border-gray-300">
                                  <span className="text-gray-500 text-sm font-semibold">
                                    {user.username.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="border border-gray-300 px-4 py-3">{user.userId}</td>
                          <td className="border border-gray-300 px-4 py-3">{user.username}</td>
                          <td className="border border-gray-300 px-4 py-3">{user.email}</td>
                          <td className="border border-gray-300 px-4 py-3">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                              {getRoleLabel(user.roleType)}
                            </span>
                          </td>
                          <td className="border border-gray-300 px-4 py-3">
                            {new Date(user.createdAt).toLocaleDateString('tr-TR')}
                          </td>
                          <td className="border border-gray-300 px-4 py-3">
                            <button
                              onClick={() => handleDeleteUser(user.userId)}
                              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                            >
                              Sil
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">Şikayet Listesi</h2>
              <div className="space-y-4">
                {complaints.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Şikayet bulunamadı</p>
                ) : (
                  complaints.map((complaint) => (
                    <div
                      key={complaint.complaintId}
                      className="border border-gray-300 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">{complaint.title}</h3>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                            complaint.status
                          )}`}
                        >
                          {complaint.status}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3">{complaint.description}</p>
                      <div className="flex gap-4 text-sm text-gray-500">
                        {complaint.student?.user && (
                          <span>
                            Öğrenci: {complaint.student.user.username} ({complaint.student.user.email})
                          </span>
                        )}
                        {complaint.complaintType && (
                          <span>Tip: {complaint.complaintType.typeName}</span>
                        )}
                        <span>
                          Tarih: {new Date(complaint.createdAt).toLocaleDateString('tr-TR')}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminPanel

