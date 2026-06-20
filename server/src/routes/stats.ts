import { Router, Request, Response } from 'express'
import { getDatabase } from '../db/database'
import { calculateStats } from '../services/statsService'
import { StatsQuery } from '../types/stats'

const router = Router()

// GET /api/stats - get statistics with filters
router.get('/', (req: Request, res: Response) => {
  const db = getDatabase()

  const query: StatsQuery = {
    period: (req.query.period as StatsQuery['period']) || 'month',
    category: req.query.category as string | undefined,
    person: (req.query.person as StatsQuery['person']) || 'both',
    start_date: req.query.start_date as string | undefined,
    end_date: req.query.end_date as string | undefined,
  }

  const stats = calculateStats(db, query)
  res.json(stats)
})

export default router
