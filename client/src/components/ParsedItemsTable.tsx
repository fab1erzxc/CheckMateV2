import CategorySelect from './CategorySelect'
import OwnerToggle from './OwnerToggle'

export interface ParsedItem {
  id: number
  raw_text: string
  price: number
  category_id: number | null
  owner: 'user' | 'girlfriend' | '50-50'
}

interface Category {
  id: number
  name: string
}

interface ParsedItemsTableProps {
  items: ParsedItem[]
  categories: Category[]
  onItemUpdate: (id: number, field: string, value: unknown) => void
  onItemRemove: (id: number) => void
  onItemAdd: () => void
}

function ParsedItemsTable({
  items,
  categories,
  onItemUpdate,
  onItemRemove,
  onItemAdd,
}: ParsedItemsTableProps) {
  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1.5fr 1fr auto',
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

      {items.map((item) => (
        <div
          key={item.id}
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1.5fr 1fr auto',
            gap: '4px',
            padding: '6px 0',
            borderBottom: '1px solid var(--border)',
            alignItems: 'center',
          }}
        >
          <input
            type="text"
            value={item.raw_text}
            onChange={(e) => onItemUpdate(item.id, 'raw_text', e.target.value)}
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
            value={item.price}
            onChange={(e) =>
              onItemUpdate(item.id, 'price', Number(e.target.value))
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
            onChange={(catId) => onItemUpdate(item.id, 'category_id', catId)}
            categories={categories}
          />
          <OwnerToggle
            value={item.owner}
            onChange={(owner) => onItemUpdate(item.id, 'owner', owner)}
          />
          <button
            type="button"
            onClick={() => onItemRemove(item.id)}
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
        onClick={onItemAdd}
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
    </div>
  )
}

export default ParsedItemsTable
