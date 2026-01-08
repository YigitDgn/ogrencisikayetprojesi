import type { Complaint } from '../../types/Complaint'
import { getStatusColor, getStatusText } from '../../types/Complaint'
import ResponseForm from './ResponseForm'

interface AnsweredComplaintCardProps {
  complaint: Complaint
  respondingTo: number | null
  responseText: string
  submitting: boolean
  onResponseTextChange: (text: string) => void
  onRespondClick: (complaintId: number) => void
  onRespondSubmit: (complaintId: number) => void
  onCancel: () => void
}

export default function AnsweredComplaintCard({
  complaint,
  respondingTo,
  responseText,
  submitting,
  onResponseTextChange,
  onRespondClick,
  onRespondSubmit,
  onCancel,
}: AnsweredComplaintCardProps) {
  // Son response'u bul (öğrenci yanıtı olan en son response)
  const lastResponse = complaint.responses
    ?.filter((r) => r.personnelResponse)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]

  const hasStudentResponse = lastResponse?.studentResponse

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
        <div className="text-right">
          <span className="text-sm text-gray-500 block">
            Oluşturulma: {new Date(complaint.createdAt).toLocaleDateString('tr-TR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </span>
          {complaint.resolvedAt && (
            <span className="text-sm text-gray-500 block mt-1">
              Cevaplanma: {new Date(complaint.resolvedAt).toLocaleDateString('tr-TR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          )}
        </div>
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
        <div className="bg-gray-50 p-4 rounded-lg mb-3">
          <p className="text-sm font-semibold text-gray-700 mb-2">Şikayet:</p>
          <p className="text-gray-700 whitespace-pre-wrap">{complaint.description}</p>
        </div>
        {complaint.responses && complaint.responses.length > 0 && (
          <>
            {complaint.responses
              .filter((r) => r.personnelResponse)
              .map((response) => (
                <div key={response.responseId} className="bg-blue-50 p-4 rounded-lg mb-3">
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
                  {response.studentResponse && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm font-semibold text-green-700 mb-2">Öğrenci Yanıtı:</p>
                      <p className="text-gray-700 whitespace-pre-wrap">{response.studentResponse}</p>
                    </div>
                  )}
                </div>
              ))}
          </>
        )}
      </div>

      {/* Öğrenci yanıtı varsa personel tekrar cevap verebilir */}
      {hasStudentResponse && (
        <div className="mt-4">
          {respondingTo === complaint.complaintId ? (
            <ResponseForm
              responseText={responseText}
              submitting={submitting}
              onResponseChange={onResponseTextChange}
              onSubmit={() => onRespondSubmit(complaint.complaintId)}
              onCancel={onCancel}
            />
          ) : (
            <button
              onClick={() => onRespondClick(complaint.complaintId)}
              className="px-6 py-2 bg-[#0077BE] text-white rounded-md hover:bg-[#005a94] transition-colors font-medium cursor-pointer"
            >
              Yanıt Ver
            </button>
          )}
        </div>
      )}
    </div>
  )
}

