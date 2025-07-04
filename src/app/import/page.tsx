'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import Tabs from '@/components/ui/Tabs'
import FileUpload from '@/components/ui/FileUpload'
import { ToastContainer } from '@/components/ui/Toast'

export const dynamic = 'force-dynamic'

// Типы отчетов для каждой платформы
const REPORT_TYPES = {
  ozon: [
    {
      id: 'orders',
      title: 'Заказы Ozon',
      description: 'Отчет по заказам с маркетплейса Ozon',
      acceptedTypes: ['.csv'],
      multiple: false,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      id: 'products',
      title: '📄 Товары Ozon (CSV)',
      description: 'Отчет по товарам и их характеристикам (CSV формат, лист &quot;Товары и цены&quot;)',
      acceptedTypes: ['.csv'],
      multiple: false,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      )
    },
    {
      id: 'full-products',
      title: '📊 Полные товары Ozon (Excel)',
      description: 'Полная информация по товарам (Excel файлы с листами: &quot;Шаблон&quot;, &quot;Озон.Видео&quot;, &quot;Озон.Видеообложка&quot;)',
      acceptedTypes: ['.xlsx'],
      multiple: true,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      )
    },
    {
      id: 'barcodes',
      title: 'Штрихкоды Ozon',
      description: 'Справочник штрихкодов товаров',
      acceptedTypes: ['.xlsx'],
      multiple: false,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V4a1 1 0 00-1-1H5a1 1 0 00-1 1v3a1 1 0 001 1zm12 0h2a1 1 0 001-1V4a1 1 0 00-1-1h-2a1 1 0 00-1 1v3a1 1 0 001 1zM5 20h2a1 1 0 001-1v-3a1 1 0 00-1-1H5a1 1 0 00-1 1v3a1 1 0 001 1z" />
        </svg>
      )
    }
  ],
  wildberries: [
    {
      id: 'wb-products',
      title: 'Товары Wildberries',
      description: 'Отчет по товарам Wildberries (может быть несколько файлов)',
      acceptedTypes: ['.xlsx'],
      multiple: true,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      )
    },
    {
      id: 'wb-prices',
      title: 'Цены Wildberries',
      description: 'Отчет по ценам и скидкам',
      acceptedTypes: ['.xlsx'],
      multiple: false,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  ]
}

interface UploadStats {
  successful: number
  errors: number
  totalRecords: number
}

interface UploadHistory {
  id: number
  reportType: string
  fileName: string
  status: string
  recordsCount?: number
  errorMessage?: string
  createdAt: string
  completedAt?: string
}

interface RecentErrors {
  reportType: string
  fileName: string
  errorMessage: string
  timestamp: string
}

