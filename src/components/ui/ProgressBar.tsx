interface ProgressBarProps {
  progress: number // 0-100
  status?: 'idle' | 'uploading' | 'processing' | 'success' | 'error'
  message?: string
}

export default function ProgressBar({ progress, status = 'idle', message }: ProgressBarProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'uploading':
        return 'bg-blue-500'
      case 'processing':
        return 'bg-yellow-500'
      case 'success':
        return 'bg-green-500'
      case 'error':
        return 'bg-red-500'
      default:
        return 'bg-gray-300'
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'uploading':
        return 'Загрузка файла...'
      case 'processing':
        return 'Обработка данных...'
      case 'success':
        return 'Загрузка завершена!'
      case 'error':
        return 'Ошибка загрузки'
      default:
        return ''
    }
  }

  if (status === 'idle') {
    return null
  }

  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between items-center text-sm">
        <span className="font-medium text-gray-700">
          {message || getStatusText()}
        </span>
        <span className="text-gray-500">
          {progress}%
        </span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className={`h-2.5 rounded-full transition-all duration-300 ease-out ${getStatusColor()}`}
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      {status === 'error' && (
        <div className="text-red-600 text-sm">
          Попробуйте загрузить файл еще раз
        </div>
      )}
    </div>
  )
} 