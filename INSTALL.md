# Инструкция по установке Data Dashboard

## Быстрая установка

### 1. Автоматическая установка (рекомендуется)

```bash
# Сделайте скрипт исполняемым и запустите
chmod +x deploy.sh
./deploy.sh
```

Скрипт автоматически:
- Проверит системные требования
- Установит зависимости
- Соберет проект
- Настроит PM2
- Запустит приложение

### 2. Ручная установка

#### Шаг 1: Установка зависимостей

```bash
# Установка Node.js (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Установка PostgreSQL
sudo apt-get install postgresql postgresql-contrib
```

#### Шаг 2: Настройка базы данных

```bash
# Переключение на пользователя postgres
sudo -u postgres psql

# Создание базы данных и пользователя
CREATE DATABASE dashboard;
CREATE USER dashboard_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE dashboard TO dashboard_user;
\q
```

#### Шаг 3: Настройка проекта

```bash
# Клонирование репозитория
git clone <repository-url>
cd data-dashboard

# Установка зависимостей
npm install

# Копирование конфигурации
cp .env.local.example .env.local
```

#### Шаг 4: Редактирование конфигурации

Отредактируйте `.env.local`:

```env
DATABASE_URL=postgresql://dashboard_user:your_password@localhost:5432/dashboard
SESSION_SECRET=your-super-secret-session-key-minimum-32-characters
AUTHORIZED_USERS=admin:secure_admin_password,user1:secure_user_password
NODE_ENV=production
```

#### Шаг 5: Сборка и запуск

```bash
# Сборка проекта
npm run build

# Установка PM2
npm install -g pm2

# Запуск с PM2
pm2 start ecosystem.config.js --env production
pm2 startup
pm2 save
```

## Проверка установки

### 1. Проверка статуса

```bash
# Статус PM2
pm2 status

# Проверка здоровья приложения
curl http://localhost:3000/api/health

# Просмотр логов
pm2 logs data-dashboard
```

### 2. Тест авторизации

1. Откройте http://localhost:3000
2. Войдите с учетными данными из AUTHORIZED_USERS
3. Проверьте доступ к dashboard

## Настройка Nginx (опционально)

### Установка и настройка

```bash
# Установка Nginx
sudo apt-get install nginx

# Создание конфигурации
sudo nano /etc/nginx/sites-available/data-dashboard
```

Конфигурация Nginx:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Активация конфигурации
sudo ln -s /etc/nginx/sites-available/data-dashboard /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### SSL с Let's Encrypt

```bash
# Установка Certbot
sudo apt-get install certbot python3-certbot-nginx

# Получение SSL сертификата
sudo certbot --nginx -d your-domain.com

# Автоматическое обновление
sudo crontab -e
# Добавить: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Обслуживание

### Обновление приложения

```bash
# Получение обновлений
git pull origin main

# Пересборка и перезапуск
npm install
npm run build
pm2 restart data-dashboard
```

### Резервное копирование

```bash
# Бэкап базы данных
pg_dump -U dashboard_user -h localhost dashboard > backup_$(date +%Y%m%d).sql

# Бэкап конфигурации
tar -czf config_backup_$(date +%Y%m%d).tar.gz .env.local ecosystem.config.js
```

### Мониторинг

```bash
# Статус системы
pm2 status
pm2 monit

# Просмотр логов
pm2 logs data-dashboard --lines 100

# Перезапуск при проблемах
pm2 restart data-dashboard
```

## Устранение неполадок

### Проблемы с базой данных

```bash
# Проверка подключения
psql $DATABASE_URL -c "SELECT NOW();"

# Перезапуск PostgreSQL
sudo systemctl restart postgresql
```

### Проблемы с приложением

```bash
# Просмотр детальных логов
pm2 logs data-dashboard --err

# Перезапуск с обновлением переменных
pm2 restart data-dashboard --update-env

# Полный перезапуск
pm2 delete data-dashboard
pm2 start ecosystem.config.js --env production
```

### Проблемы с авторизацией

1. Проверьте переменную AUTHORIZED_USERS в .env.local
2. Убедитесь, что SESSION_SECRET установлен и достаточно длинный
3. Очистите куки браузера

## Безопасность

### Рекомендации

1. **Сильные пароли**: Используйте сложные пароли в AUTHORIZED_USERS
2. **Секретный ключ**: SESSION_SECRET должен быть случайным и длинным
3. **Firewall**: Настройте firewall для ограничения доступа
4. **SSL**: Используйте HTTPS в production
5. **Обновления**: Регулярно обновляйте зависимости

### Настройка Firewall

```bash
# UFW (Ubuntu)
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```