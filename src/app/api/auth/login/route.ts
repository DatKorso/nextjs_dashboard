import { NextRequest, NextResponse } from 'next/server'
import { login } from '@/lib/auth'
import { ApiResponse } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body
    
    if (!username || !password) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Логин и пароль обязательны',
      }, { status: 400 })
    }
    
    const success = await login(username, password)
    
    if (success) {
      return NextResponse.json<ApiResponse>({
        success: true,
        data: { message: 'Успешная авторизация' },
      })
    } else {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Неверный логин или пароль',
      }, { status: 401 })
    }
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Внутренняя ошибка сервера',
    }, { status: 500 })
  }
}