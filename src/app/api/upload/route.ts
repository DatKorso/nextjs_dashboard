import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-middleware'
import { ReportTypeSchema } from '@/lib/validators/reports'
import { parseReportFile, validateFileType } from '@/lib/parsers/file-parsers'
import { 
  OzonOrdersSchema, 
  OzonProductsSchema, 
  OzonBarcodesSchema,
  OzCategoryProductsSchema,
  WildberriesProductsSchema,
  WildberriesPricesSchema 
} from '@/lib/validators/reports'
import { prisma } from '@/lib/db'
import { 
  logger,
  logFileUploadStart,
  logFileUploadProgress,
  logFileUploadSuccess,
  logFileUploadError,
  logParsingError,
  logValidationError,
  type FileUploadLogContext
} from '@/lib/logger'

// Transform function for Ozon Category Products multi-sheet data
function transformOzCategoryProductsData(rawData: any[]): any[] {
  return rawData.map(row => {
    // Transform the combined multi-sheet data to match our schema
    return {
      ozVendorCode: row['Артикул*'] || '',
      productName: row['Название товара'] || null,
      ozActualPrice: row['Цена, руб.*'] || null,
      ozPriceBeforeDiscount: row['Цена до скидки, руб.'] || null,
      vatPercent: row['НДС, %*'] || null,
      installment: row['Рассрочка'] || null,
      reviewPoints: row['Баллы за отзывы'] || null,
      ozSku: row['SKU'] || null,
      barcode: row['Штрихкод (Серийный номер / EAN)'] || null,
      packageWeightG: row['Вес в упаковке, г*'] || null,
      packageWidthMm: row['Ширина упаковки, мм*'] || null,
      packageHeightMm: row['Высота упаковки, мм*'] || null,
      packageLengthMm: row['Длина упаковки, мм*'] || null,
      packageCount: row['Количество заводских упаковок'] || null,
      shoesInPackCount: row['Количество пар обуви в упаковке'] || null,
      mainPhotoUrl: row['Ссылка на главное фото*'] || null,
      additionalPhotosUrls: row['Ссылки на дополнительные фото'] || null,
      photo360Urls: row['Ссылки на фото 360'] || null,
      photoArticle: row['Артикул фото'] || null,
      ozBrand: row['Бренд в одежде и обуви*'] || null,
      mergeOnCard: row['Объединить на одной карточке*'] || null,
      type: row['Тип*'] || null,
      gender: row['Пол*'] || null,
      season: row['Сезон'] || null,
      collection: row['Коллекция'] || null,
      style: row['Стиль'] || null,
      groupName: row['Название группы'] || null,
      color: row['Цвет товара*'] || null,
      russianSize: row['Российский размер*'] || null,
      colorName: row['Название цвета'] || null,
      manufacturerSize: row['Размер производителя'] || null,
      hashtags: row['#Хештеги'] || null,
      annotation: row['Аннотация'] || null,
      richContentJson: row['Rich-контент JSON'] || null,
      keywords: row['Ключевые слова'] || null,
      is18plus: convertRussianBoolean(row['Признак 18+']),
      material: row['Материал'] || null,
      upperMaterial: row['Материал верха'] || null,
      liningMaterial: row['Материал подкладки обуви'] || null,
      insoleMaterial: row['Материал стельки'] || null,
      outsoleMaterial: row['Материал подошвы обуви'] || null,
      temperatureMode: row['Температурный режим'] || null,
      footLengthCm: parseDecimal(row['Длина стопы, см']),
      insoleLengthCm: parseDecimal(row['Длина стельки, см']),
      fullness: row['Полнота'] || null,
      heelHeightCm: parseDecimal(row['Высота каблука, см']),
      soleHeightCm: parseDecimal(row['Высота подошвы, см']),
      bootlegHeightCm: parseDecimal(row['Высота голенища, см']),
      platformHeightCm: parseDecimal(row['Высота платформы, см']),
      sizeInfo: row['Информация о размерах'] || null,
      fastenerType: row['Вид застёжки'] || null,
      heelType: row['Вид каблука'] || null,
      modelFeatures: row['Особенности модели'] || null,
      decorativeElements: row['Декоративные элементы'] || null,
      fit: row['Посадка'] || null,
      sizeTableJson: parseJson(row['Таблица размеров JSON']),
      warrantyPeriod: row['Гарантийный срок'] || null,
      sportPurpose: row['Спортивное назначение'] || null,
      orthopedic: convertRussianBoolean(row['Ортопедический']),
      waterproof: convertRussianBoolean(row['Непромокаемые']),
      countryOfOrigin: row['Страна-изготовитель'] || null,
      brandCountry: row['Страна бренда'] || null,
      pronationType: row['Тип пронации'] || null,
      membraneMaterialType: row['Тип мембранного материала'] || null,
      targetAudience: row['Целевая аудитория'] || null,
      tnvedCodes: row['ТН ВЭД коды ЕАЭС'] || null,
      bootsModel: row['Модель ботинок'] || null,
      shoesModel: row['Модель туфель'] || null,
      balletFlatsModel: row['Модель балеток'] || null,
      videoName: row['Озон.Видео: название'] || null,
      videoLink: row['Озон.Видео: ссылка'] || null,
      productsOnVideo: row['Озон.Видео: товары на видео'] || null,
      videoCoverLink: row['Озон.Видеообложка: ссылка'] || null,
      errorMessage: row['Ошибка'] || null,
      warningMessage: row['Предупреждение'] || null,
    }
  })
}

