import { z } from 'zod'

// ============= UTILITY VALIDATORS =============

// Валидатор для удаления одинарных кавычек из vendor code
const cleanVendorCode = z.string().transform((val) => val.replace(/'/g, ''))

// Валидатор для преобразования строки в число
const stringToNumber = z.string().transform((val, ctx) => {
  const parsed = Number(val)
  if (isNaN(parsed)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Not a valid number",
    })
    return z.NEVER
  }
  return parsed
})

// Валидатор для даты
const dateStringToDate = z.string().transform((val, ctx) => {
  const parsed = new Date(val)
  if (isNaN(parsed.getTime())) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Not a valid date",
    })
    return z.NEVER
  }
  return parsed
})

// ============= OZON VALIDATORS =============

// Ozon Orders CSV Validator
export const OzonOrderRowSchema = z.object({
  'Номер заказа': z.string().min(1),
  'Номер отправления': z.string().optional(),
  'Принят в обработку': dateStringToDate.optional(),
  'Статус': z.string().optional(),
  'OZON id': stringToNumber.optional(),
  'Артикул': z.string().optional(),
}).transform((data) => ({
  ozOrderNumber: data['Номер заказа'],
  ozShipmentNumber: data['Номер отправления'] || null,
  ozAcceptedDate: data['Принят в обработку'] || null,
  orderStatus: data['Статус'] || null,
  ozSku: data['OZON id'] || null,
  ozVendorCode: data['Артикул'] || null,
}))

export const OzonOrdersSchema = z.array(OzonOrderRowSchema)

// Ozon Products CSV Validator
export const OzonProductRowSchema = z.object({
  'Артикул': cleanVendorCode,
  'Ozon Product ID': stringToNumber.optional(),
  'SKU': stringToNumber.optional(),
  'Бренд': z.string().optional(),
  'Статус товара': z.string().optional(),
  'Видимость на Ozon': z.string().optional(),
  'Причины скрытия': z.string().optional(),
  'Доступно к продаже по схеме FBO, шт.': z.union([z.string(), z.number()]).transform((val) => {
    const num = typeof val === 'string' ? parseInt(val, 10) : val
    return isNaN(num) ? null : num
  }).optional(),
  'Текущая цена с учетом скидки, ₽': z.union([z.string(), z.number()]).transform((val) => {
    const num = typeof val === 'string' ? parseFloat(val) : val
    return isNaN(num) ? null : num
  }).optional(),
}).transform((data) => ({
  ozVendorCode: data['Артикул'],
  ozProductId: data['Ozon Product ID'] || null,
  ozSku: data['SKU'] || null,
  ozBrand: data['Бренд'] || null,
  ozProductStatus: data['Статус товара'] || null,
  ozProductVisible: data['Видимость на Ozon'] || null,
  ozHidingReasons: data['Причины скрытия'] || null,
  ozFboStock: data['Доступно к продаже по схеме FBO, шт.'] || null,
  ozActualPrice: data['Текущая цена с учетом скидки, ₽'] || null,
}))

export const OzonProductsSchema = z.array(OzonProductRowSchema)

// Ozon Barcodes XLSX Validator  
export const OzonBarcodeRowSchema = z.object({
  'Артикул': z.string(),
  'Ozon Product ID': z.union([z.string(), z.number()]).transform((val) => {
    const num = typeof val === 'string' ? Number(val) : val
    return isNaN(num) ? null : num
  }).optional(),
  'Штрихкод': z.string(),
}).transform((data) => ({
  ozVendorCode: data['Артикул'],
  ozProductId: data['Ozon Product ID'] || null,
  ozBarcode: data['Штрихкод'],
}))

export const OzonBarcodesSchema = z.array(OzonBarcodeRowSchema)

// ============= WILDBERRIES VALIDATORS =============

// Wildberries Products XLSX Validator
export const WildberriesProductRowSchema = z.object({
  'Артикул WB': z.union([z.string(), z.number()]).transform((val) => {
    const num = typeof val === 'string' ? Number(val) : val
    return isNaN(num) ? null : num
  }),
  'Категория продавца': z.string().optional(),
  'Бренд': z.string().optional(),
  'Баркод': z.string().optional(),
  'Размер': z.string().optional(),
}).transform((data) => ({
  wbSku: data['Артикул WB'],
  wbCategory: data['Категория продавца'] || null,
  wbBrand: data['Бренд'] || null,
  wbBarcodes: data['Баркод'] || null,
  wbSize: data['Размер'] || null,
}))

