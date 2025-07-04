# Технические спецификации

## Архитектура
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL с Prisma ORM
- **Authentication**: iron-session (cookie-based)
- **Styling**: Tailwind CSS
- **Deploy**: PM2 на VPS

## Конфигурация окружения

### Переменные окружения
Проект использует единый файл `.env` в корне проекта для всех переменных окружения.

⚠️ **ВАЖНО**: Если в системе установлены переменные окружения с теми же именами (например, `DATABASE_URL` для других проектов), они будут перекрыты настройками из `.env` файла.

#### Основные переменные:
```bash
# База данных (Prisma требует формат postgresql:// или postgres://)
DATABASE_URL="postgresql://username:password@host:port/database"

# Сессии
SESSION_SECRET="your-super-secret-session-key-change-this-in-production"

# Авторизация (формат: username:password,username:password)
AUTHORIZED_USERS="admin:admin123,user:user123"

# Окружение
NODE_ENV="development"
```

#### Файловая структура:
- `.env` - основной файл конфигурации (коммитится в Git)
- `.env.local` - локальные переопределения (игнорируется Git)
- `.env.local.example` - пример локальных настроек

### Решение конфликтов переменных окружения

Проект автоматически перекрывает системные переменные окружения:

1. **На уровне Next.js**: `next.config.js` загружает `.env` с параметром `override: true`
2. **На уровне Prisma**: `src/lib/db.ts` принудительно загружает переменные на сервере
3. **Проверка подключения**: используйте `npx prisma db push` для валидации

## База данных

### Prisma Configuration
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### Схема
- `UserSession` - сессии пользователей с JSON данными

## Deployment

### Требования к среде:
- Node.js 18+
- PostgreSQL 12+
- PM2 для управления процессами

### Переменные для продакшена:
```bash
# Обязательно измените в продакшене!
SESSION_SECRET="complex-production-secret-minimum-32-characters"
DATABASE_URL="postgresql://prod_user:prod_pass@prod_host:5432/prod_db"
NODE_ENV="production"
```

## Безопасность

### Headers
Автоматически устанавливаются security headers:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: origin-when-cross-origin`

### Сессии
- HttpOnly cookies
- Secure cookies в продакшене
- 24-часовое время жизни сессии

## Мониторинг

### Health Check
- Endpoint: `/api/health`
- Проверяет подключение к БД
- Возвращает статус и timestamp

### Logging
- Ошибки подключения к БД логируются в консоль
- В продакшене рекомендуется настроить централизованное логирование

## Технологический стек

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Язык**: TypeScript
- **Стили**: Tailwind CSS
- **Компоненты**: Базовые HTML + CSS

### Backend
- **Runtime**: Node.js 18+
- **API**: Next.js API Routes
- **Авторизация**: iron-session
- **Валидация**: Zod (опционально)

### База данных
- **СУБД**: PostgreSQL 14+
- **ORM**: Встроенный pg клиент
- **Миграции**: Простые SQL файлы

### Развертывание
- **Процесс менеджер**: PM2
- **Веб-сервер**: Nginx (опционально)
- **SSL**: Let's Encrypt

## Структура проекта

```
├── project-docs/          # Документация проекта
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/     # Страница авторизации
│   │   ├── dashboard/     # Главная страница
│   │   └── api/
│   │       └── auth/      # API авторизации
│   ├── lib/
│   │   ├── auth.ts        # Настройки авторизации
│   │   ├── db.ts          # Подключение к БД
│   │   └── utils.ts       # Утилиты
│   ├── components/
│   │   ├── Layout.tsx     # Основной макет
│   │   └── ui/            # UI компоненты
│   ├── middleware.ts      # Middleware авторизации
│   └── types/             # TypeScript типы
├── public/                # Статические файлы
├── .env.local            # Переменные окружения
├── ecosystem.config.js   # PM2 конфигурация
└── package.json
```

## Стандарты кодирования

### TypeScript
- Строгий режим включен
- Использование интерфейсов для типов
- Обработка всех ошибок

### CSS
- Tailwind CSS для стилизации
- Мобильный подход (mobile-first)
- Консистентная типография

### Безопасность
- Валидация всех входных данных
- Параметризованные запросы к БД
- Секреты только в переменных окружения

## API Design

### Авторизация
- `POST /api/auth/login` - Вход в систему
- `POST /api/auth/logout` - Выход из системы
- `GET /api/auth/user` - Получение текущего пользователя

### Структура ответов
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```