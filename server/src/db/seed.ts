import Database from 'better-sqlite3'

const DEFAULT_USERS = ['Макар', 'Ксюша']

const DEFAULT_CATEGORIES = [
  'базовая еда',
  'сладости/снэки',
  'алкоголь',
  'курево',
  'утварь/химия для дома',
  'транспорт',
  'коммуналка',
  'другое',
]

export function seedDatabase(db: Database.Database): void {
  const userCount = (
    db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }
  ).count

  if (userCount === 0) {
    const insertUser = db.prepare('INSERT INTO users (name) VALUES (?)')
    db.exec('BEGIN TRANSACTION')
    try {
      for (const name of DEFAULT_USERS) {
        insertUser.run(name)
      }
      db.exec('COMMIT')
      console.log(`Seeded ${DEFAULT_USERS.length} users`)
    } catch (error) {
      db.exec('ROLLBACK')
      throw error
    }
  } else {
    console.log(`Users table already has ${userCount} records, skipping seed`)
  }

  const categoryCount = (
    db.prepare('SELECT COUNT(*) as count FROM categories').get() as {
      count: number
    }
  ).count

  if (categoryCount === 0) {
    const insertCategory = db.prepare(
      'INSERT INTO categories (name, is_custom) VALUES (?, ?)'
    )
    db.exec('BEGIN TRANSACTION')
    try {
      for (const name of DEFAULT_CATEGORIES) {
        insertCategory.run(name, 0)
      }
      db.exec('COMMIT')
      console.log(`Seeded ${DEFAULT_CATEGORIES.length} categories`)
    } catch (error) {
      db.exec('ROLLBACK')
      throw error
    }
  } else {
    console.log(
      `Categories table already has ${categoryCount} records, skipping seed`
    )
  }
}