export const WildberriesProductsSchema = z.array(WildberriesProductRowSchema)

// Wildberries Prices XLSX Validator
export const WildberriesPriceRowSchema = z.object({
  'Артикул WB': z.union([z.string(), z.number()]).transform((val) => {
    const num = typeof val === 'string' ? Number(val) : val
    return isNaN(num) ? null : num
  }),
  'Остатки WB': z.union([z.string(), z.number()]).transform((val) => {
    const num = typeof val === 'string' ? parseInt(val, 10) : val
    return isNaN(num) ? null : num
  }).optional(),
}).transform((data) => ({
  wbSku: data['Артикул WB'],
  wbFboStock: data['Остатки WB'] || null,
}))

export const WildberriesPricesSchema = z.array(WildberriesPriceRowSchema)

// ============= OZON CATEGORY PRODUCTS VALIDATORS =============

// Helper function to convert "Да"/"Нет" to boolean
const russianBooleanTransform = z.union([z.string(), z.boolean()]).transform((val) => {
  if (typeof val === 'boolean') return val
  if (typeof val === 'string') {
    const cleaned = val.trim().toLowerCase()
    if (cleaned === 'да' || cleaned === 'yes' || cleaned === 'true') return true
    if (cleaned === 'нет' || cleaned === 'no' || cleaned === 'false') return false
  }
  return null
}).optional()

// Helper function to safely parse JSON
const safeJsonTransform = z.union([z.string(), z.object({})]).transform((val, ctx) => {
  if (typeof val === 'object') return val
  if (typeof val === 'string' && val.trim()) {
    try {
      return JSON.parse(val)
    } catch (error) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid JSON format",
      })
      return null
    }
  }
  return null
}).optional()

// Helper function to convert various numeric inputs to decimal
const decimalTransform = z.union([z.string(), z.number()]).transform((val, ctx) => {
  if (typeof val === 'number') return val
  if (typeof val === 'string') {
    const cleaned = val.replace(/[^\d.,]/g, '').replace(',', '.')
    const parsed = parseFloat(cleaned)
    if (!isNaN(parsed)) return parsed
  }
  return null
}).optional()

// Helper function to convert various numeric inputs to integer
const integerTransform = z.union([z.string(), z.number()]).transform((val, ctx) => {
  if (typeof val === 'number') return Math.floor(val)
  if (typeof val === 'string') {
    const cleaned = val.replace(/[^\d]/g, '')
    const parsed = parseInt(cleaned, 10)
    if (!isNaN(parsed)) return parsed
  }
  return null
}).optional()

