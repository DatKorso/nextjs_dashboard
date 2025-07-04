# Техническое задание для обновления импорта Ozon Category Products

The existing import page needs to be updated to add a new import feature for Ozon Category Products. There is a folder containing .xlsx files, and for each file, data must be extracted from multiple sheets and loaded into a single database table. Since the table is newly created and all previous data will be deleted before each import, a separate migration is not required.

## Ozon Category Products (Folder) - Data Loading Instructions

The user specifies in the application settings the path to a folder containing .xlsx files. All files in this folder are processed, and data from multiple sheets within each file is combined and loaded into a single PostgreSQL table (oz_category_products).

* **Target PostgreSQL Table:** oz_category_products
* **File Pattern:** Pattern to identify files to process, e.g., "*.xlsx" in folder
* **Processing Mode:** Process multiple sheets from each file and combine data by oz_vendor_code
* **Pre-Update Action:** Delete all existing data before inserting new data
* **File Grouping:** Union all records from multiple files

## Sheet Processing Instructions

### Sheet 1: "Шаблон" (Template) - Main Product Data
* **Header Row Number:** 2
* **Data Starts on Row:** 4
* **Primary Key:** oz_vendor_code (Артикул*)

### Sheet 2: "Озон.Видео" (Ozon Video) - Video Data
* **Header Row Number:** 2
* **Data Starts on Row:** 4
* **Join Key:** oz_vendor_code (Артикул*)

### Sheet 3: "Озон.Видеообложка" (Ozon Video Cover) - Video Cover Data
* **Header Row Number:** 2
* **Data Starts on Row:** 4
* **Join Key:** oz_vendor_code (Артикул*)

## Database Schema with Data Types

**Complete PostgreSQL Table Schema for oz_category_products:**

