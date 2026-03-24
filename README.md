# Basketball Booking Platform 🏀

Платформа для бронирования баскетбольных игр и организации тренировок.
Проект состоит из клиентского веб-приложения (frontend) и серверного API (backend) с интеграцией Telegram и Twilio.

## 🏗 Архитектура проекта

Проект разделен на две основные части: **Frontend** и **Backend**.

### 💻 Frontend (`/front`)
Клиентская часть реализована в виде Single Page Application (SPA).
* **Фреймворк:** Vue.js (v2)
* **Роутинг и стейт-менеджмент:** Vue Router, Vuex
* **UI/Стилизация:** Bootstrap Vue
* **Карты:** интеграция с Google Maps (`vue2-google-maps`)
* **Сборка:** Vue CLI (Babel, ESLint)

### ⚙️ Backend (`/back`)
Серверная часть предоставляет REST API и обрабатывает логику работы приложения, включая автоматизацию платежей и уведомлений.
* **Среда выполнения:** Node.js
* **Фреймворк:** Express.js
* **База данных:** SQLite3
* **Интеграции:**
  * `twilio` — для отправки SMS (авторизация, уведомления)
  * Telegram Bot API — для взаимодействия с пользователями через мессенджер
  * Платежные шлюзы (внутренняя интеграция `payproxy`)
* **Логирование:** Winston (`winston-daily-rotate-file`)


## 🚀 Запуск проекта

### Требования
* Node.js (рекомендуется v12 - v16, учитывая версии зависимостей)
* npm или yarn

### Запуск Backend-части
```bash
cd back
npm install
npm start # Запускает node server.js
```
Дополнительно доступны скрипты для разработки (`dev.start.sh` и `start.sh`).

### Запуск Frontend-части
```bash
cd front
npm install
npm run serve # Запуск dev-сервера с hot-reload
```
Для сборки production версии:
```bash
npm run build
```

## 📂 Структура проекта
* `/back/api/` — Контроллеры REST API (пользователи, игры, платежи, бронирования, tg-бот)
* `/back/dal/` — Data Access Layer (слой работы с БД SQLite)
* `/back/connector/` — Интеграции со сторонними сервисами (Telegram, Twilio, PayProxy)
* `/back/automation/` — Фоновые задачи (проверка истекших бронирований, открытие новых игр)
* `/front/src/components/` — Vue-компоненты приложения (авторизация, профиль, списки игр)
* `/front/src/store/` — Хранилище Vuex (actions, mutations)
* `/doc/` — Документация и макеты/скриншоты дизайна



## 📸 Скриншоты и интерфейс

Приложение разделено на интерфейсы для **игроков** и **администраторов (организаторов)**.

### Интерфейс игрока

| Список игр | Экран игры | Мои платежи | Бронирование |
|:---:|:---:|:---:|:---:|
| ![Список игр](doc/player/1.%20gamesPlayer.png) | ![Экран игры](doc/player/2.%20gameScreen.png) | ![Платежи](doc/player/5.%20gamePayments.png) | ![Бронирование](doc/player/reservationPlayer.png) |

### Интерфейс организатора (Админка)

| Управление играми | Создание игры | Прошлые игры |
|:---:|:---:|:---:|
| ![Управление играми](doc/admin/1.%20gamesAdmin.png) | ![Создание игры](doc/admin/6.%20newGame.png) | ![Прошлые игры](doc/admin/2.%20pastGames.png) |