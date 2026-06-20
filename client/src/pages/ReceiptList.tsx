import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

interface ReceiptSummary {
  id: number
  date: string
  payer_name: string
  total_amount: number
  item_count: number
}

function ReceiptList() {
  const navigate = useNavigate()
  const [receipts, setReceipts] = useState<ReceiptSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  useEffect(() => {
    fetchReceipts()
  }, [])

  async function fetchReceipts() {
    setLoading(true)
    try {
      const res = await fetch('/api/receipts')
      if (res.ok) {
        setReceipts(await res.json())
      } else {
        setError('Failed to load receipts')
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: number) {
    try {
      const res = await fetch(`/api/receipts/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setReceipts((prev) => prev.filter((r) => r.id !== id))
      } else {
        setError('Failed to delete receipt')
      }
    } catch {
      setError('Network error')
    } finally {
      setDeleteId(null)
    }
  }

  function formatDate(dateStr: string): string {
    const d = new Date(dateStr)
    return d.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '40px' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading receipts...</p>
      </div>
    )
  }

  return (
    <div className="container">
      <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Receipts</h2>

      {error && (
        <p
          style={{
            color: 'var(--danger)',
            marginBottom: '12px',
            fontSize: '14px',
          }}
        >
          {error}
        </p>
      )}

      {receipts.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px' }}>
          No receipts yet
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {receipts.map((receipt) => (
            <div
              key={receipt.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
              onClick={() => navigate(`/receipts/${receipt.id}`)}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  {formatDate(receipt.date)}
                </div>
                <div style={{ fontWeight: 600, marginTop: '2px' }}>
                  {receipt.total_amount} ₺
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    marginTop: '2px',
                  }}
                >
                  {receipt.item_count} items · paid by {receipt.payer_name}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setDeleteId(receipt.id)
                }}
                style={{
                  padding: '6px 12px',
                  backgroundColor: 'transparent',
                  color: 'var(--danger)',
                  border: '1px solid var(--danger)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation dialog */}
      {deleteId !== null && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setDeleteId(null)}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-secondary)',
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              maxWidth: '300px',
              textAlign: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <p style={{ marginBottom: '16px' }}>Delete this receipt?</p>
            <p
              style={{
                fontSize: '13px',
                color: 'var(--text-secondary)',
                marginBottom: '20px',
              }}
            >
              This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => handleDelete(deleteId)}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: 'var(--danger)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteId(null)}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReceiptList
