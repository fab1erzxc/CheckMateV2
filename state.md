# CheckMateV2 — Project State

> Last updated: 2026-06-21 (конец дня)
> For AI agents resuming work on this project.

---

## Quick Resume for Next Session

**Что есть:** Full-stack receipt scanner + expense tracker для двоих (Макар и Ксюша). React + Express + SQLite. AI-парсинг текста (DeepSeek V4 Flash) и фото (Gemini 2.5 Flash). Расчёт долгов с учётом кто платил, кто потреблял, 50-50 сплит. Статистика с графиками.

**Где лежит:** `C:\Users\Makar1\PROG\CheckMateV2`

**Запуск:** `cd server && npm run dev` (порт 3000) + `cd client && npm run dev` (порт 5173)

**Проверки:** `cd server && npm test` (87 тестов), `cd client && npm run test` (6 тестов), `tsc --noEmit`

**Последний коммит:** `2f85f8b` — fix: stats charts filter by person

**Что важно для след. сессии:**
- `.env` лежит в корне проекта, не в `server/`
- AI модели: `deepseek-v4-flash` (текст), `gemini-2.5-flash` (фото)
- База: `server/data.db` (better-sqlite3), авто-инициализация + сиды при старте
- All 87/87 tests pass ✅

**Ключевые файлы:**
- `server/src/services/ai/client.ts` — универсальный HTTP-клиент для AI
- `server/src/services/parsePipeline.ts` — пайплайн парсинга (AI + категоризация)
- `server/src/services/debtService.ts` — расчёт долгов
- `client/src/components/PayerToggle.tsx` — переключатель плательщика

**Приоритеты (issues/README.md):**
1. OpenRouter fallback (ключ уже в `.env`)
2. Dictionary UPSERT (добавить UNIQUE constraint)
3. Вынести авто-пополнение словаря в общий хелпер
4. Backup'ы
5. PWA + HTTPS

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

### Category Assignment
- AI возвращает `category` (название категории) вместе с `raw_text` и `price`
- Сервер маппит `category_name → category_id` через таблицу `categories`
- Если AI не определил категорию → fallback в таблицу `dictionary` (по `raw_text`)
- Клиент принимает `category_id` и предвыбирает его в `<CategorySelect>`
- Категории: `базовая еда` (1), `сладости/снэки` (2), `алкоголь` (3), `курево` (4), `утварь/химия для дома` (5), `транспорт` (6), `коммуналка` (7), `другое` (8)

### API Endpoints (фактические)

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
| POST | `/api/balance/settlement` | Частичное/полное погашение долга |
| GET | `/api/balance/settlements` | История погашений |
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
       → После успешного save: POST /api/dictionary для каждого товара с category_id
       → Возвращает полный receipt с items
```

### Debt Calculation (balances)
- `balance.ts` route → `calculateBalance()` в `debtService.ts`
- Логика: кто платил (`payer_id`) vs кто потребил (`owner`)
- `owner = 'user' | 'girlfriend' | '50-50'`
- `payer_id = 1` (Макар) или `2` (Ксюша)
- Учитываются settlement'ы (частичные погашения)

### Dictionary
- Таблица `dictionary`: `raw_text → normalized_name + category_id`
- Используется как fallback при определении категории
- Автоматически пополняется при сохранении чека (через TextEntry, PhotoEntry, ReceiptDetail)
- **Известная проблема:** нет UNIQUE constraint — возможны дубликаты

### AI Client Layer
- `server/src/services/ai/client.ts` — универсальный `aiRequest(params)`
- Принимает: url, headers, body, apiKey, serviceName, timeout
- Обрабатывает: key check, AbortController, fetch, status errors, JSON, network errors
- Возвращает `{ ok: true, data } | { ok: false, error }`
- `deepseek.ts` (79 строк) и `gemini.ts` (103 строки) — только сборка запроса + парсинг ответа
- Новый провайдер: ~30 строк (client.ts + адаптер)

---

## Known Issues / Limitations

- ✅ **payer_id выбирается** — PayerToggle (Макар/Ксюша) в TextEntry, PhotoEntry, ReceiptDetail
- ✅ **Словарь пополняется** — при сохранении чека товары с category_id добавляются в dictionary
- ✅ **Графики Stats фильтруются по человеку** — пофикшен баг: `byCategory`/`byPeriod` теперь учитывают `person` filter
- ❌ **OpenRouter не подключён** — есть ключ в `.env`, но код fallback'а не написан
- ❌ **Backup'ы не работают** — папка `backups/` описана, но код не реализован
- ❌ **PWA** — service worker и манифест не настроены
- ❌ **Offline** — не работает
- ❌ **Multi-currency** — есть поле `currency` в receipts, но UI конвертации нет
- ❌ **HTTPS / self-signed cert** — для доступа с телефона по Wi-Fi не настроено
- ⚠️ **`better-sqlite3` требует native build tools** — на Windows нужны Visual Studio Build Tools (node-gyp)
- ⚠️ **DeepSeek API может быть недоступен** из некоторых регионов
- ⚠️ **Дубликаты в словаре** — таблица `dictionary` без UNIQUE constraint на `raw_text`
- ⚠️ **Код авто-пополнения словаря продублирован** — в TextEntry, PhotoEntry, ReceiptDetail

---

## Recent Changes (today)

### Session 1 — Fix AI + server
- AI модели обновлены (gemini-pro-vision → 2.5-flash, deepseek-chat → v4-flash)
- Сервер починен: установлены зависимости, исправлен dotenv path
- Добавлена автоматическая категоризация (AI → category_name → category_id → dictionary fallback)
- Переменная env `закры_API_KEY` → `DEEPSEEK_API_KEY`

### Session 2 — Architecture (issues 001-003)
- HTML-генератор вытащен из ExportButton в `htmlReport.ts` (+6 тестов vitest)
- Parse pipeline углублён: `parseService.ts` → `parsePipeline.ts` (+7 тестов)
- AI клиент вынесен в `client.ts` (deepseek 120→79 строк, gemini 136→103)

### Session 3 — Core features (issues 004-006)
- PayerToggle (Макар/Ксюша) добавлен во все формы
- Пофикшен баг: balanceRouter маунтился на `/api` вместо `/api/balance`
- Виджет баланса на Home странице
- Умный дефолт owner: payer=Ксюша → owner=girlfriend
- Кнопки "Set all to" в ParsedItemsTable
- Авто-пополнение словаря при сохранении (было только в ReceiptDetail)

### Session 3.5 — Stats chart fix
- `byCategory`/`byPeriod` не фильтровали по `ri.owner` — три графика показывали одно и то же
- Добавлен `ownerFilter` в SQL запросы

---

## For Future AI Sessions

### Перед началом работы
1. Запустить сервер: `cd server && npm run dev`
2. Запустить клиент: `cd client && npm run dev` 
3. Проверить тесты: `cd server && npm test` (87), `cd client && npm run test` (6)
4. Проверить typecheck: `cd server && npx tsc --noEmit`, `cd client && npx tsc --noEmit`
5. Проверить health: `curl http://localhost:3000/api/health`

