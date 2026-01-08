export interface ComplaintResponse {
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

export interface Complaint {
  complaintId: number
  uniqueCode?: string
  title: string
  description: string
  status: string
  responses?: ComplaintResponse[]
  createdAt: string
  resolvedAt?: string | null
  complaintType?: {
    complaintTypeId?: number
    typeName: string
  }
  course?: {
    courseId?: number
    courseName: string
    courseCode: string
  }
  student?: {
    user?: {
      firstName: string
      lastName: string
      email: string
    }
  }
  handledByPersonnel?: {
    user?: {
      firstName: string
      lastName: string
    }
  }
  completedByPersonnel?: {
    personnelId?: number
    user?: {
      firstName: string
      lastName: string
    }
  }
  completedByUser?: {
    firstName: string
    lastName: string
  }
  completedByPersonnelId?: number | null
  completedByUserId?: number | null
  isAnonymous?: boolean
  isPublic?: boolean
}

export const getStatusColor = (status: string) => {
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

export const getStatusText = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'beklemede':
    case 'pending':
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

