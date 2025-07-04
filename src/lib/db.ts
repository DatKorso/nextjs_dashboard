import { PrismaClient } from '@prisma/client'

// Принудительно загружаем переменные из .env файла для перекрытия системных
if (typeof window === 'undefined') { // только на сервере
  require('dotenv').config({ override: true })
}

// Global variable to store the Prisma client instance
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Create a single instance of Prisma client
export const prisma = globalForPrisma.prisma ?? new PrismaClient()

// In development, attach the Prisma client to the global object
// to prevent multiple instances during hot reload
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Database initialization function
export async function initDatabase() {
  try {
    // Test the connection
    await prisma.$connect()
    console.log('Database connection successful')
    
    // No need to create tables manually - Prisma handles this
    console.log('Database initialized successfully')
  } catch (error) {
    console.error('Database initialization failed:', error)
    throw error
  }
}

// Helper function to disconnect from database
export async function disconnectDatabase() {
  await prisma.$disconnect()
}