// Template Sheet Validator (Main Product Data)
export const OzCategoryProductTemplateRowSchema = z.object({
  'Артикул*': z.string().min(1, 'Vendor code is required'),
  'Название товара': z.string().optional(),
  'Цена, руб.*': decimalTransform,
  'Цена до скидки, руб.': decimalTransform,
  'НДС, %*': integerTransform,
  'Рассрочка': z.string().optional(),
  'Баллы за отзывы': integerTransform,
  'SKU': z.union([z.string(), z.number()]).transform((val) => {
    if (typeof val === 'number') return BigInt(val)
    if (typeof val === 'string' && val.trim()) {
      const num = Number(val.trim())
      return !isNaN(num) ? BigInt(num) : null
    }
    return null
  }).optional(),
  'Штрихкод (Серийный номер / EAN)': z.string().optional(),
  'Вес в упаковке, г*': integerTransform,
  'Ширина упаковки, мм*': integerTransform,
  'Высота упаковки, мм*': integerTransform,
  'Длина упаковки, мм*': integerTransform,
  'Количество заводских упаковок': integerTransform,
  'Количество пар обуви в упаковке': integerTransform,
  'Ссылка на главное фото*': z.string().optional(),
  'Ссылки на дополнительные фото': z.string().optional(),
  'Ссылки на фото 360': z.string().optional(),
  'Артикул фото': z.string().optional(),
  'Бренд в одежде и обуви*': z.string().optional(),
  'Объединить на одной карточке*': z.string().optional(),
  'Тип*': z.string().optional(),
  'Пол*': z.string().optional(),
  'Сезон': z.string().optional(),
  'Коллекция': z.string().optional(),
  'Стиль': z.string().optional(),
  'Название группы': z.string().optional(),
  'Цвет товара*': z.string().optional(),
  'Российский размер*': z.string().optional(),
  'Название цвета': z.string().optional(),
  'Размер производителя': z.string().optional(),
  '#Хештеги': z.string().optional(),
  'Аннотация': z.string().optional(),
  'Rich-контент JSON': safeJsonTransform,
  'Ключевые слова': z.string().optional(),
  'Признак 18+': russianBooleanTransform,
  'Материал': z.string().optional(),
  'Материал верха': z.string().optional(),
  'Материал подкладки обуви': z.string().optional(),
  'Материал стельки': z.string().optional(),
  'Материал подошвы обуви': z.string().optional(),
  'Температурный режим': z.string().optional(),
  'Длина стопы, см': decimalTransform,
  'Длина стельки, см': decimalTransform,
  'Полнота': z.string().optional(),
  'Высота каблука, см': decimalTransform,
  'Высота подошвы, см': decimalTransform,
  'Высота голенища, см': decimalTransform,
  'Высота платформы, см': decimalTransform,
  'Информация о размерах': z.string().optional(),
  'Вид застёжки': z.string().optional(),
  'Вид каблука': z.string().optional(),
  'Особенности модели': z.string().optional(),
  'Декоративные элементы': z.string().optional(),
  'Посадка': z.string().optional(),
  'Таблица размеров JSON': safeJsonTransform,
  'Гарантийный срок': z.string().optional(),
  'Спортивное назначение': z.string().optional(),
  'Ортопедический': russianBooleanTransform,
  'Непромокаемые': russianBooleanTransform,
  'Страна-изготовитель': z.string().optional(),
  'Страна бренда': z.string().optional(),
  'Тип пронации': z.string().optional(),
  'Тип мембранного материала': z.string().optional(),
  'Целевая аудитория': z.string().optional(),
  'ТН ВЭД коды ЕАЭС': z.string().optional(),
  'Модель ботинок': z.string().optional(),
  'Модель туфель': z.string().optional(),
  'Модель балеток': z.string().optional(),
  'Ошибка': z.string().optional(),
  'Предупреждение': z.string().optional(),
}).transform((data) => ({
  ozVendorCode: data['Артикул*'],
  productName: data['Название товара'] || null,
  ozActualPrice: data['Цена, руб.*'] || null,
  ozPriceBeforeDiscount: data['Цена до скидки, руб.'] || null,
  vatPercent: data['НДС, %*'] || null,
  installment: data['Рассрочка'] || null,
  reviewPoints: data['Баллы за отзывы'] || null,
  ozSku: data['SKU'] || null,
  barcode: data['Штрихкод (Серийный номер / EAN)'] || null,
  packageWeightG: data['Вес в упаковке, г*'] || null,
  packageWidthMm: data['Ширина упаковки, мм*'] || null,
  packageHeightMm: data['Высота упаковки, мм*'] || null,
  packageLengthMm: data['Длина упаковки, мм*'] || null,
  packageCount: data['Количество заводских упаковок'] || null,
  shoesInPackCount: data['Количество пар обуви в упаковке'] || null,
  mainPhotoUrl: data['Ссылка на главное фото*'] || null,
  additionalPhotosUrls: data['Ссылки на дополнительные фото'] || null,
  photo360Urls: data['Ссылки на фото 360'] || null,
  photoArticle: data['Артикул фото'] || null,
  ozBrand: data['Бренд в одежде и обуви*'] || null,
  mergeOnCard: data['Объединить на одной карточке*'] || null,
  type: data['Тип*'] || null,
  gender: data['Пол*'] || null,
  season: data['Сезон'] || null,
  collection: data['Коллекция'] || null,
  style: data['Стиль'] || null,
  groupName: data['Название группы'] || null,
  color: data['Цвет товара*'] || null,
  russianSize: data['Российский размер*'] || null,
  colorName: data['Название цвета'] || null,
  manufacturerSize: data['Размер производителя'] || null,
  hashtags: data['#Хештеги'] || null,
  annotation: data['Аннотация'] || null,
  richContentJson: data['Rich-контент JSON'] || null,
  keywords: data['Ключевые слова'] || null,
  is18plus: data['Признак 18+'] || null,
  material: data['Материал'] || null,
  upperMaterial: data['Материал верха'] || null,
  liningMaterial: data['Материал подкладки обуви'] || null,
  insoleMaterial: data['Материал стельки'] || null,
  outsoleMaterial: data['Материал подошвы обуви'] || null,
  temperatureMode: data['Температурный режим'] || null,
  footLengthCm: data['Длина стопы, см'] || null,
  insoleLengthCm: data['Длина стельки, см'] || null,
  fullness: data['Полнота'] || null,
  heelHeightCm: data['Высота каблука, см'] || null,
  soleHeightCm: data['Высота подошвы, см'] || null,
  bootlegHeightCm: data['Высота голенища, см'] || null,
  platformHeightCm: data['Высота платформы, см'] || null,
  sizeInfo: data['Информация о размерах'] || null,
  fastenerType: data['Вид застёжки'] || null,
  heelType: data['Вид каблука'] || null,
  modelFeatures: data['Особенности модели'] || null,
  decorativeElements: data['Декоративные элементы'] || null,
  fit: data['Посадка'] || null,
  sizeTableJson: data['Таблица размеров JSON'] || null,
  warrantyPeriod: data['Гарантийный срок'] || null,
  sportPurpose: data['Спортивное назначение'] || null,
  orthopedic: data['Ортопедический'] || null,
  waterproof: data['Непромокаемые'] || null,
  countryOfOrigin: data['Страна-изготовитель'] || null,
  brandCountry: data['Страна бренда'] || null,
  pronationType: data['Тип пронации'] || null,
  membraneMaterialType: data['Тип мембранного материала'] || null,
  targetAudience: data['Целевая аудитория'] || null,
  tnvedCodes: data['ТН ВЭД коды ЕАЭС'] || null,
  bootsModel: data['Модель ботинок'] || null,
  shoesModel: data['Модель туфель'] || null,
  balletFlatsModel: data['Модель балеток'] || null,
  errorMessage: data['Ошибка'] || null,
  warningMessage: data['Предупреждение'] || null,
}))

