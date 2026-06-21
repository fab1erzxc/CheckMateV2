# Consolidate AI client boilerplate

## What to build

`deepseek.ts` и `gemini.ts` имеют ~85% идентичного кода: проверка API-ключа, AbortController + timeout, fetch с заголовками, обработка ошибок, парсинг ответа. Баг в одном — почти гарантированно в обоих.

Вытащить общий HTTP-слой в `server/src/services/ai/client.ts`:

```ts
interface AiRequestOptions {
  url: string
  headers?: Record<string, string>
  body: unknown
  apiKey: string
  timeout?: number // default 30000
}

async function aiRequest<T>(options: AiRequestOptions): Promise<T>
```

DeepSeek и Gemini остаются, но только:
1. Формируют URL
2. Формируют body (свою специфичную структуру)
3. Парсят response в `ParseResult`
4. Всё остальное (key check, abort, fetch, error handling, timeout) — в `client.ts`

## Acceptance criteria

- [ ] Создан `server/src/services/ai/client.ts` с функцией `aiRequest(options)`
- [ ] `deepseek.ts` использует `aiRequest()` — убран дублированный boilerplate
- [ ] `gemini.ts` использует `aiRequest()` — убран дублированный boilerplate
- [ ] Обработка ошибок (таймаут, статус, парсинг) централизована
- [ ] Все существующие тесты проходят
- [ ] `POST /api/parse/text` и `/api/parse/receipt` работают как раньше
- [ ] TypeScript `npm run typecheck` проходит

## Status

✅ Completed 2026-06-21

## Blocked by

None — can start immediately

## Notes

Сейчас всего 2 адаптера, поэтому это скорее "worth refactoring when adding a 3rd" (OpenRouter уже есть в .env, но не подключён). Если делать — быстро и без переусложнения: не вводить абстрактный `AiClient` класс, просто одна функция.
