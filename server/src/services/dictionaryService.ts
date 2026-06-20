import Database from 'better-sqlite3'
import { DictionaryEntry, DictionaryInput } from '../types/dictionary'

export function createDictionaryEntry(
  db: Database.Database,
  input: DictionaryInput
): DictionaryEntry {
  const result = db
    .prepare(
      `INSERT INTO dictionary (raw_text, normalized_name, category_id)
       VALUES (?, ?, ?)`
    )
    .run(input.raw_text, input.normalized_name || null, input.category_id || null)

  return getDictionaryEntryById(db, Number(result.lastInsertRowid))!
}

export function listDictionaryEntries(
  db: Database.Database
): DictionaryEntry[] {
  return db
    .prepare(
      `SELECT d.id, d.raw_text, d.normalized_name,
              d.category_id, c.name as category_name, d.created_at
       FROM dictionary d
       LEFT JOIN categories c ON d.category_id = c.id
       ORDER BY d.raw_text`
    )
    .all() as DictionaryEntry[]
}

export function getDictionaryEntryById(
  db: Database.Database,
  id: number
): DictionaryEntry | null {
  const entry = db
    .prepare(
      `SELECT d.id, d.raw_text, d.normalized_name,
              d.category_id, c.name as category_name, d.created_at
       FROM dictionary d
       LEFT JOIN categories c ON d.category_id = c.id
       WHERE d.id = ?`
    )
    .get(id) as DictionaryEntry | undefined

  return entry || null
}

export function searchDictionary(
  db: Database.Database,
  query: string
): DictionaryEntry[] {
  return db
    .prepare(
      `SELECT d.id, d.raw_text, d.normalized_name,
              d.category_id, c.name as category_name, d.created_at
       FROM dictionary d
       LEFT JOIN categories c ON d.category_id = c.id
       WHERE d.raw_text LIKE ?
       ORDER BY d.raw_text
       LIMIT 50`
    )
    .all(`%${query}%`) as DictionaryEntry[]
}

export function updateDictionaryEntry(
  db: Database.Database,
  id: number,
  updates: Partial<DictionaryInput>
): DictionaryEntry | null {
  const existing = getDictionaryEntryById(db, id)
  if (!existing) return null

  const fields: string[] = []
  const values: (string | number)[] = []

  if (updates.raw_text !== undefined) {
    fields.push('raw_text = ?')
    values.push(updates.raw_text)
  }
  if (updates.normalized_name !== undefined) {
    fields.push('normalized_name = ?')
    values.push(updates.normalized_name)
  }
  if (updates.category_id !== undefined) {
    fields.push('category_id = ?')
    values.push(updates.category_id)
  }

  if (fields.length > 0) {
    values.push(id)
    db.prepare(
      `UPDATE dictionary SET ${fields.join(', ')} WHERE id = ?`
    ).run(...values)
  }

  return getDictionaryEntryById(db, id)
}

export function deleteDictionaryEntry(
  db: Database.Database,
  id: number
): boolean {
  const result = db.prepare('DELETE FROM dictionary WHERE id = ?').run(id)
  return result.changes > 0
}
