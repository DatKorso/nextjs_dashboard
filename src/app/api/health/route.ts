import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ApiResponse } from '@/types'

export async function GET(request: NextRequest) {
  try {
    // Test database connection using Prisma
    await prisma.$queryRaw`SELECT 1`
    
    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        status: 'healthy',
        database: 'connected',
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Database connection failed',
    }, { status: 503 })
  }
}