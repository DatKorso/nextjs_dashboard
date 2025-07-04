'use client'

import { useState, useEffect, useCallback } from 'react'

interface DatabaseTable {
  name: string
  comment: string | null
  rowCount: number
}

interface TableSelectorProps {
  selectedTable: string | null
  onTableSelect: (tableName: string) => void
  onError?: (error: string) => void
}

export default function TableSelector({ selectedTable, onTableSelect, onError }: TableSelectorProps) {
  const [tables, setTables] = useState<DatabaseTable[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const fetchTables = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/database/tables')
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch tables')
      }
      
      setTables(result.data)
    } catch (error) {
      console.error('Error fetching tables:', error)
      onError?.(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [onError])

  useEffect(() => {
    fetchTables()
  }, [fetchTables])

  const filteredTables = tables.filter(table =>
    table.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-gray-200 rounded mb-4"></div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Таблицы базы данных
        </h2>
        <button
          onClick={fetchTables}
          className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Обновить
        </button>
      </div>
      
      <div className="relative">
        <input
          type="text"
          placeholder="Поиск таблиц..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <svg
          className="absolute right-3 top-2.5 h-5 w-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredTables.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? 'Таблицы не найдены' : 'Нет доступных таблиц'}
          </div>
        ) : (
          filteredTables.map((table) => (
            <button
              key={table.name}
              onClick={() => onTableSelect(table.name)}
              className={`
                w-full text-left p-3 rounded-lg border transition-colors
                ${selectedTable === table.name
                  ? 'border-blue-500 bg-blue-50 text-blue-900'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{table.name}</h3>
                  {table.comment && (
                    <p className="text-sm text-gray-600 truncate mt-1">
                      {table.comment}
                    </p>
                  )}
                </div>
                <div className="ml-4 flex-shrink-0">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {table.rowCount.toLocaleString()} строк
                  </span>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
      
      {filteredTables.length > 0 && (
        <div className="text-sm text-gray-500 border-t pt-3">
          Найдено таблиц: {filteredTables.length} из {tables.length}
        </div>
      )}
    </div>
  )
}