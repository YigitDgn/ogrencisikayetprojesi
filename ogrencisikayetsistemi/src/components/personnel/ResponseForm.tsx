interface ResponseFormProps {
  responseText: string
  submitting: boolean
  onResponseChange: (value: string) => void
  onSubmit: () => void
  onCancel: () => void
}

export default function ResponseForm({
  responseText,
  submitting,
  onResponseChange,
  onSubmit,
  onCancel,
}: ResponseFormProps) {
  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Cevap Yazın
      </label>
      <textarea
        value={responseText}
        onChange={(e) => onResponseChange(e.target.value)}
        rows={4}
        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0077BE] text-base"
        placeholder="Şikayete cevabınızı yazın..."
      />
      <div className="flex gap-2 mt-3">
        <button
          onClick={onSubmit}
          disabled={submitting || !responseText.trim()}
          className="px-6 py-2 bg-[#0077BE] text-white rounded-md hover:bg-[#005a94] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium cursor-pointer"
        >
          {submitting ? 'Gönderiliyor...' : 'Cevabı Gönder'}
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

