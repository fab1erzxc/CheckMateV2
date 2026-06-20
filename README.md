# CheckMateV2

Smart receipt scanner, expense tracker, and debt calculator for shared expenses.

## Features

- Scan receipts via camera or gallery
- Enter expenses as natural language text
- AI-powered parsing (Gemini Vision, DeepSeek)
- Automatic categorization with learning dictionary
- Debt calculation (who owes whom)
- Statistics with interactive charts
- Balance tracking and settlement
- Dark theme PWA

## Tech Stack

- **Frontend:** React, TypeScript, Vite, Recharts
- **Backend:** Express, TypeScript, SQLite (better-sqlite3)
- **AI:** Gemini Vision (receipts), DeepSeek (text)

## Getting Started

1. Clone the repository
2. Copy `.env.example` to `.env` and fill in API keys
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

## Project Structure

```
checkmate/
├── client/          # React PWA
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── styles/
│   └── public/
├── server/          # Express API
│   ├── src/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── db/
│   │   └── types/
├── backups/         # Database backups
└── data.db          # SQLite database
```
