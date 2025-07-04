import * as XLSX from 'xlsx'
import { ReportType } from '../validators/reports'

// ============= INTERFACES =============

export interface ParsedFileData {
  data: any[]
  totalRows: number
  errors: string[]
  metadata: {
    fileName: string
    fileSize: number
    parsedRows: number
    skippedRows: number
  }
}

export interface FileParseConfig {
  delimiter?: string
  headerRow?: number
  dataStartRow?: number
  sheetName?: string
  encoding?: BufferEncoding
}

// ============= CSV PARSER =============

export function parseCSVFile(
  buffer: Buffer,
  config: FileParseConfig = {},
  fileName: string = 'unknown.csv'
): ParsedFileData {
  const {
    delimiter = ';',
    headerRow = 1,
    dataStartRow = 2,
    encoding = 'utf-8'
  } = config

  const errors: string[] = []
  let data: any[] = []
  let totalRows = 0
  let parsedRows = 0
  let skippedRows = 0

  try {
    // Конвертируем buffer в строку
    const csvText = buffer.toString(encoding)
    const lines = csvText.split('\n').filter(line => line.trim().length > 0)
    totalRows = lines.length

    if (lines.length === 0) {
      errors.push('File is empty')
      return {
        data: [],
        totalRows: 0,
        errors,
        metadata: { fileName, fileSize: buffer.length, parsedRows: 0, skippedRows: 0 }
      }
    }

    // Получаем заголовки
    if (headerRow > lines.length) {
      errors.push(`Header row ${headerRow} exceeds file length ${lines.length}`)
      return {
        data: [],
        totalRows,
        errors,
        metadata: { fileName, fileSize: buffer.length, parsedRows: 0, skippedRows: totalRows }
      }
    }

    const headerLine = lines[headerRow - 1]
    const headers = headerLine.split(delimiter).map(h => h.trim().replace(/"/g, ''))

    // Парсим данные
    const dataLines = lines.slice(dataStartRow - 1)
    
    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i].trim()
      if (!line) {
        skippedRows++
        continue
      }

      try {
        const values = line.split(delimiter).map(v => v.trim().replace(/"/g, ''))
        
        if (values.length !== headers.length) {
          errors.push(`Row ${dataStartRow + i}: Column count mismatch. Expected ${headers.length}, got ${values.length}`)
          skippedRows++
          continue
        }

        const rowData: Record<string, string> = {}
        headers.forEach((header, index) => {
          rowData[header] = values[index] || ''
        })

        data.push(rowData)
        parsedRows++
      } catch (error) {
        errors.push(`Row ${dataStartRow + i}: Parse error - ${error}`)
        skippedRows++
      }
    }

  } catch (error) {
    errors.push(`CSV parsing failed: ${error}`)
  }

  return {
    data,
    totalRows,
    errors,
    metadata: {
      fileName,
      fileSize: buffer.length,
      parsedRows,
      skippedRows
    }
  }
}

// ============= XLSX PARSER =============

export function parseXLSXFile(
  buffer: Buffer,
  config: FileParseConfig = {},
  fileName: string = 'unknown.xlsx'
): ParsedFileData {
  const {
    headerRow = 1,
    dataStartRow = 2,
    sheetName
  } = config

  const errors: string[] = []
  let data: any[] = []
  let totalRows = 0
  let parsedRows = 0
  let skippedRows = 0

  try {
    // Читаем XLSX файл
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    
    if (!workbook.SheetNames.length) {
      errors.push('No sheets found in workbook')
      return {
        data: [],
        totalRows: 0,
        errors,
        metadata: { fileName, fileSize: buffer.length, parsedRows: 0, skippedRows: 0 }
      }
    }

    // Выбираем лист
    let targetSheetName = sheetName
    if (!targetSheetName) {
      targetSheetName = workbook.SheetNames[0] // Используем первый лист по умолчанию
    }

    if (!workbook.Sheets[targetSheetName]) {
      // Check if this might be an Ozon Category Products file uploaded as wrong type
      const hasOzCategoryProductsSheets = workbook.SheetNames.includes('Шаблон') && 
                                           (workbook.SheetNames.includes('Озон.Видео') || 
                                            workbook.SheetNames.includes('Озон.Видеообложка'))
      
      if (hasOzCategoryProductsSheets) {
        errors.push(`This appears to be an Ozon Category Products file. Please use "Полные товары Ozon" import type instead. Available sheets: ${workbook.SheetNames.join(', ')}`)
      } else {
        errors.push(`Sheet "${targetSheetName}" not found. Available sheets: ${workbook.SheetNames.join(', ')}`)
      }
      
      return {
        data: [],
        totalRows: 0,
        errors,
        metadata: { fileName, fileSize: buffer.length, parsedRows: 0, skippedRows: 0 }
      }
    }

    const worksheet = workbook.Sheets[targetSheetName]
    
    // Получаем диапазон данных
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1')
    totalRows = range.e.r + 1

    if (totalRows === 0) {
      errors.push('Worksheet is empty')
      return {
        data: [],
        totalRows: 0,
        errors,
        metadata: { fileName, fileSize: buffer.length, parsedRows: 0, skippedRows: 0 }
      }
    }

    // Проверяем что headerRow существует
    if (headerRow > totalRows) {
      errors.push(`Header row ${headerRow} exceeds sheet rows ${totalRows}`)
      return {
        data: [],
        totalRows,
        errors,
        metadata: { fileName, fileSize: buffer.length, parsedRows: 0, skippedRows: totalRows }
      }
    }

    // Читаем заголовки
    const headers: string[] = []
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: headerRow - 1, c: C })
      const cell = worksheet[cellAddress]
      const header = cell ? String(cell.v).trim() : ''
      if (header) {
        headers.push(header)
      }
    }

    if (headers.length === 0) {
      errors.push('No headers found')
      return {
        data: [],
        totalRows,
        errors,
        metadata: { fileName, fileSize: buffer.length, parsedRows: 0, skippedRows: totalRows }
      }
    }

    // Читаем данные
    for (let R = dataStartRow - 1; R <= range.e.r; ++R) {
      const rowData: Record<string, any> = {}
      let hasData = false

      for (let C = 0; C < headers.length; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C + range.s.c })
        const cell = worksheet[cellAddress]
        const value = cell ? cell.v : ''
        
        rowData[headers[C]] = value
        if (value !== '' && value !== null && value !== undefined) {
          hasData = true
        }
      }

      if (hasData) {
        data.push(rowData)
        parsedRows++
      } else {
        skippedRows++
      }
    }

  } catch (error) {
    errors.push(`XLSX parsing failed: ${error}`)
  }

  return {
    data,
    totalRows,
    errors,
    metadata: {
      fileName,
      fileSize: buffer.length,
      parsedRows,
      skippedRows
    }
  }
}

