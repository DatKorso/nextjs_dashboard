import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'

export const dynamic = 'force-dynamic'

export default function SearchPage() {
  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Поиск между МП</h1>
          <p className="text-gray-600">Инструмент для поиска и сравнения товаров между маркетплейсами</p>
        </div>

        <Card
          title="Функция в разработке"
          subtitle="Эта страница находится в процессе разработки"
        >
          <div className="text-center py-12">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Поиск между маркетплейсами
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Инструмент для кросс-поиска товаров будет добавлен в следующих версиях.
            </p>
            <div className="mt-6">
              <div className="bg-gray-50 rounded-md p-4">
                <h4 className="text-sm font-medium text-gray-900">Планируемые возможности:</h4>
                <ul className="mt-2 text-sm text-gray-600 text-left space-y-1">
                  <li>• Поиск по артикулу/названию</li>
                  <li>• Сравнение цен между МП</li>
                  <li>• Анализ конкурентов</li>
                  <li>• Отслеживание изменений</li>
                  <li>• Экспорт результатов</li>
                  <li>• Интеграция с Ozon и Wildberries API</li>
                </ul>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  )
}