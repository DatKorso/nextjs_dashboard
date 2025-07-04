import { NextRequest } from 'next/server'
import { withAuth, createApiResponse } from '@/lib/api-middleware'
import { prisma } from '@/lib/db'

async function getStatus(req: NextRequest) {
  let isDbConnected = false
  
  try {
    await prisma.$queryRaw`SELECT 1`
    isDbConnected = true
  } catch (error) {
    console.error('Database connection test failed:', error)
    isDbConnected = false
  }
  
  const status = {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: isDbConnected ? 'connected' : 'disconnected',
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '0.1.0',
    environment: process.env.NODE_ENV || 'development',
  }
  
  return createApiResponse(status)
}

export const GET = withAuth(getStatus)