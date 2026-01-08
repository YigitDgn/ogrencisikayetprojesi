import { useState, useEffect, useCallback, memo, useRef } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStatusText } from '../../types/Complaint'
import Pagination from '../shared/Pagination'

const API_URL = '/api'

// Arama input'u için memoize edilmiş component
const SearchInput = memo(({ value, onChange, inputRef, onFocus, onBlur }: { 
  value: string
  onChange: (value: string) => void
  inputRef?: React.RefObject<HTMLInputElement | null>
  onFocus?: () => void
  onBlur?: () => void
}) => {
  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={onFocus}
      onBlur={onBlur}
      placeholder="Ad, soyad veya e-posta ile ara..."
      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0077BE]"
      autoComplete="off"
    />
  )
})

SearchInput.displayName = 'SearchInput'

interface User {
  userId: number
  firstName: string
  lastName: string
  email: string
  roleType: string
  phoneNumber?: string
  createdAt: string
  photo?: string | null
  student?: any
  admin?: any
  personnel?: any
  complaintCount?: number
}

interface UsersResponse {
  data: User[]
  total: number
  page: number
  limit: number
  totalPages: number
}

interface Complaint {
  complaintId: number
  title: string
  description: string
  status: string
  createdAt: string
  resolvedAt?: string
  uniqueCode?: string
  isPublic?: boolean
  isAnonymous?: boolean
  student?: {
    studentId: number
    studentNumber: string
    user?: {
      firstName: string
      lastName: string
      email: string
    }
  }
  complaintType?: {
    typeName: string
  }
  course?: {
    courseName: string
  }
  handledByPersonnel?: {
    user?: {
      firstName: string
      lastName: string
    }
  }
  responses?: Array<{
    responseId: number
    personnelResponse?: string | null
    studentResponse?: string | null
    createdAt: string
    respondedByPersonnel?: {
      user?: {
        firstName: string
        lastName: string
      }
    }
  }>
}