export default function ImportPage() {
  const [activeTab, setActiveTab] = useState('ozon')
  const [uploadStats, setUploadStats] = useState<UploadStats>({
    successful: 0,
    errors: 0,
    totalRecords: 0
  })
  const [uploadHistory, setUploadHistory] = useState<UploadHistory[]>([])
  const [recentErrors, setRecentErrors] = useState<RecentErrors[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Загрузка статистики и истории загрузок
  const fetchUploadData = async () => {
    try {
      const response = await fetch('/api/upload')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          setUploadHistory(data.data)
          
          // Вычисляем статистику
          const stats = data.data.reduce((acc: UploadStats, upload: UploadHistory) => {
            if (upload.status === 'completed') {
              acc.successful++
              acc.totalRecords += upload.recordsCount || 0
            } else if (upload.status === 'failed') {
              acc.errors++
            }
            return acc
          }, { successful: 0, errors: 0, totalRecords: 0 })
          
          setUploadStats(stats)
          
          // Извлекаем последние ошибки для отображения
          const errors = data.data
            .filter((upload: UploadHistory) => upload.status === 'failed' && upload.errorMessage)
            .slice(0, 5) // Последние 5 ошибок
            .map((upload: UploadHistory) => ({
              reportType: upload.reportType,
              fileName: upload.fileName,
              errorMessage: upload.errorMessage || 'Неизвестная ошибка',
              timestamp: upload.createdAt
            }))
          
          setRecentErrors(errors)
        }
      }
    } catch (error) {
      console.error('Error fetching upload data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUploadData()
  }, [])

  // Обработчик загрузки файлов
  const handleFileUpload = async (reportId: string, files: FileList) => {
    // Map frontend report IDs to backend report types
    const reportTypeMap: Record<string, string> = {
      'orders': 'ozon_orders',
      'products': 'ozon_products',
      'full-products': 'ozon_category_products',
      'barcodes': 'ozon_barcodes',
      'wb-products': 'wb_products',
      'wb-prices': 'wb_prices'
    }
    
    const backendReportType = reportTypeMap[reportId] || reportId
    console.log(`Uploading ${backendReportType}:`, Array.from(files).map(f => f.name))
    
    // Обновляем данные после загрузки
    await fetchUploadData()
  }

  // Получение даты последней загрузки для конкретного типа отчета
  const getLastUploadDate = (reportId: string): string | null => {
    const reportTypeMap: Record<string, string> = {
      'orders': 'ozon_orders',
      'products': 'ozon_products',
      'full-products': 'ozon_category_products',
      'barcodes': 'ozon_barcodes',
      'wb-products': 'wb_products',
      'wb-prices': 'wb_prices'
    }
    
    const backendType = reportTypeMap[reportId]
    const lastUpload = uploadHistory
      .filter(upload => upload.reportType === backendType && upload.status === 'completed')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
    
    return lastUpload ? lastUpload.createdAt : null
  }

  const tabs = [
    {
      id: 'ozon',
      label: 'Ozon',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      )
    },
    {
      id: 'wildberries',
      label: 'Wildberries',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 3H3m4 10v6a1 1 0 001 1h12a1 1 0 001-1v-6M7 13v-2a1 1 0 011-1h8a1 1 0 011 1v2m-9 4h.01M18 17h.01" />
        </svg>
      )
    }
  ]

  const renderReportCards = (reportTypes: typeof REPORT_TYPES.ozon) => {
    return (
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        {reportTypes.map((report) => (
          <FileUpload
            key={report.id}
            title={report.title}
            description={report.description}
            acceptedTypes={report.acceptedTypes}
            multiple={report.multiple}
            lastUploadDate={getLastUploadDate(report.id)}
            onUpload={(files) => handleFileUpload(report.id, files)}
            icon={report.icon}
          />
        ))}
      </div>
    )
  }

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Импорт отчетов</h1>
          <p className="text-gray-600 mt-2">
            Загрузка и обработка отчетов с маркетплейсов Ozon и Wildberries
          </p>
          
          {/* Quick Guide for File Types */}
          <div className="mt-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Выберите правильный тип импорта для ваших файлов:
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">📄</span>
                      <div>
                        <strong>CSV файлы</strong> → &quot;Товары Ozon (CSV)&quot;
                        <br />
                        <span className="text-xs">содержат лист &quot;Товары и цены&quot;</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">📊</span>
                      <div>
                        <strong>Excel файлы</strong> → &quot;Полные товары Ozon (Excel)&quot;
                        <br />
                        <span className="text-xs">содержат листы &quot;Шаблон&quot;, &quot;Озон.Видео&quot;</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Успешных загрузок
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">{isLoading ? '...' : uploadStats.successful}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Ошибок обработки
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">{isLoading ? '...' : uploadStats.errors}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 12l2 2 4-4" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Обработано записей
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">{isLoading ? '...' : uploadStats.totalRecords.toLocaleString()}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Errors Section */}
        {recentErrors.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <svg className="h-5 w-5 text-red-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Последние ошибки загрузки
              </h2>
              <span className="text-sm text-gray-500">
                {recentErrors.length} ошибок
              </span>
            </div>
            <div className="space-y-3">
              {recentErrors.map((error, index) => (
                <div key={index} className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {error.reportType}
                        </span>
                        <span className="ml-2 text-sm font-medium text-gray-900">
                          {error.fileName}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-red-700">
                        {error.errorMessage}
                      </p>
                    </div>
                    <div className="ml-4 text-xs text-gray-500">
                      {new Date(error.timestamp).toLocaleDateString('ru-RU', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs and Content */}
        <div className="bg-white shadow rounded-lg p-6">
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          >
            {activeTab === 'ozon' && (
              <div className="space-y-6">
                <div className="border-l-4 border-blue-400 bg-blue-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-700">
                        <strong>Важно:</strong> Выберите правильный тип импорта:
                      </p>
                      <ul className="text-sm text-blue-700 mt-2 ml-4 list-disc">
                        <li><strong>&quot;Товары Ozon&quot;</strong> - для CSV файлов с листом &quot;Товары и цены&quot;</li>
                        <li><strong>&quot;Полные товары Ozon&quot;</strong> - для Excel файлов с листами &quot;Шаблон&quot;, &quot;Озон.Видео&quot;, &quot;Озон.Видеообложка&quot;</li>
                      </ul>
                      <p className="text-sm text-blue-700 mt-2">
                        Проверьте корректность кодировки (UTF-8) перед загрузкой.
                      </p>
                    </div>
                  </div>
                </div>
                {renderReportCards(REPORT_TYPES.ozon)}
              </div>
            )}

            {activeTab === 'wildberries' && (
              <div className="space-y-6">
                <div className="border-l-4 border-purple-400 bg-purple-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-purple-700">
                        <strong>Особенности Wildberries:</strong> Некоторые отчеты могут состоять из нескольких файлов. 
                        Загружайте все связанные файлы одновременно для корректной обработки.
                      </p>
                    </div>
                  </div>
                </div>
                {renderReportCards(REPORT_TYPES.wildberries)}
              </div>
            )}
          </Tabs>
        </div>

        {/* Footer with Instructions */}
        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Инструкции по загрузке
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Поддерживаемые форматы:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• <strong>CSV файлы:</strong> с разделителем &quot;;&quot; или &quot;,&quot; (UTF-8)</li>
                <li>• <strong>Excel файлы:</strong> формат .xlsx</li>
                <li>• <strong>Максимальный размер:</strong> 500 МБ на файл</li>
                <li>• <strong>Множественная загрузка:</strong> до 10 файлов одновременно</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Рекомендации:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Проверьте данные перед загрузкой</li>
                <li>• Убедитесь в корректности структуры файлов</li>
                <li>• Файлы обрабатываются в фоновом режиме</li>
                <li>• При ошибках повторите загрузку</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      {/* Toast Container for notifications */}
      <ToastContainer />
    </Layout>
  )
}