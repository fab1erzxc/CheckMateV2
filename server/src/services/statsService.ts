import Database from 'better-sqlite3'
import { StatsResult, StatsQuery } from '../types/stats'

function getDateRange(query: StatsQuery): { start: string; end: string } {
  const now = new Date()
  const end = now.toISOString().split('T')[0]

  let start: Date

  switch (query.period) {
    case 'week':
      start = new Date(now)
      start.setDate(start.getDate() - 7)
      break
    case 'month':
      start = new Date(now)
      start.setMonth(start.getMonth() - 1)
      break
    case '3months':
      start = new Date(now)
      start.setMonth(start.getMonth() - 3)
      break
    case 'year':
      start = new Date(now)
      start.setFullYear(start.getFullYear() - 1)
      break
    case 'custom':
      return {
        start: query.start_date || end,
        end: query.end_date || end,
      }
    default:
      // Default to this month
      start = new Date(now.getFullYear(), now.getMonth(), 1)
      break
  }

  return { start: start.toISOString().split('T')[0], end }
}

export function calculateStats(
  db: Database.Database,
  query: StatsQuery
): StatsResult {
  const { start, end } = getDateRange(query)
  const personFilter = query.person || 'both'
  const categoryIds = query.category
    ? query.category.split(',').map(Number).filter(Boolean)
    : []

  // Build WHERE clauses
  const conditions: string[] = ['r.date >= ?', 'r.date <= ?']
  const params: (string | number)[] = [start, end]

  if (categoryIds.length > 0) {
    conditions.push(`ri.category_id IN (${categoryIds.map(() => '?').join(',')})`)
    params.push(...categoryIds)
  }

  const whereClause = conditions.join(' AND ')

  // Person filter for category/period breakdowns (includes 50-50 items at full price)
  let ownerFilter = ''
  if (personFilter === 'user') {
    ownerFilter = " AND (ri.owner = 'user' OR ri.owner = '50-50')"
  } else if (personFilter === 'girlfriend') {
    ownerFilter = " AND (ri.owner = 'girlfriend' OR ri.owner = '50-50')"
  }

  // Total amount
  let totalQuery = `
    SELECT COALESCE(SUM(ri.price), 0) as total
    FROM receipt_items ri
    JOIN receipts r ON ri.receipt_id = r.id
    WHERE ${whereClause}
  `
  const totalRow = db.prepare(totalQuery).get(...params) as { total: number }
  let total = totalRow.total

  // By category
  const categoryQuery = `
    SELECT c.name as category, COALESCE(SUM(ri.price), 0) as amount
    FROM receipt_items ri
    JOIN receipts r ON ri.receipt_id = r.id
    JOIN categories c ON ri.category_id = c.id
    WHERE ${whereClause}${ownerFilter}
    GROUP BY ri.category_id
    ORDER BY amount DESC
  `
  const byCategory = db.prepare(categoryQuery).all(...params) as Array<{
    category: string
    amount: number
  }>

  // By period (monthly)
  const periodQuery = `
    SELECT substr(r.date, 1, 7) as period, COALESCE(SUM(ri.price), 0) as amount
    FROM receipt_items ri
    JOIN receipts r ON ri.receipt_id = r.id
    WHERE ${whereClause}${ownerFilter}
    GROUP BY substr(r.date, 1, 7)
    ORDER BY period ASC
  `
  const byPeriod = db.prepare(periodQuery).all(...params) as Array<{
    period: string
    amount: number
  }>

  // By person
  // For user: items owned by 'user' + half of '50-50' items
  const userQuery = `
    SELECT COALESCE(SUM(
      CASE
        WHEN ri.owner = 'user' THEN ri.price
        WHEN ri.owner = '50-50' THEN ri.price / 2.0
        ELSE 0
      END
    ), 0) as total
    FROM receipt_items ri
    JOIN receipts r ON ri.receipt_id = r.id
    WHERE ${whereClause}
      AND (ri.owner = 'user' OR ri.owner = '50-50')
  `
  const userRow = db.prepare(userQuery).get(...params) as { total: number }

  const girlfriendQuery = `
    SELECT COALESCE(SUM(
      CASE
        WHEN ri.owner = 'girlfriend' THEN ri.price
        WHEN ri.owner = '50-50' THEN ri.price / 2.0
        ELSE 0
      END
    ), 0) as total
    FROM receipt_items ri
    JOIN receipts r ON ri.receipt_id = r.id
    WHERE ${whereClause}
      AND (ri.owner = 'girlfriend' OR ri.owner = '50-50')
  `
  const girlfriendRow = db.prepare(girlfriendQuery).get(...params) as {
    total: number
  }

  // Apply person filter to total
  if (personFilter === 'user') {
    total = userRow.total
  } else if (personFilter === 'girlfriend') {
    total = girlfriendRow.total
  }

  return {
    total: Math.round(total * 100) / 100,
    by_category: byCategory.map((c) => ({
      category: c.category,
      amount: Math.round(c.amount * 100) / 100,
    })),
    by_period: byPeriod.map((p) => ({
      period: p.period,
      amount: Math.round(p.amount * 100) / 100,
    })),
    by_person: {
      user: Math.round(userRow.total * 100) / 100,
      girlfriend: Math.round(girlfriendRow.total * 100) / 100,
    },
  }
}
