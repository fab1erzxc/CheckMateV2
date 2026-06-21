# CheckMateV2 — Project State

> Last updated: 2026-06-21
> For AI agents resuming work on this project.

## TL;DR

Full-stack receipt scanner + expense tracker for two people (user & girlfriend). React + Express + SQLite. AI-parses text (DeepSeek) and receipt photos (Gemini). Tracks shared debts, shows stats with charts.

---

## What Is Not in README / PRD

### Environment
- `.env` лежит в **корне проекта** (`CheckMateV2/.env`), не в `server/`
- Сервер запускается из `cd server && npm run dev`, поэтому `dotenv.config()` требует явного пути: `{ path: path.resolve(__dirname, '..', '..', '.env') }`
- Зависимости ставятся отдельно: `cd server && npm install`, `cd client && npm install` (или `npm run install:all` из корня)

### Database
- SQLite БД создаётся в `server/data.db` (через `better-sqlite3`)
- При старте автоматически создаются таблицы и сидится 2 пользователя (`Макар`, `Ксюша`) + 8 категорий
- `server/data.db-shm` и `server/data.db-wal` — временные файлы SQLite WAL, добавлены в `.gitignore`

### AI Models (актуальные на 2026-06-21)

| Сервис | Endpoint | Модель |
|--------|----------|--------|
| DeepSeek (текст) | `api.deepseek.com/v1/chat/completions` | `deepseek-v4-flash` |
| Gemini (фото) | `generativelanguage.googleapis.com/v1beta/models/...` | `gemini-2.5-flash` |
| OpenRouter (запасной) | есть ключ в `.env`, но **не подключён** в коде | — |

**Важно:** `gemini-pro-vision` удалён Google (404). `deepseek-chat` — deprecated.

### Category Assignment (добавлено 2026-06-21)
- AI возвращает `category` (название категории) вместе с `raw_text` и `price`
- Сервер маппит `category_name → category_id` через таблицу `categories`
- Если AI не определил категорию → fallback в таблицу `dictionary` (по `raw_text`)
- Клиент принимает `category_id` и предвыбирает его в `<CategorySelect>`
- Категории: `базовая еда` (1), `сладости/снэки` (2), `алкоголь` (3), `курево` (4), `утварь/химия для дома` (5), `транспорт` (6), `коммуналка` (7), `другое` (8)

### API Endpoints (фактические, не все описаны в PRD)

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/health` | Health check |
| POST | `/api/parse/text` | AI-парсинг текста |
| POST | `/api/parse/receipt` | AI-парсинг фото чека (multipart, поле `image`) |
| GET | `/api/receipts` | Список чеков |
| GET | `/api/receipts/:id` | Чек с товарами |
| POST | `/api/receipts` | Создать чек |
| PUT | `/api/receipts/:id` | Обновить чек |
| DELETE | `/api/receipts/:id` | Удалить чек |
| POST | `/api/receipts/items` | Добавить товар в чек |
| PUT | `/api/receipts/items/:id` | Обновить товар |
| DELETE | `/api/receipts/items/:id` | Удалить товар |
| GET | `/api/categories` | Список категорий |
| GET | `/api/dictionary` | Словарь |
| POST | `/api/dictionary` | Создать запись словаря |
| PUT | `/api/dictionary/:id` | Обновить запись |
| DELETE | `/api/dictionary/:id` | Удалить запись |
| GET | `/api/dictionary/search?q=` | Поиск по словарю |
| GET | `/api/balance` | Текущий баланс долга |
| POST | `/api/settlement` | Частичное/полное погашение долга |
| GET | `/api/settlements` | История погашений |
| GET | `/api/stats` | Статистика с фильтрами (`period`, `category`, `person`, `start_date`, `end_date`) |

---

## Architecture Notes

### Parse Flow
```
Client → POST /api/parse/text (или /receipt)
       → parse.ts (роут, только HTTP: валидация + ответ)
       → runParsePipeline(db, input)  ← parsePipeline.ts
            → AI (DeepSeek или Gemini в зависимости от type)
            → parseItemsFromContent() → извлекает [{raw_text, price, category}]
            → assignCategoryIds() → маппинг category_name → category_id
            → возвращает ParseResult
       → возвращает клиенту [{raw_text, price, category, category_id}]
       → Client отображает в ParsedItemsTable с предвыбранной категорией
```

### Save Flow
```
Client → POST /api/receipts { date, payer_id, items: [{raw_text, price, category_id, owner}] }
       → receiptService.createReceipt()
       → INSERT INTO receipts + INSERT INTO receipt_items (каждый товар)
       → Возвращает полный receipt с items