// Video Sheet Validator
export const OzCategoryProductVideoRowSchema = z.object({
  'Артикул*': z.string().min(1, 'Vendor code is required'),
  'Озон.Видео: название': z.string().optional(),
  'Озон.Видео: ссылка': z.string().optional(),
  'Озон.Видео: товары на видео': z.string().optional(),
}).transform((data) => ({
  ozVendorCode: data['Артикул*'],
  videoName: data['Озон.Видео: название'] || null,
  videoLink: data['Озон.Видео: ссылка'] || null,
  productsOnVideo: data['Озон.Видео: товары на видео'] || null,
}))

// Video Cover Sheet Validator
export const OzCategoryProductVideoCoverRowSchema = z.object({
  'Артикул*': z.string().min(1, 'Vendor code is required'),
  'Озон.Видеообложка: ссылка': z.string().optional(),
}).transform((data) => ({
  ozVendorCode: data['Артикул*'],
  videoCoverLink: data['Озон.Видеообложка: ссылка'] || null,
}))

// Combined schema for the final merged data
export const OzCategoryProductRowSchema = z.object({
  ozVendorCode: z.string(),
  productName: z.string().nullable().optional(),
  ozActualPrice: z.number().nullable().optional(),
  ozPriceBeforeDiscount: z.number().nullable().optional(),
  vatPercent: z.number().nullable().optional(),
  installment: z.string().nullable().optional(),
  reviewPoints: z.number().nullable().optional(),
  ozSku: z.bigint().nullable().optional(),
  barcode: z.string().nullable().optional(),
  packageWeightG: z.number().nullable().optional(),
  packageWidthMm: z.number().nullable().optional(),
  packageHeightMm: z.number().nullable().optional(),
  packageLengthMm: z.number().nullable().optional(),
  packageCount: z.number().nullable().optional(),
  shoesInPackCount: z.number().nullable().optional(),
  mainPhotoUrl: z.string().nullable().optional(),
  additionalPhotosUrls: z.string().nullable().optional(),
  photo360Urls: z.string().nullable().optional(),
  photoArticle: z.string().nullable().optional(),
  ozBrand: z.string().nullable().optional(),
  mergeOnCard: z.string().nullable().optional(),
  type: z.string().nullable().optional(),
  gender: z.string().nullable().optional(),
  season: z.string().nullable().optional(),
  collection: z.string().nullable().optional(),
  style: z.string().nullable().optional(),
  groupName: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  russianSize: z.string().nullable().optional(),
  colorName: z.string().nullable().optional(),
  manufacturerSize: z.string().nullable().optional(),
  hashtags: z.string().nullable().optional(),
  annotation: z.string().nullable().optional(),
  richContentJson: z.any().nullable().optional(),
  keywords: z.string().nullable().optional(),
  is18plus: z.boolean().nullable().optional(),
  material: z.string().nullable().optional(),
  upperMaterial: z.string().nullable().optional(),
  liningMaterial: z.string().nullable().optional(),
  insoleMaterial: z.string().nullable().optional(),
  outsoleMaterial: z.string().nullable().optional(),
  temperatureMode: z.string().nullable().optional(),
  footLengthCm: z.number().nullable().optional(),
  insoleLengthCm: z.number().nullable().optional(),
  fullness: z.string().nullable().optional(),
  heelHeightCm: z.number().nullable().optional(),
  soleHeightCm: z.number().nullable().optional(),
  bootlegHeightCm: z.number().nullable().optional(),
  platformHeightCm: z.number().nullable().optional(),
  sizeInfo: z.string().nullable().optional(),
  fastenerType: z.string().nullable().optional(),
  heelType: z.string().nullable().optional(),
  modelFeatures: z.string().nullable().optional(),
  decorativeElements: z.string().nullable().optional(),
  fit: z.string().nullable().optional(),
  sizeTableJson: z.any().nullable().optional(),
  warrantyPeriod: z.string().nullable().optional(),
  sportPurpose: z.string().nullable().optional(),
  orthopedic: z.boolean().nullable().optional(),
  waterproof: z.boolean().nullable().optional(),
  countryOfOrigin: z.string().nullable().optional(),
  brandCountry: z.string().nullable().optional(),
  pronationType: z.string().nullable().optional(),
  membraneMaterialType: z.string().nullable().optional(),
  targetAudience: z.string().nullable().optional(),
  tnvedCodes: z.string().nullable().optional(),
  bootsModel: z.string().nullable().optional(),
  shoesModel: z.string().nullable().optional(),
  balletFlatsModel: z.string().nullable().optional(),
  videoName: z.string().nullable().optional(),
  videoLink: z.string().nullable().optional(),
  productsOnVideo: z.string().nullable().optional(),
  videoCoverLink: z.string().nullable().optional(),
  errorMessage: z.string().nullable().optional(),
  warningMessage: z.string().nullable().optional(),
})

