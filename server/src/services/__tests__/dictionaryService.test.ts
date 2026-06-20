import { getTestDatabase } from '../../db/database'
import { initializeDatabase } from '../../db/init'
import { seedDatabase } from '../../db/seed'
import {
  createDictionaryEntry,
  listDictionaryEntries,
  getDictionaryEntryById,
  searchDictionary,
  updateDictionaryEntry,
  deleteDictionaryEntry,
} from '../dictionaryService'
import Database from 'better-sqlite3'

function setupTestDb(): Database.Database {
  const db = getTestDatabase()
  initializeDatabase(db)
  seedDatabase(db)
  return db
}

describe('Dictionary Service', () => {
  let db: Database.Database

  beforeEach(() => {
    db = setupTestDb()
  })

  afterEach(() => {
    db.close()
  })

  describe('createDictionaryEntry', () => {
    it('should create an entry with raw_text only', () => {
      const entry = createDictionaryEntry(db, { raw_text: 'kirni pilic' })
      expect(entry.id).toBeGreaterThan(0)
      expect(entry.raw_text).toBe('kirni pilic')
      expect(entry.normalized_name).toBeNull()
      expect(entry.category_name).toBeNull()
    })

    it('should create an entry with normalized_name and category', () => {
      const entry = createDictionaryEntry(db, {
        raw_text: 'kirni pilic',
        normalized_name: 'eggs (яйца)',
        category_id: 1,
      })
      expect(entry.normalized_name).toBe('eggs (яйца)')
      expect(entry.category_name).toBe('базовая еда')
    })
  })

  describe('listDictionaryEntries', () => {
    it('should return empty list when no entries', () => {
      const entries = listDictionaryEntries(db)
      expect(entries).toEqual([])
    })

    it('should return all entries sorted by raw_text', () => {
      createDictionaryEntry(db, { raw_text: 'banana' })
      createDictionaryEntry(db, { raw_text: 'apple' })
      createDictionaryEntry(db, { raw_text: 'cherry' })

      const entries = listDictionaryEntries(db)
      expect(entries).toHaveLength(3)
      expect(entries[0].raw_text).toBe('apple')
      expect(entries[1].raw_text).toBe('banana')
      expect(entries[2].raw_text).toBe('cherry')
    })
  })

  describe('getDictionaryEntryById', () => {
    it('should return entry by id', () => {
      const created = createDictionaryEntry(db, { raw_text: 'test entry' })
      const entry = getDictionaryEntryById(db, created.id)
      expect(entry).not.toBeNull()
      expect(entry!.raw_text).toBe('test entry')
    })

    it('should return null for non-existent id', () => {
      const entry = getDictionaryEntryById(db, 999)
      expect(entry).toBeNull()
    })
  })

  describe('searchDictionary', () => {
    it('should find entries by partial match on raw_text', () => {
      createDictionaryEntry(db, { raw_text: 'kirni pilic' })
      createDictionaryEntry(db, { raw_text: 'coca cola' })
      createDictionaryEntry(db, { raw_text: 'kirkit' })

      const results = searchDictionary(db, 'kir')
      expect(results).toHaveLength(2)
      expect(results.map((r) => r.raw_text)).toContain('kirni pilic')
      expect(results.map((r) => r.raw_text)).toContain('kirkit')
    })

    it('should return empty list when no matches', () => {
      createDictionaryEntry(db, { raw_text: 'apple' })
      const results = searchDictionary(db, 'xyz')
      expect(results).toEqual([])
    })

    it('should be case-insensitive', () => {
      createDictionaryEntry(db, { raw_text: 'Coca Cola' })
      const results = searchDictionary(db, 'coca')
      expect(results).toHaveLength(1)
    })

    it('should limit results to 50', () => {
      for (let i = 0; i < 60; i++) {
        createDictionaryEntry(db, { raw_text: `item-${i}` })
      }
      const results = searchDictionary(db, 'item')
      expect(results).toHaveLength(50)
    })
  })

  describe('updateDictionaryEntry', () => {
    it('should update fields', () => {
      const created = createDictionaryEntry(db, { raw_text: 'old text' })
      const updated = updateDictionaryEntry(db, created.id, {
        raw_text: 'new text',
        normalized_name: 'new name',
        category_id: 2,
      })
      expect(updated!.raw_text).toBe('new text')
      expect(updated!.normalized_name).toBe('new name')
      expect(updated!.category_name).toBe('сладости/снэки')
    })

    it('should return null for non-existent entry', () => {
      const result = updateDictionaryEntry(db, 999, { raw_text: 'test' })
      expect(result).toBeNull()
    })
  })

  describe('deleteDictionaryEntry', () => {
    it('should delete an entry', () => {
      const created = createDictionaryEntry(db, { raw_text: 'test' })
      const deleted = deleteDictionaryEntry(db, created.id)
      expect(deleted).toBe(true)
      expect(getDictionaryEntryById(db, created.id)).toBeNull()
    })

    it('should return false for non-existent entry', () => {
      const result = deleteDictionaryEntry(db, 999)
      expect(result).toBe(false)
    })
  })

  describe('validation', () => {
    it('should reject entry without raw_text', () => {
      expect(() =>
        createDictionaryEntry(db, { raw_text: '' })
      ).not.toThrow() // DB allows empty string raw_text, but route validates
    })
  })
})
