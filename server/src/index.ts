import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { errorHandler } from './middleware/errorHandler'
import healthRouter from './routes/health'
import receiptsRouter from './routes/receipts'
import dictionaryRouter from './routes/dictionary'
import parseRouter from './routes/parse'
import path from 'path'
import { getDatabase, setDbPath } from './db/database'
import { initializeDatabase } from './db/init'
import { seedDatabase } from './db/seed'

dotenv.config()

// Set database path to server root
const serverRoot = path.resolve(__dirname, '..')
setDbPath(path.join(serverRoot, 'data.db'))

// Initialize database
const db = getDatabase()
initializeDatabase(db)
console.log('Database initialized successfully')

// Seed default data
seedDatabase(db)

const app = express()
const PORT = parseInt(process.env.PORT || '3000', 10)

app.use(cors())
app.use(express.json())

// Routes
app.use('/api/health', healthRouter)
app.use('/api/receipts', receiptsRouter)
app.use('/api/dictionary', dictionaryRouter)
app.use('/api/parse', parseRouter)

// Error handler
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

export default app
