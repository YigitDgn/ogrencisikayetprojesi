import type { Complaint } from '../../types/Complaint'
import { getStatusColor, getStatusText } from '../../types/Complaint'
import ResponseForm from './ResponseForm'
import RejectForm from './RejectForm'

interface PendingComplaintCardProps {
  complaint: Complaint
  respondingTo: number | null
  rejectingTo: number | null
  responseText: string
  rejectReason: string
  submitting: boolean
  onResponseTextChange: (value: string) => void
  onRejectReasonChange: (value: string) => void
  onRespondClick: (complaintId: number) => void
  onRejectClick: (complaintId: number) => void
  onRespondSubmit: (complaintId: number) => void
  onRejectSubmit: (complaintId: number) => void
  onCancel: () => void
}

export default function PendingComplaintCard({
  complaint,
  respondingTo,
  rejectingTo,
  responseText,
  rejectReason,
  submitting,
  onResponseTextChange,
  onRejectReasonChange,
  onRespondClick,
  onRejectClick,
  onRespondSubmit,
  onRejectSubmit,
  onCancel,
}: PendingComplaintCardProps) {
  return (
    <div className="border border-gray-300 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {complaint.title}
          </h3>
          <div className="flex flex-wrap gap-2 mb-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(complaint.status)}`}>
              {getStatusText(complaint.status)}
            </span>
            {complaint.complaintType && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                {complaint.complaintType.typeName}
              </span>
            )}
            {complaint.course && (
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                {complaint.course.courseName}
              </span>
            )}
          </div>
        </div>
        <span className="text-sm text-gray-500">
          {new Date(complaint.createdAt).toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>

      <div className="mb-4">
        <p className="text-gray-700 mb-2">
          <span className="font-semibold">Öğrenci:</span>{' '}
          {complaint.isAnonymous
            ? 'İsimsiz'
            : complaint.student?.user
            ? `${complaint.student.user.firstName} ${complaint.student.user.lastName}`
            : 'Bilinmeyen'}
        </p>
        <p className="text-gray-700 whitespace-pre-wrap">{complaint.description}</p>
      </div>

      {respondingTo === complaint.complaintId ? (
        <ResponseForm
          responseText={responseText}
          submitting={submitting}
          onResponseChange={onResponseTextChange}
          onSubmit={() => onRespondSubmit(complaint.complaintId)}
          onCancel={onCancel}
        />
      ) : rejectingTo === complaint.complaintId ? (
        <RejectForm
          rejectReason={rejectReason}
          submitting={submitting}
          onReasonChange={onRejectReasonChange}
          onSubmit={() => onRejectSubmit(complaint.complaintId)}
          onCancel={onCancel}
        />
      ) : (
        <div className="flex gap-2">
          <button
            onClick={() => onRespondClick(complaint.complaintId)}
            className="px-6 py-2 bg-[#0077BE] text-white rounded-md hover:bg-[#005a94] transition-colors font-medium cursor-pointer"
          >
            Cevap Yaz
          </button>
          <button
            onClick={() => onRejectClick(complaint.complaintId)}
            className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium cursor-pointer"
          >
            Reddet
          </button>
        </div>
      )}
    </div>
  )
}