// ============= MULTI-SHEET XLSX PARSER FOR OZON CATEGORY PRODUCTS =============

export interface MultiSheetParseResult {
  data: any[]
  totalRows: number
  errors: string[]
  metadata: {
    fileName: string
    fileSize: number
    parsedRows: number
    skippedRows: number
    sheetsProcessed: string[]
  }
}

export function parseOzCategoryProductsFile(
  buffer: Buffer,
  fileName: string = 'unknown.xlsx'
): MultiSheetParseResult {
  const errors: string[] = []
  let combinedData: any[] = []
  let totalRows = 0
  let parsedRows = 0
  let skippedRows = 0
  const sheetsProcessed: string[] = []

  try {
    // Читаем XLSX файл
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    
    if (!workbook.SheetNames.length) {
      errors.push('No sheets found in workbook')
      return {
        data: [],
        totalRows: 0,
        errors,
        metadata: { fileName, fileSize: buffer.length, parsedRows: 0, skippedRows: 0, sheetsProcessed: [] }
      }
    }

    // Определяем целевые листы
    const requiredSheets = {
      template: 'Шаблон',
      video: 'Озон.Видео',
      videoCover: 'Озон.Видеообложка'
    }

    // Проверяем наличие основного листа "Шаблон"
    if (!workbook.Sheets[requiredSheets.template]) {
      errors.push(`Required sheet "${requiredSheets.template}" not found. Available sheets: ${workbook.SheetNames.join(', ')}`)
      return {
        data: [],
        totalRows: 0,
        errors,
        metadata: { fileName, fileSize: buffer.length, parsedRows: 0, skippedRows: 0, sheetsProcessed: [] }
      }
    }

    // 1. Читаем основной лист "Шаблон"
    const templateData = parseSheetData(workbook, requiredSheets.template, {
      headerRow: 2,
      dataStartRow: 4
    })

    if (templateData.errors.length > 0) {
      errors.push(...templateData.errors.map(err => `Template sheet: ${err}`))
    }

    totalRows += templateData.totalRows
    parsedRows += templateData.parsedRows
    skippedRows += templateData.skippedRows
    sheetsProcessed.push(requiredSheets.template)

    // Создаем основную структуру данных из Template листа
    const dataMap = new Map<string, any>()
    templateData.data.forEach(row => {
      if (row['Артикул*']) {
        dataMap.set(row['Артикул*'], { ...row })
      }
    })

    // 2. Читаем лист "Озон.Видео" (опционально)
    if (workbook.Sheets[requiredSheets.video]) {
      const videoData = parseSheetData(workbook, requiredSheets.video, {
        headerRow: 2,
        dataStartRow: 4
      })

      if (videoData.errors.length > 0) {
        errors.push(...videoData.errors.map(err => `Video sheet: ${err}`))
      }

      totalRows += videoData.totalRows
      parsedRows += videoData.parsedRows
      skippedRows += videoData.skippedRows
      sheetsProcessed.push(requiredSheets.video)

      // Объединяем данные по Артикул*
      videoData.data.forEach(videoRow => {
        const vendorCode = videoRow['Артикул*']
        if (vendorCode && dataMap.has(vendorCode)) {
          const existingData = dataMap.get(vendorCode)
          existingData['Озон.Видео: название'] = videoRow['Озон.Видео: название'] || null
          existingData['Озон.Видео: ссылка'] = videoRow['Озон.Видео: ссылка'] || null
          existingData['Озон.Видео: товары на видео'] = videoRow['Озон.Видео: товары на видео'] || null
          dataMap.set(vendorCode, existingData)
        }
      })
    }

    // 3. Читаем лист "Озон.Видеообложка" (опционально)
    if (workbook.Sheets[requiredSheets.videoCover]) {
      const videoCoverData = parseSheetData(workbook, requiredSheets.videoCover, {
        headerRow: 2,
        dataStartRow: 4
      })

      if (videoCoverData.errors.length > 0) {
        errors.push(...videoCoverData.errors.map(err => `Video cover sheet: ${err}`))
      }

      totalRows += videoCoverData.totalRows
      parsedRows += videoCoverData.parsedRows
      skippedRows += videoCoverData.skippedRows
      sheetsProcessed.push(requiredSheets.videoCover)

      // Объединяем данные по Артикул*
      videoCoverData.data.forEach(coverRow => {
        const vendorCode = coverRow['Артикул*']
        if (vendorCode && dataMap.has(vendorCode)) {
          const existingData = dataMap.get(vendorCode)
          existingData['Озон.Видеообложка: ссылка'] = coverRow['Озон.Видеообложка: ссылка'] || null
          dataMap.set(vendorCode, existingData)
        }
      })
    }

    // Конвертируем Map обратно в массив
    combinedData = Array.from(dataMap.values())

  } catch (error) {
    errors.push(`Multi-sheet XLSX parsing failed: ${error}`)
  }

  return {
    data: combinedData,
    totalRows,
    errors,
    metadata: {
      fileName,
      fileSize: buffer.length,
      parsedRows,
      skippedRows,
      sheetsProcessed
    }
  }
}