// Helper functions for data transformation
function convertRussianBoolean(value: any): boolean | null {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const cleaned = value.trim().toLowerCase()
    if (cleaned === 'да' || cleaned === 'yes' || cleaned === 'true') return true
    if (cleaned === 'нет' || cleaned === 'no' || cleaned === 'false') return false
  }
  return null
}

function parseDecimal(value: any): number | null {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^\d.,]/g, '').replace(',', '.')
    const parsed = parseFloat(cleaned)
    return !isNaN(parsed) ? parsed : null
  }
  return null
}

function parseJson(value: any): any {
  if (typeof value === 'object') return value
  if (typeof value === 'string' && value.trim()) {
    try {
      return JSON.parse(value)
    } catch {
      return null
    }
  }
  return null
}

async function handleUpload(req: NextRequest) {
  const startTime = Date.now()
  let logContext: FileUploadLogContext | undefined
  let uploadRecord: any = null

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const reportType = formData.get('reportType') as string
    
    // Базовая валидация
    if (!file) {
      await logger.error('Upload failed: No file provided')
      return NextResponse.json(
        { success: false, error: 'No file uploaded' },
        { status: 400 }
      )
    }

    if (!reportType) {
      await logger.error('Upload failed: No report type provided', {
        fileName: file.name,
        fileSize: file.size
      })
      return NextResponse.json(
        { success: false, error: 'Report type is required' },
        { status: 400 }
      )
    }

    // Создаем контекст для логирования
    logContext = {
      fileName: file.name,
      fileSize: file.size,
      reportType,
      stage: 'validation'
    }

    // Валидация типа отчета
    const reportTypeValidation = ReportTypeSchema.safeParse(reportType)
    if (!reportTypeValidation.success) {
      await logValidationError(logContext, ['Invalid report type: ' + reportType])
      return NextResponse.json(
        { success: false, error: 'Invalid report type' },
        { status: 400 }
      )
    }

    const validatedReportType = reportTypeValidation.data
    logContext.reportType = validatedReportType

    // Начинаем логирование процесса загрузки
    await logFileUploadStart(logContext)

    // Валидация размера файла (макс 500MB)
    if (file.size > 500 * 1024 * 1024) {
      await logValidationError(logContext, ['File too large: ' + (file.size / 1024 / 1024).toFixed(2) + 'MB (max 500MB)'])
      return NextResponse.json(
        { success: false, error: 'File too large (max 500MB)' },
        { status: 400 }
      )
    }

    // Валидация типа файла
    if (!validateFileType(file.name, validatedReportType)) {
      const expectedTypes = getExpectedFileTypes(validatedReportType)
      await logValidationError(logContext, [`Invalid file type for ${validatedReportType}. Expected: ${expectedTypes.join(', ')}`])
      return NextResponse.json(
        { success: false, error: `Invalid file type for ${validatedReportType}` },
        { status: 400 }
      )
    }

    await logFileUploadProgress('File validation passed', logContext)

    // Создание записи загрузки
    uploadRecord = await prisma.reportUpload.create({
      data: {
        reportType: validatedReportType,
        fileName: file.name,
        fileSize: file.size,
        status: 'processing',
        uploadedBy: 'system', // TODO: get from session
      }
    })

    logContext.uploadId = uploadRecord.id
    await logFileUploadProgress('Upload record created', logContext, { uploadId: uploadRecord.id })

    try {
      // Парсинг файла
      logContext.stage = 'parsing'
      await logFileUploadProgress('Starting file parsing', logContext)
      
      const buffer = Buffer.from(await file.arrayBuffer())
      const parsedData = parseReportFile(buffer, validatedReportType, file.name)

      await logFileUploadProgress('File parsing completed', logContext, {
        totalRows: parsedData.totalRows,
        parsedRows: parsedData.metadata.parsedRows,
        skippedRows: parsedData.metadata.skippedRows,
        errorsCount: parsedData.errors.length
      })

      if (parsedData.errors.length > 0 && parsedData.data.length === 0) {
        // Критические ошибки парсинга
        await logParsingError(logContext, parsedData.errors, parsedData.metadata)
        
        await prisma.reportUpload.update({
          where: { id: uploadRecord.id },
          data: {
            status: 'failed',
            errorMessage: parsedData.errors.join('; '),
            completedAt: new Date()
          }
        })

        return NextResponse.json({
          success: false,
          error: 'File parsing failed',
          details: parsedData.errors
        }, { status: 400 })
      }

      // Логируем предупреждения парсинга, если есть
      if (parsedData.errors.length > 0) {
        await logger.warn('File parsing completed with warnings', {
          ...logContext,
          warnings: parsedData.errors,
          metadata: parsedData.metadata
        })
      }

      // Валидация и трансформация данных в зависимости от типа отчета
      logContext.stage = 'processing'
      await logFileUploadProgress('Starting data validation', logContext, { rowsToValidate: parsedData.data.length })
      
      let validatedData: any[] = []
      let validationErrors: string[] = []

      switch (validatedReportType) {
        case 'ozon_orders':
          const ozonOrdersValidation = OzonOrdersSchema.safeParse(parsedData.data)
          if (ozonOrdersValidation.success) {
            validatedData = ozonOrdersValidation.data
          } else {
            validationErrors = ozonOrdersValidation.error.errors.map(e => `Row ${e.path[0]}: ${e.path.slice(1).join('.')}: ${e.message}`)
          }
          break

        case 'ozon_products':
          const ozonProductsValidation = OzonProductsSchema.safeParse(parsedData.data)
          if (ozonProductsValidation.success) {
            validatedData = ozonProductsValidation.data
          } else {
            validationErrors = ozonProductsValidation.error.errors.map(e => `Row ${e.path[0]}: ${e.path.slice(1).join('.')}: ${e.message}`)
          }
          break

        case 'ozon_barcodes':
          const ozonBarcodesValidation = OzonBarcodesSchema.safeParse(parsedData.data)
          if (ozonBarcodesValidation.success) {
            validatedData = ozonBarcodesValidation.data
          } else {
            validationErrors = ozonBarcodesValidation.error.errors.map(e => `Row ${e.path[0]}: ${e.path.slice(1).join('.')}: ${e.message}`)
          }
          break

        case 'ozon_category_products':
          // Special processing for category products - transform multi-sheet data
          const transformedData = transformOzCategoryProductsData(parsedData.data)
          const ozCategoryProductsValidation = OzCategoryProductsSchema.safeParse(transformedData)
          if (ozCategoryProductsValidation.success) {
            validatedData = ozCategoryProductsValidation.data
          } else {
            validationErrors = ozCategoryProductsValidation.error.errors.map(e => `Row ${e.path[0]}: ${e.path.slice(1).join('.')}: ${e.message}`)
          }
          break

        case 'wb_products':
          const wbProductsValidation = WildberriesProductsSchema.safeParse(parsedData.data)
          if (wbProductsValidation.success) {
            validatedData = wbProductsValidation.data
          } else {
            validationErrors = wbProductsValidation.error.errors.map(e => `Row ${e.path[0]}: ${e.path.slice(1).join('.')}: ${e.message}`)
          }
          break

        case 'wb_prices':
          const wbPricesValidation = WildberriesPricesSchema.safeParse(parsedData.data)
          if (wbPricesValidation.success) {
            validatedData = wbPricesValidation.data
          } else {
            validationErrors = wbPricesValidation.error.errors.map(e => `Row ${e.path[0]}: ${e.path.slice(1).join('.')}: ${e.message}`)
          }
          break

        default:
          validationErrors = ['Unknown report type']
          validatedData = []
      }

      await logFileUploadProgress('Data validation completed', logContext, {
        validatedRows: validatedData?.length || 0,
        validationErrorsCount: validationErrors.length
      })

      if (validationErrors.length > 0) {
        await logValidationError(logContext, validationErrors, parsedData.data.length)
        
        await prisma.reportUpload.update({
          where: { id: uploadRecord.id },
          data: {
            status: 'failed',
            errorMessage: validationErrors.slice(0, 10).join('; ') + (validationErrors.length > 10 ? '...' : ''),
            completedAt: new Date()
          }
        })

        return NextResponse.json({
          success: false,
          error: 'Data validation failed',
          details: validationErrors.slice(0, 20) // Ограничиваем количество ошибок в ответе
        }, { status: 400 })
      }

      // Сохранение данных в базе данных (подход delete + insert)
      logContext.stage = 'storage'
      await logFileUploadProgress('Starting data storage', logContext, { recordsToStore: validatedData!.length })
      
      const storageStartTime = Date.now()
      await processReportData(validatedReportType, validatedData!)
      const storageTime = Date.now() - storageStartTime

      // Обновление записи загрузки
      await prisma.reportUpload.update({
        where: { id: uploadRecord.id },
        data: {
          status: 'completed',
          recordsCount: validatedData!.length,
          completedAt: new Date()
        }
      })

      const totalTime = Date.now() - startTime
      await logFileUploadSuccess(logContext, {
        recordsProcessed: validatedData!.length,
        warnings: parsedData.errors
      })

      await logger.info('Upload completed successfully', {
        ...logContext,
        stage: 'completion',
        processingTime: `${totalTime}ms`,
        storageTime: `${storageTime}ms`,
        finalRecordCount: validatedData!.length
      })

      return NextResponse.json({
        success: true,
        uploadId: uploadRecord.id,
        recordsProcessed: validatedData!.length,
        warnings: parsedData.errors,
        metadata: parsedData.metadata,
        processingTime: totalTime
      })

    } catch (error) {
      // Логируем ошибку обработки
      if (logContext) {
        await logFileUploadError(logContext, error instanceof Error ? error : new Error('Unknown processing error'), {
          stage: logContext.stage || 'unknown',
          processingTime: `${Date.now() - startTime}ms`
        })
      }

      // Обновляем запись загрузки с ошибкой
      if (uploadRecord) {
        try {
          await prisma.reportUpload.update({
            where: { id: uploadRecord.id },
            data: {
              status: 'failed',
              errorMessage: error instanceof Error ? error.message : 'Unknown error',
              completedAt: new Date()
            }
          })
        } catch (dbError) {
          await logger.error('Failed to update upload record with error', {
            uploadId: uploadRecord.id,
            originalError: error instanceof Error ? error.message : 'Unknown error'
          }, dbError instanceof Error ? dbError : undefined)
        }
      }

      throw error
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    // Логируем общую ошибку загрузки
    if (logContext) {
      await logFileUploadError(logContext, error instanceof Error ? error : new Error(errorMessage), {
        totalProcessingTime: `${Date.now() - startTime}ms`
      })
    } else {
      await logger.error('Upload failed without context', {
        error: errorMessage,
        processingTime: `${Date.now() - startTime}ms`
      }, error instanceof Error ? error : undefined)
    }

    return NextResponse.json({
      success: false,
      error: 'Upload processing failed',
      details: errorMessage
    }, { status: 500 })
  }
}

