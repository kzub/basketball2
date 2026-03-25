# Basketball Booking Platform 🏀

![Vue.js](https://img.shields.io/badge/Vue.js-2.7-4FC08D?style=flat&logo=vue.js)
![Node.js](https://img.shields.io/badge/Node.js-%3E%3D%2020-339933?style=flat&logo=node.js)

Платформа для бронирования баскетбольных игр и организации тренировок.
Проект состоит из клиентского веб-приложения (frontend) и серверного API (backend) с интеграцией Telegram и Twilio.

## 🏗 Краткий обзор проекта

Проект разделен на две основные части: **Frontend** и **Backend**. Для более детальной информации об архитектуре, подходах к разработке и тестированию каждой из частей, пожалуйста, обратитесь к соответствующим документам:

*   👉 **[Frontend Документация (Клиентская часть)](front/README.md)**
*   👉 **[Backend Документация (Серверная часть)](back/README.md)**

### 💻 Frontend (`/front`)
Клиентская часть реализована в виде Single Page Application (SPA).
* **Фреймворк:** Vue.js (v2)
* **Роутинг и стейт-менеджмент:** Vue Router, Vuex
* **Стилизация:** Bootstrap Vue

### ⚙️ Backend (`/back`)
Серверная часть предоставляет REST API и обрабатывает логику работы приложения, включая автоматизацию платежей и уведомлений.
* **Среда выполнения:** Node.js (v20)
* **База данных:** SQLite3
* **Интеграции:** Telegram Bot API, Twilio, внутренний шлюз PayProxy

## 🚀 Быстрый запуск

### Требования
* Node.js (рекомендуется v20)
* npm

### Запуск Backend-части
1. Создайте конфигурационный файл `settings.json` (инструкция по заполнению: [Создание конфигурационного файла в back/README.md](back/README.md#создание-конфигурационного-файла-settingsjson))
2. Выполните:
```bash
cd back
npm install
BASKET_MODE=dev npm start # Запускает node server.js в режиме разработки
```

### Запуск Frontend-части
```bash
cd front
npm install --legacy-peer-deps
npm run serve # Запуск dev-сервера с hot-reload
```

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
