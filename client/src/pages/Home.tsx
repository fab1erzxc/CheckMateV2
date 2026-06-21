import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

interface BalanceData {
  balance: number
  direction: 'user_owes_girlfriend' | 'girlfriend_owes_user' | 'settled'
  details: Array<{ from_user: string; to_user: string; amount: number }>
}

function BalanceWidget({ balance }: { balance: BalanceData }) {
  const navigate = useNavigate()

  const isPositive = balance.direction === 'user_owes_girlfriend'
  const isSettled = balance.direction === 'settled'

  const label = isSettled
    ? 'No debt'
    : isPositive
    ? 'You owe Ксюша'
    : 'Ксюша owes you'

  return (
    <div
      onClick={() => navigate('/balance')}
      style={{
        padding: '20px',
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        cursor: 'pointer',
        textAlign: 'center',
        marginBottom: '16px',
      }}
    >
      <div
        style={{
          fontSize: '13px',
          color: 'var(--text-secondary)',
          marginBottom: '4px',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: '32px',
          fontWeight: 700,
          color: isSettled ? 'var(--accent)' : isPositive ? 'var(--danger)' : 'var(--accent)',
        }}
      >
        {isSettled ? '0' : balance.balance} ₺
      </div>
      <div
        style={{
          marginTop: '8px',
          fontSize: '13px',
          color: 'var(--accent)',
        }}
      >
        View details →
      </div>
    </div>
  )
}

function Home() {
  const navigate = useNavigate()
  const [balance, setBalance] = useState<BalanceData | null>(null)

  useEffect(() => {
    fetch('/api/balance')
      .then((res) => res.ok && res.json())
      .then((data) => setBalance(data))
      .catch(() => {}) // silently fail
  }, [])

  return (
    <div className="container">
      <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>CheckMate</h2>

      {balance && <BalanceWidget balance={balance} />}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <button
          onClick={() => navigate('/entry/text')}
          style={{
            padding: '20px',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            cursor: 'pointer',
            textAlign: 'left',
            color: 'var(--text-primary)',
          }}
        >
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>📝</div>
          <div style={{ fontWeight: 600, marginBottom: '4px' }}>
            Text Entry
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Enter expenses as text
          </div>
        </button>

        <button
          onClick={() => navigate('/entry/photo')}
          style={{
            padding: '20px',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            cursor: 'pointer',
            textAlign: 'left',
            color: 'var(--text-primary)',
          }}
        >
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>📷</div>
          <div style={{ fontWeight: 600, marginBottom: '4px' }}>
            Photo Entry
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Scan a receipt photo
          </div>
        </button>

        <button
          onClick={() => navigate('/receipts')}
          style={{
            padding: '20px',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            cursor: 'pointer',
            textAlign: 'left',
            color: 'var(--text-primary)',
          }}
        >
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>📋</div>
          <div style={{ fontWeight: 600, marginBottom: '4px' }}>
            View Receipts
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Edit or delete past receipts
          </div>
        </button>
      </div>
    </div>
  )
}

export default Home
