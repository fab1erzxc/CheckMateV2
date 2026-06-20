import { Router, Request, Response } from 'express'
import { parseText } from '../services/parseService'

const router = Router()

// POST /api/parse/text - parse text input
router.post('/text', async (req: Request, res: Response) => {
  const { text } = req.body

  if (!text || typeof text !== 'string' || !text.trim()) {
    res.status(400).json({
      success: false,
      items: [],
      error: 'Text is required and must be a non-empty string',
    })
    return
  }

  const result = await parseText(text.trim())
  res.json(result)
})

export default router
