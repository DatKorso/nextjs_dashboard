'use client'

import { useMemo, useState, useEffect, useCallback } from 'react'
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
  type MRT_ColumnFiltersState,
  type MRT_PaginationState,
  type MRT_SortingState,
} from 'material-react-table'

interface TableColumn {
  accessorKey: string
  header: string
  dataType: string
  nullable: boolean
  maxLength?: number | null
}

interface TableData {
  rows: any[]
  totalRows: number
  page: number
  pageSize: number
  totalPages: number
  columns: TableColumn[]
}

interface DatabaseTableProps {
  tableName: string
  onError?: (error: string) => void
}

export default function DatabaseTable({ tableName, onError }: DatabaseTableProps) {
  const [data, setData] = useState<TableData>({
    rows: [],
    totalRows: 0,
    page: 0,
    pageSize: 50,
    totalPages: 0,
    columns: []
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)
  
  // Table state
  const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState<MRT_SortingState>([])
  const [pagination, setPagination] = useState<MRT_PaginationState>({
    pageIndex: 0,
    pageSize: 50,
  })

  // Fetch data function
  const fetchData = useCallback(async () => {
    if (!tableName) return
    
    setIsLoading(true)
    setIsError(false)
    
    try {
      const params = new URLSearchParams({
        page: pagination.pageIndex.toString(),
        pageSize: pagination.pageSize.toString(),
      })
      
      if (globalFilter) {
        params.set('globalFilter', globalFilter)
      }
      
      if (columnFilters.length > 0) {
        params.set('columnFilters', JSON.stringify(columnFilters))
      }
      
      if (sorting.length > 0) {
        params.set('sorting', JSON.stringify(sorting))
      }
      
      const response = await fetch(`/api/database/${tableName}?${params}`)
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch data')
      }
      
      setData(result.data)
    } catch (error) {
      console.error('Error fetching table data:', error)
      setIsError(true)
      onError?.(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [tableName, pagination.pageIndex, pagination.pageSize, globalFilter, columnFilters, sorting, onError])

  // Fetch data when dependencies change
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Generate columns based on table schema
  const columns = useMemo<MRT_ColumnDef<any>[]>(() => {
    return data.columns.map((column) => ({
      accessorKey: column.accessorKey,
      header: column.header,
      enableSorting: true,
      enableColumnFilter: true,
      enableGlobalFilter: ['text', 'varchar', 'character varying'].includes(column.dataType),
      Cell: ({ cell }) => {
        const value = cell.getValue()
        
        // Handle different data types
        if (value === null || value === undefined) {
          return <span className="text-gray-400 italic">null</span>
        }
        
        if (typeof value === 'boolean') {
          return <span className={value ? 'text-green-600' : 'text-red-600'}>
            {value.toString()}
          </span>
        }
        
        if (typeof value === 'object') {
          return <span className="text-blue-600 font-mono text-sm">
            {JSON.stringify(value)}
          </span>
        }
        
        return <span className="break-words">{String(value)}</span>
      },
      muiTableHeadCellProps: {
        sx: {
          fontWeight: 'bold',
          backgroundColor: '#f8fafc',
        },
      },
      muiTableBodyCellProps: {
        sx: {
          maxWidth: '300px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        },
      },
    }))
  }, [data.columns])

  const table = useMaterialReactTable({
    columns,
    data: data.rows,
    enableRowSelection: false,
    enableColumnActions: false,
    enableColumnDragging: false,
    enableDensityToggle: false,
    enableFullScreenToggle: false,
    enableHiding: false,
    manualFiltering: true,
    manualPagination: true,
    manualSorting: true,
    enableGlobalFilter: true,
    enableColumnFilters: true,
    rowCount: data.totalRows,
    state: {
      columnFilters,
      globalFilter,
      isLoading,
      pagination,
      showAlertBanner: isError,
      showProgressBars: isLoading,
      sorting,
    },
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    muiToolbarAlertBannerProps: isError
      ? {
          color: 'error',
          children: 'Error loading data',
        }
      : undefined,
    muiTableContainerProps: {
      sx: {
        maxHeight: '600px',
      },
    },
    muiSearchTextFieldProps: {
      placeholder: `Search ${tableName}...`,
      sx: { minWidth: '300px' },
      variant: 'outlined',
    },
    muiPaginationProps: {
      rowsPerPageOptions: [25, 50, 100, 200],
      showFirstButton: false,
      showLastButton: false,
    },
    paginationDisplayMode: 'pages',
    positionGlobalFilter: 'left',
    initialState: {
      showGlobalFilter: true,
      showColumnFilters: true,
    },
  })

  if (!tableName) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Выберите таблицу для просмотра
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Таблица: {tableName}
        </h3>
        <div className="flex gap-4 text-sm text-gray-600">
          <span>Всего записей: {data.totalRows.toLocaleString()}</span>
          <span>Колонок: {data.columns.length}</span>
          <span>Страниц: {data.totalPages}</span>
        </div>
      </div>
      
      <MaterialReactTable table={table} />
    </div>
  )
}