import { useState, useEffect, useRef } from 'react'
import PhotoCapture from '../components/PhotoCapture'
import PhotoPreview from '../components/PhotoPreview'
import ParsedItemsTable, { ParsedItem } from '../components/ParsedItemsTable'
import DatePicker from '../components/DatePicker'
import { DEFAULT_CATEGORIES, getToday, base64ToBlob } from '../utils'

interface Category {
  id: number
  name: string
}

function PhotoEntry() {
  const [step, setStep] = useState<'capture' | 'preview' | 'parsing' | 'review' | 'saving' | 'done'>('capture')
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const [mimeType, setMimeType] = useState('image/jpeg')
  const [items, setItems] = useState<ParsedItem[]>([])
  const [date, setDate] = useState(getToday)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const nextId = useRef(1)

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

  async function handlePhotoCapture(base64: string, file: File) {
    setImageBase64(base64)
    setMimeType(file.type)
    setStep('preview')
    setError(null)
  }

  async function handleParse() {
    if (!imageBase64) return

    setStep('parsing')
    setError(null)

    try {
      const formData = new FormData()
      const blob = base64ToBlob(imageBase64, mimeType)
      formData.append('image', blob, 'receipt.' + mimeType.split('/')[1])

      const res = await fetch('/api/parse/receipt', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (data.success && data.items && data.items.length > 0) {
        setItems(
          data.items.map((item: { raw_text: string; price: number }) => ({
            id: nextId.current++,
            raw_text: item.raw_text,
            price: item.price,
            category_id: null,
            owner: 'user' as const,
          }))
        )
        setStep('review')
      } else {
        setError(data.error || 'Could not parse any items from the receipt')
        setStep('preview')
      }
    } catch {
      setError('Network error. Please try again.')
      setStep('preview')
    }
  }

  function handleRetake() {
    setImageBase64(null)
    setStep('capture')
    setError(null)
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
        owner: 'user' as const,
      },
    ])
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
          payer_id: 1,
          items: items.map((item) => ({
            raw_text: item.raw_text,
            price: item.price,
            category_id: item.category_id,
            owner: item.owner,
          })),
        }),
      })

      if (res.ok) {
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
    setStep('capture')
    setImageBase64(null)
    setItems([])
    setError(null)
    setDate(getToday())
  }

  if (step === 'done') {
    return (
      <div className="container">
        <div style={{ textAlign: 'center', padding: '40px 16px' }}>
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
      <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Photo Entry</h2>

      {(step === 'capture' || step === 'preview') && (
        <>
          {step === 'capture' ? (
            <PhotoCapture onPhotoCapture={handlePhotoCapture} />
          ) : imageBase64 ? (
            <>
              <PhotoPreview
                imageBase64={imageBase64}
                mimeType={mimeType}
                onRetake={handleRetake}
              />
              <button
                type="button"
                onClick={handleParse}
                style={{
                  width: '100%',
                  padding: '12px',
                  marginTop: '12px',
                  backgroundColor: 'var(--accent)',
                  color: '#000',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Parse Receipt
              </button>
            </>
          ) : null}

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

      {step === 'parsing' && (
        <div style={{ textAlign: 'center', padding: '40px 16px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '3px solid var(--border)',
              borderTopColor: 'var(--accent)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 16px',
            }}
          />
          <p style={{ color: 'var(--text-secondary)' }}>
            Parsing receipt image...
          </p>
        </div>
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

          <ParsedItemsTable
            items={items}
            categories={categories}
            onItemUpdate={handleItemUpdate}
            onItemRemove={handleItemRemove}
            onItemAdd={handleItemAdd}
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
              backgroundColor: isSaving ? 'var(--border)' : 'var(--accent)',
              color: '#000',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: isSaving || items.length === 0 ? 'not-allowed' : 'pointer',
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

export default PhotoEntry
