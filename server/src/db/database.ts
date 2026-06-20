import Database from 'better-sqlite3'
import path from 'path'

let db: Database.Database | null = null
let dbPath: string | null = null

export function setDbPath(p: string): void {
  dbPath = p
}

export function getDatabase(): Database.Database {
  if (db) return db

  const resolvedPath = dbPath || path.resolve(process.cwd(), 'data.db')
  db = new Database(resolvedPath)

  // Enable WAL mode for better concurrent access
  db.pragma('journal_mode = WAL')
  // Enable foreign keys
  db.pragma('foreign_keys = ON')

  return db
}

export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
  }
}

export function getTestDatabase(): Database.Database {
  const testDb = new Database(':memory:')
  testDb.pragma('foreign_keys = ON')
  return testDb
}
