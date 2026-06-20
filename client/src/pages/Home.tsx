import { useNavigate } from 'react-router-dom'

function Home() {
  const navigate = useNavigate()

  return (
    <div className="container">
      <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>CheckMate</h2>

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
      </div>
    </div>
  )
}

export default Home
