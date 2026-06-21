import { getTestDatabase } from '../../db/database'
import { initializeDatabase } from '../../db/init'
import { seedDatabase } from '../../db/seed'
import { runParsePipeline } from '../parsePipeline'
import Database from 'better-sqlite3'

// Mock AI modules
jest.mock('../ai/deepseek', () => ({
  parseTextWithDeepSeek: jest.fn(),
}))
jest.mock('../ai/gemini', () => ({
  parseReceiptImage: jest.fn(),
}))

import { parseTextWithDeepSeek } from '../ai/deepseek'
import { parseReceiptImage } from '../ai/gemini'

function setupTestDb(): Database.Database {
  const db = getTestDatabase()
  initializeDatabase(db)
  seedDatabase(db)
  return db
}

describe('ParsePipeline', () => {
  let db: Database.Database

  beforeEach(() => {
    db = setupTestDb()
    jest.clearAllMocks()
  })

  afterEach(() => {
    db.close()
  })

  describe('text parsing', () => {
    it('should call DeepSeek and assign category_id', async () => {
      ;(parseTextWithDeepSeek as jest.Mock).mockResolvedValue({
        success: true,
        items: [
          { raw_text: 'Marlboro', price: 150, category: 'курево', category_id: null },
          { raw_text: 'Coca-Cola', price: 40, category: 'сладости/снэки', category_id: null },
        ],
      })

      const result = await runParsePipeline(db, { type: 'text', text: 'test' })

      expect(result.success).toBe(true)
      expect(result.items).toHaveLength(2)
      expect(result.items[0]).toMatchObject({ raw_text: 'Marlboro', category_id: 4 })
      expect(result.items[1]).toMatchObject({ raw_text: 'Coca-Cola', category_id: 2 })
    })

    it('should fallback to dictionary when AI returns no category', async () => {
      // Seed a dictionary entry
      db.prepare('INSERT INTO dictionary (raw_text, category_id) VALUES (?, ?)').run(
        'Marlboro',
        4
      )

      ;(parseTextWithDeepSeek as jest.Mock).mockResolvedValue({
        success: true,
        items: [
          { raw_text: 'Marlboro', price: 150, category: null, category_id: null },
          { raw_text: 'Unknown item', price: 50, category: null, category_id: null },
        ],
      })

      const result = await runParsePipeline(db, { type: 'text', text: 'test' })

      expect(result.items[0].category_id).toBe(4) // from dictionary
      expect(result.items[1].category_id).toBeNull() // not in dictionary
    })

    it('should return AI error without crashing', async () => {
      ;(parseTextWithDeepSeek as jest.Mock).mockResolvedValue({
        success: false,
        items: [],
        error: 'API error',
      })

      const result = await runParsePipeline(db, { type: 'text', text: 'test' })

      expect(result.success).toBe(false)
      expect(result.error).toBe('API error')
    })
  })

  describe('image parsing', () => {
    it('should call Gemini and assign category_id', async () => {
      ;(parseReceiptImage as jest.Mock).mockResolvedValue({
        success: true,
        items: [
          { raw_text: 'Bread', price: 15, category: 'базовая еда', category_id: null },
        ],
      })

      const result = await runParsePipeline(db, {
        type: 'image',
        imageBase64: 'fake-base64',
        mimeType: 'image/jpeg',
      })

      expect(result.success).toBe(true)
      expect(result.items[0]).toMatchObject({ raw_text: 'Bread', category_id: 1 })
    })

    it('should handle Gemini errors', async () => {
      ;(parseReceiptImage as jest.Mock).mockResolvedValue({
        success: false,
        items: [],
        error: 'Image too large',
      })

      const result = await runParsePipeline(db, {
        type: 'image',
        imageBase64: 'fake',
        mimeType: 'image/jpeg',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Image too large')
    })
  })

  describe('category assignment edge cases', () => {
    it('should handle unknown AI category name', async () => {
      ;(parseTextWithDeepSeek as jest.Mock).mockResolvedValue({
        success: true,
        items: [
          { raw_text: 'Some item', price: 99, category: 'nonexistent category', category_id: null },
        ],
      })

      const result = await runParsePipeline(db, { type: 'text', text: 'test' })

      expect(result.items[0].category_id).toBeNull()
    })

    it('should handle empty items list', async () => {
      ;(parseTextWithDeepSeek as jest.Mock).mockResolvedValue({
        success: true,
        items: [],
      })

      const result = await runParsePipeline(db, { type: 'text', text: 'test' })

      expect(result.success).toBe(true)
      expect(result.items).toHaveLength(0)
    })
  })
})
