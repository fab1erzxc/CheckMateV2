import Database from 'better-sqlite3'
import { BalanceResult, DebtDetail } from '../types/debt'

interface ReceiptWithItems {
  id: number
  payer_id: number
  items: Array<{
    price: number
    owner: 'user' | 'girlfriend' | '50-50'
  }>
}

interface UserRow {
  id: number
  name: string
}

interface SettlementRow {
  id: number
  from_user_id: number
  from_user_name: string
  to_user_id: number
  to_user_name: string
  amount: number
  settled_at: string
}

/**
 * Calculate the current balance between user and girlfriend.
 * Positive balance means user owes girlfriend.
 * Negative balance means girlfriend owes user.
 */
export function calculateBalance(
  db: Database.Database
): BalanceResult {
  const receipts = db
    .prepare(
      `SELECT r.id, r.payer_id
       FROM receipts r
       ORDER BY r.id`
    )
    .all() as Array<{ id: number; payer_id: number }>

  let userOwesGirlfriend = 0
  let girlfriendOwesUser = 0

  for (const receipt of receipts) {
    const items = db
      .prepare(
        `SELECT price, owner FROM receipt_items WHERE receipt_id = ?`
      )
      .all(receipt.id) as Array<{
      price: number
      owner: 'user' | 'girlfriend' | '50-50'
    }>

    for (const item of items) {
      const price = item.price || 0
      const payerId = receipt.payer_id

      if (item.owner === 'user') {
        // User's item
        if (payerId === 2) {
          // Girlfriend paid → user owes girlfriend
          userOwesGirlfriend += price
        }
        // If payerId === 1 (user paid), no debt
      } else if (item.owner === 'girlfriend') {
        // Girlfriend's item
        if (payerId === 1) {
          // User paid → girlfriend owes user
          girlfriendOwesUser += price
        }
        // If payerId === 2 (girlfriend paid), no debt
      } else if (item.owner === '50-50') {
        // Split item
        const half = price / 2
        if (payerId === 1) {
          // User paid → girlfriend owes user half
          girlfriendOwesUser += half
        } else if (payerId === 2) {
          // Girlfriend paid → user owes girlfriend half
          userOwesGirlfriend += half
        }
      }
    }
  }

  // Subtract settled amounts
  const settlements = db
    .prepare(
      `SELECT
         s.id,
         s.from_user_id,
         fu.name as from_user_name,
         s.to_user_id,
         tu.name as to_user_name,
         s.amount,
         s.settled_at
       FROM debt_settlements s
       JOIN users fu ON s.from_user_id = fu.id
       JOIN users tu ON s.to_user_id = tu.id
       ORDER BY s.settled_at DESC`
    )
    .all() as SettlementRow[]

  for (const settlement of settlements) {
    if (settlement.from_user_id === 1 && settlement.to_user_id === 2) {
      // User settled to girlfriend → reduces userOwesGirlfriend
      userOwesGirlfriend = Math.max(0, userOwesGirlfriend - settlement.amount)
    } else if (settlement.from_user_id === 2 && settlement.to_user_id === 1) {
      // Girlfriend settled to user → reduces girlfriendOwesUser
      girlfriendOwesUser = Math.max(0, girlfriendOwesUser - settlement.amount)
    }
  }

  // Net balance
  const netBalance = userOwesGirlfriend - girlfriendOwesUser

  const details: DebtDetail[] = []
  if (userOwesGirlfriend > 0) {
    details.push({
      from_user: 'Макар',
      to_user: 'Ксюша',
      amount: Math.round(userOwesGirlfriend * 100) / 100,
    })
  }
  if (girlfriendOwesUser > 0) {
    details.push({
      from_user: 'Ксюша',
      to_user: 'Макар',
      amount: Math.round(girlfriendOwesUser * 100) / 100,
    })
  }

  let direction: BalanceResult['direction']
  if (netBalance > 0) {
    direction = 'user_owes_girlfriend'
  } else if (netBalance < 0) {
    direction = 'girlfriend_owes_user'
  } else {
    direction = 'settled'
  }

  return {
    balance: Math.round(Math.abs(netBalance) * 100) / 100,
    direction,
    details,
  }
}

/**
 * Create a settlement (partial or full).
 * Amount is how much the payer is settling to the recipient.
 */
export function createSettlement(
  db: Database.Database,
  fromUserId: number,
  toUserId: number,
  amount: number
): SettlementRow {
  const result = db
    .prepare(
      `INSERT INTO debt_settlements (from_user_id, to_user_id, amount)
       VALUES (?, ?, ?)`
    )
    .run(fromUserId, toUserId, amount)

  return db
    .prepare(
      `SELECT
         s.id,
         s.from_user_id,
         fu.name as from_user_name,
         s.to_user_id,
         tu.name as to_user_name,
         s.amount,
         s.settled_at
       FROM debt_settlements s
       JOIN users fu ON s.from_user_id = fu.id
       JOIN users tu ON s.to_user_id = tu.id
       WHERE s.id = ?`
    )
    .get(Number(result.lastInsertRowid)) as SettlementRow
}

/**
 * List all settlements, newest first.
 */
export function listSettlements(
  db: Database.Database
): SettlementRow[] {
  return db
    .prepare(
      `SELECT
         s.id,
         s.from_user_id,
         fu.name as from_user_name,
         s.to_user_id,
         tu.name as to_user_name,
         s.amount,
         s.settled_at
       FROM debt_settlements s
       JOIN users fu ON s.from_user_id = fu.id
       JOIN users tu ON s.to_user_id = tu.id
       ORDER BY s.settled_at DESC`
    )
    .all() as SettlementRow[]
}
