'use client'

import { useState, useEffect } from 'react'

interface DatabaseStatusProps {
  className?: string
}

export default function DatabaseStatus({ className }: DatabaseStatusProps) {
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking')
  const [lastCheck, setLastCheck] = useState<Date | null>(null)

  const checkStatus = async () => {
    try {
      setStatus('checking')
      const response = await fetch('/api/health')
      const data = await response.json()
      
      setStatus(data.success ? 'connected' : 'disconnected')
      setLastCheck(new Date())
    } catch (error) {
      setStatus('disconnected')
      setLastCheck(new Date())
    }
  }

  useEffect(() => {
    checkStatus()
    const interval = setInterval(checkStatus, 30000) // Check every 30 seconds
    
    return () => clearInterval(interval)
  }, [])

  const statusConfig = {
    connected: {
      color: 'bg-green-500',
      text: 'Подключено',
      textColor: 'text-green-600'
    },
    disconnected: {
      color: 'bg-red-500', 
      text: 'Отключено',
      textColor: 'text-red-600'
    },
    checking: {
      color: 'bg-yellow-500',
      text: 'Проверка...',
      textColor: 'text-yellow-600'
    }
  }

  const config = statusConfig[status]

  return (
    <div className={`p-3 bg-white rounded-lg border ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          База данных
        </span>
        <div className={`w-2 h-2 rounded-full ${config.color}`}></div>
      </div>
      
      <div className={`text-sm font-medium ${config.textColor}`}>
        {config.text}
      </div>
      
      {lastCheck && (
        <div className="text-xs text-gray-400 mt-1">
          {lastCheck.toLocaleTimeString('ru-RU')}
        </div>
      )}
    </div>
  )
}