# Opencode Agent Instructions (AGENTS.md)

Welcome to the Basketball Booking Platform repository. This file serves as a comprehensive guide for agentic AI coders operating within this codebase. It outlines the core architecture, development commands, style rules, and conventions you must strictly follow to ensure stability and maintainability.

## 1. Project Overview and Context
*   **Tech Stack:** Node.js backend (transitioning from v12 to v20), Express.js, SQLite3 database. 
*   **Architecture:** Layered architecture consisting of:
    *   `api/` - Express route handlers and controller logic.
    *   `dal/` - Data Access Layer (SQLite operations and business logic models like `Game`, `Reservation`, `User`).
    *   `utils/` - Shared helpers (logging, dates, notification event mapping).
    *   `connector/` - External integrations (Telegram bot, Twilio SMS, Payment Proxy).
*   **Environment:** The application relies heavily on environment configurations. Tests and local development should always run with `BASKET_MODE=dev`.

## 2. Build, Lint, and Test Commands

### Testing
We use **Jest (v27)** alongside **Supertest**. The project is highly sensitive, and tests are crucial. You must ensure tests run in-memory without mutating a real file-based SQLite database.

*   **Run the full test suite (with coverage):**
    ```bash
    cd back
    BASKET_MODE=dev npm test
    # or
    BASKET_MODE=dev npx jest tests --coverage --forceExit
    ```
*   **Run a single test file (Fastest way to verify changes):**
    ```bash
    cd back
    BASKET_MODE=dev npx jest tests/api/game.test.js
    ```
*   **Run a specific test case within a file:**
    ```bash
    cd back
    BASKET_MODE=dev npx jest tests/api/game.test.js -t "should add game correctly"
    ```
*   *Note on Testing Rules:* 
    *   Always mock out the DAL (`jest.mock('../../dal/dal')`) when testing the API layer controllers to isolate business logic. 
    *   When testing the DAL itself, completely mock the `sqlite3` driver using `jest.mock('sqlite3')` to return exact mocked JSON structures required to hit branch coverage.

### Running the Application
*   **Start the development server:**
    ```bash
    cd back
    BASKET_MODE=dev npm start
    # or
    BASKET_MODE=dev node server.js
    ```
*   *Note on Server Architecture:* `app.js` exclusively handles the Express middleware and routing setup. `server.js` imports it, binds the application to a network port, and starts recurring cron intervals. **Never** bind the port inside `app.js` to prevent `EADDRINUSE` lockups during Jest tests.

### Linting & Formatting
*   Currently, there is no strict Prettier or ESLint enforcement in the CI pipeline, but you must mimic the surrounding code style exactly.
*   Use 2 spaces for indentation.
*   Use single quotes (`'`) for strings unless utilizing template literals (`` ` ``).

## 3. Code Style and Guidelines

### Imports and Modules
*   **Module System:** Use CommonJS (`require()` and `module.exports`). Do not use ES6 `import`/`export` syntax until the v20 migration specifically mandates and configures it globally in the `package.json`.
*   **Import Ordering:** 
    1. Built-in Node modules (`fs`, `path`).
    2. Third-party NPM packages (`express`, `uuid`).
    3. Internal project modules (`./utils/misc`, `./dal/dal`).

### Variables, Types, and Formatting
*   **JavaScript:** The project uses plain JavaScript. Do not write TypeScript (`.ts`).
*   **JSDoc:** Add JSDoc comments sparingly. They are primarily requested for complex object payloads or function signatures that lack obvious context.
*   **Naming Conventions:**
    *   `camelCase` for variables, object instances, and functions (e.g., `getGameDetails`, `paymentAmount`).
    *   `PascalCase` for Classes and Models in the `types.js` layer (e.g., `Game`, `Reservation`, `User`).
    *   `UPPER_SNAKE_CASE` for global constants or configuration keys (e.g., `MIN_PAYMENT_AMOUNT`).
*   **Asynchronous Code:** Prefer `async/await` over raw `.then().catch()` chains or callbacks. Always `await` asynchronous database queries before progressing.

### Error Handling and Logging
*   **Logging:** Use the custom Winston logger wrapped in `utils/logger.js`.
    *   Inside Express routes, use the request-bound logger: `req.log.info()`, `req.log.error()`, `req.log.warn()`.
    *   Outside routes (or in the DAL/utilities), instantiate a named logger: `const log = require('../utils/logger').create('MODULE_NAME'); log.error('...');`
    *   Never use standard `console.log()` in production code.
*   **Exception Boundaries:**
    *   Catch potential async errors in controllers. Return standardized JSON error responses (e.g., `res.send({ error: true, reason: 'message' })` or `res.send({ ok: false })`).
    *   Do not leak stack traces or raw database errors to the HTTP response payload.
    *   Fatal system-level exceptions trigger global Telegram notifications via `events.emit('system.uncaughtException')`. Do not remove these event emitters from `app.js`.

### API and Express Request Lifecycle
*   All incoming requests are tagged with a unique `req.id` and pass through a custom logging middleware defined in `app.js`.
*   The Data Access Layer is globally attached to `req.dal` by middleware. Inside controllers (`api/*.js`), always access the database via `req.dal` (e.g., `req.dal.game.getGame(id)`). Do not `require('../dal/dal')` directly within an Express route file to maintain mockability.
*   The logged-in user ID is accessible via `req.userId` (decoded from the `auth` cookie).

### Database Operations (SQLite3)
*   The DAL relies on `sqlite3`. Queries are written in raw SQL. Avoid writing dynamic SQL string concatenations that could lead to SQL injection. 
*   Always use parameterized queries (the `?` placeholder) if adding new queries.
*   Example: `await dal.all('SELECT * FROM users WHERE phone = ?', [phone]);`

### Business Logic and Events
*   **Event Emitters:** The system heavily utilizes an event-driven architecture via `utils/notifications.js` to dispatch Telegram/SMS messages out-of-band without blocking the HTTP request loop.
*   When modifying critical state (e.g., a reservation is paid, a game is created, a user is banned, credits transferred), always ensure the corresponding `events.emit('event.name', payload)` is triggered so the external bots can notify users/admins. Look at `tests/utils.notifications.test.js` for the list of supported internal events.

## 4. Operational Directives for Agents
*   **Git Commits:** Do not commit code yourself. Wait for the user to commit or explicitly ask to do so. Only make the requested modifications and run tests, but do not use `git commit` automatically.
*   **Verify Before Committing:** Before finalizing a set of changes, you must ensure the test suite still passes. Run `BASKET_MODE=dev npx jest tests --coverage`.
*   **Clean Up:** Do not leave `fix-*.js`, `.bak` backups, or temporary text files in the project directory when finishing your tasks.
*   **Version Transitions:** Node v12 to Node v20 transitions require careful attention to dependency bumping. Do not blindly upgrade packages like `sqlite3` without checking Node-API compatibility.
