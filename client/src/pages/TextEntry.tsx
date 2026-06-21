import { useState, useEffect, useRef } from 'react'
import TextInputForm from '../components/TextInputForm'
import ParsedItemsTable, { ParsedItem } from '../components/ParsedItemsTable'
import DatePicker from '../components/DatePicker'
import PayerToggle from '../components/PayerToggle'
import { DEFAULT_CATEGORIES, getToday } from '../utils'

interface Category {
  id: number
  name: string
}

function TextEntry() {
  const [step, setStep] = useState<'input' | 'review' | 'done'>('input')
  const [isSaving, setIsSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<ParsedItem[]>([])
  const [payerId, setPayerId] = useState(1)
  const [date, setDate] = useState(getToday)
  const [categories, setCategories] = useState<Category[]>([])
  const nextId = useRef(1)

  function defaultOwner(): 'user' | 'girlfriend' {
    return payerId === 1 ? 'user' : 'girlfriend'
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  async function fetchCategories() {
    try {
      const res = await fetch('/api/categories')
      if (res.ok) {
        const data = await res.json()
        setCategories(data)
      }
    } catch {
      setCategories(DEFAULT_CATEGORIES)
    }
  }

  async function handleParse(text: string) {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/parse/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })

      const data = await res.json()

      if (data.success && data.items && data.items.length > 0) {
        setItems(
          data.items.map((item: { raw_text: string; price: number; category_id?: number | null }) => ({
            id: nextId.current++,
            raw_text: item.raw_text,
            price: item.price,
            category_id: item.category_id ?? null,
            owner: defaultOwner(),
          }))
        )
        setStep('review')
      } else {
        setError(data.error || 'Could not parse any items')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleItemUpdate(id: number, field: string, value: unknown) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    )
  }

  function handleItemRemove(id: number) {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  function handleItemAdd() {
    setItems((prev) => [
      ...prev,
      {
        id: nextId.current++,
        raw_text: '',
        price: 0,
        category_id: null,
        owner: defaultOwner(),
      },
    ])
  }

  function handleSetAllOwner(owner: 'user' | 'girlfriend' | '50-50') {
    setItems((prev) => prev.map((item) => ({ ...item, owner })))
  }

  async function handleSave() {
    setIsSaving(true)
    setError(null)

    try {
      const res = await fetch('/api/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          payer_id: payerId,
          items: items.map((item) => ({
            raw_text: item.raw_text,
            price: item.price,
            category_id: item.category_id,
            owner: item.owner,
          })),
        }),
      })

      if (res.ok) {
        // Auto-update dictionary for items with category
        for (const item of items) {
          if (item.raw_text && item.category_id) {
            fetch('/api/dictionary', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                raw_text: item.raw_text,
                normalized_name: item.raw_text,
                category_id: item.category_id,
              }),
            }).catch(() => {})
          }
        }
        setStep('done')
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to save receipt')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  function handleReset() {
    setStep('input')
    setItems([])
    setError(null)
    setDate(getToday())
  }

  if (step === 'done') {
    return (
      <div className="container">
        <div
          style={{
            textAlign: 'center',
            padding: '40px 16px',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
          <h2 style={{ marginBottom: '8px' }}>Receipt saved!</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            {items.length} items recorded
          </p>
          <button
            onClick={handleReset}
            style={{
              padding: '12px 24px',
              backgroundColor: 'var(--accent)',
              color: '#000',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Add another
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Text Entry</h2>

      {step === 'input' && (
        <>
          <TextInputForm onParse={handleParse} loading={loading} />
          {error && (
            <p
              style={{
                color: 'var(--danger)',
                marginTop: '12px',
                fontSize: '14px',
              }}
            >
              {error}
            </p>
          )}
        </>
      )}

      {step === 'review' && (
        <>
          <div style={{ marginBottom: '12px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                color: 'var(--text-secondary)',
                marginBottom: '4px',
              }}
            >
              Date
            </label>
            <DatePicker value={date} onChange={setDate} />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <PayerToggle value={payerId} onChange={setPayerId} />
          </div>

          <ParsedItemsTable
            items={items}
            categories={categories}
            onItemUpdate={handleItemUpdate}
            onItemRemove={handleItemRemove}
            onItemAdd={handleItemAdd}
            onSetAllOwner={handleSetAllOwner}
          />

          {error && (
            <p
              style={{
                color: 'var(--danger)',
                marginTop: '12px',
                fontSize: '14px',
              }}
            >
              {error}
            </p>
          )}

          <button
            onClick={handleSave}
            disabled={isSaving || items.length === 0}
            style={{
              width: '100%',
              padding: '12px',
              marginTop: '16px',
              backgroundColor:
                isSaving ? 'var(--border)' : 'var(--accent)',
              color: '#000',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: 600,
              cursor:
                isSaving || items.length === 0
                  ? 'not-allowed'
                  : 'pointer',
            }}
          >
            {isSaving ? 'Saving...' : `Save (${items.length} items)`}
          </button>

          <button
            onClick={handleReset}
            style={{
              width: '100%',
              padding: '12px',
              marginTop: '8px',
              backgroundColor: 'transparent',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </>
      )}
    </div>
  )
}

export default TextEntry
