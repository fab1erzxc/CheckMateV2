import { Router, Request, Response } from 'express'
import { getDatabase } from '../db/database'
import {
  createReceipt,
  listReceipts,
  getReceiptById,
  updateReceipt,
  deleteReceipt,
  addReceiptItem,
  updateReceiptItem,
  deleteReceiptItem,
} from '../services/receiptService'

const router = Router()

// GET /api/receipts - list all receipts
router.get('/', (_req: Request, res: Response) => {
  const db = getDatabase()
  const receipts = listReceipts(db)
  res.json(receipts)
})

// GET /api/receipts/:id - get receipt with items
router.get('/:id', (req: Request, res: Response) => {
  const db = getDatabase()
  const id = parseInt(req.params.id, 10)
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid receipt ID' })
    return
  }

  const receipt = getReceiptById(db, id)
  if (!receipt) {
    res.status(404).json({ error: 'Receipt not found' })
    return
  }

  res.json(receipt)
})

// POST /api/receipts - create receipt with items
router.post('/', (req: Request, res: Response) => {
  const db = getDatabase()
  const { date, payer_id, currency, items } = req.body

  if (!date || !payer_id || !items || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({
      error: 'Validation failed',
      details: 'date, payer_id, and items (non-empty array) are required',
    })
    return
  }

  for (const item of items) {
    if (typeof item.price !== 'number' || !item.owner) {
      res.status(400).json({
        error: 'Validation failed',
        details: 'Each item must have price and owner',
      })
      return
    }
    if (!['user', 'girlfriend', '50-50'].includes(item.owner)) {
      res.status(400).json({
        error: 'Validation failed',
        details: 'owner must be one of: user, girlfriend, 50-50',
      })
      return
    }
  }

  const receipt = createReceipt(db, { date, payer_id, currency, items })
  res.status(201).json(receipt)
})

// PUT /api/receipts/:id - update receipt
router.put('/:id', (req: Request, res: Response) => {
  const db = getDatabase()
  const id = parseInt(req.params.id, 10)
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid receipt ID' })
    return
  }

  const receipt = updateReceipt(db, id, req.body)
  if (!receipt) {
    res.status(404).json({ error: 'Receipt not found' })
    return
  }

  res.json(receipt)
})

// DELETE /api/receipts/:id - delete receipt
router.delete('/:id', (req: Request, res: Response) => {
  const db = getDatabase()
  const id = parseInt(req.params.id, 10)
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid receipt ID' })
    return
  }

  const deleted = deleteReceipt(db, id)
  if (!deleted) {
    res.status(404).json({ error: 'Receipt not found' })
    return
  }

  res.json({ success: true })
})

// POST /api/receipt_items - add item to receipt
router.post('/items', (req: Request, res: Response) => {
  const db = getDatabase()
  const { receipt_id, raw_text, normalized_name, category_id, price, owner } =
    req.body

  if (!receipt_id || typeof price !== 'number' || !owner) {
    res.status(400).json({
      error: 'Validation failed',
      details: 'receipt_id, price, and owner are required',
    })
    return
  }

  const item = addReceiptItem(db, receipt_id, {
    raw_text,
    normalized_name,
    category_id,
    price,
    owner,
  })
  res.status(201).json(item)
})

// PUT /api/receipt_items/:id - update item
router.put('/items/:id', (req: Request, res: Response) => {
  const db = getDatabase()
  const id = parseInt(req.params.id, 10)
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid item ID' })
    return
  }

  const item = updateReceiptItem(db, id, req.body)
  res.json(item)
})

// DELETE /api/receipt_items/:id - delete item
router.delete('/items/:id', (req: Request, res: Response) => {
  const db = getDatabase()
  const id = parseInt(req.params.id, 10)
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid item ID' })
    return
  }

  const deleted = deleteReceiptItem(db, id)
  if (!deleted) {
    res.status(404).json({ error: 'Item not found' })
    return
  }

  res.json({ success: true })
})

export default router
