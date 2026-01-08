interface RejectFormProps {
  rejectReason: string
  submitting: boolean
  onReasonChange: (value: string) => void
  onSubmit: () => void
  onCancel: () => void
}

export default function RejectForm({
  rejectReason,
  submitting,
  onReasonChange,
  onSubmit,
  onCancel,
}: RejectFormProps) {
  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Reddetme Sebebi
      </label>
      <textarea
        value={rejectReason}
        onChange={(e) => onReasonChange(e.target.value)}
        rows={4}
        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0077BE] text-base"
        placeholder="Şikayeti neden reddettiğinizi açıklayın..."
      />
      <div className="flex gap-2 mt-3">
        <button
          onClick={onSubmit}
          disabled={submitting || !rejectReason.trim()}
          className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium cursor-pointer"
        >
          {submitting ? 'Gönderiliyor...' : 'Reddet'}
        </button>
        <button
          onClick={onCancel}
          disabled={submitting}
          className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium cursor-pointer"
        >
          İptal
        </button>
      </div>
    </div>
  )
}