export const OzCategoryProductsSchema = z.array(OzCategoryProductRowSchema)

// ============= FILE UPLOAD VALIDATORS =============

export const FileUploadSchema = z.object({
  name: z.string(),
  size: z.number().max(500 * 1024 * 1024, 'File too large (max 500MB)'),
  type: z.string(),
  lastModified: z.number(),
})

export const ReportTypeSchema = z.enum([
  'ozon_orders',
  'ozon_products', 
  'ozon_barcodes',
  'ozon_category_products',
  'wb_products',
  'wb_prices'
])

export const UploadRequestSchema = z.object({
  reportType: ReportTypeSchema,
  file: FileUploadSchema,
})

// ============= RESPONSE SCHEMAS =============

export const UploadResponseSchema = z.object({
  success: z.boolean(),
  uploadId: z.number().optional(),
  recordsProcessed: z.number().optional(),
  errors: z.array(z.string()).optional(),
  message: z.string().optional(),
})

// Types for TypeScript
export type OzonOrderRow = z.infer<typeof OzonOrderRowSchema>
export type OzonProductRow = z.infer<typeof OzonProductRowSchema>
export type OzonBarcodeRow = z.infer<typeof OzonBarcodeRowSchema>
export type OzCategoryProductTemplateRow = z.infer<typeof OzCategoryProductTemplateRowSchema>
export type OzCategoryProductVideoRow = z.infer<typeof OzCategoryProductVideoRowSchema>
export type OzCategoryProductVideoCoverRow = z.infer<typeof OzCategoryProductVideoCoverRowSchema>
export type OzCategoryProductRow = z.infer<typeof OzCategoryProductRowSchema>
export type WildberriesProductRow = z.infer<typeof WildberriesProductRowSchema>
export type WildberriesPriceRow = z.infer<typeof WildberriesPriceRowSchema>
export type ReportType = z.infer<typeof ReportTypeSchema>
export type UploadResponse = z.infer<typeof UploadResponseSchema> 