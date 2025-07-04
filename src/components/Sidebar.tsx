'use client'

import { useState } from 'react'
import NavigationItem from './ui/NavigationItem'
import DatabaseStatus from './DatabaseStatus'
import VersionInfo from './VersionInfo'

interface SidebarProps {
  className?: string
}

export default function Sidebar({ className }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const HomeIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )

  const ImportIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
    </svg>
  )

  const SettingsIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )

  const SearchIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )

  const AlertIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.864-.833-2.634 0L4.18 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  )

  const DatabaseIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
    </svg>
  )

  if (isCollapsed) {
    return (
      <div className={`w-16 bg-white border-r border-gray-200 flex flex-col ${className}`}>
        <div className="p-4">
          <button
            onClick={() => setIsCollapsed(false)}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`w-64 bg-white border-r border-gray-200 flex flex-col ${className}`}>
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Навигация</h2>
        <button
          onClick={() => setIsCollapsed(true)}
          className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <nav className="p-4 space-y-2">
          <div className="space-y-1">
            <NavigationItem href="/dashboard" icon={<HomeIcon />} exact>
              Главная
            </NavigationItem>
            <NavigationItem href="/import" icon={<ImportIcon />}>
              Импорт
            </NavigationItem>
            <NavigationItem href="/settings" icon={<SettingsIcon />}>
              Настройки
            </NavigationItem>
          </div>

          <div className="pt-4">
            <div className="px-3 mb-2">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Инструменты
              </div>
            </div>
            <div className="space-y-1">
              <NavigationItem href="/tools/database-viewer" icon={<DatabaseIcon />}>
                Просмотр БД
              </NavigationItem>
              <NavigationItem href="/tools/search" icon={<SearchIcon />}>
                Поиск между МП
              </NavigationItem>
              <NavigationItem href="/tools/problematic-cards" icon={<AlertIcon />}>
                Проблемные карточки
              </NavigationItem>
            </div>
          </div>
        </nav>
      </div>

      <div className="p-4 space-y-3 border-t border-gray-200">
        <DatabaseStatus />
        <VersionInfo />
      </div>
    </div>
  )
}