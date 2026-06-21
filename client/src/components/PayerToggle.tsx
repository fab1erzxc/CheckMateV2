interface PayerToggleProps {
  value: number // 1 = Макар, 2 = Ксюша
  onChange: (payerId: number) => void
}

const options: { value: number; label: string }[] = [
  { value: 1, label: 'Макар' },
  { value: 2, label: 'Ксюша' },
]

function PayerToggle({ value, onChange }: PayerToggleProps) {
  return (
    <div>
      <div
        style={{
          fontSize: '13px',
          color: 'var(--text-secondary)',
          marginBottom: '6px',
        }}
      >
        Who paid?
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            style={{
              flex: 1,
              padding: '10px 16px',
              fontSize: '14px',
              fontWeight: value === opt.value ? 600 : 400,
              border: '1px solid var(--border)',
              borderRadius: '8px',
              backgroundColor:
                value === opt.value ? 'var(--accent)' : 'var(--bg-secondary)',
              color: value === opt.value ? '#000' : 'var(--text-primary)',
              cursor: 'pointer',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default PayerToggle
