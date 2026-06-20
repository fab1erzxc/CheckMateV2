import Database from 'better-sqlite3'

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  is_custom BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS receipts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date DATE NOT NULL,
  payer_id INTEGER REFERENCES users(id),
  currency TEXT DEFAULT 'TRY',
  total_amount REAL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS receipt_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  receipt_id INTEGER REFERENCES receipts(id) ON DELETE CASCADE,
  raw_text TEXT,
  normalized_name TEXT,
  category_id INTEGER REFERENCES categories(id),
  price REAL,
  owner TEXT CHECK(owner IN ('user', 'girlfriend', '50-50')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dictionary (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  raw_text TEXT NOT NULL,
  normalized_name TEXT,
  category_id INTEGER REFERENCES categories(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS debts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_user_id INTEGER REFERENCES users(id),
  to_user_id INTEGER REFERENCES users(id),
  amount REAL NOT NULL,
  settled BOOLEAN DEFAULT FALSE,
  settled_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS debt_settlements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_user_id INTEGER REFERENCES users(id),
  to_user_id INTEGER REFERENCES users(id),
  amount REAL NOT NULL,
  settled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`

const INDEXES_SQL = `
CREATE INDEX IF NOT EXISTS idx_receipts_date ON receipts(date);
CREATE INDEX IF NOT EXISTS idx_receipts_payer ON receipts(payer_id);
CREATE INDEX IF NOT EXISTS idx_receipt_items_receipt ON receipt_items(receipt_id);
CREATE INDEX IF NOT EXISTS idx_receipt_items_category ON receipt_items(category_id);
CREATE INDEX IF NOT EXISTS idx_dictionary_raw ON dictionary(raw_text);
CREATE INDEX IF NOT EXISTS idx_debts_from ON debts(from_user_id);
CREATE INDEX IF NOT EXISTS idx_debts_to ON debts(to_user_id);
CREATE INDEX IF NOT EXISTS idx_debts_settled ON debts(settled);
`

export function initializeDatabase(db: Database.Database): void {
  db.exec('BEGIN TRANSACTION')
  try {
    db.exec(SCHEMA_SQL)
    db.exec(INDEXES_SQL)
    db.exec('COMMIT')
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }
}

export function tableExists(db: Database.Database, tableName: string): boolean {
  const row = db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name = ?"
  ).get(tableName) as { name: string } | undefined
  return !!row
}
