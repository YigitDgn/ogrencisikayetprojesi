interface PersonnelFiltersProps {
  searchTerm: string
  sortBy: string
  sortOrder: 'ASC' | 'DESC'
  complaintTypeId: string
  complaintTypes: Array<{ complaintTypeId: number; typeName: string }>
  onSearchChange: (value: string) => void
  onSortByChange: (value: string) => void
  onSortOrderChange: (value: 'ASC' | 'DESC') => void
  onComplaintTypeChange: (value: string) => void
}

export default function PersonnelFilters({
  searchTerm,
  sortBy,
  sortOrder,
  complaintTypeId,
  complaintTypes,
  onSearchChange,
  onSortByChange,
  onSortOrderChange,
  onComplaintTypeChange,
}: PersonnelFiltersProps) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Ara</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Başlık veya açıklama ara..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0077BE]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tipi</label>
          <select
            value={complaintTypeId}
            onChange={(e) => onComplaintTypeChange(e.target.value)}
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
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value)}
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
            value={sortOrder}
            onChange={(e) => onSortOrderChange(e.target.value as 'ASC' | 'DESC')}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0077BE] bg-white"
          >
            <option value="DESC">Azalan</option>
            <option value="ASC">Artan</option>
          </select>
        </div>
      </div>
    </div>
  )
}

