interface PersonnelTabNavigationProps {
  activeTab: 'pending' | 'answered' | 'completed'
  pendingTotal: number
  answeredTotal: number
  completedTotal: number
  onTabChange: (tab: 'pending' | 'answered' | 'completed') => void
}

export default function PersonnelTabNavigation({
  activeTab,
  pendingTotal,
  answeredTotal,
  completedTotal,
  onTabChange,
}: PersonnelTabNavigationProps) {
  return (
    <div className="flex gap-4 mb-6 border-b border-gray-200">
      <button
        onClick={() => onTabChange('pending')}
        className={`px-6 py-3 font-medium transition-colors cursor-pointer ${
          activeTab === 'pending'
            ? 'text-[#0077BE] border-b-2 border-[#0077BE]'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        Bekleyen Şikayetler ({pendingTotal})
      </button>
      <button
        onClick={() => onTabChange('answered')}
        className={`px-6 py-3 font-medium transition-colors cursor-pointer ${
          activeTab === 'answered'
            ? 'text-[#0077BE] border-b-2 border-[#0077BE]'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        Cevaplanan Şikayetler ({answeredTotal})
      </button>
      <button
        onClick={() => onTabChange('completed')}
        className={`px-6 py-3 font-medium transition-colors cursor-pointer ${
          activeTab === 'completed'
            ? 'text-[#0077BE] border-b-2 border-[#0077BE]'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        Tamamlanan Şikayetler ({completedTotal})
      </button>
    </div>
  )
}

