import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'

export const dynamic = 'force-dynamic'

export default function ImportPage() {
  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Импорт данных</h1>
          <p className="text-gray-600">Загрузка и обработка файлов данных</p>
        </div>

        <Card
          title="Функция в разработке"
          subtitle="Эта страница находится в процессе разработки"
        >
          <div className="text-center py-12">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
              <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Импорт данных
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Функциональность импорта файлов будет добавлена в следующих версиях.
            </p>
            <div className="mt-6">
              <div className="bg-gray-50 rounded-md p-4">
                <h4 className="text-sm font-medium text-gray-900">Планируемые возможности:</h4>
                <ul className="mt-2 text-sm text-gray-600 text-left space-y-1">
                  <li>• Загрузка CSV/Excel файлов</li>
                  <li>• Валидация данных</li>
                  <li>• Предварительный просмотр</li>
                  <li>• Настройка маппинга полей</li>
                  <li>• Пакетная обработка</li>
                </ul>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  )
}