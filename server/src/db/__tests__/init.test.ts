import { getTestDatabase } from '../database'
import { initializeDatabase, tableExists } from '../init'
import Database from 'better-sqlite3'

describe('Database initialization', () => {
  let db: Database.Database

  beforeEach(() => {
    db = getTestDatabase()
  })

  afterEach(() => {
    db.close()
  })

  it('should create all tables', () => {
    initializeDatabase(db)

    const expectedTables = [
      'users',
      'categories',
      'receipts',
      'receipt_items',
      'dictionary',
      'debts',
      'debt_settlements',
    ]

    for (const table of expectedTables) {
      expect(tableExists(db, table)).toBe(true)
    }
  })

  it('should create all indexes', () => {
    initializeDatabase(db)

    const expectedIndexes = [
      'idx_receipts_date',
      'idx_receipts_payer',
      'idx_receipt_items_receipt',
      'idx_receipt_items_category',
      'idx_dictionary_raw',
      'idx_debts_from',
      'idx_debts_to',
      'idx_debts_settled',
    ]

    const rows = db
      .prepare("SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%'")
      .all() as { name: string }[]

    const indexNames = rows.map((r) => r.name)
    for (const idx of expectedIndexes) {
      expect(indexNames).toContain(idx)
    }
  })

  it('should enforce foreign keys', () => {
    initializeDatabase(db)

    // Insert a user first
    db.prepare("INSERT INTO users (name) VALUES ('Макар')").run()

    // Try inserting a receipt with invalid payer_id - should fail
    expect(() => {
      db.prepare(
        "INSERT INTO receipts (date, payer_id) VALUES ('2024-06-20', 999)"
      ).run()
    }).toThrow()
  })

  it('should cascade delete from receipts to receipt_items', () => {
    initializeDatabase(db)

    db.prepare("INSERT INTO users (name) VALUES ('Макар')").run()
    db.prepare("INSERT INTO categories (name) VALUES ('еда')").run()
    db.prepare(
      "INSERT INTO receipts (date, payer_id) VALUES ('2024-06-20', 1)"
    ).run()
    db.prepare(
      "INSERT INTO receipt_items (receipt_id, raw_text, category_id, price, owner) VALUES (1, 'test item', 1, 100, 'user')"
    ).run()

    // Verify item exists
    const itemBefore = db
      .prepare('SELECT id FROM receipt_items WHERE receipt_id = 1')
      .get()
    expect(itemBefore).toBeTruthy()

    // Delete receipt
    db.prepare('DELETE FROM receipts WHERE id = 1').run()

    // Verify item is also deleted
    const itemAfter = db
      .prepare('SELECT id FROM receipt_items WHERE receipt_id = 1')
      .get()
    expect(itemAfter).toBeUndefined()
  })

  it('should be idempotent (calling initializeDatabase twice is safe)', () => {
    initializeDatabase(db)
    expect(() => initializeDatabase(db)).not.toThrow()
  })
})
