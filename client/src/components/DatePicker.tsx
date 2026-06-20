interface DatePickerProps {
  value: string
  onChange: (date: string) => void
}

function DatePicker({ value, onChange }: DatePickerProps) {
  return (
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: '100%',
        padding: '10px 12px',
        backgroundColor: 'var(--bg-secondary)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        fontSize: '15px',
        colorScheme: 'dark',
      }}
    />
  )
}

export default DatePicker
