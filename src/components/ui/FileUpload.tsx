'use client'

import { useState, useRef, ChangeEvent } from 'react'
import ProgressBar from './ProgressBar'
import { showSuccessToast, showErrorToast, showWarningToast } from './Toast'
import clsx from 'clsx'

interface FileUploadProps {
  title: string
  description?: string
  acceptedTypes: string[] // ['.csv', '.xlsx']
  multiple?: boolean
  lastUploadDate?: string | null
  onUpload: (files: FileList) => Promise<void>
  disabled?: boolean
  icon?: React.ReactNode
}

type UploadStatus = 'idle' | 'uploading' | 'processing' | 'success' | 'error'

interface UploadResult {
  success: boolean
  message?: string
  details?: string[]
  recordsProcessed?: number
  warnings?: string[]
  processingTime?: number
}

export default function FileUpload({ 
  title, 
  description, 
  acceptedTypes, 
  multiple = false,
  lastUploadDate,
  onUpload,
  disabled = false,
  icon
}: FileUploadProps) {
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [lastUploadResult, setLastUploadResult] = useState<UploadResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const formatFileTypes = () => {
    return acceptedTypes.join(', ')
  }

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return
    
    // Валидация типов файлов
    const validFiles = Array.from(files).filter(file => {
      const extension = '.' + file.name.split('.').pop()?.toLowerCase()
      return acceptedTypes.some(type => type.toLowerCase() === extension)
    })

    if (validFiles.length === 0) {
      alert(`Пожалуйста, выберите файлы следующих типов: ${formatFileTypes()}`)
      return
    }

    if (validFiles.length !== files.length) {
      alert(`Некоторые файлы имеют неподдерживаемый формат. Принимаются только: ${formatFileTypes()}`)
    }

    const fileList = new DataTransfer()
    validFiles.forEach(file => fileList.items.add(file))
    setSelectedFiles(fileList.files)
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const uploadFiles = async (reportType: string, files: FileList): Promise<UploadResult[]> => {
    // Загружаем файлы по одному, так как API ожидает единичный файл
    const results: UploadResult[] = []
    
    for (const file of Array.from(files)) {
      try {
        const formData = new FormData()
        formData.append('reportType', reportType)
        formData.append('file', file)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })

        const result = await response.json()

        if (!response.ok) {
          // Обработка ошибок от сервера
          results.push({
            success: false,
            message: result.error || 'Ошибка загрузки файла',
            details: result.details || []
          })
        } else {
          // Успешная загрузка
          results.push({
            success: true,
            message: `Файл "${file.name}" успешно обработан`,
            recordsProcessed: result.recordsProcessed,
            warnings: result.warnings,
            processingTime: result.processingTime
          })
        }
      } catch (error) {
        // Сетевые или другие ошибки
        results.push({
          success: false,
          message: `Ошибка при загрузке "${file.name}"`,
          details: [error instanceof Error ? error.message : 'Неизвестная ошибка']
        })
      }
    }

    return results
  }

  const simulateProgress = async (onProgressUpdate: (progress: number) => void) => {
    // Симуляция загрузки файла (0-50%)
    for (let i = 0; i <= 50; i += 10) {
      onProgressUpdate(i)
      await new Promise(resolve => setTimeout(resolve, 150))
    }
    
    // Симуляция обработки (50-100%)
    for (let i = 55; i <= 100; i += 15) {
      onProgressUpdate(i)
      await new Promise(resolve => setTimeout(resolve, 200))
    }
  }

  const handleUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) return

    try {
      setProgress(0)
      setUploadStatus('uploading')
      setLastUploadResult(null)

      // Получаем тип отчета из title (можно передать отдельно)
      const reportTypeMap: Record<string, string> = {
        'Заказы Ozon': 'ozon_orders',
        '📄 Товары Ozon (CSV)': 'ozon_products', 
        '📊 Полные товары Ozon (Excel)': 'ozon_category_products',
        'Товары Ozon': 'ozon_products',
        'Полные товары Ozon': 'ozon_category_products',
        'Штрихкоды Ozon': 'ozon_barcodes',
        'Товары Wildberries': 'wb_products',
        'Цены Wildberries': 'wb_prices'
      }
      
      const reportType = reportTypeMap[title]
      if (!reportType) {
        throw new Error('Неизвестный тип отчета')
      }

      // Симуляция прогресса и реальная загрузка
      const progressPromise = simulateProgress(setProgress)
      const uploadPromise = uploadFiles(reportType, selectedFiles)

      const [, results] = await Promise.all([progressPromise, uploadPromise])

      // Обработка результатов
      const successCount = results.filter(r => r.success).length
      const errorCount = results.filter(r => !r.success).length
      const totalRecords = results.reduce((sum, r) => sum + (r.recordsProcessed || 0), 0)
      const allWarnings = results.flatMap(r => r.warnings || [])

      if (errorCount === 0) {
        // Все файлы загружены успешно
        setUploadStatus('success')
        
        const resultSummary: UploadResult = {
          success: true,
          message: successCount === 1 ? 'Файл успешно обработан' : `Все ${successCount} файлов успешно обработаны`,
          recordsProcessed: totalRecords,
          warnings: allWarnings
        }
        setLastUploadResult(resultSummary)

        // Показываем Toast с результатами
        if (allWarnings.length > 0) {
          showWarningToast(
            'Загрузка завершена с предупреждениями',
            `Обработано записей: ${totalRecords}`,
            allWarnings
          )
        } else {
          showSuccessToast(
            'Файлы успешно загружены',
            `Обработано записей: ${totalRecords}`
          )
        }
      } else if (successCount === 0) {
        // Все файлы с ошибками
        setUploadStatus('error')
        
        const allErrors = results.flatMap(r => r.details || [r.message || 'Неизвестная ошибка'])
        const resultSummary: UploadResult = {
          success: false,
          message: `Ошибка при загрузке ${errorCount === 1 ? 'файла' : 'файлов'}`,
          details: allErrors
        }
        setLastUploadResult(resultSummary)

        showErrorToast(
          'Ошибка загрузки файлов',
          `Не удалось загрузить ${errorCount} файлов`,
          allErrors
        )
      } else {
        // Частично успешно
        setUploadStatus('success')
        
        const allErrors = results.filter(r => !r.success).flatMap(r => r.details || [r.message || 'Неизвестная ошибка'])
        const resultSummary: UploadResult = {
          success: true,
          message: `Частично успешно: ${successCount} из ${results.length} файлов`,
          recordsProcessed: totalRecords,
          warnings: allWarnings,
          details: allErrors
        }
        setLastUploadResult(resultSummary)

        showWarningToast(
          'Частично успешная загрузка',
          `Загружено: ${successCount}, ошибок: ${errorCount}`,
          allErrors
        )
      }
      
      // Вызов callback
      await onUpload(selectedFiles)
      
      // Сброс через 5 секунд
      setTimeout(() => {
        setUploadStatus('idle')
        setProgress(0)
        setSelectedFiles(null)
        setLastUploadResult(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }, 5000)

    } catch (error) {
      setUploadStatus('error')
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка'
      
      const resultSummary: UploadResult = {
        success: false,
        message: 'Критическая ошибка загрузки',
        details: [errorMessage]
      }
      setLastUploadResult(resultSummary)

      showErrorToast(
        'Критическая ошибка',
        errorMessage
      )
      
      // Сброс через 5 секунд при ошибке
      setTimeout(() => {
        setUploadStatus('idle')
        setProgress(0)
        setLastUploadResult(null)
      }, 5000)
    }
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  const getSelectedFilesInfo = () => {
    if (!selectedFiles) return null
    
    if (selectedFiles.length === 1) {
      return selectedFiles[0].name
    }
    
    return `${selectedFiles.length} файлов выбрано`
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start space-x-3">
        {icon && (
          <div className="flex-shrink-0 text-gray-400">
            {icon}
          </div>
        )}
        <div className="flex-1">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          {description && (
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          )}
        </div>
      </div>

      {/* File Drop Zone */}
      <div
        className={clsx(
          'border-2 border-dashed rounded-lg p-6 text-center transition-colors',
          isDragOver
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(',')}
          multiple={multiple}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />
        
        <div className="space-y-2">
          <div className="text-gray-600">
            <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          
          <div>
            <button
              type="button"
              onClick={openFileDialog}
              disabled={disabled}
              className="text-blue-600 hover:text-blue-500 font-medium disabled:text-gray-400"
            >
              Выберите файл{multiple ? 'ы' : ''}
            </button>
            <span className="text-gray-500"> или перетащите сюда</span>
          </div>
          
          <p className="text-xs text-gray-500">
            Поддерживаемые форматы: {formatFileTypes()}
            {multiple && ' (можно выбрать несколько файлов)'}
          </p>
        </div>
      </div>

      {/* Selected Files Info */}
      {selectedFiles && (
        <div className="bg-gray-50 rounded-md p-3">
          <div className="text-sm text-gray-700">
            <strong>Выбрано:</strong> {getSelectedFilesInfo()}
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <ProgressBar 
        progress={progress} 
        status={uploadStatus}
      />

      {/* Upload Results */}
      {lastUploadResult && (
        <div className={clsx(
          'rounded-md p-3 text-sm',
          lastUploadResult.success 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        )}>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {lastUploadResult.success ? (
                <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <div className="ml-3 flex-1">
              <p className={clsx(
                'font-medium',
                lastUploadResult.success ? 'text-green-800' : 'text-red-800'
              )}>
                {lastUploadResult.message}
              </p>
              
              {/* Детали результата */}
              {lastUploadResult.recordsProcessed && (
                <p className={clsx(
                  'mt-1 text-xs',
                  lastUploadResult.success ? 'text-green-600' : 'text-red-600'
                )}>
                  Обработано записей: {lastUploadResult.recordsProcessed.toLocaleString()}
                  {lastUploadResult.processingTime && (
                    <span className="ml-2">
                      (время: {lastUploadResult.processingTime}мс)
                    </span>
                  )}
                </p>
              )}
              
              {/* Предупреждения */}
              {lastUploadResult.warnings && lastUploadResult.warnings.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-yellow-600 font-medium">
                    Предупреждения ({lastUploadResult.warnings.length}):
                  </p>
                  <ul className="mt-1 text-xs text-yellow-600 space-y-1">
                    {lastUploadResult.warnings.slice(0, 3).map((warning, index) => (
                      <li key={index} className="border-l-2 border-yellow-300 pl-2">
                        {warning}
                      </li>
                    ))}
                    {lastUploadResult.warnings.length > 3 && (
                      <li className="text-yellow-500 italic">
                        ... и еще {lastUploadResult.warnings.length - 3} предупреждений
                      </li>
                    )}
                  </ul>
                </div>
              )}
              
              {/* Ошибки */}
              {lastUploadResult.details && lastUploadResult.details.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-red-600 font-medium">
                    Ошибки ({lastUploadResult.details.length}):
                  </p>
                  <ul className="mt-1 text-xs text-red-600 space-y-1">
                    {lastUploadResult.details.slice(0, 3).map((detail, index) => (
                      <li key={index} className="border-l-2 border-red-300 pl-2">
                        {detail}
                      </li>
                    ))}
                    {lastUploadResult.details.length > 3 && (
                      <li className="text-red-500 italic">
                        ... и еще {lastUploadResult.details.length - 3} ошибок
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upload Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleUpload}
          disabled={!selectedFiles || uploadStatus !== 'idle' || disabled}
          className={clsx(
            'px-4 py-2 rounded-md font-medium text-sm transition-colors',
            selectedFiles && uploadStatus === 'idle' && !disabled
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          )}
        >
          {uploadStatus === 'uploading' || uploadStatus === 'processing' 
            ? 'Загрузка...' 
            : 'Загрузить'}
        </button>

        {/* Last Upload Date */}
        {lastUploadDate && (
          <div className="text-sm text-gray-500">
            Последняя загрузка: {new Date(lastUploadDate).toLocaleDateString('ru-RU', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        )}
      </div>
    </div>
  )
} 