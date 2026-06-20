import { getTestDatabase } from '../../db/database'
import { initializeDatabase } from '../../db/init'
import { seedDatabase } from '../../db/seed'
import {
  calculateBalance,
  createSettlement,
  listSettlements,
} from '../debtService'
import Database from 'better-sqlite3'

function setupTestDb(): Database.Database {
  const db = getTestDatabase()
  initializeDatabase(db)
  seedDatabase(db)
  return db
}

describe('Debt Service', () => {
  let db: Database.Database

  beforeEach(() => {
    db = setupTestDb()
  })

  afterEach(() => {
    db.close()
  })

  describe('calculateBalance', () => {
    it('should return settled balance when no receipts exist', () => {
      const result = calculateBalance(db)
      expect(result.balance).toBe(0)
      expect(result.direction).toBe('settled')
      expect(result.details).toEqual([])
    })

    it('user pays, girlfriend has item → girlfriend owes user', () => {
      // User (id=1) paid, item is girlfriend's
      db.prepare(
        `INSERT INTO receipts (date, payer_id) VALUES ('2024-06-20', 1)`
      ).run()
      db.prepare(
        `INSERT INTO receipt_items (receipt_id, price, owner) VALUES (1, 100, 'girlfriend')`
      ).run()

      const result = calculateBalance(db)
      expect(result.balance).toBe(100)
      expect(result.direction).toBe('girlfriend_owes_user')
      expect(result.details).toHaveLength(1)
      expect(result.details[0]).toEqual({
        from_user: 'Ксюша',
        to_user: 'Макар',
        amount: 100,
      })
    })

    it('girlfriend pays, user has item → user owes girlfriend', () => {
      // Girlfriend (id=2) paid, item is user's
      db.prepare(
        `INSERT INTO receipts (date, payer_id) VALUES ('2024-06-20', 2)`
      ).run()
      db.prepare(
        `INSERT INTO receipt_items (receipt_id, price, owner) VALUES (1, 200, 'user')`
      ).run()

      const result = calculateBalance(db)
      expect(result.balance).toBe(200)
      expect(result.direction).toBe('user_owes_girlfriend')
      expect(result.details[0]).toEqual({
        from_user: 'Макар',
        to_user: 'Ксюша',
        amount: 200,
      })
    })

    it('user pays own item → no debt', () => {
      db.prepare(
        `INSERT INTO receipts (date, payer_id) VALUES ('2024-06-20', 1)`
      ).run()
      db.prepare(
        `INSERT INTO receipt_items (receipt_id, price, owner) VALUES (1, 100, 'user')`
      ).run()

      const result = calculateBalance(db)
      expect(result.balance).toBe(0)
      expect(result.direction).toBe('settled')
    })

    it('girlfriend pays own item → no debt', () => {
      db.prepare(
        `INSERT INTO receipts (date, payer_id) VALUES ('2024-06-20', 2)`
      ).run()
      db.prepare(
        `INSERT INTO receipt_items (receipt_id, price, owner) VALUES (1, 100, 'girlfriend')`
      ).run()

      const result = calculateBalance(db)
      expect(result.balance).toBe(0)
      expect(result.direction).toBe('settled')
    })

    it('user pays 50-50 item → girlfriend owes user half', () => {
      db.prepare(
        `INSERT INTO receipts (date, payer_id) VALUES ('2024-06-20', 1)`
      ).run()
      db.prepare(
        `INSERT INTO receipt_items (receipt_id, price, owner) VALUES (1, 100, '50-50')`
      ).run()

      const result = calculateBalance(db)
      expect(result.balance).toBe(50)
      expect(result.direction).toBe('girlfriend_owes_user')
      expect(result.details[0].amount).toBe(50)
    })

    it('girlfriend pays 50-50 item → user owes girlfriend half', () => {
      db.prepare(
        `INSERT INTO receipts (date, payer_id) VALUES ('2024-06-20', 2)`
      ).run()
      db.prepare(
        `INSERT INTO receipt_items (receipt_id, price, owner) VALUES (1, 100, '50-50')`
      ).run()

      const result = calculateBalance(db)
      expect(result.balance).toBe(50)
      expect(result.direction).toBe('user_owes_girlfriend')
      expect(result.details[0].amount).toBe(50)
    })

    it('should handle multiple receipts', () => {
      // Receipt 1: User paid, girlfriend's item 100
      db.prepare(
        `INSERT INTO receipts (date, payer_id) VALUES ('2024-06-20', 1)`
      ).run()
      db.prepare(
        `INSERT INTO receipt_items (receipt_id, price, owner) VALUES (1, 100, 'girlfriend')`
      ).run()

      // Receipt 2: Girlfriend paid, user's item 50
      db.prepare(
        `INSERT INTO receipts (date, payer_id) VALUES ('2024-06-21', 2)`
      ).run()
      db.prepare(
        `INSERT INTO receipt_items (receipt_id, price, owner) VALUES (2, 50, 'user')`
      ).run()

      const result = calculateBalance(db)
      // girlfirend_owes_user = 100, user_owes_girlfriend = 50
      // net = 50 → girlfriend owes user
      expect(result.balance).toBe(50)
      expect(result.direction).toBe('girlfriend_owes_user')
    })

    it('should account for settlements', () => {
      // User paid 100 for girlfriend's item
      db.prepare(
        `INSERT INTO receipts (date, payer_id) VALUES ('2024-06-20', 1)`
      ).run()
      db.prepare(
        `INSERT INTO receipt_items (receipt_id, price, owner) VALUES (1, 100, 'girlfriend')`
      ).run()

      // Girlfriend settled 30 to user
      db.prepare(
        `INSERT INTO debt_settlements (from_user_id, to_user_id, amount)
         VALUES (2, 1, 30)`
      ).run()

      const result = calculateBalance(db)
      // girlfriend_owes_user = 100 - 30 = 70
      expect(result.balance).toBe(70)
      expect(result.direction).toBe('girlfriend_owes_user')
    })
  })

  describe('createSettlement', () => {
    it('should create a settlement record', () => {
      const settlement = createSettlement(db, 1, 2, 50)

      expect(settlement.id).toBeGreaterThan(0)
      expect(settlement.from_user_name).toBe('Макар')
      expect(settlement.to_user_name).toBe('Ксюша')
      expect(settlement.amount).toBe(50)
    })
  })

  describe('listSettlements', () => {
    it('should return empty list when no settlements', () => {
      const settlements = listSettlements(db)
      expect(settlements).toEqual([])
    })

    it('should list all settlements', () => {
      createSettlement(db, 1, 2, 50)
      createSettlement(db, 2, 1, 30)

      const settlements = listSettlements(db)
      expect(settlements).toHaveLength(2)
      const amounts = settlements.map((s) => s.amount).sort()
      expect(amounts).toEqual([30, 50])
    })
  })
})
