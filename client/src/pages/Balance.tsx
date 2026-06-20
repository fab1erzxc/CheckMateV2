import { useState, useEffect } from 'react'

interface BalanceData {
  balance: number
  direction: 'user_owes_girlfriend' | 'girlfriend_owes_user' | 'settled'
  details: Array<{ from_user: string; to_user: string; amount: number }>
}

interface Settlement {
  id: number
  from_user_name: string
  to_user_name: string
  amount: number
  settled_at: string
}

function Balance() {
  const [balanceData, setBalanceData] = useState<BalanceData | null>(null)
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [settleAmount, setSettleAmount] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [settling, setSettling] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [balanceRes, settlementsRes] = await Promise.all([
        fetch('/api/balance'),
        fetch('/api/settlements'),
      ])
      if (balanceRes.ok) setBalanceData(await balanceRes.json())
      if (settlementsRes.ok) setSettlements(await settlementsRes.json())
    } catch {
      setError('Failed to load balance data')
    } finally {
      setLoading(false)
    }
  }

  function getMaxSettleAmount(): number {
    if (!balanceData) return 0
    return balanceData.balance
  }

  function getDirectionText(): string {
    if (!balanceData) return ''
    const { direction, balance } = balanceData
    if (direction === 'user_owes_girlfriend') {
      return `Ты должен Ксюше ${balance} ₺`
    }
    if (direction === 'girlfriend_owes_user') {
      return `Ксюша должна тебе ${balance} ₺`
    }
    return 'Баланс: 0'
  }

  async function handleSettle() {
    if (!balanceData || !settleAmount || parseFloat(settleAmount) <= 0) return

    setSettling(true)
    setError(null)

    const fromUserId = balanceData.direction === 'user_owes_girlfriend' ? 1 : 2
    const toUserId = balanceData.direction === 'user_owes_girlfriend' ? 2 : 1

    try {
      const res = await fetch('/api/settlement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_user_id: fromUserId,
          to_user_id: toUserId,
          amount: parseFloat(settleAmount),
        }),
      })

      if (res.ok) {
        setShowConfirm(false)
        setSettleAmount('')
        await loadData()
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to record settlement')
      }
    } catch {
      setError('Network error')
    } finally {
      setSettling(false)
    }
  }

  function formatDate(dateStr: string): string {
    const d = new Date(dateStr)
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '40px' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading balance...</p>
      </div>
    )
  }

  return (
    <div className="container">
      <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Balance</h2>

      {/* Balance Widget */}
      <div
        style={{
          textAlign: 'center',
          padding: '32px 16px',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '12px',
          border: '1px solid var(--border)',
          marginBottom: '20px',
        }}
      >
        <div
          style={{
            fontSize: '48px',
            fontWeight: 700,
            color:
              balanceData?.direction === 'settled'
                ? 'var(--accent)'
                : balanceData?.direction === 'user_owes_girlfriend'
                ? 'var(--danger)'
                : 'var(--accent)',
          }}
        >
          {balanceData?.balance ?? 0} ₺
        </div>
        <div
          style={{
            marginTop: '8px',
            fontSize: '16px',
            color: 'var(--text-secondary)',
          }}
        >
          {getDirectionText()}
        </div>
      </div>

      {/* Settlement Form */}
      {balanceData && balanceData.direction !== 'settled' && (
        <div
          style={{
            padding: '16px',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            marginBottom: '20px',
          }}
        >
          <label
            style={{
              display: 'block',
              fontSize: '13px',
              color: 'var(--text-secondary)',
              marginBottom: '8px',
            }}
          >
            Settle amount
          </label>
          <input
            type="number"
            value={settleAmount}
            onChange={(e) => setSettleAmount(e.target.value)}
            placeholder="0"
            min="0"
            step="0.01"
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              fontSize: '18px',
              marginBottom: '12px',
            }}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => {
                setSettleAmount(String(getMaxSettleAmount()))
              }}
              style={{
                flex: 1,
                padding: '10px',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Settle fully ({getMaxSettleAmount()} ₺)
            </button>
            <button
              onClick={() => {
                if (settleAmount && parseFloat(settleAmount) > 0) {
                  setShowConfirm(true)
                }
              }}
              disabled={!settleAmount || parseFloat(settleAmount) <= 0}
              style={{
                flex: 1,
                padding: '10px',
                backgroundColor:
                  settleAmount && parseFloat(settleAmount) > 0
                    ? 'var(--accent)'
                    : 'var(--border)',
                color: '#000',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                cursor:
                  settleAmount && parseFloat(settleAmount) > 0
                    ? 'pointer'
                    : 'not-allowed',
              }}
            >
              Settle
            </button>
          </div>
        </div>
      )}

      {error && (
        <p style={{ color: 'var(--danger)', marginBottom: '12px', fontSize: '14px' }}>
          {error}
        </p>
      )}

      {/* Settlement History */}
      <h3
        style={{
          fontSize: '15px',
          marginBottom: '12px',
          color: 'var(--text-secondary)',
        }}
      >
        Settlement History
      </h3>

      {settlements.length === 0 ? (
        <p
          style={{
            color: 'var(--text-secondary)',
            textAlign: 'center',
            padding: '20px',
            fontSize: '14px',
          }}
        >
          No settlements yet
        </p>
      ) : (
        <div>
          {settlements.map((s) => (
            <div
              key={s.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '8px',
                marginBottom: '8px',
                border: '1px solid var(--border)',
              }}
            >
              <div>
                <div style={{ fontSize: '14px' }}>
                  {s.from_user_name} → {s.to_user_name}
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    marginTop: '2px',
                  }}
                >
                  {formatDate(s.settled_at)}
                </div>
              </div>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: 'var(--accent)',
                }}
              >
                {s.amount} ₺
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirm && (
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
          onClick={() => setShowConfirm(false)}
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
            <p style={{ marginBottom: '16px', fontSize: '16px' }}>
              Погасить {settleAmount} ₺?
            </p>
            <p
              style={{
                fontSize: '13px',
                color: 'var(--text-secondary)',
                marginBottom: '20px',
              }}
            >
              {balanceData?.direction === 'user_owes_girlfriend'
                ? 'Ты погашаешь долг Ксюше'
                : 'Ксюша погашает долг тебе'}
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleSettle}
                disabled={settling}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: settling ? 'var(--border)' : 'var(--accent)',
                  color: '#000',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: settling ? 'not-allowed' : 'pointer',
                }}
              >
                {settling ? 'Processing...' : 'Confirm'}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
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

export default Balance
