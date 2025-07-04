import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Get all table information from PostgreSQL information_schema
    const tables = await prisma.$queryRaw`
      SELECT 
        t.table_name,
        obj_description(c.oid) as table_comment
      FROM information_schema.tables t
      LEFT JOIN pg_class c ON c.relname = t.table_name
      WHERE t.table_schema = 'public' 
        AND t.table_type = 'BASE TABLE'
      ORDER BY t.table_name
    ` as Array<{ table_name: string; table_comment: string | null }>

    // Get row counts for each table
    const tablesWithCounts = await Promise.all(
      tables.map(async (table) => {
        try {
          const result = await prisma.$queryRawUnsafe(`
            SELECT COUNT(*) as count FROM "${table.table_name}"
          `) as Array<{ count: bigint }>
          
          return {
            name: table.table_name,
            comment: table.table_comment,
            rowCount: Number(result[0].count)
          }
        } catch (error) {
          console.warn(`Failed to get count for table ${table.table_name}:`, error)
          return {
            name: table.table_name,
            comment: table.table_comment,
            rowCount: 0
          }
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: tablesWithCounts
    })
  } catch (error) {
    console.error('Database tables API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch database tables' 
      },
      { status: 500 }
    )
  }
}