// Вспомогательная функция для парсинга отдельного листа
function parseSheetData(
  workbook: XLSX.WorkBook,
  sheetName: string,
  config: { headerRow: number; dataStartRow: number }
): ParsedFileData {
  const errors: string[] = []
  let data: any[] = []
  let totalRows = 0
  let parsedRows = 0
  let skippedRows = 0

  try {
    const worksheet = workbook.Sheets[sheetName]
    
    // Получаем диапазон данных
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1')
    totalRows = range.e.r + 1

    if (totalRows === 0) {
      errors.push(`Sheet "${sheetName}" is empty`)
      return {
        data: [],
        totalRows: 0,
        errors,
        metadata: { fileName: sheetName, fileSize: 0, parsedRows: 0, skippedRows: 0 }
      }
    }

    // Проверяем что headerRow существует
    if (config.headerRow > totalRows) {
      errors.push(`Header row ${config.headerRow} exceeds sheet rows ${totalRows}`)
      return {
        data: [],
        totalRows,
        errors,
        metadata: { fileName: sheetName, fileSize: 0, parsedRows: 0, skippedRows: totalRows }
      }
    }

    // Читаем заголовки
    const headers: string[] = []
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: config.headerRow - 1, c: C })
      const cell = worksheet[cellAddress]
      const header = cell ? String(cell.v).trim() : ''
      if (header) {
        headers.push(header)
      }
    }

    if (headers.length === 0) {
      errors.push(`No headers found in sheet "${sheetName}"`)
      return {
        data: [],
        totalRows,
        errors,
        metadata: { fileName: sheetName, fileSize: 0, parsedRows: 0, skippedRows: totalRows }
      }
    }

    // Читаем данные
    for (let R = config.dataStartRow - 1; R <= range.e.r; ++R) {
      const rowData: Record<string, any> = {}
      let hasData = false

      for (let C = 0; C < headers.length; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C + range.s.c })
        const cell = worksheet[cellAddress]
        const value = cell ? cell.v : ''
        
        rowData[headers[C]] = value
        if (value !== '' && value !== null && value !== undefined) {
          hasData = true
        }
      }

      if (hasData) {
        data.push(rowData)
        parsedRows++
      } else {
        skippedRows++
      }
    }

  } catch (error) {
    errors.push(`Failed to parse sheet "${sheetName}": ${error}`)
  }

  return {
    data,
    totalRows,
    errors,
    metadata: {
      fileName: sheetName,
      fileSize: 0,
      parsedRows,
      skippedRows
    }
  }
}

