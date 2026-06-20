import { useState } from 'react'

interface TextInputFormProps {
  onParse: (text: string) => void
  loading: boolean
}

function TextInputForm({ onParse, loading }: TextInputFormProps) {
  const [text, setText] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (text.trim() && !loading) {
      onParse(text.trim())
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Coca-Cola 40 lira, potatoes 120 lira..."
        rows={4}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: 'var(--bg-secondary)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          fontSize: '15px',
          resize: 'vertical',
          fontFamily: 'inherit',
        }}
      />
      <button
        type="submit"
        disabled={loading || !text.trim()}
        style={{
          width: '100%',
          padding: '12px',
          marginTop: '8px',
          backgroundColor: loading ? 'var(--border)' : 'var(--accent)',
          color: '#000',
          border: 'none',
          borderRadius: '8px',
          fontSize: '15px',
          fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? 'Parsing...' : 'Parse'}
      </button>
    </form>
  )
}

export default TextInputForm