function AdminPanel() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'users' | 'complaints'>('users')
  const [users, setUsers] = useState<User[]>([])
  const [usersTotal, setUsersTotal] = useState(0)
  const [usersPage, setUsersPage] = useState(1)
  const [usersLimit, setUsersLimit] = useState(10)
  const [usersTotalPages, setUsersTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [complaintsTab, setComplaintsTab] = useState<'pending' | 'answered' | 'completed' | 'rejected' | 'all'>('all')
  const [complaintsTotal, setComplaintsTotal] = useState(0)
  const [complaintsPage, setComplaintsPage] = useState(1)
  const [complaintsLimit] = useState(10)
  const [complaintsTotalPages, setComplaintsTotalPages] = useState(1)
  const [complaintsSearchTerm, setComplaintsSearchTerm] = useState('')
  const [complaintsSortBy, setComplaintsSortBy] = useState<string>('createdAt')
  const [complaintsSortOrder, setComplaintsSortOrder] = useState<'ASC' | 'DESC'>('DESC')
  const [complaintsTypeId, setComplaintsTypeId] = useState<string>('')
  const [complaintTypes, setComplaintTypes] = useState<Array<{ complaintTypeId: number; typeName: string }>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    roleType: 'student',
    phoneNumber: '',
  })
  const [editPhoto, setEditPhoto] = useState<File | null>(null)
  const [editPhotoPreview, setEditPhotoPreview] = useState<string | null>(null)
  const [removeEditPhoto, setRemoveEditPhoto] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [viewingComplaints, setViewingComplaints] = useState<User | null>(null)
  const [userComplaints, setUserComplaints] = useState<Complaint[]>([])
  const [loadingComplaints, setLoadingComplaints] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const wasSearchFocusedRef = useRef(false)

  // Debounce için searchTerm güncellemesi
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== searchTerm) {
        setSearchTerm(searchInput)
        setUsersPage(1) // Arama değiştiğinde ilk sayfaya dön
      }
    }, 500) // 500ms bekle

    return () => clearTimeout(timer)
  }, [searchInput, searchTerm])

  // Cookie otomatik olarak gönderiliyor, header'a gerek yok
  const getAuthHeaders = (): Record<string, string> => {
    return {}
  }

  const loadUsers = useCallback(async () => {
    // Odak durumunu kaydet
    const hadFocus = document.activeElement === searchInputRef.current
    wasSearchFocusedRef.current = hadFocus || false

    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({
        page: usersPage.toString(),
        limit: usersLimit.toString(),
      })
      if (searchTerm) {
        params.append('search', searchTerm)
      }
      if (roleFilter !== 'all') {
        params.append('roleType', roleFilter)
      }

      const response = await fetch(`${API_URL}/admin/users?${params.toString()}`, {
        credentials: 'include',
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
      const data: UsersResponse = await response.json()
      // Sadece gerçekten değişen değerleri güncelle
      setUsers(prev => {
        if (JSON.stringify(prev) === JSON.stringify(data.data)) {
          return prev
        }
        return data.data
      })
      setUsersTotal(data.total)
      setUsersPage(prev => prev === data.page ? prev : data.page)
      setUsersLimit(prev => prev === data.limit ? prev : data.limit)
      setUsersTotalPages(data.totalPages)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
    } finally {
      setLoading(false)
      // Render sonrası odak durumunu geri yükle
      if (wasSearchFocusedRef.current && searchInputRef.current) {
        setTimeout(() => {
          searchInputRef.current?.focus()
        }, 0)
      }
    }
  }, [usersPage, usersLimit, searchTerm, roleFilter])

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers()
    } else {
      loadComplaintTypes()
      loadComplaints()
    }
  }, [activeTab, loadUsers])

  useEffect(() => {
    if (activeTab === 'complaints') {
      loadComplaints()
    }
  }, [complaintsTab, complaintsPage, complaintsSearchTerm, complaintsSortBy, complaintsSortOrder, complaintsTypeId])

  // Sayfa yüklendiğinde veya admin paneline dönüldüğünde kullanıcıları yükle
  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  const loadComplaints = async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({
        page: complaintsPage.toString(),
        limit: complaintsLimit.toString(),
        sortBy: complaintsSortBy,
        sortOrder: complaintsSortOrder,
      })
      
      if (complaintsTab === 'pending') {
        params.append('status', 'pending')
      } else if (complaintsTab === 'answered') {
        params.append('status', 'answered')
      } else if (complaintsTab === 'completed') {
        params.append('status', 'completed')
      } else if (complaintsTab === 'rejected') {
        params.append('status', 'rejected')
      }
      
      if (complaintsSearchTerm) {
        params.append('search', complaintsSearchTerm)
      }
      if (complaintsTypeId) {
        params.append('complaintTypeId', complaintsTypeId)
      }

      const response = await fetch(`${API_URL}/admin/complaints?${params}`, {
        credentials: 'include',
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
      const complaints = data.data || data
      const total = typeof data.total === 'number' ? data.total : (Array.isArray(complaints) ? complaints.length : 0)
      const totalPages = typeof data.totalPages === 'number' ? data.totalPages : Math.ceil(total / complaintsLimit)
      
      setComplaints(Array.isArray(complaints) ? complaints : [])
      setComplaintsTotal(total)
      setComplaintsTotalPages(totalPages || 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const loadUserComplaints = async (userId: number) => {
    setLoadingComplaints(true)
    setError('')
    try {
      const response = await fetch(`${API_URL}/admin/users/${userId}/complaints`, {
        credentials: 'include',
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
      setUserComplaints(data.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
    } finally {
      setLoadingComplaints(false)
    }
  }

  const handleViewComplaints = async (user: User) => {
    setViewingComplaints(user)
    await loadUserComplaints(user.userId)
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setEditFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      password: '',
      roleType: user.roleType || 'student',
      phoneNumber: user.phoneNumber || '',
    })
    setEditPhoto(null)
    setEditPhotoPreview(null)
    setRemoveEditPhoto(false)
    setError('')
  }

  const handleEditPhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
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
      setEditPhoto(file)
      setError('')
      const reader = new FileReader()
      reader.onloadend = () => {
        setEditPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUpdateUser = async (e: FormEvent) => {
    e.preventDefault()
    if (!editingUser) return

    setUpdating(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('firstName', editFormData.firstName)
      formData.append('lastName', editFormData.lastName)
      formData.append('email', editFormData.email)
      if (editFormData.password) {
        formData.append('password', editFormData.password)
      }
      formData.append('roleType', editFormData.roleType)
      if (editFormData.phoneNumber) {
        formData.append('phoneNumber', editFormData.phoneNumber)
      }
      if (removeEditPhoto) {
        formData.append('removePhoto', 'true')
      } else if (editPhoto) {
        formData.append('photo', editPhoto)
      }

      const response = await fetch(`${API_URL}/admin/users/${editingUser.userId}`, {
        method: 'PUT',
        credentials: 'include',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('Yetkisiz erişim. Lütfen tekrar giriş yapın.')
        }
        throw new Error(data.message || 'Kullanıcı güncellenemedi')
      }

      // Başarılı güncelleme - Modal'ı kapat ve listeyi yenile
      setEditingUser(null)
      setEditFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        roleType: 'student',
        phoneNumber: '',
      })
      setEditPhoto(null)
      setEditPhotoPreview(null)
      setRemoveEditPhoto(false)
      loadUsers()
    } catch (err) {
      // Başarısız güncelleme - Modal'ı kapat ve hatayı göster
      setEditingUser(null)
      setEditFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        roleType: 'student',
        phoneNumber: '',
      })
      setEditPhoto(null)
      setEditPhotoPreview(null)
      setRemoveEditPhoto(false)
      setError(err instanceof Error ? err.message : 'Kullanıcı güncellenirken hata oluştu')
    } finally {
      setUpdating(false)
    }
  }

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) {
      return
    }

    try {
      const response = await fetch(`${API_URL}/admin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
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
            className={`px-6 py-3 rounded-lg font-medium transition-colors cursor-pointer ${
              activeTab === 'users'
                ? 'bg-white text-[#0077BE]'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            Kullanıcılar
          </button>
          <button
            onClick={() => setActiveTab('complaints')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors cursor-pointer ${
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

          {activeTab === 'users' ? (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-800">Kullanıcı Listesi</h2>
                <button
                  onClick={() => navigate('/admin/add-user')}
                  className="px-4 py-2 bg-[#0077BE] text-white rounded-lg hover:bg-[#005a94] transition-colors font-medium cursor-pointer"
                >
                  + Kullanıcı Ekle
                </button>
              </div>

              {/* Filtreler */}
              <div className="mb-4 flex gap-4 items-end" key="filters-container">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ara</label>
                  <SearchInput
                    value={searchInput}
                    onChange={setSearchInput}
                    inputRef={searchInputRef}
                    onFocus={() => {
                      wasSearchFocusedRef.current = true
                    }}
                    onBlur={() => {
                      wasSearchFocusedRef.current = false
                    }}
                  />
                </div>
                <div className="w-48">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                  <select
                    value={roleFilter}
                    onChange={(e) => {
                      setRoleFilter(e.target.value)
                      setUsersPage(1)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0077BE] bg-white"
                  >
                    <option value="all">Tümü</option>
                    <option value="student">Öğrenci</option>
                    <option value="personnel">Personel</option>
                    <option value="admin">Yönetici</option>
                  </select>
                </div>
                <div className="w-32">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sayfa Başına</label>
                  <select
                    value={usersLimit}
                    onChange={(e) => {
                      setUsersLimit(Number(e.target.value))
                      setUsersPage(1)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0077BE] bg-white"
                  >
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                </div>
              </div>

              <div className="mb-2 text-sm text-gray-600">
                {loading ? 'Yükleniyor...' : `Toplam ${usersTotal} kullanıcı bulundu`}
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0077BE] mx-auto"></div>
                  <p className="mt-4 text-gray-600">Yükleniyor...</p>
                </div>
              ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-2 py-2 text-center text-gray-700 font-semibold w-16">
                        Foto
                      </th>
                      <th className="border border-gray-300 px-2 py-2 text-left text-gray-700 font-semibold w-16">
                        ID
                      </th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-gray-700 font-semibold">
                        Ad Soyad
                      </th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-gray-700 font-semibold">
                        E-posta
                      </th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-gray-700 font-semibold">
                        Telefon
                      </th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-gray-700 font-semibold">
                        Rol
                      </th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-gray-700 font-semibold">
                        Detay
                      </th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-gray-700 font-semibold">
                        Tarih
                      </th>
                      <th className="border border-gray-300 px-3 py-2 text-center text-gray-700 font-semibold w-32">
                        İşlemler
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                          Kullanıcı bulunamadı
                        </td>
                      </tr>
                    ) : (
                      users.map((user) => (
                        <tr key={user.userId} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-2 py-2">
                            <div className="flex items-center justify-center w-10 h-10 mx-auto">
                              {user.photo ? (
                                <img
                                  src={`/api${user.photo}`}
                                  alt={`${user.firstName} ${user.lastName}`}
                                  className="w-10 h-10 rounded-full object-cover border border-gray-300"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    const parent = target.parentElement;
                                    if (parent) {
                                      const fallback = document.createElement('div');
                                      fallback.className = 'w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center border border-gray-300';
                                      fallback.innerHTML = `<span class="text-gray-500 text-xs font-semibold">${user.firstName?.charAt(0).toUpperCase() || ''}</span>`;
                                      parent.appendChild(fallback);
                                    }
                                  }}
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center border border-gray-300">
                                  <span className="text-gray-500 text-xs font-semibold">
                                    {user.firstName?.charAt(0).toUpperCase() || ''}
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="border border-gray-300 px-2 py-2">{user.userId}</td>
                          <td className="border border-gray-300 px-3 py-2">
                            {user.firstName} {user.lastName}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-xs">{user.email}</td>
                          <td className="border border-gray-300 px-3 py-2 text-xs">
                            {user.phoneNumber || '-'}
                          </td>
                          <td className="border border-gray-300 px-3 py-2">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              user.roleType === 'admin' ? 'bg-purple-100 text-purple-800' :
                              user.roleType === 'personnel' ? 'bg-green-100 text-green-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {getRoleLabel(user.roleType)}
                            </span>
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-xs">
                            {user.student?.studentNumber && (
                              <div className="text-gray-600">Öğr. No: {user.student.studentNumber}</div>
                            )}
                            {user.personnel?.personnelNumber && (
                              <div className="text-gray-600">Pers. No: {user.personnel.personnelNumber}</div>
                            )}
                            {!user.student && !user.personnel && '-'}
                            {user.roleType === 'student' && (
                              <div className="mt-1">
                                <button
                                  onClick={() => handleViewComplaints(user)}
                                  className="text-[#0077BE] hover:underline text-xs"
                                >
                                  Şikayetler ({user.complaintCount || 0})
                                </button>
                              </div>
                            )}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-xs">
                            {new Date(user.createdAt).toLocaleDateString('tr-TR')}
                          </td>
                          <td className="border border-gray-300 px-3 py-2">
                            <div className="flex gap-1 justify-center">
                              <button
                                onClick={() => handleEditUser(user)}
                                className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors cursor-pointer"
                                title="Düzenle"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user.userId)}
                                className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors cursor-pointer"
                                title="Sil"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              )}

              {/* Sayfalama */}
              {!loading && usersTotalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Sayfa {usersPage} / {usersTotalPages}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setUsersPage(prev => Math.max(1, prev - 1))}
                      disabled={usersPage === 1}
                      className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      Önceki
                    </button>
                    {Array.from({ length: Math.min(5, usersTotalPages) }, (_, i) => {
                      let pageNum: number
                      if (usersTotalPages <= 5) {
                        pageNum = i + 1
                      } else if (usersPage <= 3) {
                        pageNum = i + 1
                      } else if (usersPage >= usersTotalPages - 2) {
                        pageNum = usersTotalPages - 4 + i
                      } else {
                        pageNum = usersPage - 2 + i
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setUsersPage(pageNum)}
                          className={`px-3 py-1.5 rounded text-sm transition-colors ${
                            usersPage === pageNum
                              ? 'bg-[#0077BE] text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                    <button
                      onClick={() => setUsersPage(prev => Math.min(usersTotalPages, prev + 1))}
                      disabled={usersPage === usersTotalPages}
                      className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      Sonraki
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">Şikayet Listesi</h2>
              
              {/* Tab Navigation */}
              <div className="flex gap-4 mb-6 border-b border-gray-200">
                <button
                  onClick={() => {
                    setComplaintsTab('all')
                    setComplaintsPage(1)
                  }}
                  className={`px-6 py-3 font-medium transition-colors cursor-pointer ${
                    complaintsTab === 'all'
                      ? 'text-[#0077BE] border-b-2 border-[#0077BE]'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Tümü
                </button>
                <button
                  onClick={() => {
                    setComplaintsTab('pending')
                    setComplaintsPage(1)
                  }}
                  className={`px-6 py-3 font-medium transition-colors cursor-pointer ${
                    complaintsTab === 'pending'
                      ? 'text-[#0077BE] border-b-2 border-[#0077BE]'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Bekleyen
                </button>
                <button
                  onClick={() => {
                    setComplaintsTab('answered')
                    setComplaintsPage(1)
                  }}
                  className={`px-6 py-3 font-medium transition-colors cursor-pointer ${
                    complaintsTab === 'answered'
                      ? 'text-[#0077BE] border-b-2 border-[#0077BE]'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Cevaplanan
                </button>
                <button
                  onClick={() => {
                    setComplaintsTab('completed')
                    setComplaintsPage(1)
                  }}
                  className={`px-6 py-3 font-medium transition-colors cursor-pointer ${
                    complaintsTab === 'completed'
                      ? 'text-[#0077BE] border-b-2 border-[#0077BE]'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Tamamlanan
                </button>
                <button
                  onClick={() => {
                    setComplaintsTab('rejected')
                    setComplaintsPage(1)
                  }}
                  className={`px-6 py-3 font-medium transition-colors cursor-pointer ${
                    complaintsTab === 'rejected'
                      ? 'text-[#0077BE] border-b-2 border-[#0077BE]'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Reddedilen
                </button>
              </div>

              {/* Filters */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ara</label>
                    <input
                      type="text"
                      value={complaintsSearchTerm}
                      onChange={(e) => {
                        setComplaintsSearchTerm(e.target.value)
                        setComplaintsPage(1)
                      }}
                      placeholder="Başlık, açıklama veya öğrenci ara..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0077BE]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tipi</label>
                    <select
                      value={complaintsTypeId}
                      onChange={(e) => {
                        setComplaintsTypeId(e.target.value)
                        setComplaintsPage(1)
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0077BE] bg-white"
                    >
                      <option value="">Tümü</option>
                      {complaintTypes.map((type) => (
                        <option key={type.complaintTypeId} value={type.complaintTypeId.toString()}>
                          {type.typeName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sırala</label>
                    <select
                      value={complaintsSortBy}
                      onChange={(e) => {
                        setComplaintsSortBy(e.target.value)
                        setComplaintsPage(1)
                      }}
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
                      value={complaintsSortOrder}
                      onChange={(e) => {
                        setComplaintsSortOrder(e.target.value as 'ASC' | 'DESC')
                        setComplaintsPage(1)
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0077BE] bg-white"
                    >
                      <option value="DESC">Azalan</option>
                      <option value="ASC">Artan</option>
                    </select>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">Yükleniyor...</p>
                </div>
              ) : complaints.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600 text-lg">Şikayet bulunamadı</p>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kod</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Başlık</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Öğrenci</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tip</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarih</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cevaplar</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {complaints.map((complaint) => (
                          <tr key={complaint.complaintId} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-mono">
                              {complaint.uniqueCode || '-'}
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-medium text-gray-800">{complaint.title}</div>
                              <div className="text-xs text-gray-500 line-clamp-1 mt-1">{complaint.description}</div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {complaint.student?.user
                                ? `${complaint.student.user.firstName} ${complaint.student.user.lastName}`
                                : 'Bilinmeyen'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {complaint.complaintType?.typeName || '-'}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                                  complaint.status
                                )}`}
                              >
                                {getStatusText(complaint.status)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {new Date(complaint.createdAt).toLocaleDateString('tr-TR')}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {complaint.responses && complaint.responses.length > 0 ? (
                                <span className="text-[#0077BE] font-medium">{complaint.responses.length}</span>
                              ) : (
                                <span className="text-gray-400">0</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {complaint.uniqueCode ? (
                                <button
                                  onClick={() => navigate(`/sikayet/${complaint.uniqueCode}`)}
                                  className="px-3 py-1.5 text-sm bg-[#0077BE] text-white rounded-md hover:bg-[#005a94] transition-colors font-medium cursor-pointer"
                                >
                                  Detay
                                </button>
                              ) : (
                                <span className="text-gray-400 text-xs">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <Pagination
                currentPage={complaintsPage}
                totalPages={complaintsTotalPages}
                total={complaintsTotal}
                onPageChange={setComplaintsPage}
              />
            </div>
          )}
        </div>
      </div>

      {/* Düzenleme Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-transparent flex items-start justify-center z-50 p-4 pt-24">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">Kullanıcı Düzenle</h2>
                <button
                  onClick={() => {
                    setEditingUser(null)
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

              <form onSubmit={handleUpdateUser} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ad <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editFormData.firstName}
                      onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0077BE]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Soyad <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editFormData.lastName}
                      onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0077BE]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    E-posta
                  </label>
                  <input
                    type="email"
                    value={editFormData.email}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Şifre (Değiştirmek için doldurun)
                  </label>
                  <input
                    type="password"
                    value={editFormData.password}
                    onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                    minLength={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0077BE]"
                    placeholder="Boş bırakılırsa değişmez"
                  />
                  <p className="mt-1 text-sm text-gray-500">Şifre değiştirmek istemiyorsanız boş bırakın</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rol <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editFormData.roleType}
                    onChange={(e) => setEditFormData({ ...editFormData, roleType: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0077BE] bg-white"
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
                    value={editFormData.phoneNumber}
                    onChange={(e) => setEditFormData({ ...editFormData, phoneNumber: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0077BE]"
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
                    onChange={handleEditPhotoChange}
                    disabled={removeEditPhoto}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0077BE] disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  {editPhotoPreview && !removeEditPhoto && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 mb-2">Yeni Fotoğraf Önizleme:</p>
                      <img
                        src={editPhotoPreview}
                        alt="Fotoğraf önizleme"
                        className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                      />
                    </div>
                  )}
                  {editingUser.photo && !editPhotoPreview && !removeEditPhoto && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 mb-2">Mevcut Fotoğraf:</p>
                      <img
                        src={`/api${editingUser.photo}`}
                        alt="Mevcut fotoğraf"
                        className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                      />
                    </div>
                  )}
                  {removeEditPhoto && (
                    <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                      <p className="text-sm text-gray-600">Fotoğraf kaldırılacak</p>
                    </div>
                  )}
                  <p className="mt-1 text-sm text-gray-500">Maksimum dosya boyutu: 5MB</p>
                  {editingUser.photo && !removeEditPhoto && (
                    <button
                      type="button"
                      onClick={() => {
                        setRemoveEditPhoto(true)
                        setEditPhoto(null)
                        setEditPhotoPreview(null)
                      }}
                      className="mt-2 px-3 py-1.5 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                    >
                      Fotoğrafı Kaldır
                    </button>
                  )}
                  {removeEditPhoto && (
                    <button
                      type="button"
                      onClick={() => {
                        setRemoveEditPhoto(false)
                        if (editingUser.photo) {
                          setEditPhotoPreview(null)
                        }
                      }}
                      className="mt-2 px-3 py-1.5 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                    >
                      İptal Et
                    </button>
                  )}
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={updating}
                    className="flex-1 px-6 py-3 bg-[#0077BE] text-white rounded-md hover:bg-[#005a94] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium cursor-pointer"
                  >
                    {updating ? 'Güncelleniyor...' : 'Güncelle'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingUser(null)
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

      {/* Şikayetler Modal */}
      {viewingComplaints && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 pt-24 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">
                  {viewingComplaints.firstName} {viewingComplaints.lastName} - Şikayetler
                </h2>
                <button
                  onClick={() => {
                    setViewingComplaints(null)
                    setUserComplaints([])
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl cursor-pointer"
                >
                  ×
                </button>
              </div>

              {loadingComplaints ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0077BE] mx-auto"></div>
                  <p className="mt-4 text-gray-600">Yükleniyor...</p>
                </div>
              ) : userComplaints.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Bu öğrencinin şikayeti bulunmamaktadır.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-2 py-2 text-left text-gray-700 font-semibold w-20">Kod</th>
                        <th className="border border-gray-300 px-3 py-2 text-left text-gray-700 font-semibold">Başlık</th>
                        <th className="border border-gray-300 px-3 py-2 text-left text-gray-700 font-semibold">Açıklama</th>
                        <th className="border border-gray-300 px-3 py-2 text-left text-gray-700 font-semibold">Tip</th>
                        <th className="border border-gray-300 px-3 py-2 text-left text-gray-700 font-semibold">Durum</th>
                        <th className="border border-gray-300 px-3 py-2 text-left text-gray-700 font-semibold">Tarih</th>
                        <th className="border border-gray-300 px-3 py-2 text-left text-gray-700 font-semibold">Cevaplar</th>
                        <th className="border border-gray-300 px-3 py-2 text-center text-gray-700 font-semibold">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userComplaints.map((complaint) => (
                        <tr key={complaint.complaintId} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-2 py-2 text-xs font-mono">
                            {complaint.uniqueCode || '-'}
                          </td>
                          <td className="border border-gray-300 px-3 py-2">
                            <div className="font-medium text-gray-800">{complaint.title}</div>
                          </td>
                          <td className="border border-gray-300 px-3 py-2">
                            <div className="max-w-md text-xs text-gray-600 line-clamp-2">{complaint.description}</div>
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-xs">
                            {complaint.complaintType?.typeName || '-'}
                          </td>
                          <td className="border border-gray-300 px-3 py-2">
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(
                                complaint.status
                              )}`}
                            >
                              {complaint.status}
                            </span>
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-xs">
                            {new Date(complaint.createdAt).toLocaleDateString('tr-TR')}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-xs">
                            {complaint.responses && complaint.responses.length > 0 ? (
                              <span className="text-[#0077BE] font-medium">{complaint.responses.length}</span>
                            ) : (
                              <span className="text-gray-400">0</span>
                            )}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-center">
                            {complaint.uniqueCode ? (
                              <button
                                onClick={() => navigate(`/sikayet/${complaint.uniqueCode}`)}
                                className="px-3 py-1 bg-[#0077BE] text-white rounded text-xs hover:bg-[#005a94] transition-colors"
                              >
                                Detay
                              </button>
                            ) : (
                              <span className="text-gray-400 text-xs">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminPanel

