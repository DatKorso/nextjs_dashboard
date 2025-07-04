# Data Dashboard

Веб-приложение для создания аналитических инструментов и работы с данными на базе Next.js 14 и PostgreSQL.

## Описание

Это базовая инфраструктура для Data Dashboard - платформы для анализа данных с простой авторизацией, подключением к PostgreSQL и готовой архитектурой для расширения функционала.

## Технологии

- **Frontend/Backend**: Next.js 14 с TypeScript
- **База данных**: PostgreSQL
- **Авторизация**: iron-session (зашифрованные куки)
- **Стили**: Tailwind CSS
- **Развертывание**: PM2

## Быстрый старт

### Требования
- Node.js 18+
- PostgreSQL 12+
- NPM или Yarn

### Установка

1. **Клонирование и установка зависимостей**
```bash
git clone <repository-url>
cd claude-code
npm install
```

2. **Настройка базы данных**
```bash
# Создайте PostgreSQL базу данных
createdb dashboard_db

# Настройте переменные окружения в .env
DATABASE_URL="postgresql://username:password@localhost:5432/dashboard_db"
SESSION_SECRET="your-super-secret-session-key-change-this-in-production"
AUTHORIZED_USERS="admin:admin123,user:user123"
NODE_ENV="development"
```

3. **Инициализация БД и запуск**
```bash
# Применить схему БД
npx prisma db push

# Генерировать Prisma клиент
npx prisma generate

# Запустить в режиме разработки
npm run dev
```

Приложение будет доступно на [http://localhost:3000](http://localhost:3000)

## 🛠️ Решение проблем

### ❌ Проблема: Prisma не может подключиться к БД

**Симптомы:**
```
Error validating datasource `db`: the URL must start with the protocol `postgresql://` or `postgres://`
```

**Причина:** Конфликт системных переменных окружения с файлом `.env`

**✅ Решение:**
1. Проект автоматически перекрывает системные переменные
2. Убедитесь что `DATABASE_URL` в `.env` имеет правильный формат:
   ```
   DATABASE_URL="postgresql://username:password@host:port/database"
   ```
3. Проверьте подключение: `npx prisma db push`

### 📁 Структура переменных окружения

- `.env` - основной файл конфигурации (коммитится в Git)
- `.env.local` - локальные переопределения (игнорируется Git)  
- `.env.local.example` - пример настроек

## Архитектура

- **Frontend**: Next.js 14 (App Router)
- **Backend**: Next.js API Routes  
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: iron-session (cookie-based)
- **Styling**: Tailwind CSS
- **Deploy**: PM2 на VPS

## API Endpoints

### Аутентификация
- `POST /api/auth/login` - вход в систему
- `POST /api/auth/logout` - выход  
- `GET /api/auth/user` - текущий пользователь

### Мониторинг
- `GET /api/health` - проверка состояния БД
- `GET /api/status` - статус авторизации

## Структура проекта

```
claude-code/
├── src/
│   ├── app/          # Next.js App Router
│   ├── components/   # React компоненты
│   ├── lib/          # Утилиты и конфигурация
│   └── types/        # TypeScript типы
├── prisma/           # Схема и миграции БД
├── project-docs/     # Документация проекта
└── .env             # Переменные окружения
```

## Авторизация

Система использует простую авторизацию на основе логина/пароля. Пользователи настраиваются в переменной `AUTHORIZED_USERS`:

```bash
AUTHORIZED_USERS="admin:admin123,user:user123,manager:manager456"
```

## Deployment

### Production переменные
```bash
# Обязательно измените в продакшене!
SESSION_SECRET="complex-production-secret-minimum-32-characters"
DATABASE_URL="postgresql://prod_user:prod_pass@prod_host:5432/prod_db"
NODE_ENV="production"
```

### PM2 запуск
```bash
npm run build
pm2 start ecosystem.config.js
```

## Разработка

### Полезные команды
```bash
# Разработка
npm run dev

# Сборка  
npm run build

# Проверка типов
npm run type-check

# Линтинг
npm run lint

# Prisma команды
npx prisma studio          # GUI для БД
npx prisma db push          # Применить изменения схемы
npx prisma generate         # Генерировать клиент
npx prisma migrate dev      # Создать миграцию
```

### База данных
Проект использует Prisma для работы с PostgreSQL. Схема определена в `prisma/schema.prisma`.

## Документация

Детальная документация находится в папке `project-docs/`:

- [`overview.md`](project-docs/overview.md) - обзор проекта
- [`tech-specs.md`](project-docs/tech-specs.md) - технические спецификации  
- [`requirements.md`](project-docs/requirements.md) - требования и функции
- [`timeline.md`](project-docs/timeline.md) - прогресс и планы

## Поддержка

При возникновении проблем:

1. Проверьте подключение к БД: `npx prisma db push`
2. Убедитесь что все переменные окружения установлены
3. Проверьте логи сервера в консоли
4. Обратитесь к документации в `project-docs/`

---

**Статус проекта**: 🟡 В разработке  
**Последнее обновление**: Декабрь 2024