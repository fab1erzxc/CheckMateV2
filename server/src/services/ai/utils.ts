import { ParsedItem } from './types'

export function parseItemsFromContent(content: string): ParsedItem[] {
  const jsonMatch = content.match(/\[[\s\S]*?\]/)
  if (!jsonMatch) return []

  try {
    const parsed = JSON.parse(jsonMatch[0])
    if (!Array.isArray(parsed)) return []

    return parsed.filter(
      (item: unknown): item is ParsedItem =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as ParsedItem).raw_text === 'string' &&
        typeof (item as ParsedItem).price === 'number'
    )
  } catch {
    return []
  }
}
