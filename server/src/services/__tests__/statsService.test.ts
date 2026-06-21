import { getTestDatabase } from '../../db/database'
import { initializeDatabase } from '../../db/init'
import { seedDatabase } from '../../db/seed'
import { calculateStats } from '../statsService'
import Database from 'better-sqlite3'

function setupTestDb(): Database.Database {
  const db = getTestDatabase()
  initializeDatabase(db)
  seedDatabase(db)
  return db
}

function addReceipt(
  db: Database.Database,
  date: string,
  payerId: number,
  items: Array<{
    price: number
    owner: 'user' | 'girlfriend' | '50-50'
    category_id?: number
  }>
): void {
  const result = db
    .prepare('INSERT INTO receipts (date, payer_id) VALUES (?, ?)')
    .run(date, payerId)

  const insertItem = db.prepare(
    `INSERT INTO receipt_items (receipt_id, price, owner, category_id)
     VALUES (?, ?, ?, ?)`
  )

  for (const item of items) {
    insertItem.run(result.lastInsertRowid, item.price, item.owner, item.category_id || null)
  }
}

describe('Stats Service', () => {
  let db: Database.Database

  beforeEach(() => {
    db = setupTestDb()

    // Use dates within the last year so period filters work
    // Use dates within last year for 'year' period filter
    const today = new Date()
    const lastMonth = new Date(today)
    lastMonth.setMonth(lastMonth.getMonth() - 1)
    const twoMonthsAgo = new Date(today)
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2)

    addReceipt(db, twoMonthsAgo.toISOString().split('T')[0], 1, [
      { price: 100, owner: 'user', category_id: 1 },
      { price: 50, owner: 'girlfriend', category_id: 2 },
    ])

    addReceipt(db, lastMonth.toISOString().split('T')[0], 2, [
      { price: 200, owner: 'user', category_id: 1 },
      { price: 80, owner: '50-50', category_id: 3 },
    ])
  })

  afterEach(() => {
    db.close()
  })

  describe('calculateStats', () => {
    it('should aggregate total amount for the period', () => {
      const stats = calculateStats(db, { period: 'year' })
      expect(stats.total).toBe(430) // 100 + 50 + 200 + 80
    })

    it('should aggregate by category', () => {
      const stats = calculateStats(db, { period: 'year' })
      expect(stats.by_category).toHaveLength(3)
      // Category 1 (базовая еда): 100 + 200 = 300
      const food = stats.by_category.find((c) => c.category === 'базовая еда')
      expect(food?.amount).toBe(300)
    })

    it('should aggregate by period (monthly)', () => {
      const stats = calculateStats(db, { period: 'year' })
      // Two receipts in different months
      const total = stats.by_period.reduce((sum, p) => sum + p.amount, 0)
      expect(total).toBe(430) // 100+50+200+80
    })

    it('should calculate by person with 50-50 splitting', () => {
      const stats = calculateStats(db, { period: 'year' })
      // User: 100 (user) + 200 (user) + 40 (half of 80) = 340
      expect(stats.by_person.user).toBe(340)
      // Girlfriend: 50 (girlfriend) + 60 (girlfriend) + 40 (half of 80) = 150
      expect(stats.by_person.girlfriend).toBe(90) // 50 + 40 (half of 80)
    })

    it('should filter by person (user only)', () => {
      const stats = calculateStats(db, { period: 'year', person: 'user' })
      expect(stats.total).toBe(340) // user's share (100 + 200 + 40)
      // Categories should only include user's items + 50-50 at full price
      expect(stats.by_category).toHaveLength(2)
      const food = stats.by_category.find((c) => c.category === 'базовая еда')
      expect(food?.amount).toBe(300) // 100 + 200
      const alcohol = stats.by_category.find((c) => c.category === 'алкоголь')
      expect(alcohol?.amount).toBe(80) // 50-50 item at full price
      // Periods should also be filtered
      const periodSum = stats.by_period.reduce((s, p) => s + p.amount, 0)
      expect(periodSum).toBe(380) // 100 (user, twoMonthsAgo) + 200+80 (user+50-50, lastMonth)
    })

    it('should filter by person (girlfriend only)', () => {
      const stats = calculateStats(db, { period: 'year', person: 'girlfriend' })
      expect(stats.total).toBe(90) // girlfriend's share (50 + 40)
      // Categories should only include girlfriend's items + 50-50 at full price
      expect(stats.by_category).toHaveLength(2)
      const sweets = stats.by_category.find((c) => c.category === 'сладости/снэки')
      expect(sweets?.amount).toBe(50)
      const alcohol = stats.by_category.find((c) => c.category === 'алкоголь')
      expect(alcohol?.amount).toBe(80) // 50-50 item at full price
    })

    it('should filter by category', () => {
      const stats = calculateStats(db, { period: 'year', category: '1' })
      expect(stats.total).toBe(300) // only category 1 items
      expect(stats.by_category).toHaveLength(1)
      expect(stats.by_category[0].category).toBe('базовая еда')
    })

    it('should filter by multiple categories', () => {
      const stats = calculateStats(db, { period: 'year', category: '1,2' })
      expect(stats.total).toBe(350) // 300 (cat1) + 50 (cat2)
    })

    it('should filter by custom date range', () => {
      const stats = calculateStats(db, {
        period: 'custom',
        start_date: '2020-01-01',
        end_date: '2030-01-01',
      })
      expect(stats.total).toBe(430) // all items
    })

    it('should return empty results when no data matches', () => {
      const stats = calculateStats(db, {
        period: 'custom',
        start_date: '2010-01-01',
        end_date: '2010-01-31',
      })
      expect(stats.total).toBe(0)
      expect(stats.by_category).toEqual([])
      expect(stats.by_period).toEqual([])
      expect(stats.by_person.user).toBe(0)
      expect(stats.by_person.girlfriend).toBe(0)
    })
  })
})
