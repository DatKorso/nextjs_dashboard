import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { ApiResponse } from '@/types'

export function withAuth(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    try {
      const session = await getSession()
      
      if (!session.isLoggedIn) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Unauthorized',
        }, { status: 401 })
      }
      
      return handler(req)
    } catch (error) {
      console.error('Auth middleware error:', error)
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Internal server error',
      }, { status: 500 })
    }
  }
}

export function withErrorHandling(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    try {
      return await handler(req)
    } catch (error) {
      console.error('API Error:', error)
      return NextResponse.json<ApiResponse>({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }, { status: 500 })
    }
  }
}

export function withValidation<T>(
  schema: (data: any) => T,
  handler: (req: NextRequest, data: T) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    try {
      const body = await req.json()
      const validatedData = schema(body)
      return handler(req, validatedData)
    } catch (error) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Invalid request data',
      }, { status: 400 })
    }
  }
}

export function createApiResponse<T>(data: T): NextResponse {
  return NextResponse.json<ApiResponse<T>>({
    success: true,
    data,
  })
}

export function createErrorResponse(error: string, status = 400): NextResponse {
  return NextResponse.json<ApiResponse>({
    success: false,
    error,
  }, { status })
}