import { useState, useEffect } from 'react'
import CategorySelect from '../components/CategorySelect'

interface DicEntry {
  id: number
  raw_text: string
  normalized_name: string | null
  category_id: number | null
  category_name: string | null
}

interface Category {
  id: number
  name: string
}

function Dictionary() {
  const [entries, setEntries] = useState<DicEntry[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<{
    raw_text: string
    normalized_name: string
    category_id: number | null
  }>({ raw_text: '', normalized_name: '', category_id: null })

  // New entry form
  const [showAddForm, setShowAddForm] = useState(false)
  const [newEntry, setNewEntry] = useState<{
    raw_text: string
    normalized_name: string
    category_id: number | null
  }>({ raw_text: '', normalized_name: '', category_id: null })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [entriesRes, catRes] = await Promise.all([
        fetch('/api/dictionary'),
        fetch('/api/categories'),
      ])
      if (entriesRes.ok) setEntries(await entriesRes.json())
      if (catRes.ok) setCategories(await catRes.json())
    } catch {
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const filteredEntries = search
    ? entries.filter((e) =>
        e.raw_text.toLowerCase().includes(search.toLowerCase())
      )
    : entries

  function startEdit(entry: DicEntry) {
    setEditingId(entry.id)
    setEditForm({
      raw_text: entry.raw_text,
      normalized_name: entry.normalized_name || '',
      category_id: entry.category_id,
    })
  }

  async function saveEdit(id: number) {
    try {
      const res = await fetch(`/api/dictionary/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raw_text: editForm.raw_text,
          normalized_name: editForm.normalized_name || undefined,
          category_id: editForm.category_id || undefined,
        }),
      })
      if (res.ok) {
        const updated = await res.json()
        setEntries((prev) =>
          prev.map((e) => (e.id === id ? { ...e, ...updated } : e))
        )
        setEditingId(null)
      } else {
        setError('Failed to update entry')
      }
    } catch {
      setError('Network error')
    }
  }

  async function deleteEntry(id: number) {
    try {
      const res = await fetch(`/api/dictionary/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setEntries((prev) => prev.filter((e) => e.id !== id))
      } else {
        setError('Failed to delete entry')
      }
    } catch {
      setError('Network error')
    }
  }

  async function addEntry() {
    if (!newEntry.raw_text.trim()) return
    try {
      const res = await fetch('/api/dictionary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raw_text: newEntry.raw_text.trim(),
          normalized_name: newEntry.normalized_name || undefined,
          category_id: newEntry.category_id || undefined,
        }),
      })
      if (res.ok) {
        const created = await res.json()
        setEntries((prev) => [...prev, created])
        setShowAddForm(false)
        setNewEntry({ raw_text: '', normalized_name: '', category_id: null })
      } else {
        setError('Failed to add entry')
      }
    } catch {
      setError('Network error')
    }
  }

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '40px' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading dictionary...</p>
      </div>
    )
  }

  return (
    <div className="container">
      <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Dictionary</h2>

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

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search dictionary..."
        style={{
          width: '100%',
          padding: '10px 12px',
          marginBottom: '16px',
          backgroundColor: 'var(--bg-secondary)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          fontSize: '14px',
        }}
      />

      {/* Add button */}
      {!showAddForm && (
        <button
          onClick={() => setShowAddForm(true)}
          style={{
            width: '100%',
            padding: '10px',
            marginBottom: '12px',
            backgroundColor: 'var(--accent)',
            color: '#000',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          + Add entry
        </button>
      )}

      {/* Add form */}
      {showAddForm && (
        <div
          style={{
            padding: '12px',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '8px',
            marginBottom: '12px',
          }}
        >
          <input
            type="text"
            value={newEntry.raw_text}
            onChange={(e) =>
              setNewEntry({ ...newEntry, raw_text: e.target.value })
            }
            placeholder="Raw text"
            style={{
              width: '100%',
              padding: '8px',
              marginBottom: '8px',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              fontSize: '13px',
            }}
          />
          <input
            type="text"
            value={newEntry.normalized_name}
            onChange={(e) =>
              setNewEntry({ ...newEntry, normalized_name: e.target.value })
            }
            placeholder="Normalized name (optional)"
            style={{
              width: '100%',
              padding: '8px',
              marginBottom: '8px',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              fontSize: '13px',
            }}
          />
          <div style={{ marginBottom: '8px' }}>
            <CategorySelect
              value={newEntry.category_id}
              onChange={(id) => setNewEntry({ ...newEntry, category_id: id })}
              categories={categories}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={addEntry}
              style={{
                flex: 1,
                padding: '8px',
                backgroundColor: 'var(--accent)',
                color: '#000',
                border: 'none',
                borderRadius: '4px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Add
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              style={{
                flex: 1,
                padding: '8px',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Entries list */}
      {filteredEntries.length === 0 ? (
        <p
          style={{
            color: 'var(--text-secondary)',
            textAlign: 'center',
            padding: '20px',
          }}
        >
          {search ? 'No matching entries' : 'Dictionary is empty'}
        </p>
      ) : (
        <div>
          {/* Header */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 2fr 1.5fr auto',
              gap: '4px',
              padding: '8px 0',
              borderBottom: '1px solid var(--border)',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              fontWeight: 600,
            }}
          >
            <span>Raw text</span>
            <span>Normalized</span>
            <span>Category</span>
            <span></span>
          </div>

          {filteredEntries.map((entry) => (
            <div
              key={entry.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 2fr 1.5fr auto',
                gap: '4px',
                padding: '6px 0',
                borderBottom: '1px solid var(--border)',
                alignItems: 'center',
              }}
            >
              {editingId === entry.id ? (
                <>
                  <input
                    type="text"
                    value={editForm.raw_text}
                    onChange={(e) =>
                      setEditForm({ ...editForm, raw_text: e.target.value })
                    }
                    style={{
                      padding: '4px 6px',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border)',
                      borderRadius: '4px',
                      fontSize: '13px',
                    }}
                  />
                  <input
                    type="text"
                    value={editForm.normalized_name}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        normalized_name: e.target.value,
                      })
                    }
                    style={{
                      padding: '4px 6px',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border)',
                      borderRadius: '4px',
                      fontSize: '13px',
                    }}
                  />
                  <CategorySelect
                    value={editForm.category_id}
                    onChange={(id) =>
                      setEditForm({ ...editForm, category_id: id })
                    }
                    categories={categories}
                  />
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => saveEdit(entry.id)}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: 'var(--accent)',
                        color: '#000',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: 'transparent',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border)',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <span style={{ fontSize: '13px' }}>{entry.raw_text}</span>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {entry.normalized_name || '—'}
                  </span>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {entry.category_name || '—'}
                  </span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => startEdit(entry)}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: 'transparent',
                        color: 'var(--accent)',
                        border: '1px solid var(--accent)',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Delete this entry?')) deleteEntry(entry.id)
                      }}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: 'transparent',
                        color: 'var(--danger)',
                        border: '1px solid var(--danger)',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      Del
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Dictionary
