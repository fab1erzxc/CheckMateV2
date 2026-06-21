# CheckMateV2

Smart receipt scanner, expense tracker, and debt calculator for shared expenses (двое — Макар и Ксюша).

## Features

- Scan receipts via camera or gallery (Gemini Vision)
- Enter expenses as natural language text (DeepSeek)
- AI-powered parsing with automatic categorization
- Learning dictionary (auto-populates from saved receipts)
- Debt calculation (who paid vs who consumed, with 50-50 splitting)
- Payer selector (Макар/Ксюша) on each receipt
- Balance tracking with settlement history
- Statistics with interactive charts (by category, period, person)
- Full CRUD for receipts, items, dictionary
- HTML report export
- Dark theme

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Recharts
- **Backend:** Express, TypeScript, SQLite (better-sqlite3)
- **AI:** Gemini 2.5 Flash (receipt photos), DeepSeek V4 Flash (text)
- **Testing:** Jest (server), Vitest (client)

## Getting Started

1. Clone the repository
2. Copy `.env.example` to `.env` in project root and fill in API keys:
   - `GEMINI_API_KEY` — Google AI key
   - `DEEPSEEK_API_KEY` — DeepSeek key
   - `OPENROBOTER_API_KEY` — optional fallback
3. Install dependencies:
   ```bash
   npm run install:all
   ```
4. Start development servers:
   ```bash
   npm run dev
   ```
5. Frontend: http://localhost:5173
6. Backend: http://localhost:3000

## Testing

```bash
# Server tests (Jest) — 87 tests
cd server && npm test

# Client tests (Vitest) — 6 tests
cd client && npm run test
```

## Project Structure

```
CheckMateV2/
├── .env                    # API keys (root, not in server/)
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components (PayerToggle, ParsedItemsTable, etc.)
│   │   ├── pages/          # Page components (Stats, Balance, TextEntry, etc.)
│   │   └── utils/          # Pure functions (htmlReport.ts)
│   └── vite.config.ts
├── server/                 # Express backend
│   ├── src/
│   │   ├── routes/         # Express routers
│   │   ├── services/       # Business logic (statsService, receiptService, etc.)
│   │   │   ├── ai/         # AI clients (client.ts, deepseek.ts, gemini.ts)
│   │   │   └── __tests__/  # Integration tests
│   │   └── db/             # SQLite init + seed
│   └── data.db             # SQLite database (auto-created)
├── issues/                 # Local architectural issues (.md)
└── state.md                # Full project state for AI agents
```

## Key Architecture

- **Parse pipeline:** `parse.ts` (route) → `parsePipeline.ts` (AI + category mapping)
- **AI client:** `server/src/services/ai/client.ts` — unified `aiRequest()` for all providers
- **Category assignment:** AI returns category name → server maps to `category_id` → fallback via dictionary
- **Debt calculation:** `balance.ts` route → `debtService.calculateBalance()` — accounts for payer, owner, settlements
- **Dictionary:** Auto-populated on receipt save (raw_text → category_id)

## Known Limitations

- ❌ OpenRouter fallback not wired (key exists in `.env`)
- ❌ Database backups not implemented
- ❌ PWA / offline not configured
- ❌ Multi-currency conversion UI
- ❌ HTTPS for phone access over Wi-Fi
- ⚠️ Dictionary has no UNIQUE constraint — duplicates possible
- ⚠️ `better-sqlite3` requires native build tools (node-gyp on Windows)

## Environment

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Google AI key for Gemini 2.5 Flash |
| `DEEPSEEK_API_KEY` | Yes | DeepSeek key for V4 Flash |
| `OPENROUTER_API_KEY` | No | Fallback provider (not wired) |

> ⚠️ `.env` must be in **project root**. Server loads it via `dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') })`.
