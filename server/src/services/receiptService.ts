import Database from 'better-sqlite3'
import { ReceiptInput, Receipt } from '../types/receipt'

export function createReceipt(
  db: Database.Database,
  input: ReceiptInput
): Receipt {
  const totalAmount = input.items.reduce((sum, item) => sum + item.price, 0)

  const result = db
    .prepare(
      `INSERT INTO receipts (date, payer_id, currency, total_amount)
       VALUES (?, ?, ?, ?)`
    )
    .run(input.date, input.payer_id, input.currency || 'TRY', totalAmount)

  const receiptId = result.lastInsertRowid

  const insertItem = db.prepare(
    `INSERT INTO receipt_items (receipt_id, raw_text, normalized_name, category_id, price, owner)
     VALUES (?, ?, ?, ?, ?, ?)`
  )

  for (const item of input.items) {
    insertItem.run(
      receiptId,
      item.raw_text || null,
      item.normalized_name || null,
      item.category_id || null,
      item.price,
      item.owner
    )
  }

  return getReceiptById(db, Number(receiptId))!
}

export function listReceipts(
  db: Database.Database
): Array<{
  id: number
  date: string
  payer_name: string
  total_amount: number
  item_count: number
}> {
  return db
    .prepare(
      `SELECT r.id, r.date, u.name as payer_name, r.total_amount,
              COUNT(ri.id) as item_count
       FROM receipts r
       JOIN users u ON r.payer_id = u.id
       LEFT JOIN receipt_items ri ON ri.receipt_id = r.id
       GROUP BY r.id
       ORDER BY r.date DESC, r.id DESC`
    )
    .all() as {
    id: number
    date: string
    payer_name: string
    total_amount: number
    item_count: number
  }[]
}

export function getReceiptById(
  db: Database.Database,
  id: number
): Receipt | null {
  const receipt = db
    .prepare(
      `SELECT r.id, r.date, r.payer_id, u.name as payer_name,
              r.currency, r.total_amount, r.created_at
       FROM receipts r
       JOIN users u ON r.payer_id = u.id
       WHERE r.id = ?`
    )
    .get(id) as Receipt | undefined

  if (!receipt) return null

  const items = db
    .prepare(
      `SELECT ri.id, ri.receipt_id, ri.raw_text, ri.normalized_name,
              ri.category_id, c.name as category_name,
              ri.price, ri.owner, ri.created_at
       FROM receipt_items ri
       LEFT JOIN categories c ON ri.category_id = c.id
       WHERE ri.receipt_id = ?
       ORDER BY ri.id`
    )
    .all(id) as Receipt['items']

  return { ...receipt, items }
}

export function updateReceipt(
  db: Database.Database,
  id: number,
  input: Partial<ReceiptInput>
): Receipt | null {
  const existing = getReceiptById(db, id)
  if (!existing) return null

  const totalAmount =
    input.items?.reduce((sum, item) => sum + item.price, 0) ??
    existing.total_amount

  db.prepare(
    `UPDATE receipts SET date = ?, payer_id = ?, currency = ?, total_amount = ?
     WHERE id = ?`
  ).run(
    input.date || existing.date,
    input.payer_id || existing.payer_id,
    input.currency || existing.currency,
    totalAmount,
    id
  )

  if (input.items) {
    // Delete existing items and re-insert
    db.prepare('DELETE FROM receipt_items WHERE receipt_id = ?').run(id)

    const insertItem = db.prepare(
      `INSERT INTO receipt_items (receipt_id, raw_text, normalized_name, category_id, price, owner)
       VALUES (?, ?, ?, ?, ?, ?)`
    )

    for (const item of input.items) {
      insertItem.run(
        id,
        item.raw_text || null,
        item.normalized_name || null,
        item.category_id || null,
        item.price,
        item.owner
      )
    }
  }

  return getReceiptById(db, id)
}

export function deleteReceipt(
  db: Database.Database,
  id: number
): boolean {
  const result = db.prepare('DELETE FROM receipts WHERE id = ?').run(id)
  return result.changes > 0
}

export function addReceiptItem(
  db: Database.Database,
  receiptId: number,
  item: {
    raw_text?: string
    normalized_name?: string
    category_id?: number
    price: number
    owner: 'user' | 'girlfriend' | '50-50'
  }
) {
  const result = db
    .prepare(
      `INSERT INTO receipt_items (receipt_id, raw_text, normalized_name, category_id, price, owner)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(
      receiptId,
      item.raw_text || null,
      item.normalized_name || null,
      item.category_id || null,
      item.price,
      item.owner
    )

  // Update receipt total
  const total = (
    db
      .prepare('SELECT SUM(price) as total FROM receipt_items WHERE receipt_id = ?')
      .get(receiptId) as { total: number }
  ).total
  db.prepare('UPDATE receipts SET total_amount = ? WHERE id = ?').run(
    total,
    receiptId
  )

  return db
    .prepare(
      `SELECT ri.*, c.name as category_name
       FROM receipt_items ri
       LEFT JOIN categories c ON ri.category_id = c.id
       WHERE ri.id = ?`
    )
    .get(Number(result.lastInsertRowid))
}

export function updateReceiptItem(
  db: Database.Database,
  itemId: number,
  updates: {
    raw_text?: string
    normalized_name?: string
    category_id?: number
    price?: number
    owner?: 'user' | 'girlfriend' | '50-50'
  }
) {
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
  if (updates.price !== undefined) {
    fields.push('price = ?')
    values.push(updates.price)
  }
  if (updates.owner !== undefined) {
    fields.push('owner = ?')
    values.push(updates.owner)
  }

  if (fields.length === 0) {
    return db
      .prepare(
        `SELECT ri.*, c.name as category_name
         FROM receipt_items ri
         LEFT JOIN categories c ON ri.category_id = c.id
         WHERE ri.id = ?`
      )
      .get(itemId)
  }

  values.push(itemId)
  db.prepare(`UPDATE receipt_items SET ${fields.join(', ')} WHERE id = ?`).run(
    ...values
  )

  // Recalculate receipt total
  const item = db
    .prepare('SELECT receipt_id FROM receipt_items WHERE id = ?')
    .get(itemId) as { receipt_id: number } | undefined

  if (item) {
    const total = (
      db
        .prepare(
          'SELECT SUM(price) as total FROM receipt_items WHERE receipt_id = ?'
        )
        .get(item.receipt_id) as { total: number | null }
    ).total ?? 0
    db.prepare('UPDATE receipts SET total_amount = ? WHERE id = ?').run(
      total,
      item.receipt_id
    )
  }

  return db
    .prepare(
      `SELECT ri.*, c.name as category_name
       FROM receipt_items ri
       LEFT JOIN categories c ON ri.category_id = c.id
       WHERE ri.id = ?`
    )
    .get(itemId)
}

export function deleteReceiptItem(
  db: Database.Database,
  itemId: number
): boolean {
  const item = db
    .prepare('SELECT receipt_id FROM receipt_items WHERE id = ?')
    .get(itemId) as { receipt_id: number } | undefined

  if (!item) return false

  const result = db
    .prepare('DELETE FROM receipt_items WHERE id = ?')
    .run(itemId)

  if (result.changes > 0) {
    // Recalculate receipt total
    const total = (
      db
        .prepare(
          'SELECT COALESCE(SUM(price), 0) as total FROM receipt_items WHERE receipt_id = ?'
        )
        .get(item.receipt_id) as { total: number }
    ).total
    db.prepare('UPDATE receipts SET total_amount = ? WHERE id = ?').run(
      total,
      item.receipt_id
    )
  }

  return result.changes > 0
}
