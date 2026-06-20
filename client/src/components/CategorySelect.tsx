interface Category {
  id: number
  name: string
}

interface CategorySelectProps {
  value: number | null
  onChange: (categoryId: number | null) => void
  categories: Category[]
}

function CategorySelect({ value, onChange, categories }: CategorySelectProps) {
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
      style={{
        width: '100%',
        padding: '6px 8px',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border)',
        borderRadius: '4px',
        fontSize: '13px',
      }}
    >
      <option value="">Select category</option>
      {categories.map((cat) => (
        <option key={cat.id} value={cat.id}>
          {cat.name}
        </option>
      ))}
    </select>
  )
}

export default CategorySelect
