import { getTestDatabase } from '../../db/database'
import { initializeDatabase } from '../../db/init'
import { seedDatabase } from '../../db/seed'
import {
  createReceipt,
  listReceipts,
  getReceiptById,
  updateReceipt,
  deleteReceipt,
  addReceiptItem,
  updateReceiptItem,
  deleteReceiptItem,
} from '../receiptService'
import Database from 'better-sqlite3'

function setupTestDb(): Database.Database {
  const db = getTestDatabase()
  initializeDatabase(db)
  seedDatabase(db)
  return db
}

describe('Receipt Service', () => {
  let db: Database.Database

  beforeEach(() => {
    db = setupTestDb()
  })

  afterEach(() => {
    db.close()
  })

  describe('createReceipt', () => {
    it('should create a receipt with items', () => {
      const receipt = createReceipt(db, {
        date: '2024-06-20',
        payer_id: 1,
        items: [
          { raw_text: 'Coca-Cola', price: 40, owner: 'user' },
          { raw_text: 'Bread', price: 15, owner: 'girlfriend' },
        ],
      })

      expect(receipt.id).toBeGreaterThan(0)
      expect(receipt.total_amount).toBe(55)
      expect(receipt.items).toHaveLength(2)
    })

    it('should calculate total amount from items', () => {
      const receipt = createReceipt(db, {
        date: '2024-06-20',
        payer_id: 1,
        items: [
          { raw_text: 'Item 1', price: 100, owner: 'user' },
          { raw_text: 'Item 2', price: 200, owner: 'girlfriend' },
          { raw_text: 'Item 3', price: 50, owner: '50-50' },
        ],
      })

      expect(receipt.total_amount).toBe(350)
    })
  })

  describe('listReceipts', () => {
    it('should return empty list when no receipts', () => {
      const receipts = listReceipts(db)
      expect(receipts).toEqual([])
    })

    it('should list all receipts with payer name and item count', () => {
      createReceipt(db, {
        date: '2024-06-20',
        payer_id: 1,
        items: [
          { raw_text: 'Item 1', price: 100, owner: 'user' },
        ],
      })
      createReceipt(db, {
        date: '2024-06-21',
        payer_id: 2,
        items: [
          { raw_text: 'Item A', price: 50, owner: 'girlfriend' },
          { raw_text: 'Item B', price: 30, owner: '50-50' },
        ],
      })

      const receipts = listReceipts(db)
      expect(receipts).toHaveLength(2)
      expect(receipts[0].payer_name).toBe('Ксюша') // newest first
      expect(receipts[0].item_count).toBe(2)
      expect(receipts[1].payer_name).toBe('Макар')
      expect(receipts[1].item_count).toBe(1)
    })
  })

  describe('getReceiptById', () => {
    it('should return receipt with items', () => {
      const created = createReceipt(db, {
        date: '2024-06-20',
        payer_id: 1,
        items: [
          { raw_text: 'Coca-Cola', price: 40, owner: 'user', category_id: 1 },
        ],
      })

      const receipt = getReceiptById(db, created.id)
      expect(receipt).not.toBeNull()
      expect(receipt!.id).toBe(created.id)
      expect(receipt!.payer_name).toBe('Макар')
      expect(receipt!.items).toHaveLength(1)
      expect(receipt!.items![0].raw_text).toBe('Coca-Cola')
    })

    it('should return null for non-existent receipt', () => {
      const receipt = getReceiptById(db, 999)
      expect(receipt).toBeNull()
    })
  })

  describe('updateReceipt', () => {
    it('should update receipt fields', () => {
      const created = createReceipt(db, {
        date: '2024-06-20',
        payer_id: 1,
        items: [{ raw_text: 'Item', price: 100, owner: 'user' }],
      })

      const updated = updateReceipt(db, created.id, {
        date: '2024-06-25',
        payer_id: 2,
      })

      expect(updated).not.toBeNull()
      expect(updated!.date).toBe('2024-06-25')
      expect(updated!.payer_name).toBe('Ксюша')
    })

    it('should replace items when provided', () => {
      const created = createReceipt(db, {
        date: '2024-06-20',
        payer_id: 1,
        items: [{ raw_text: 'Old Item', price: 100, owner: 'user' }],
      })

      const updated = updateReceipt(db, created.id, {
        items: [
          { raw_text: 'New Item 1', price: 50, owner: 'girlfriend' },
          { raw_text: 'New Item 2', price: 75, owner: '50-50' },
        ],
      })

      expect(updated!.items).toHaveLength(2)
      expect(updated!.total_amount).toBe(125)
    })

    it('should return null for non-existent receipt', () => {
      const result = updateReceipt(db, 999, { date: '2024-06-20' })
      expect(result).toBeNull()
    })
  })

  describe('deleteReceipt', () => {
    it('should delete a receipt', () => {
      const created = createReceipt(db, {
        date: '2024-06-20',
        payer_id: 1,
        items: [{ raw_text: 'Item', price: 100, owner: 'user' }],
      })

      const deleted = deleteReceipt(db, created.id)
      expect(deleted).toBe(true)

      const receipt = getReceiptById(db, created.id)
      expect(receipt).toBeNull()
    })

    it('should cascade delete items', () => {
      const created = createReceipt(db, {
        date: '2024-06-20',
        payer_id: 1,
        items: [{ raw_text: 'Item', price: 100, owner: 'user' }],
      })

      deleteReceipt(db, created.id)

      const items = db
        .prepare('SELECT * FROM receipt_items WHERE receipt_id = ?')
        .all(created.id)
      expect(items).toHaveLength(0)
    })

    it('should return false for non-existent receipt', () => {
      const result = deleteReceipt(db, 999)
      expect(result).toBe(false)
    })
  })

  describe('addReceiptItem', () => {
    it('should add an item to an existing receipt', () => {
      const created = createReceipt(db, {
        date: '2024-06-20',
        payer_id: 1,
        items: [{ raw_text: 'Item 1', price: 100, owner: 'user' }],
      })

      const item = addReceiptItem(db, created.id, {
        raw_text: 'Item 2',
        price: 50,
        owner: 'girlfriend',
      })

      expect(item).toBeTruthy()
      expect((item as any).raw_text).toBe('Item 2')

      const receipt = getReceiptById(db, created.id)
      expect(receipt!.items).toHaveLength(2)
      expect(receipt!.total_amount).toBe(150)
    })
  })

  describe('updateReceiptItem', () => {
    it('should update an item', () => {
      const created = createReceipt(db, {
        date: '2024-06-20',
        payer_id: 1,
        items: [{ raw_text: 'Old Name', price: 100, owner: 'user', category_id: 1 }],
      })

      const itemId = created.items![0].id
      const updated = updateReceiptItem(db, itemId, {
        normalized_name: 'New Name',
        price: 200,
      })

      expect((updated as any).normalized_name).toBe('New Name')
      expect((updated as any).price).toBe(200)

      // Total should be recalculated
      const receipt = getReceiptById(db, created.id)
      expect(receipt!.total_amount).toBe(200)
    })
  })

  describe('deleteReceiptItem', () => {
    it('should delete an item and recalculate total', () => {
      const created = createReceipt(db, {
        date: '2024-06-20',
        payer_id: 1,
        items: [
          { raw_text: 'Item 1', price: 100, owner: 'user' },
          { raw_text: 'Item 2', price: 50, owner: 'girlfriend' },
        ],
      })

      const itemId = created.items![0].id
      const deleted = deleteReceiptItem(db, itemId)
      expect(deleted).toBe(true)

      const receipt = getReceiptById(db, created.id)
      expect(receipt!.items).toHaveLength(1)
      expect(receipt!.total_amount).toBe(50)
    })

    it('should return false for non-existent item', () => {
      const result = deleteReceiptItem(db, 999)
      expect(result).toBe(false)
    })
  })
})
