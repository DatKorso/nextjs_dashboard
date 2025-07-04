import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'

export const dynamic = 'force-dynamic'

export default function ProblematicCardsPage() {
  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Проблемные карточки</h1>
          <p className="text-gray-600">Анализ и выявление проблемных товарных карточек</p>
        </div>

        <Card
          title="Функция в разработке"
          subtitle="Эта страница находится в процессе разработки"
        >
          <div className="text-center py-12">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.864-.833-2.634 0L4.18 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Анализ проблемных карточек
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Система анализа проблемных товарных карточек будет добавлена в следующих версиях.
            </p>
            <div className="mt-6">
              <div className="bg-gray-50 rounded-md p-4">
                <h4 className="text-sm font-medium text-gray-900">Планируемые возможности:</h4>
                <ul className="mt-2 text-sm text-gray-600 text-left space-y-1">
                  <li>• Детекция карточек с низким рейтингом</li>
                  <li>• Анализ отсутствующих изображений</li>
                  <li>• Проверка корректности описаний</li>
                  <li>• Выявление нарушений модерации</li>
                  <li>• Отчеты по проблемным товарам</li>
                  <li>• Рекомендации по исправлению</li>
                </ul>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  )
}