'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface NavigationItemProps {
  href: string
  children: ReactNode
  icon?: ReactNode
  exact?: boolean
}

export default function NavigationItem({ 
  href, 
  children, 
  icon, 
  exact = false 
}: NavigationItemProps) {
  const pathname = usePathname()
  
  const isActive = exact ? pathname === href : pathname.startsWith(href)

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors',
        isActive
          ? 'bg-primary-100 text-primary-900 border-r-2 border-primary-500'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      )}
    >
      {icon && (
        <span className={cn(
          'mr-3 flex-shrink-0 h-5 w-5',
          isActive ? 'text-primary-500' : 'text-gray-400'
        )}>
          {icon}
        </span>
      )}
      {children}
    </Link>
  )
}