```

### Debt Calculation (balances)
- `balance.ts` → `calculateBalance()` в `debtService.ts`
- Логика: кто платил (`payer_id`) vs кто потребил (`owner`)
- `owner = 'user' | 'girlfriend' | '50-50'`
- `payer_id = 1` (Макар) или `2` (Ксюша)
- Учитываются settlement'ы

### Dictionary
- Таблица `dictionary`: `raw_text → normalized_name + category_id`
- Используется как fallback при определении категории
- Пока не обновляется автоматически при ручных правках пользователя (planned)

---

## Recent Changes

### 2026-06-21 (first session)

1. **Починены AI модели:**
   - `gemini-pro-vision` → `gemini-2.5-flash` (была 404)
   - `deepseek-chat` → `deepseek-v4-flash` (была deprecated)

2. **Починен старт сервера:**
   - Установлены зависимости (`server/node_modules`)
   - Исправлен путь к `.env` в `server/src/index.ts`

3. **Добавлена автоматическая категоризация:**
   - AI возвращает `category` в JSON
   - Сервер маппит `category_name → category_id`
   - Fallback через словарь
   - Клиент предвыбирает категорию

4. **Добавлены SQLite WAL-файлы в `.gitignore`**

### 2026-06-21 (second session)

5. **Вытащен HTML-генератор из ExportButton:**
   - `generateHtml()` переехала в `client/src/utils/htmlReport.ts` — чистая функция `htmlReport(stats): string`
   - `ExportButton` стал тоньше: только UI + вызов `htmlReport()`
   - Добавлен `vitest` в клиент (npm install)
   - Написаны 6 тестов для `htmlReport` (полнота, суммы, категории, периоды, люди, пустые данные)
   - Добавлены скрипты `npm run test` / `npm run test:watch`

6. **Создана папка `issues/`:**
   - `001-extract-html-report-generator.md` — ✅ completed
   - `002-deepen-parse-pipeline.md` — ✅ completed
   - `003-ai-client-boilerplate.md` — ✅ completed
   - `README.md` — индекс

7. **Углублён parse pipeline:**
   - `parseService.ts` переименован в `parsePipeline.ts` — теперь вся цепочка (AI → категоризация) в одном модуле
   - Единый интерфейс: `runParsePipeline(db, input)` где input = `{ type: 'text', text } | { type: 'image', imageBase64, mimeType }`
   - Роут `parse.ts` только вызывает pipeline, не содержит бизнес-логики
   - Написаны 7 тестов: текст, фото, маппинг категорий, fallback словаря, ошибки, пустые данные

8. **Вынесен общий HTTP-слой AI в `client.ts`:**
   - `server/src/services/ai/client.ts` — общий `aiRequest()` для всех AI-провайдеров
   - Key check, AbortController, timeout, fetch, обработка статусов, network errors — в одном месте
   - `deepseek.ts` похудел с 120→79 строк, `gemini.ts` с 136→103 строк
   - Добавление нового провайдера (OpenRouter) = ~30 строк вместо 120+

### 2026-06-21 (третья сессия)

9. **Обнаружена отсутствующая core-функция:** `payer_id` захардкожен = 1 в обоих страницах ввода чека. Долги не считаются.
10. **Созданы issue 004-006:**
   - `004-payer-selector.md` — UI выбора плательщика (critical)
   - `005-balance-widget-home.md` — виджет баланса на главной
   - `006-default-owner-by-payer.md` — умный дефолт owner в зависимости от плательщика

---

## Known Issues / Limitations

- ❌ **CRITICAL: payer_id захардкожен = 1** — в `TextEntry.tsx` и `PhotoEntry.tsx` нет UI выбора кто заплатил. Долги не считаются. Issue [#004](./issues/004-payer-selector.md)
- ❌ **OpenRouter не подключён** — есть ключ в `.env`, но код fallback'а не написан
- ❌ **Словарь не обновляется** — при ручной смене категории пользователем, `dictionary` не пополняется
- ❌ **Backup'ы не работают** — папка `backups/` описана, но код авто-бэкапа не реализован
- ❌ **PWA** — service worker и манифест не настроены
- ❌ **Offline** — не работает
- ❌ **Multi-currency** — есть поле `currency` в receipts, но UI конвертации нет
- ❌ **HTTPS / self-signed cert** — для доступа с телефона по Wi-Fi не настроено
- ⚠️ **`better-sqlite3` требует native build tools** — на Windows нужны Visual Studio Build Tools (node-gyp). Альтернатива — `sql.js` (чистый JS, без сборки)
- ⚠️ **DeepSeek API может быть недоступен** из некоторых регионов (Китайская цензура)

---

## Setup Quick Reference

```bash
# Первый раз
git clone ...
cp .env.example .env  # заполнить ключи
npm run install:all    # npm i + cd client && npm i + cd ../server && npm i

# Запуск
npm run dev            # concurrently запускает server (:3000) + client (:5173)

# Или по отдельности
cd server && npm run dev
cd client && npm run dev
```

Сайт открывается на `http://localhost:5173`.

---

## For Future AI Sessions

- **Не менять модели AI** без проверки curl'ом что они живы
- **Не трогать `.sandcastle/`** — это мусор от прошлой версии проекта
- **Парсинг фото** использует `multer` (multipart/form-data, поле `image`)
- **Типы** дублируются: `server/src/services/ai/types.ts` (внутренние) и `client/src/components/ParsedItemsTable.tsx` (UI)
- **Тесты** в `server/src/**/__tests__/` — integration тесты с in-memory SQLite (через `getTestDatabase()`)
- **Клиентские тесты** — `vitest` через `cd client && npm run test`
- **Архитектурные issue** — в `issues/` (локальные .md, готовые для реализации)
- **CRITICAL**: `issues/004-payer-selector.md` — `payer_id` захардкожен = 1, нужно UI выбора плательщика. Без этого долги не считаются.
- Все API ключи в `.env`: `GEMINI_API_KEY`, `DEEPSEEK_API_KEY`, `OPENROUTER_API_KEY`
- **AI клиент**: `server/src/services/ai/client.ts` — общая `aiRequest()` для HTTP вызовов к AI. Новый провайдер: `client.ts` + один адаптер (~30 строк)