### Важные правила
- **Не менять модели AI** без проверки curl'ом что они живы
- **Не трогать `.sandcastle/`** — мусор от прошлой версии
- **Не удалять issues/**, issues/README.md, state.md — контекст для AI
- **Не переписывать better-sqlite3** на sql.js — пользователь отказался

### Файлы с тестами (server)
- `server/src/services/__tests__/statsService.test.ts`
- `server/src/services/__tests__/debtService.test.ts`
- `server/src/services/__tests__/receiptService.test.ts`
- `server/src/services/__tests__/dictionaryService.test.ts`
- `server/src/services/__tests__/parsePipeline.test.ts`
- `server/src/services/__tests__/deepseek.test.ts`
- `server/src/services/__tests__/gemini.test.ts`
- `server/src/db/__tests__/init.test.ts`
- `server/src/db/__tests__/seed.test.ts`
- Тесты используют `getTestDatabase()` — in-memory SQLite, не трогают `data.db`

### Файлы с тестами (client)
- `client/src/utils/__tests__/htmlReport.test.ts`
- Vitest, без jsdom — чистые функции

### Ключевые модули
| Модуль | Путь | Назначение |
|--------|------|------------|
| AI client | `server/src/services/ai/client.ts` | Универсальный HTTP-клиент для всех AI-провайдеров |
| DeepSeek | `server/src/services/ai/deepseek.ts` | Адаптер для DeepSeek (текст) |
| Gemini | `server/src/services/ai/gemini.ts` | Адаптер для Gemini (фото) |
| Parse pipeline | `server/src/services/parsePipeline.ts` | Пайплайн: AI → парсинг → категоризация |
| Stats service | `server/src/services/statsService.ts` | Статистика (total, by_category, by_period, by_person) |
| Debt service | `server/src/services/debtService.ts` | Расчёт долгов (balance + settlement) |
| Dictionary service | `server/src/services/dictionaryService.ts` | CRUD словаря |
| Receipt service | `server/src/services/receiptService.ts` | CRUD чеков + товаров |
| PayerToggle | `client/src/components/PayerToggle.tsx` | Выбор плательщика |
| ParsedItemsTable | `client/src/components/ParsedItemsTable.tsx` | Таблица товаров с OwnerToggle + CategorySelect |
| htmlReport | `client/src/utils/htmlReport.ts` | Генерация HTML-отчёта (чистая функция) |

### Приоритеты на будущее
1. **OpenRouter fallback** — ключ есть в `.env`. Нужен адаптер (~30 строк) + интеграция в parsePipeline
2. **Dictionary UPSERT** — добавить UNIQUE(raw_text) + `ON CONFLICT DO UPDATE` в dictionaryService
3. **Вынести авто-пополнение словаря** — сейчас дублируется в TextEntry, PhotoEntry, ReceiptDetail
4. **Backup'ы** — `backups/` папка описана, код не написан
5. **PWA + HTTPS** — service worker, manifest, self-signed cert для телефона

### Добавление нового AI-провайдера
```typescript
// 1. Создать адаптер (как deepseek.ts или gemini.ts)
// 2. Использовать aiRequest() из client.ts
// 3. Интегрировать в parsePipeline.ts
// ~30 строк кода
```

### Проверка API ключей
```bash
curl -X POST http://localhost:3000/api/parse/text \
  -H "Content-Type: application/json" \
  -d '{"text":"Marlboro 150 lira, bread 30 lira"}'
# Должен вернуть items с category_id
```
