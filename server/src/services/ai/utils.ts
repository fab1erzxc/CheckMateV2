import { ParsedItem } from './types'

export function parseItemsFromContent(content: string): ParsedItem[] {
  const jsonMatch = content.match(/\[[\s\S]*?\]/)
  if (!jsonMatch) return []

  try {
    const parsed = JSON.parse(jsonMatch[0])
    if (!Array.isArray(parsed)) return []

    return parsed
      .filter(
        (item: unknown): item is { raw_text: string; price: number; category?: string } =>
          typeof item === 'object' &&
          item !== null &&
          typeof (item as Record<string, unknown>).raw_text === 'string' &&
          typeof (item as Record<string, unknown>).price === 'number'
      )
      .map((item) => ({
        raw_text: item.raw_text,
        price: item.price,
        category: typeof item.category === 'string' ? item.category : null,
        category_id: null,
      }))
  } catch {
    return []
  }
}
