'use client'

import Button from '@/components/ui/Button'

export default function DashboardActions() {
  const handleLoadData = () => {
    alert('Функция в разработке')
  }

  const handleCreateReport = () => {
    alert('Функция в разработке')
  }

  return (
    <div className="space-y-2">
      <Button
        variant="primary"
        size="sm"
        className="w-full"
        onClick={handleLoadData}
      >
        Загрузить данные
      </Button>
      <Button
        variant="secondary"
        size="sm"
        className="w-full"
        onClick={handleCreateReport}
      >
        Создать отчет
      </Button>
    </div>
  )
} 