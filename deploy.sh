#!/bin/bash

# Скрипт для развертывания Data Dashboard на сервере

set -e

echo "🚀 Начинаем развертывание Data Dashboard..."

# Проверка Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не установлен. Установите Node.js 18+ и попробуйте снова."
    exit 1
fi

# Проверка версии Node.js
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Требуется Node.js 18+. Текущая версия: $(node -v)"
    exit 1
fi

# Проверка PM2
if ! command -v pm2 &> /dev/null; then
    echo "📦 Устанавливаем PM2..."
    npm install -g pm2
fi

# Проверка PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL не найден. Убедитесь, что PostgreSQL установлен и запущен."
fi

# Установка зависимостей
echo "📦 Устанавливаем зависимости..."
npm install

# Проверка переменных окружения
if [ ! -f ".env.local" ]; then
    echo "⚠️  Файл .env.local не найден. Создаем из примера..."
    cp .env.local .env.local.example
    echo "✏️  Отредактируйте .env.local и запустите скрипт снова."
    exit 1
fi

# Сборка проекта
echo "🔨 Собираем проект..."
npm run build

# Создание директории для логов
mkdir -p logs

# Остановка предыдущего процесса (если есть)
echo "🔄 Перезапускаем приложение..."
pm2 stop data-dashboard 2>/dev/null || true
pm2 delete data-dashboard 2>/dev/null || true

# Запуск с PM2
echo "🚀 Запускаем приложение с PM2..."
pm2 start ecosystem.config.js --env production

# Настройка автозапуска
echo "⚙️  Настраиваем автозапуск..."
pm2 startup
pm2 save

echo "✅ Развертывание завершено!"
echo ""
echo "📊 Статус приложения:"
pm2 status

echo ""
echo "🌐 Приложение доступно по адресу: http://localhost:3000"
echo "📋 Логи: pm2 logs data-dashboard"
echo "🔄 Перезапуск: pm2 restart data-dashboard"
echo "⏹️  Остановка: pm2 stop data-dashboard"