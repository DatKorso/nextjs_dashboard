import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { ApiResponse } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (user) {
      return NextResponse.json<ApiResponse>({
        success: true,
        data: user,
      })
    } else {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Пользователь не авторизован',
      }, { status: 401 })
    }
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Внутренняя ошибка сервера',
    }, { status: 500 })
  }
}