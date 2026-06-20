import { Router, Request, Response } from 'express'
import { getDatabase } from '../db/database'
import {
  createDictionaryEntry,
  listDictionaryEntries,
  getDictionaryEntryById,
  searchDictionary,
  updateDictionaryEntry,
  deleteDictionaryEntry,
} from '../services/dictionaryService'

const router = Router()

// GET /api/dictionary/search?q=query - search by raw_text
router.get('/search', (req: Request, res: Response) => {
  const db = getDatabase()
  const query = (req.query.q as string) || ''
  if (!query.trim()) {
    res.json([])
    return
  }

  const results = searchDictionary(db, query.trim())
  res.json(results)
})

// GET /api/dictionary - list all entries
router.get('/', (_req: Request, res: Response) => {
  const db = getDatabase()
  const entries = listDictionaryEntries(db)
  res.json(entries)
})

// GET /api/dictionary/:id - get single entry
router.get('/:id', (req: Request, res: Response) => {
  const db = getDatabase()
  const id = parseInt(req.params.id, 10)
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid dictionary entry ID' })
    return
  }

  const entry = getDictionaryEntryById(db, id)
  if (!entry) {
    res.status(404).json({ error: 'Dictionary entry not found' })
    return
  }

  res.json(entry)
})

// POST /api/dictionary - create entry
router.post('/', (req: Request, res: Response) => {
  const db = getDatabase()
  const { raw_text, normalized_name, category_id } = req.body

  if (!raw_text || typeof raw_text !== 'string' || !raw_text.trim()) {
    res.status(400).json({
      error: 'Validation failed',
      details: 'raw_text is required and must be a non-empty string',
    })
    return
  }

  const entry = createDictionaryEntry(db, {
    raw_text: raw_text.trim(),
    normalized_name,
    category_id,
  })
  res.status(201).json(entry)
})

// PUT /api/dictionary/:id - update entry
router.put('/:id', (req: Request, res: Response) => {
  const db = getDatabase()
  const id = parseInt(req.params.id, 10)
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid dictionary entry ID' })
    return
  }

  const entry = updateDictionaryEntry(db, id, req.body)
  if (!entry) {
    res.status(404).json({ error: 'Dictionary entry not found' })
    return
  }

  res.json(entry)
})

// DELETE /api/dictionary/:id - delete entry
router.delete('/:id', (req: Request, res: Response) => {
  const db = getDatabase()
  const id = parseInt(req.params.id, 10)
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid dictionary entry ID' })
    return
  }

  const deleted = deleteDictionaryEntry(db, id)
  if (!deleted) {
    res.status(404).json({ error: 'Dictionary entry not found' })
    return
  }

  res.json({ success: true })
})

export default router
