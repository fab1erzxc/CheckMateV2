import { Router, Request, Response } from 'express'
import multer from 'multer'
import { parseText, parseReceiptImageFromBase64 } from '../services/parseService'

const router = Router()
const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp']
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed'))
    }
  },
})

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

// POST /api/parse/receipt - parse receipt image
router.post('/receipt', upload.single('image'), async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({
      success: false,
      items: [],
      error: 'Image file is required',
    })
    return
  }

  const base64 = req.file.buffer.toString('base64')
  const result = await parseReceiptImageFromBase64(base64, req.file.mimetype)
  res.json(result)
})

export default router