// ============= MAIN PARSER FUNCTION =============

export function parseReportFile(
  buffer: Buffer,
  reportType: ReportType,
  fileName: string
): ParsedFileData {
  const fileExtension = fileName.split('.').pop()?.toLowerCase()
  
  // Special handling for Ozon Category Products (multi-sheet processing)
  if (reportType === 'ozon_category_products') {
    if (['xlsx', 'xls'].includes(fileExtension || '')) {
      const result = parseOzCategoryProductsFile(buffer, fileName)
      // Convert MultiSheetParseResult to ParsedFileData format
      return {
        data: result.data,
        totalRows: result.totalRows,
        errors: result.errors,
        metadata: {
          fileName: result.metadata.fileName,
          fileSize: result.metadata.fileSize,
          parsedRows: result.metadata.parsedRows,
          skippedRows: result.metadata.skippedRows
        }
      }
    } else {
      return {
        data: [],
        totalRows: 0,
        errors: [`Ozon Category Products requires Excel format (.xlsx). Got: ${fileExtension}`],
        metadata: {
          fileName,
          fileSize: buffer.length,
          parsedRows: 0,
          skippedRows: 0
        }
      }
    }
  }
  
  // Конфигурации для разных типов отчетов согласно схеме
  const csvConfigs: Record<Exclude<ReportType, 'ozon_category_products'>, FileParseConfig> = {
    ozon_orders: {
      delimiter: ';',
      headerRow: 1,
      dataStartRow: 2
    },
    ozon_products: {
      delimiter: ';',
      headerRow: 1,
      dataStartRow: 2
    },
    ozon_barcodes: {
      delimiter: ';',
      headerRow: 1,
      dataStartRow: 2
    },
    wb_products: {
      delimiter: ';',
      headerRow: 1,
      dataStartRow: 2
    },
    wb_prices: {
      delimiter: ';',
      headerRow: 1,
      dataStartRow: 2
    }
  }

  const xlsxConfigs: Record<Exclude<ReportType, 'ozon_category_products'>, FileParseConfig> = {
    ozon_orders: {
      sheetName: 'Товары и цены',
      headerRow: 3,
      dataStartRow: 5
    },
    ozon_products: {
      sheetName: 'Товары и цены',
      headerRow: 3,
      dataStartRow: 5
    },
    ozon_barcodes: {
      sheetName: 'Штрихкоды',
      headerRow: 3,
      dataStartRow: 5
    },
    wb_products: {
      sheetName: 'Товары',
      headerRow: 3,
      dataStartRow: 5
    },
    wb_prices: {
      sheetName: 'Отчет - цены и скидки на товары',
      headerRow: 1,
      dataStartRow: 2
    }
  }

  const config = ['csv'].includes(fileExtension || '') ? csvConfigs[reportType as Exclude<ReportType, 'ozon_category_products'>] : xlsxConfigs[reportType as Exclude<ReportType, 'ozon_category_products'>]

  if (['csv'].includes(fileExtension || '')) {
    return parseCSVFile(buffer, config, fileName)
  } else if (['xlsx', 'xls'].includes(fileExtension || '')) {
    return parseXLSXFile(buffer, config, fileName)
  } else {
    return {
      data: [],
      totalRows: 0,
      errors: [`Unsupported file format: ${fileExtension}`],
      metadata: {
        fileName,
        fileSize: buffer.length,
        parsedRows: 0,
        skippedRows: 0
      }
    }
  }
}

