# Extract HTML report generator from ExportButton

## What to build

Вытащить генерацию HTML-отчёта из React-компонента `ExportButton` в чистую функцию. Сейчас 60 строк HTML-вёрстки заперты внутри компонента — их нельзя протестировать без рендера React и нельзя переиспользовать (например, для серверного экспорта).

Новый модуль — чистая функция:
```
htmlReport(stats: StatsData): string
```

Компонент `ExportButton` только вызывает эту функцию и скачивает результат. Функцию можно тестировать напрямую: передал данные → проверил строку.

## Acceptance criteria

- [ ] Функция `htmlReport()` вынесена в отдельный файл `client/src/utils/htmlReport.ts`
- [ ] `ExportButton` импортирует и вызывает `htmlReport()` вместо встроенной `generateHtml()`
- [ ] Старая `generateHtml()` удалена из компонента
- [ ] Написан тест: `htmlReport(mockStats)` возвращает строку, содержащую ожидаемые заголовки ("Total", "By Category", "By Period", "By Person") и значения из mockData
- [ ] Существующая кнопка экспорта работает как раньше (скачивает .html файл)
- [ ] TypeScript `npm run typecheck` проходит

## Status

✅ Completed 2026-06-21

## Blocked by

None — can start immediately
