import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import CategorySelect from '../components/CategorySelect'
import OwnerToggle from '../components/OwnerToggle'
import PayerToggle from '../components/PayerToggle'
import { DEFAULT_CATEGORIES } from '../utils'

interface Item {
  id: number
  raw_text: string | null
  normalized_name: string | null
  category_id: number | null
  category_name: string | null
  price: number | null
  owner: string
}

interface Receipt {
  id: number
  date: string
  payer_id: number
  payer_name: string
  currency: string
  total_amount: number
  items: Item[]
}

interface Category {
  id: number
  name: string
}

function ReceiptDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [receipt, setReceipt] = useState<Receipt | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [id])

  async function loadData() {
    setLoading(true)
    try {
      const [receiptRes, catRes] = await Promise.all([
        fetch(`/api/receipts/${id}`),
        fetch('/api/categories'),
      ])

      if (receiptRes.ok) {
        setReceipt(await receiptRes.json())
      } else {
        setError('Receipt not found')
      }

      if (catRes.ok) {
        setCategories(await catRes.json())
      } else {
        setCategories(DEFAULT_CATEGORIES)
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  function handleItemUpdate(itemId: number, field: string, value: unknown) {
    if (!receipt) return
    setReceipt({
      ...receipt,
      items: receipt.items.map((item) =>
        item.id === itemId ? { ...item, [field]: value } : item
      ),
    })
  }

  function handleItemRemove(itemId: number) {
    if (!receipt) return
    setReceipt({
      ...receipt,
      items: receipt.items.filter((item) => item.id !== itemId),
    })
  }

  function handleItemAdd() {
    if (!receipt) return
    setReceipt({
      ...receipt,
      items: [
        ...receipt.items,
        {
          id: -Date.now(), // temp id
          raw_text: '',
          normalized_name: null,
          category_id: null,
          category_name: null,
          price: 0,
          owner: 'user',
        },
      ],
    })
  }

  function handleDateChange(date: string) {
    if (!receipt) return
    setReceipt({ ...receipt, date })
  }

  async function handleSave() {
    if (!receipt) return
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      // Update receipt date/payer
      const receiptRes = await fetch(`/api/receipts/${receipt.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: receipt.date,
          payer_id: receipt.payer_id,
          items: receipt.items.map((item) => ({
            raw_text: item.raw_text || '',
            normalized_name: item.normalized_name || undefined,
            category_id: item.category_id || undefined,
            price: item.price || 0,
            owner: item.owner as 'user' | 'girlfriend' | '50-50',
          })),
        }),
      })

      if (receiptRes.ok) {
        const updated = await receiptRes.json()
        setReceipt(updated)
        setSuccess('Receipt saved!')

        // Auto-update dictionary for items with category changes
        for (const item of receipt.items) {
          if (item.raw_text && item.category_id) {
            fetch('/api/dictionary', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                raw_text: item.raw_text,
                normalized_name: item.normalized_name || item.raw_text,
                category_id: item.category_id,
              }),
            }).catch(() => {})
          }
        }

        setTimeout(() => setSuccess(null), 3000)
      } else {
        const data = await receiptRes.json()
        setError(data.error || 'Failed to save')
      }
    } catch {
      setError('Network error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '40px' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading receipt...</p>
      </div>
    )
  }

  if (!receipt) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '40px' }}>
        <p style={{ color: 'var(--danger)' }}>Receipt not found</p>
        <button
          onClick={() => navigate('/receipts')}
          style={{
            marginTop: '12px',
            padding: '10px 20px',
            backgroundColor: 'var(--accent)',
            color: '#000',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          Back to receipts
        </button>
      </div>
    )
  }

  return (
    <div className="container">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '16px',
        }}
      >
        <button
          onClick={() => navigate('/receipts')}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--accent)',
            fontSize: '16px',
            cursor: 'pointer',
            padding: '4px 8px',
            marginRight: '8px',
          }}
        >
          ← Back
        </button>
        <h2 style={{ fontSize: '18px' }}>Receipt #{receipt.id}</h2>
      </div>

      <div
        style={{
          padding: '12px',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '8px',
          marginBottom: '16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px',
          }}
        >
          <div>
            <label
              style={{
                fontSize: '12px',
                color: 'var(--text-secondary)',
                display: 'block',
                marginBottom: '4px',
              }}
            >
              Date
            </label>
            <input
              type="date"
              value={receipt.date}
              onChange={(e) => handleDateChange(e.target.value)}
              style={{
                padding: '6px 8px',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                fontSize: '14px',
                colorScheme: 'dark',
              }}
            />
          </div>
          <div style={{ textAlign: 'right' }}>
            <PayerToggle
              value={receipt.payer_id}
              onChange={(pid) =>
                setReceipt({ ...receipt, payer_id: pid })
              }
            />
          </div>
        </div>
        <div style={{ textAlign: 'right', marginTop: '8px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Total:{' '}
          </span>
          <span style={{ fontSize: '20px', fontWeight: 700 }}>
            {receipt.total_amount} ₺
          </span>
        </div>
      </div>

      {/* Items header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.5fr 0.8fr 1.2fr 1fr auto',
          gap: '4px',
          padding: '8px 0',
          borderBottom: '1px solid var(--border)',
          fontSize: '12px',
          color: 'var(--text-secondary)',
          fontWeight: 600,
        }}
      >
        <span>Item</span>
        <span>Price</span>
        <span>Category</span>
        <span>Owner</span>
        <span></span>
      </div>

      {receipt.items.map((item) => (
        <div
          key={item.id}
          style={{
            display: 'grid',
            gridTemplateColumns: '1.5fr 0.8fr 1.2fr 1fr auto',
            gap: '4px',
            padding: '6px 0',
            borderBottom: '1px solid var(--border)',
            alignItems: 'center',
          }}
        >
          <input
            type="text"
            value={item.raw_text || ''}
            onChange={(e) =>
              handleItemUpdate(item.id, 'raw_text', e.target.value)
            }
            style={{
              padding: '4px 6px',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              fontSize: '13px',
              width: '100%',
            }}
          />
          <input
            type="number"
            value={item.price || 0}
            onChange={(e) =>
              handleItemUpdate(item.id, 'price', Number(e.target.value))
            }
            style={{
              padding: '4px 6px',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              fontSize: '13px',
              width: '100%',
            }}
          />
          <CategorySelect
            value={item.category_id}
            onChange={(catId) =>
              handleItemUpdate(item.id, 'category_id', catId)
            }
            categories={categories}
          />
          <OwnerToggle
            value={item.owner as 'user' | 'girlfriend' | '50-50'}
            onChange={(owner) => handleItemUpdate(item.id, 'owner', owner)}
          />
          <button
            type="button"
            onClick={() => handleItemRemove(item.id)}
            style={{
              padding: '4px 8px',
              backgroundColor: 'transparent',
              color: 'var(--danger)',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            ✕
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={handleItemAdd}
        style={{
          width: '100%',
          padding: '8px',
          marginTop: '8px',
          backgroundColor: 'var(--bg-secondary)',
          color: 'var(--accent)',
          border: '1px dashed var(--border)',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '13px',
        }}
      >
        + Add item
      </button>

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

      {success && (
        <p
          style={{
            color: 'var(--accent)',
            marginTop: '12px',
            fontSize: '14px',
          }}
        >
          {success}
        </p>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          width: '100%',
          padding: '12px',
          marginTop: '16px',
          backgroundColor: saving ? 'var(--border)' : 'var(--accent)',
          color: '#000',
          border: 'none',
          borderRadius: '8px',
          fontSize: '15px',
          fontWeight: 600,
          cursor: saving ? 'not-allowed' : 'pointer',
        }}
      >
        {saving ? 'Saving...' : 'Save changes'}
      </button>
    </div>
  )
}

export default ReceiptDetail