```sql
CREATE TABLE IF NOT EXISTS oz_category_products (
    id SERIAL PRIMARY KEY,
    
    -- Basic Product Information
    oz_vendor_code VARCHAR(255) NOT NULL,              -- Артикул* (Primary Business Key)
    product_name VARCHAR(500),                         -- Название товара
    oz_actual_price DECIMAL(10,2),                     -- Цена, руб.*
    oz_price_before_discount DECIMAL(10,2),            -- Цена до скидки, руб.
    vat_percent SMALLINT,                              -- НДС, %*
    installment VARCHAR(50),                           -- Рассрочка
    review_points SMALLINT,                            -- Баллы за отзывы
    oz_sku BIGINT,                                     -- SKU (can be NULL)
    barcode VARCHAR(100),                              -- Штрихкод (Серийный номер / EAN)
    
    -- Package Information
    package_weight_g INTEGER,                          -- Вес в упаковке, г*
    package_width_mm INTEGER,                          -- Ширина упаковки, мм*
    package_height_mm INTEGER,                         -- Высота упаковки, мм*
    package_length_mm INTEGER,                         -- Длина упаковки, мм*
    package_count INTEGER,                             -- Количество заводских упаковок
    shoes_in_pack_count INTEGER,                       -- Количество пар обуви в упаковке
    
    -- Media Information
    main_photo_url TEXT,                               -- Ссылка на главное фото*
    additional_photos_urls TEXT,                       -- Ссылки на дополнительные фото
    photo_360_urls TEXT,                               -- Ссылки на фото 360
    photo_article VARCHAR(100),                        -- Артикул фото
    
    -- Brand and Product Classification
    oz_brand VARCHAR(100),                             -- Бренд в одежде и обуви*
    merge_on_card VARCHAR(100),                        -- Объединить на одной карточке*
    type VARCHAR(100),                                 -- Тип*
    gender VARCHAR(20),                                -- Пол*
    season VARCHAR(50),                                -- Сезон
    collection VARCHAR(100),                           -- Коллекция
    style VARCHAR(100),                                -- Стиль
    group_name VARCHAR(100),                           -- Название группы
    
    -- Size and Color Information
    color VARCHAR(100),                                -- Цвет товара*
    russian_size VARCHAR(20),                          -- Российский размер*
    color_name VARCHAR(100),                           -- Название цвета
    manufacturer_size VARCHAR(20),                     -- Размер производителя
    
    -- Content and Marketing
    hashtags TEXT,                                     -- #Хештеги
    annotation TEXT,                                   -- Аннотация
    rich_content_json JSONB,                           -- Rich-контент JSON
    keywords TEXT,                                     -- Ключевые слова
    is_18plus BOOLEAN,                                 -- Признак 18+ (converted from VARCHAR)
    
    -- Material Information
    material VARCHAR(200),                             -- Материал
    upper_material VARCHAR(200),                       -- Материал верха
    lining_material VARCHAR(200),                      -- Материал подкладки обуви
    insole_material VARCHAR(200),                      -- Материал стельки
    outsole_material VARCHAR(200),                     -- Материал подошвы обуви
    
    -- Physical Characteristics
    temperature_mode VARCHAR(100),                     -- Температурный режим
    foot_length_cm DECIMAL(4,1),                       -- Длина стопы, см
    insole_length_cm DECIMAL(4,1),                     -- Длина стельки, см
    fullness VARCHAR(10),                              -- Полнота
    heel_height_cm DECIMAL(4,1),                       -- Высота каблука, см
    sole_height_cm DECIMAL(4,1),                       -- Высота подошвы, см
    bootleg_height_cm DECIMAL(4,1),                    -- Высота голенища, см
    platform_height_cm DECIMAL(4,1),                  -- Высота платформы, см
    
    -- Additional Product Details
    size_info TEXT,                                    -- Информация о размерах
    fastener_type VARCHAR(100),                        -- Вид застёжки
    heel_type VARCHAR(100),                            -- Вид каблука
    model_features TEXT,                               -- Особенности модели
    decorative_elements TEXT,                          -- Декоративные элементы
    fit VARCHAR(50),                                   -- Посадка
    size_table_json JSONB,                             -- Таблица размеров JSON
    
    -- Product Specifications
    warranty_period VARCHAR(50),                       -- Гарантийный срок
    sport_purpose VARCHAR(100),                        -- Спортивное назначение
    orthopedic BOOLEAN,                                -- Ортопедический (converted from VARCHAR)
    waterproof BOOLEAN,                                -- Непромокаемые (converted from VARCHAR)
    country_of_origin VARCHAR(100),                    -- Страна-изготовитель
    brand_country VARCHAR(100),                        -- Страна бренда
    pronation_type VARCHAR(100),                       -- Тип пронации
    membrane_material_type VARCHAR(100),               -- Тип мембранного материала
    target_audience VARCHAR(100),                      -- Целевая аудитория
    tnved_codes VARCHAR(200),                          -- ТН ВЭД коды ЕАЭС
    
    -- Model Types
    boots_model VARCHAR(100),                          -- Модель ботинок
    shoes_model VARCHAR(100),                          -- Модель туфель
    ballet_flats_model VARCHAR(100),                   -- Модель балеток
    
    -- Video Data (from "Озон.Видео" sheet)
    video_name VARCHAR(255),                           -- Озон.Видео: название
    video_link TEXT,                                   -- Озон.Видео: ссылка
    products_on_video TEXT,                            -- Озон.Видео: товары на видео
    
    -- Video Cover Data (from "Озон.Видеообложка" sheet)
    video_cover_link TEXT,                             -- Озон.Видеообложка: ссылка
    
    -- Import Metadata
    error_message TEXT,                                -- Ошибка
    warning_message TEXT,                              -- Предупреждение
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    UNIQUE(oz_vendor_code)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_oz_category_products_vendor_code ON oz_category_products(oz_vendor_code);
CREATE INDEX IF NOT EXISTS idx_oz_category_products_brand ON oz_category_products(oz_brand);
CREATE INDEX IF NOT EXISTS idx_oz_category_products_type ON oz_category_products(type);
CREATE INDEX IF NOT EXISTS idx_oz_category_products_created_at ON oz_category_products(created_at);
```

## Column Mappings and Data Processing Rules