async function processReportData(reportType: string, data: any[]) {
  // Delete existing data and insert new data (as per requirements)
  switch (reportType) {
    case 'ozon_orders':
      await prisma.ozonOrder.deleteMany()
      if (data.length > 0) {
        await prisma.ozonOrder.createMany({ data })
      }
      break

    case 'ozon_products':
      await prisma.ozonProduct.deleteMany()
      if (data.length > 0) {
        await prisma.ozonProduct.createMany({ data })
      }
      break

    case 'ozon_barcodes':
      await prisma.ozonBarcode.deleteMany()
      if (data.length > 0) {
        await prisma.ozonBarcode.createMany({ data })
      }
      break

    case 'ozon_category_products':
      await prisma.ozCategoryProduct.deleteMany()
      if (data.length > 0) {
        await prisma.ozCategoryProduct.createMany({ data })
      }
      break

    case 'wb_products':
      await prisma.wildberriesProduct.deleteMany()
      if (data.length > 0) {
        await prisma.wildberriesProduct.createMany({ data })
      }
      break

    case 'wb_prices':
      await prisma.wildberriesPrice.deleteMany()
      if (data.length > 0) {
        await prisma.wildberriesPrice.createMany({ data })
      }
      break

    default:
      throw new Error(`Unknown report type: ${reportType}`)
  }
}

// Get upload history
async function getUploadHistory(req: NextRequest) {
  try {
    const uploads = await prisma.reportUpload.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    return NextResponse.json({
      success: true,
      data: uploads
    })
  } catch (error) {
    console.error('Get history error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch upload history'
    }, { status: 500 })
  }
}

// Функция для получения ожидаемых типов файлов
function getExpectedFileTypes(reportType: string): string[] {
  const fileTypeMap: Record<string, string[]> = {
    'ozon_orders': ['csv'],
    'ozon_products': ['csv'],
    'ozon_barcodes': ['xlsx', 'xls'],
    'ozon_category_products': ['xlsx', 'xls'],
    'wb_products': ['xlsx', 'xls'],
    'wb_prices': ['xlsx', 'xls']
  }
  
  return fileTypeMap[reportType] || []
}

export const POST = withAuth(handleUpload)
export const GET = withAuth(getUploadHistory) 