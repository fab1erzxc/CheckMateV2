type Owner = 'user' | 'girlfriend' | '50-50'

interface OwnerToggleProps {
  value: Owner
  onChange: (owner: Owner) => void
}

const options: { value: Owner; label: string }[] = [
  { value: 'user', label: 'Me' },
  { value: 'girlfriend', label: 'Her' },
  { value: '50-50', label: '50/50' },
]

function OwnerToggle({ value, onChange }: OwnerToggleProps) {
  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          style={{
            flex: 1,
            padding: '4px 8px',
            fontSize: '12px',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            backgroundColor:
              value === opt.value ? 'var(--accent)' : 'var(--bg-primary)',
            color: value === opt.value ? '#000' : 'var(--text-secondary)',
            cursor: 'pointer',
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

export default OwnerToggle
