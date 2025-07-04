import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'

export const dynamic = 'force-dynamic'

export default function DashboardPage() {
  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Добро пожаловать в Data Dashboard</p>
        </div>

        <div className="mt-8">
          <Card
            title="Информация о проекте"
            subtitle="Детали текущей сборки"
          >
            <div className="prose max-w-none">
              <p className="text-gray-600">
                Это базовая версия Data Dashboard. Система готова к добавлению
                специфичного функционала для работы с данными.
              </p>
              <div className="mt-4 bg-gray-50 p-4 rounded-md">
                <h4 className="font-medium text-gray-900">Следующие этапы:</h4>
                <ul className="mt-2 text-sm text-gray-600 space-y-1">
                  <li>• Добавление загрузки файлов</li>
                  <li>• Создание аналитических инструментов</li>
                  <li>• Настройка графиков и визуализации</li>
                  <li>• Расширение функционала базы данных</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  )
}