### From "Шаблон" Sheet:
| Excel Column Header | Database Column | Data Type | Processing Rules |
|---------------------|----------------|-----------|------------------|
| Артикул* | oz_vendor_code | VARCHAR(255) | Required, Primary Key |
| Название товара | product_name | VARCHAR(500) | Trim whitespace |
| Цена, руб.* | oz_actual_price | DECIMAL(10,2) | Convert to decimal, handle currency symbols |
| Цена до скидки, руб. | oz_price_before_discount | DECIMAL(10,2) | Convert to decimal, handle currency symbols |
| НДС, %* | vat_percent | SMALLINT | Convert percentage to integer |
| Рассрочка | installment | VARCHAR(50) | Standard text processing |
| Баллы за отзывы | review_points | SMALLINT | Convert to integer |
| SKU | oz_sku | BIGINT | Convert to bigint, allow NULL |
| Штрихкод (Серийный номер / EAN) | barcode | VARCHAR(100) | Standard text processing |
| Вес в упаковке, г* | package_weight_g | INTEGER | Convert to integer |
| Ширина упаковки, мм* | package_width_mm | INTEGER | Convert to integer |
| Высота упаковки, мм* | package_height_mm | INTEGER | Convert to integer |
| Длина упаковки, мм* | package_length_mm | INTEGER | Convert to integer |
| Ссылка на главное фото* | main_photo_url | TEXT | Validate URL format |
| Ссылки на дополнительные фото | additional_photos_urls | TEXT | Handle multiple URLs separated by newlines |
| Ссылки на фото 360 | photo_360_urls | TEXT | Handle multiple URLs separated by newlines |
| Артикул фото | photo_article | VARCHAR(100) | Standard text processing |
| Бренд в одежде и обуви* | oz_brand | VARCHAR(100) | Required field |
| Объединить на одной карточке* | merge_on_card | VARCHAR(100) | Required field |
| Цвет товара* | color | VARCHAR(100) | Required field, handle multiple values |
| Российский размер* | russian_size | VARCHAR(20) | Required field |
| Название цвета | color_name | VARCHAR(100) | Standard text processing |
| Размер производителя | manufacturer_size | VARCHAR(20) | Standard text processing |
| Тип* | type | VARCHAR(100) | Required field |
| Пол* | gender | VARCHAR(20) | Required field |
| Сезон | season | VARCHAR(50) | Standard text processing |
| Признак 18+ | is_18plus | BOOLEAN | Convert "Да"/"Нет" to boolean |
| Название группы | group_name | VARCHAR(100) | Standard text processing |
| #Хештеги | hashtags | TEXT | Handle multiple hashtags |
| Аннотация | annotation | TEXT | Standard text processing |
| Rich-контент JSON | rich_content_json | JSONB | Parse and validate JSON |
| Ключевые слова | keywords | TEXT | Handle multiple keywords |
| Страна-изготовитель | country_of_origin | VARCHAR(100) | Standard text processing |
| Материал | material | VARCHAR(200) | Handle multiple materials |
| Материал верха | upper_material | VARCHAR(200) | Handle multiple materials |
| Материал подкладки обуви | lining_material | VARCHAR(200) | Handle multiple materials |
| Материал стельки | insole_material | VARCHAR(200) | Standard text processing |
| Материал подошвы обуви | outsole_material | VARCHAR(200) | Standard text processing |
| Коллекция | collection | VARCHAR(100) | Standard text processing |
| Стиль | style | VARCHAR(100) | Standard text processing |
| Температурный режим | temperature_mode | VARCHAR(100) | Standard text processing |
| Длина стопы, см | foot_length_cm | DECIMAL(4,1) | Convert to decimal |
| Длина стельки, см | insole_length_cm | DECIMAL(4,1) | Convert to decimal |
| Полнота | fullness | VARCHAR(10) | Standard text processing |
| Высота каблука, см | heel_height_cm | DECIMAL(4,1) | Convert to decimal |
| Высота подошвы, см | sole_height_cm | DECIMAL(4,1) | Convert to decimal |
| Высота голенища, см | bootleg_height_cm | DECIMAL(4,1) | Convert to decimal |
| Информация о размерах | size_info | TEXT | Standard text processing |
| Вид застёжки | fastener_type | VARCHAR(100) | Standard text processing |
| Вид каблука | heel_type | VARCHAR(100) | Standard text processing |
| Особенности модели | model_features | TEXT | Standard text processing |
| Декоративные элементы | decorative_elements | TEXT | Standard text processing |
| Посадка | fit | VARCHAR(50) | Standard text processing |
| Таблица размеров JSON | size_table_json | JSONB | Parse and validate JSON |
| Гарантийный срок | warranty_period | VARCHAR(50) | Standard text processing |
| Спортивное назначение | sport_purpose | VARCHAR(100) | Standard text processing |
| Ортопедический | orthopedic | BOOLEAN | Convert "Да"/"Нет" to boolean |
| Непромокаемые | waterproof | BOOLEAN | Convert "Да"/"Нет" to boolean |
| Страна бренда | brand_country | VARCHAR(100) | Standard text processing |
| Тип пронации | pronation_type | VARCHAR(100) | Standard text processing |
| Тип мембранного материала | membrane_material_type | VARCHAR(100) | Standard text processing |
| Целевая аудитория | target_audience | VARCHAR(100) | Standard text processing |
| Количество заводских упаковок | package_count | INTEGER | Convert to integer |
| ТН ВЭД коды ЕАЭС | tnved_codes | VARCHAR(200) | Standard text processing |
| Высота платформы, см | platform_height_cm | DECIMAL(4,1) | Convert to decimal |
| Модель ботинок | boots_model | VARCHAR(100) | Standard text processing |
| Модель туфель | shoes_model | VARCHAR(100) | Standard text processing |
| Модель балеток | ballet_flats_model | VARCHAR(100) | Standard text processing |
| Количество пар обуви в упаковке | shoes_in_pack_count | INTEGER | Convert to integer |
| Ошибка | error_message | TEXT | Standard text processing |
| Предупреждение | warning_message | TEXT | Standard text processing |

