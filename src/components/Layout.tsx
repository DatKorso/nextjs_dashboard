import { ReactNode } from 'react'
import ClientLayout from './ClientLayout'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <ClientLayout>
      {children}
    </ClientLayout>
  )
}