import { Database } from 'better-sqlite3'
import { ParseResult, ParsedItem } from './ai/types'
import { parseTextWithDeepSeek } from './ai/deepseek'
import { parseReceiptImage } from './ai/gemini'

export type TextInput = { type: 'text'; text: string }
export type ImageInput = { type: 'image'; imageBase64: string; mimeType: string }
export type ParseInput = TextInput | ImageInput

interface Category {
  id: number
  name: string
}

/** Map AI category names and dictionary entries to category_ids */
function assignCategoryIds(
  db: Database,
  items: ParsedItem[]
): ParsedItem[] {
  const categories = db
    .prepare('SELECT id, name FROM categories')
    .all() as Category[]

  const categoryByName = new Map<string, number>()
  for (const cat of categories) {
    categoryByName.set(cat.name.toLowerCase(), cat.id)
  }

  return items.map((item) => {
    let categoryId: number | null = null

    // 1. Try matching AI category name
    if (item.category) {
      const matchedId = categoryByName.get(item.category.toLowerCase())
      if (matchedId !== undefined) {
        categoryId = matchedId
      }
    }

    // 2. Fallback: search dictionary by raw_text
    if (categoryId === null) {
      const dictEntry = db
        .prepare(
          `SELECT category_id FROM dictionary WHERE raw_text = ? AND category_id IS NOT NULL LIMIT 1`
        )
        .get(item.raw_text) as { category_id: number } | undefined

      if (dictEntry) {
        categoryId = dictEntry.category_id
      }
    }

    return { ...item, category_id: categoryId }
  })
}

/**
 * Run the full parse pipeline: call AI → assign category IDs.
 * Validation (empty input, missing file) is handled by the caller.
 */
export async function runParsePipeline(
  db: Database,
  input: ParseInput
): Promise<ParseResult> {
  const result: ParseResult =
    input.type === 'text'
      ? await parseTextWithDeepSeek(input.text)
      : await parseReceiptImage(input.imageBase64, input.mimeType)

  if (result.success && result.items.length > 0) {
    result.items = assignCategoryIds(db, result.items)
  }

  return result
}
