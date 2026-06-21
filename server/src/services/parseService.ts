import { Database } from 'better-sqlite3'
import { ParseResult } from './ai/types'
import { parseTextWithDeepSeek } from './ai/deepseek'
import { parseReceiptImage } from './ai/gemini'

interface Category {
  id: number
  name: string
}

/** Map AI category names and dictionary entries to category_ids */
function assignCategoryIds(
  db: Database,
  items: ParseResult['items']
): ParseResult['items'] {
  // Get all categories from DB
  const categories = db
    .prepare('SELECT id, name FROM categories')
    .all() as Category[]

  // Build a lookup: lowercased name → id
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

export async function parseText(
  db: Database,
  text: string
): Promise<ParseResult> {
  if (!text || !text.trim()) {
    return {
      success: false,
      items: [],
      error: 'No text provided',
    }
  }

  const result = await parseTextWithDeepSeek(text)
  if (result.success && result.items.length > 0) {
    result.items = assignCategoryIds(db, result.items)
  }
  return result
}

export async function parseReceiptImageFromBase64(
  db: Database,
  imageBase64: string,
  mimeType: string = 'image/jpeg'
): Promise<ParseResult> {
  const result = await parseReceiptImage(imageBase64, mimeType)
  if (result.success && result.items.length > 0) {
    result.items = assignCategoryIds(db, result.items)
  }
  return result
}
