'use client'

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'

export interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  details?: string[]
  duration?: number
  actions?: ToastAction[]
}

export interface ToastAction {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary'
}

interface ToastProps {
  toast: ToastMessage
  onRemove: (id: string) => void
}

interface ToastProviderProps {
  children: React.ReactNode
}

// Контекст для управления Toast
let toastListeners: ((toasts: ToastMessage[]) => void)[] = []
let toastQueue: ToastMessage[] = []

export const addToast = (toast: Omit<ToastMessage, 'id'>): string => {
  const id = Math.random().toString(36).substring(2, 15)
  const newToast: ToastMessage = {
    ...toast,
    id,
    duration: toast.duration ?? (toast.type === 'error' ? 8000 : 5000)
  }
  
  toastQueue = [...toastQueue, newToast]
  toastListeners.forEach(listener => listener(toastQueue))
  
  // Автоматическое удаление
  if (newToast.duration && newToast.duration > 0) {
    setTimeout(() => {
      removeToast(id)
    }, newToast.duration)
  }
  
  return id
}

export const removeToast = (id: string): void => {
  toastQueue = toastQueue.filter(toast => toast.id !== id)
  toastListeners.forEach(listener => listener(toastQueue))
}

export const clearAllToasts = (): void => {
  toastQueue = []
  toastListeners.forEach(listener => listener(toastQueue))
}

// Хук для использования Toast
export const useToast = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>(toastQueue)

  useEffect(() => {
    toastListeners.push(setToasts)
    return () => {
      toastListeners = toastListeners.filter(listener => listener !== setToasts)
    }
  }, [])

  return {
    toasts,
    addToast,
    removeToast,
    clearAllToasts
  }
}

// Компонент отдельного Toast
function Toast({ toast, onRemove }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    // Анимация появления
    requestAnimationFrame(() => {
      setIsVisible(true)
    })
  }, [])

  const handleRemove = useCallback(() => {
    setIsVisible(false)
    // Ждем окончания анимации перед удалением
    setTimeout(() => {
      onRemove(toast.id)
    }, 300)
  }, [toast.id, onRemove])

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return (
          <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'error':
        return (
          <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'warning':
        return (
          <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        )
      case 'info':
        return (
          <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
    }
  }

  const getBorderColor = () => {
    switch (toast.type) {
      case 'success': return 'border-green-200'
      case 'error': return 'border-red-200'
      case 'warning': return 'border-yellow-200'
      case 'info': return 'border-blue-200'
    }
  }

  return (
    <div
      className={clsx(
        'relative w-full max-w-sm bg-white shadow-lg rounded-lg border pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden',
        getBorderColor(),
        'transform transition-all duration-300 ease-in-out',
        isVisible
          ? 'translate-x-0 opacity-100 scale-100'
          : 'translate-x-full opacity-0 scale-95'
      )}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="ml-3 w-0 flex-1">
            <p className="text-sm font-medium text-gray-900">
              {toast.title}
            </p>
            {toast.message && (
              <p className="mt-1 text-sm text-gray-500">
                {toast.message}
              </p>
            )}
            
            {/* Детали ошибок */}
            {toast.details && toast.details.length > 0 && (
              <div className="mt-2">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-xs text-gray-400 hover:text-gray-600 underline"
                >
                  {isExpanded ? 'Скрыть детали' : `Показать детали (${toast.details.length})`}
                </button>
                {isExpanded && (
                  <div className="mt-2 max-h-32 overflow-y-auto">
                    <ul className="text-xs text-gray-600 space-y-1">
                      {toast.details.slice(0, 10).map((detail, index) => (
                        <li key={index} className="border-l-2 border-gray-200 pl-2">
                          {detail}
                        </li>
                      ))}
                      {toast.details.length > 10 && (
                        <li className="text-gray-400 italic">
                          ... и еще {toast.details.length - 10} ошибок
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )}
            
            {/* Кнопки действий */}
            {toast.actions && toast.actions.length > 0 && (
              <div className="mt-3 flex space-x-2">
                {toast.actions.map((action, index) => (
                  <button
                    key={index}
                    onClick={action.onClick}
                    className={clsx(
                      'px-2 py-1 rounded text-xs font-medium transition-colors',
                      action.variant === 'primary'
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    )}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500"
              onClick={handleRemove}
            >
              <span className="sr-only">Закрыть</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Прогресс-бар для автоматического закрытия */}
      {toast.duration && toast.duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
          <div 
            className={clsx(
              'h-full transition-all ease-linear',
              toast.type === 'success' && 'bg-green-400',
              toast.type === 'error' && 'bg-red-400',
              toast.type === 'warning' && 'bg-yellow-400',
              toast.type === 'info' && 'bg-blue-400'
            )}
            style={{
              animation: `shrink ${toast.duration}ms linear forwards`
            }}
          />
        </div>
      )}
      
      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  )
}

// Контейнер для Toast уведомлений
export function ToastContainer() {
  const { toasts, removeToast } = useToast()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return createPortal(
    <div
      aria-live="assertive"
      className="fixed inset-0 flex items-end justify-center px-4 py-6 pointer-events-none sm:p-6 sm:items-start sm:justify-end z-50"
    >
      <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            toast={toast}
            onRemove={removeToast}
          />
        ))}
      </div>
    </div>,
    document.body
  )
}

// Утилитарные функции для быстрого создания Toast
export const showSuccessToast = (title: string, message?: string, details?: string[]) => {
  return addToast({
    type: 'success',
    title,
    message,
    details
  })
}

export const showErrorToast = (title: string, message?: string, details?: string[]) => {
  return addToast({
    type: 'error',
    title,
    message,
    details
  })
}

export const showWarningToast = (title: string, message?: string, details?: string[]) => {
  return addToast({
    type: 'warning',
    title,
    message,
    details
  })
}

export const showInfoToast = (title: string, message?: string, details?: string[]) => {
  return addToast({
    type: 'info',
    title,
    message,
    details
  })
}