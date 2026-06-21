# Deepen the parse pipeline

## What to build

Сейчас `parseService.ts` — pass-through: вызывает AI, потом маппит категории. Роут (`parse.ts`) получает `db`, передаёт в сервис, сервис передаёт в AI. Логика размазана.

Сделать из `parseService` настоящий **ParsePipeline** — один интерфейс, который инкапсулирует всю цепочку:

```
input (text | image) → validate → call AI (DeepSeek | Gemini) → assign category_ids → ParseResult
```

Роут только вызывает `parsePipeline.run(input)` и отвечает клиенту. `db` инкапсулирован внутри пайплайна (или передаётся один раз в конструктор).

## Acceptance criteria

- [ ] Создан модуль `server/src/services/parsePipeline.ts` с интерфейсом:
      ```ts
      interface ParsePipeline {
        run(input: ParseTextInput | ParseImageInput): Promise<ParseResult>
      }
      ```
- [ ] Вся логика из `parseService.ts` и маппинг категорий (`assignCategoryIds`) переехали в пайплайн
- [ ] Роут `parse.ts` вызывает `pipeline.run(input)` — не содержит цепочек вызовов
- [ ] Написан тест: пайплайн с mock- AI возвращает корректный `ParseResult` с `category_id`
- [ ] Старый `parseService.ts` удалён или стал адаптером к пайплайну
- [ ] `POST /api/parse/text` и `/api/parse/receipt` работают как раньше
- [ ] TypeScript `npm run typecheck` проходит

## Blocked by

None — can start immediately

## Notes

Категоризация уже добавлена (AI возвращает category). Осталось собрать всё в один модуль.
