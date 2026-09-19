# 🚀 Инструкция по деплою бота на Render.com (24/7 бесплатно)

Бот будет работать на облачных серверах **Render.com** 24/7/365, даже когда ваш компьютер и телефон полностью выключены.

---

## 📋 Шаг 1. Загрузка проекта на GitHub

1. Зайдите на [GitHub.com](https://github.com/) и создайте новый репозиторий (например: `telegram-expense-bot`).
2. В терминале в папке проекта выполните команды:
   ```bash
   cd C:\Users\Hello\.gemini\antigravity\scratch\telegram-expense-bot
   git init
   git add .
   git commit -m "Initial commit for Render"
   git branch -M main
   git remote add origin ВАША_ССЫЛКА_НА_GITHUB_РЕПОЗИТОРИЙ
   git push -u origin main
   ```

---

## 📋 Шаг 2. Создание сервиса на Render.com

1. Зарегистрируйтесь / войдите на [Render.com](https://dashboard.render.com/).
2. Нажмите кнопку **+ New** (справа вверху) ➡️ **Web Service**.
3. Подключите ваш GitHub репозиторий `telegram-expense-bot`.
4. Заполните основные поля:
   * **Name**: `telegram-expense-bot`
   * **Language**: `Node`
   * **Branch**: `main`
   * **Build Command**: `npm install`
   * **Start Command**: `npm start`
   * **Instance Type**: `Free` (Бесплатный)

---

## 📋 Шаг 3. Добавление переменных окружения (Environment Variables)

В разделе **Environment Variables** добавьте следующие переменные:

| Key (Имя) | Value (Значение) |
| :--- | :--- |
| `BOT_TOKEN` | `8760033475:AAGd1me4GB-F9u2ZZmeBilrQKuOtWU8QYRg` |
| `ADMIN_ID` | `5709203608` |
| `SPREADSHEET_ID` | `18T6vFRi9BlliJrzNyy8bvoXH-wgerSwX7cD-ry9F_yE` |
| `SPREADSHEET_SHEET_NAME` | `AUTO` |
| `TIMEZONE` | `Asia/Tashkent` |
| `GOOGLE_CREDENTIALS_JSON` | *(Скопируйте и вставьте всё содержимое файла `credentials.json`)* |

---

## 📋 Шаг 4. Запуск!

1. Нажмите внизу **Deploy Web Service** (или **Create Web Service**).
2. Render за 1 минуту установит зависимости и запустит бота.
3. В логах появится:
   ```text
   🌐 Health check server listening on port 10000
   ⏳ Telegram-bot ishga tushmoqda...
   🚀 Bot muvaffaqiyatli ishga tushdi! Admin ID: 5709203608
   ```

Теперь бот работает в облаке **24 часа в сутки 7 дней в неделю**! 🎉
