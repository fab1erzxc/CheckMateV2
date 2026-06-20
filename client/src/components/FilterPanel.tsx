interface Category {
  id: number
  name: string
}

interface FilterPanelProps {
  period: string
  onPeriodChange: (period: string) => void
  selectedCategories: number[]
  onCategoriesChange: (ids: number[]) => void
  person: string
  onPersonChange: (person: string) => void
  onApply: () => void
  categories: Category[]
  startDate: string
  endDate: string
  onStartDateChange: (date: string) => void
  onEndDateChange: (date: string) => void
}

const periods = [
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: '3months', label: '3 Months' },
  { value: 'year', label: 'Year' },
  { value: 'custom', label: 'Custom' },
]

function FilterPanel({
  period,
  onPeriodChange,
  selectedCategories,
  onCategoriesChange,
  person,
  onPersonChange,
  onApply,
  categories,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: FilterPanelProps) {
  function toggleCategory(id: number) {
    if (selectedCategories.includes(id)) {
      onCategoriesChange(selectedCategories.filter((c) => c !== id))
    } else {
      onCategoriesChange([...selectedCategories, id])
    }
  }

  return (
    <div
      style={{
        padding: '12px',
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '12px',
        border: '1px solid var(--border)',
        marginBottom: '16px',
      }}
    >
      {/* Time period */}
      <div style={{ marginBottom: '12px' }}>
        <label
          style={{
            fontSize: '12px',
            color: 'var(--text-secondary)',
            display: 'block',
            marginBottom: '6px',
          }}
        >
          Period
        </label>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {periods.map((p) => (
            <button
              key={p.value}
              onClick={() => onPeriodChange(p.value)}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                backgroundColor:
                  period === p.value ? 'var(--accent)' : 'var(--bg-primary)',
                color: period === p.value ? '#000' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
        {period === 'custom' && (
          <div
            style={{
              display: 'flex',
              gap: '8px',
              marginTop: '8px',
            }}
          >
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              style={{
                flex: 1,
                padding: '6px 8px',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                fontSize: '12px',
                colorScheme: 'dark',
              }}
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              style={{
                flex: 1,
                padding: '6px 8px',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                fontSize: '12px',
                colorScheme: 'dark',
              }}
            />
          </div>
        )}
      </div>

      {/* Category filter */}
      <div style={{ marginBottom: '12px' }}>
        <label
          style={{
            fontSize: '12px',
            color: 'var(--text-secondary)',
            display: 'block',
            marginBottom: '6px',
          }}
        >
          Categories
        </label>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => toggleCategory(cat.id)}
              style={{
                padding: '4px 8px',
                fontSize: '11px',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                backgroundColor: selectedCategories.includes(cat.id)
                  ? 'var(--accent)'
                  : 'var(--bg-primary)',
                color: selectedCategories.includes(cat.id)
                  ? '#000'
                  : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Person filter */}
      <div style={{ marginBottom: '12px' }}>
        <label
          style={{
            fontSize: '12px',
            color: 'var(--text-secondary)',
            display: 'block',
            marginBottom: '6px',
          }}
        >
          Person
        </label>
        <div style={{ display: 'flex', gap: '4px' }}>
          {[
            { value: 'both', label: 'Both' },
            { value: 'user', label: 'Me' },
            { value: 'girlfriend', label: 'Her' },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => onPersonChange(opt.value)}
              style={{
                flex: 1,
                padding: '6px 12px',
                fontSize: '12px',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                backgroundColor:
                  person === opt.value ? 'var(--accent)' : 'var(--bg-primary)',
                color:
                  person === opt.value ? '#000' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={onApply}
        style={{
          width: '100%',
          padding: '10px',
          backgroundColor: 'var(--accent)',
          color: '#000',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Apply Filters
      </button>
    </div>
  )
}

export default FilterPanel
