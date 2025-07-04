import { NextRequest, NextResponse } from 'next/server'
import { logout } from '@/lib/auth'
import { ApiResponse } from '@/types'

export async function POST(request: NextRequest) {
  try {
    await logout()
    
    return NextResponse.json<ApiResponse>({
      success: true,
      data: { message: 'Успешный выход' },
    })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Ошибка при выходе',
    }, { status: 500 })
  }
}