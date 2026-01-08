interface PaginationProps {
  currentPage: number
  totalPages: number
  total: number
  onPageChange: (page: number) => void
}

export default function Pagination({
  currentPage,
  totalPages,
  total,
  onPageChange,
}: PaginationProps) {
  // NaN veya geçersiz değerleri kontrol et
  const safeTotalPages = isNaN(totalPages) || totalPages < 1 ? 1 : totalPages
  const safeTotal = isNaN(total) ? 0 : total
  const safeCurrentPage = isNaN(currentPage) || currentPage < 1 ? 1 : currentPage

  if (safeTotalPages <= 1) return null

  return (
    <div className="flex justify-center items-center gap-2 mt-6">
      <button
        onClick={() => onPageChange(Math.max(1, safeCurrentPage - 1))}
        disabled={safeCurrentPage === 1}
        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        Önceki
      </button>
      <span className="text-gray-700">
        Sayfa {safeCurrentPage} / {safeTotalPages} (Toplam: {safeTotal})
      </span>
      <button
        onClick={() => onPageChange(Math.min(safeTotalPages, safeCurrentPage + 1))}
        disabled={safeCurrentPage === safeTotalPages}
        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        Sonraki
      </button>
    </div>
  )
}