// ============= VALIDATION HELPERS =============

export function validateFileType(fileName: string, reportType: ReportType): boolean {
  const extension = fileName.split('.').pop()?.toLowerCase()
  
  const allowedExtensions: Record<ReportType, string[]> = {
    ozon_orders: ['csv'],
    ozon_products: ['csv', 'xlsx', 'xls'],
    ozon_barcodes: ['xlsx', 'xls'],
    ozon_category_products: ['xlsx', 'xls'],
    wb_products: ['xlsx', 'xls'],
    wb_prices: ['xlsx', 'xls']
  }

  return allowedExtensions[reportType]?.includes(extension || '') || false
}

export function getExpectedColumns(reportType: ReportType): string[] {
  const expectedColumns: Record<ReportType, string[]> = {
    ozon_orders: ['Номер заказа', 'Номер отправления', 'Принят в обработку', 'Статус', 'OZON id', 'Артикул'],
    ozon_products: ['Артикул', 'Ozon Product ID', 'SKU', 'Бренд', 'Статус товара', 'Видимость на Ozon', 'Причины скрытия', 'Доступно к продаже по схеме FBO, шт.', 'Текущая цена с учетом скидки, ₽'],
    ozon_barcodes: ['Артикул', 'Ozon Product ID', 'Штрихкод'],
    ozon_category_products: ['Артикул*', 'Название товара', 'Цена, руб.*', 'Бренд в одежде и обуви*', 'Тип*', 'Пол*', 'Цвет товара*', 'Российский размер*'],
    wb_products: ['Артикул WB', 'Категория продавца', 'Бренд', 'Баркод', 'Размер'],
    wb_prices: ['Артикул WB', 'Остатки WB']
  }

  return expectedColumns[reportType] || []
} 