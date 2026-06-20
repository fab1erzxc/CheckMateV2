import { Router, Request, Response } from 'express'
import { getDatabase } from '../db/database'

const router = Router()

// GET /api/categories - list all categories
router.get('/', (_req: Request, res: Response) => {
  const db = getDatabase()
  const categories = db
    .prepare('SELECT id, name FROM categories ORDER BY id')
    .all()
  res.json(categories)
})

export default router
