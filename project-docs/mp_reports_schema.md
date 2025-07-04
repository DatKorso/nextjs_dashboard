# Marketplace Reports Loading Schema

This file defines how data should be loaded from various marketplace report files into the DataFox database. Each section describes the mapping between source files and database tables, as well as any required data transformations.

## Ozon Orders (.csv) - Data Loading Instructions

The user specifies the path to the Ozon orders .csv report in the application settings. The application loads data from this CSV file into the database as follows:

* **Target Postgres Table:** oz_orders
* **CSV Delimiter:** ';'
* **Header Row Number:** 1
* **Data Starts on Row:** 2
* **Columns to Load:** (List the exact CSV column header names and the corresponding target Postgres table column names)
  * `Номер заказа` -> `oz_order_number`
  * `Номер отправления` -> `oz_shipment_number`
  * `Принят в обработку` -> `oz_accepted_date`
  * `Статус` -> `order_status`
  * `OZON id` -> `oz_sku`
  * `Артикул` -> `oz_vendor_code`
* **Data Type Conversions/Transformations:**
  * `oz_order_number` varchar
  * `oz_shipment_number` varchar
  * `oz_accepted_date` date
  * `oz_status` varchar
  * `oz_sku` bigint
  * `oz_vendor_code` varchar
* **Pre-Update Action:** Delete all existing Ozon order data before inserting new data

## Ozon Products (.csv) - Data Loading Instructions

The user specifies the path to the Ozon products .csv report in the application settings. The application loads data from this CSV file into the database as follows:

* **Target Postgres Table:** oz_products
* **CSV Delimiter:** ';'
* **Header Row Number:** 1
* **Data Starts on Row:** 2
* **Columns to Load:** (List the exact CSV column header names and the corresponding target Postgres table column names)
  * `Артикул` -> `oz_vendor_code`
  * `Ozon Product ID` -> `oz_product_id`
  * `SKU` -> `oz_sku`
  * `Бренд` -> `oz_brand`
  * `Статус товара` -> `oz_product_status`
  * `Видимость на Ozon` -> `oz_product_visible`
  * `Причины скрытия` -> `oz_hiding_reasons`
  * `Доступно к продаже по схеме FBO, шт.` -> `oz_fbo_stock`
  * `Текущая цена с учетом скидки, ₽` -> `oz_actual_price`
* **Data Type Conversions/Transformations:**
  * `oz_vendor_code` varchar (must remove "'" symbol from data)
  * `oz_product_id` bigint
  * `oz_sku` bigint
  * `oz_brand` varchar
  * `oz_product_status` varchar
  * `oz_product_visible` varchar
  * `oz_hiding_reasons` varchar 
  * `oz_fbo_stock` int
* **Pre-Update Action:** Delete all existing Ozon order data before inserting new data

## Ozon Barcodes (.xlsx) - Data Loading Instructions

The user specifies the path to the Ozon barcodes .xlsx report in the application settings. The application loads data from this Excel file into the database as follows:

* **Target Postgres Table:** oz_barcodes
* **Sheet Name:** "Штрихкоды"
* **Header Row Number:** 3
* **Data Starts on Row:** 5
* **Columns to Load:** (List the exact Excel column header names and the corresponding target Postgres table column names)
  * `Артикул товара` -> `oz_vendor_code`
  * `Ozon ID` -> `oz_product_id`
  * `Штрихкод` -> `oz_barcode`
* **Data Type Conversions/Transformations:**
  * `oz_vendor_code` varchar
  * `oz_product_id` bigint
  * `oz_barcode` varchar
* **Pre-Update Action:** Delete all existing Ozon order data before inserting new data

## Wildberries Products (Folder) - Data Loading Instructions

The user specifies in the application settings the path to a folder containing .xlsx files. All files in this folder are loaded into the Postgres table (wb_products), and the data from each report is combined (unioned) together.

* **Target Postgres Table:** wb_products
* **File Pattern:** Pattern to identify files to process, e.g., "*.xlsx" in folder
* **Sheet Name:** "Товары"
* **Header Row Number:** 3
* **Data Starts on Row:** 5
* **Columns to Load:** (List the exact Excel column header names and the corresponding target Postgres table column names)
  * `Артикул WB` -> `wb_sku`
  * `Категория продавца` -> `wb_category`
  * `Бренд` -> `wb_brand`
  * `Баркод` -> `wb_barcodes`
  * `Размер` -> `wb_size`
* **Data Type Conversions/Transformations:**
  * `wb_sku` bigint
  * `wb_category` varchar
  * `wb_brand` varchar
  * `wb_barcodes` varchar (can contain list of barcodes through the symbol ";")
  * `wb_size` varchar
* **Pre-Update Action:** Delete all existing Ozon order data before inserting new data
* **File Grouping:** Union all records from multiple files

## Wildberries Prices (.xlsx) - Data Loading Instructions

The user specifies the path to the Wildberries .xlsx report in the application settings. The application loads data from this Excel file into the database as follows:

