import { Router, Request, Response } from 'express'
import { getDatabase } from '../db/database'
import {
  calculateBalance,
  createSettlement,
  listSettlements,
} from '../services/debtService'

const router = Router()

// GET /api/balance - get current balance
router.get('/', (_req: Request, res: Response) => {
  const db = getDatabase()
  const balance = calculateBalance(db)
  res.json(balance)
})

// POST /api/settlement - create a settlement
router.post('/settlement', (req: Request, res: Response) => {
  const db = getDatabase()
  const { from_user_id, to_user_id, amount } = req.body

  if (!from_user_id || !to_user_id || !amount || amount <= 0) {
    res.status(400).json({
      error: 'Validation failed',
      details: 'from_user_id, to_user_id, and amount (positive number) are required',
    })
    return
  }

  const settlement = createSettlement(db, from_user_id, to_user_id, amount)
  res.status(201).json(settlement)
})

// GET /api/settlements - list all settlements
router.get('/settlements', (_req: Request, res: Response) => {
  const db = getDatabase()
  const settlements = listSettlements(db)
  res.json(settlements)
})

export default router
