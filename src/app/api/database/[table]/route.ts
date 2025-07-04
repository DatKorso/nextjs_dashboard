import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// Helper function to convert BigInt values to strings for JSON serialization
function serializeBigInt(obj: any): any {
  if (obj === null || obj === undefined) return obj
  if (typeof obj === 'bigint') return obj.toString()
  if (Array.isArray(obj)) return obj.map(serializeBigInt)
  if (typeof obj === 'object') {
    const serialized: any = {}
    for (const key in obj) {
      serialized[key] = serializeBigInt(obj[key])
    }
    return serialized
  }
  return obj
}

// Validation schema for query parameters
const QuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 0),
  pageSize: z.string().optional().transform(val => val ? parseInt(val, 10) : 50),
  globalFilter: z.string().optional(),
  columnFilters: z.string().optional(),
  sorting: z.string().optional()
})

interface ColumnFilter {
  id: string
  value: string
}

interface SortingState {
  id: string
  desc: boolean
}

export async function GET(
  request: NextRequest,
  { params }: { params: { table: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const query = QuerySchema.parse(Object.fromEntries(searchParams.entries()))
    
    const tableName = params.table
    const { page = 0, pageSize = 50, globalFilter, columnFilters, sorting } = query
    
    // Validate table name to prevent SQL injection
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) {
      return NextResponse.json(
        { success: false, error: 'Invalid table name' },
        { status: 400 }
      )
    }

    // Get table schema information
    const columns = await prisma.$queryRaw`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = ${tableName}
      ORDER BY ordinal_position
    ` as Array<{
      column_name: string
      data_type: string
      is_nullable: string
      column_default: string | null
      character_maximum_length: number | null
    }>

    if (columns.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Table not found' },
        { status: 404 }
      )
    }

    // Build WHERE clause for filters
    let whereConditions: string[] = []
    let queryParams: any[] = []
    let paramIndex = 1

    // Global filter - search across all text columns
    if (globalFilter) {
      const textColumns = columns
        .filter(col => ['text', 'varchar', 'character varying'].includes(col.data_type))
        .map(col => col.column_name)
      
      if (textColumns.length > 0) {
        const globalConditions = textColumns.map(col => 
          `"${col}"::text ILIKE $${paramIndex}`
        ).join(' OR ')
        
        whereConditions.push(`(${globalConditions})`)
        queryParams.push(`%${globalFilter}%`)
        paramIndex++
      }
    }

    // Column-specific filters
    if (columnFilters) {
      try {
        const filters: ColumnFilter[] = JSON.parse(columnFilters)
        filters.forEach(filter => {
          if (filter.value && filter.id) {
            const column = columns.find(col => col.column_name === filter.id)
            if (column) {
              if (['text', 'varchar', 'character varying'].includes(column.data_type)) {
                whereConditions.push(`"${filter.id}"::text ILIKE $${paramIndex}`)
                queryParams.push(`%${filter.value}%`)
              } else {
                whereConditions.push(`"${filter.id}"::text = $${paramIndex}`)
                queryParams.push(filter.value)
              }
              paramIndex++
            }
          }
        })
      } catch (e) {
        // Invalid JSON for column filters, ignore
      }
    }

    // Build ORDER BY clause
    let orderByClause = ''
    if (sorting) {
      try {
        const sortingState: SortingState[] = JSON.parse(sorting)
        if (sortingState.length > 0) {
          const sortClauses = sortingState.map(sort => {
            const column = columns.find(col => col.column_name === sort.id)
            if (column) {
              return `"${sort.id}" ${sort.desc ? 'DESC' : 'ASC'}`
            }
            return null
          }).filter(Boolean)
          
          if (sortClauses.length > 0) {
            orderByClause = `ORDER BY ${sortClauses.join(', ')}`
          }
        }
      } catch (e) {
        // Invalid JSON for sorting, ignore
      }
    }

    // Build the complete query
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''
    const offset = page * pageSize
    
    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM "${tableName}" 
      ${whereClause}
    `
    
    const countResult = await prisma.$queryRawUnsafe(countQuery, ...queryParams) as Array<{ total: bigint }>
    const totalRows = Number(countResult[0].total)

    // Get paginated data
    const dataQuery = `
      SELECT * 
      FROM "${tableName}" 
      ${whereClause}
      ${orderByClause}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `
    
    const data = await prisma.$queryRawUnsafe(
      dataQuery, 
      ...queryParams, 
      pageSize, 
      offset
    )

    return NextResponse.json({
      success: true,
      data: {
        rows: serializeBigInt(data),
        totalRows,
        page,
        pageSize,
        totalPages: Math.ceil(totalRows / pageSize),
        columns: columns.map(col => ({
          accessorKey: col.column_name,
          header: col.column_name,
          dataType: col.data_type,
          nullable: col.is_nullable === 'YES',
          maxLength: col.character_maximum_length
        }))
      }
    })
  } catch (error) {
    console.error('Database table data API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch table data' 
      },
      { status: 500 }
    )
  }
}