* **Target Postgres Table:** wb_prices
* **Sheet Name:** "Отчет - цены и скидки на товары"
* **Header Row Number:** 1
* **Data Starts on Row:** 2
* **Columns to Load:** (List the exact Excel column header names and the corresponding target Postgres table column names)
  * `Артикул WB` -> `wb_sku`
  * `Остатки WB` -> `wb_fbo_stock`
* **Data Type Conversions/Transformations:**
  * `wb_sku` bigint
  * `wb_fbo_stock` int
* **Pre-Update Action:** Delete all existing Wildberries prices data before inserting new data

## Связи между Таблицами

1.  **Связь: `oz_orders` и `oz_products`**
    *   **Тип:** Один-ко-Многим (Один товар в `oz_products` может быть во многих строках `oz_orders`).
    *   **Условие Объединения (JOIN):**
        *   `oz_orders.oz_sku = oz_products.oz_sku` (предпочтительно, если `oz_sku` в `oz_products` уникален и всегда присутствует)
        *   И/ИЛИ `oz_orders.oz_vendor_code = oz_products.oz_vendor_code` (`oz_vendor_code` менее надежен, так как в отличие от `oz_sku`, `oz_vendor_code` способен меняться)
    *   **Описание:** Позволяет получить полную информацию о товаре для каждой позиции в заказе Ozon.

2.  **Связь: `oz_barcodes` и `oz_products`**
    *   **Тип:** Один-ко-Многим (Один товар в `oz_products` может иметь несколько штрихкодов в `oz_barcodes`).
    *   **Условие Объединения (JOIN):**
        *   `oz_barcodes.oz_product_id = oz_products.oz_product_id`
        *   И/ИЛИ `oz_barcodes.oz_vendor_code = oz_products.oz_vendor_code` (`oz_vendor_code` менее надежен, так как в отличие от `oz_product_id`, `oz_vendor_code` способен меняться. Важно не путать `oz_product_id` и `oz_sku`, это разные значения)
    *   **Описание:** Позволяет получить список штрихкодов для товаров Ozon.

3.  **Связь: `wb_prices` и `wb_products`**
    *   **Тип:** Один-к-Одному (или Один-ко-Многим, если цены могут меняться со временем и хранится история, но текущая схема предполагает одну цену на товар).
    *   **Условие Объединения (JOIN):** `wb_prices.wb_sku = wb_products.wb_sku`
    *   **Описание:** Позволяет получить информацию о ценах для товаров Wildberries.

4.  **Связь: `oz_barcodes` (`oz_barcode`) и `wb_products` (`wb_barcodes`) - Сопоставление товаров по штрихкодам**
    *   **Цель:** Идентификация и связывание идентичных товаров, представленных на Ozon и Wildberries, на основе общих штрихкодов. Это позволяет проводить сквозной анализ или синхронизацию данных по товарам между площадками.
    *   **Проблема:** Прямое связывание таблиц через стандартные механизмы PK-FK затруднено из-за фундаментальных различий в структуре хранения штрихкодов:
        *   В таблице `wb_products` поле `wb_barcodes` может содержать как один штрихкод, так и строку с несколькими штрихкодами, разделенными точкой с запятой (`;`).
        *   В таблице `oz_barcodes` поле `oz_barcode` всегда содержит один штрихкод на запись. Однако, один и тот же товар Ozon (связанный через `oz_product_id` или `oz_vendor_code`) может иметь несколько записей в `oz_barcodes`, каждая с уникальным штрихкодом.
    *   **Предлагаемое решение (Бизнес-логика для сопоставления):**
        1.  **Нормализация штрихкодов Wildberries:** На первом этапе необходимо обработать поле `wb_products.wb_barcodes`. Для каждой записи из `wb_products` нужно извлечь все индивидуальные штрихкоды. Если поле содержит список, его следует разделить на отдельные значения. Это можно представить как создание временного набора данных, где каждая строка содержит пару (`wb_sku`, `wb_individual_barcode`).
        2.  **Прямое сравнение:** После нормализации, каждый `wb_individual_barcode` сравнивается с каждым значением из `oz_barcodes.oz_barcode`.
        3.  **Установление логической связи:** При обнаружении совпадения (`oz_barcodes.oz_barcode = wb_individual_barcode`) устанавливается логическая связь между соответствующим товаром Ozon (например, через `oz_barcodes.oz_product_id`) и товаром Wildberries (`wb_products.wb_sku`).
    *   **Тип связи:** Данная связь является логической, а не физической (основанной на ограничениях внешнего ключа). На уровне уникальных товаров это чаще всего будет связь "один-к-одному" или "многие-к-одному" (если несколько штрихкодов одного товара Ozon соответствуют одному товару WB с одним из этих штрихкодов, или наоборот).
    *   **Реализация:** Эта логика сопоставления обычно реализуется программно на уровне приложения или через сложные SQL-запросы (например, с использованием функций разделения строк для `wb_barcodes` и последующих JOIN-операций по результатам сравнения). Она не обеспечивается стандартными средствами СУБД для поддержания целостности данных.
    *   **Важно:** Качество и уникальность штрихкодов на обеих площадках критически важны для корректности такого сопоставления. Могут потребоваться дополнительные шаги по очистке и стандартизации данных штрихкодов.