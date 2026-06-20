import { getTestDatabase } from '../database'
import { initializeDatabase } from '../init'
import { seedDatabase } from '../seed'
import Database from 'better-sqlite3'

describe('Database seeding', () => {
  let db: Database.Database

  beforeEach(() => {
    db = getTestDatabase()
    initializeDatabase(db)
  })

  afterEach(() => {
    db.close()
  })

  it('should insert default users', () => {
    seedDatabase(db)

    const users = db.prepare('SELECT name FROM users ORDER BY id').all()
    expect(users).toEqual([{ name: 'Макар' }, { name: 'Ксюша' }])
  })

  it('should insert default categories', () => {
    seedDatabase(db)

    const categories = db
      .prepare('SELECT name FROM categories ORDER BY id')
      .all() as { name: string }[]

    const expectedCategories = [
      'базовая еда',
      'сладости/снэки',
      'алкоголь',
      'курево',
      'утварь/химия для дома',
      'транспорт',
      'коммуналка',
      'другое',
    ]

    expect(categories.map((c) => c.name)).toEqual(expectedCategories)
  })

  it('should mark default categories as non-custom', () => {
    seedDatabase(db)

    const customCategories = db
      .prepare('SELECT name FROM categories WHERE is_custom = 1')
      .all()
    expect(customCategories).toHaveLength(0)
  })

  it('should not duplicate users on second call', () => {
    seedDatabase(db)
    seedDatabase(db)

    const count = (
      db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }
    ).count
    expect(count).toBe(2)
  })

  it('should not duplicate categories on second call', () => {
    seedDatabase(db)
    seedDatabase(db)

    const count = (
      db.prepare('SELECT COUNT(*) as count FROM categories').get() as {
        count: number
      }
    ).count
    expect(count).toBe(8)
  })

  it('should be idempotent when called multiple times', () => {
    seedDatabase(db)
    seedDatabase(db)
    seedDatabase(db)

    const userCount = (
      db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }
    ).count
    const categoryCount = (
      db.prepare('SELECT COUNT(*) as count FROM categories').get() as {
        count: number
      }
    ).count

    expect(userCount).toBe(2)
    expect(categoryCount).toBe(8)
  })
})
