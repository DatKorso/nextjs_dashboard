import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'

export const dynamic = 'force-dynamic'

export default function SettingsPage() {
  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Настройки</h1>
          <p className="text-gray-600">Конфигурация системы и пользовательские предпочтения</p>
        </div>

        <Card
          title="Функция в разработке"
          subtitle="Эта страница находится в процессе разработки"
        >
          <div className="text-center py-12">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Настройки системы
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Панель настроек будет доступна в следующих версиях.
            </p>
            <div className="mt-6">
              <div className="bg-gray-50 rounded-md p-4">
                <h4 className="text-sm font-medium text-gray-900">Планируемые настройки:</h4>
                <ul className="mt-2 text-sm text-gray-600 text-left space-y-1">
                  <li>• Настройки подключения к БД</li>
                  <li>• Пользовательские предпочтения</li>
                  <li>• Настройки уведомлений</li>
                  <li>• Конфигурация API</li>
                  <li>• Управление пользователями</li>
                  <li>• Настройки безопасности</li>
                </ul>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  )
}