### From "Озон.Видео" Sheet:
| Excel Column Header | Database Column | Data Type | Processing Rules |
|---------------------|----------------|-----------|------------------|
| Артикул* | oz_vendor_code | VARCHAR(255) | Join key - must match existing record |
| Озон.Видео: название | video_name | VARCHAR(255) | Standard text processing |
| Озон.Видео: ссылка | video_link | TEXT | Validate URL format |
| Озон.Видео: товары на видео | products_on_video | TEXT | Standard text processing |

### From "Озон.Видеообложка" Sheet:
| Excel Column Header | Database Column | Data Type | Processing Rules |
|---------------------|----------------|-----------|------------------|
| Артикул* | oz_vendor_code | VARCHAR(255) | Join key - must match existing record |
| Озон.Видеообложка: ссылка | video_cover_link | TEXT | Validate URL format |

## Data Processing Algorithm

1. **Initialize**: Delete all existing data from oz_category_products table
2. **Process each .xlsx file in the folder**:
   - **Step 1**: Read "Шаблон" sheet and create base records with oz_vendor_code as primary key
   - **Step 2**: Read "Озон.Видео" sheet and update existing records with video data using oz_vendor_code as join key
   - **Step 3**: Read "Озон.Видеообложка" sheet and update existing records with video cover data using oz_vendor_code as join key
3. **Data Validation**:
   - Validate required fields are not empty
   - Validate numeric fields can be converted properly
   - Validate URLs are in correct format
   - Validate JSON fields are properly formatted
4. **Error Handling**:
   - Log any conversion errors in error_message field
   - Log any validation warnings in warning_message field
   - Continue processing other records if one record fails

## Example Data Processing

```sql
-- Example of how data will be combined:
INSERT INTO oz_category_products (
    oz_vendor_code, product_name, oz_actual_price, /* ... other fields from Template sheet */
    video_name, video_link, products_on_video,      /* ... fields from Video sheet */
    video_cover_link                                 /* ... fields from Video Cover sheet */
) VALUES (
    '11100626-белый-38',
    'Сабо на каблуке кожаные с открытой пяткой и квадратным носом, мюли',
    1679.00,
    /* ... other template data ... */
    '75346ba0041b4d0c93601b9738804577',
    'https://cdnvideo.v.ozone.ru/vod/video-52/01J6F3ASC0S146HY9CYC6K8FY8/asset_3_h264.mp4',
    null,
    'https://cdnvideo.v.ozone.ru/vod/video-52/01J6F3ASC0S146HY9CYC6K8FY8/asset_3_h264.mp4'
);
```

## Performance Considerations

- Use batch insert operations for better performance
- Create indexes on frequently queried columns
- Use JSONB for JSON data to enable efficient queries
- Consider using UPSERT operations for data updates
- Implement proper error handling and logging