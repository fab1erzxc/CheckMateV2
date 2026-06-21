import { useState } from 'react'
import { htmlReport, type StatsData } from '../utils/htmlReport'

interface ExportButtonProps {
  data: StatsData | null
}

function ExportButton({ data }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false)

  async function handleExport() {
    if (!data) return
    setExporting(true)

    try {
      const html = htmlReport(data)
      const blob = new Blob([html], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `checkmate-stats-${new Date().toISOString().split('T')[0]}.html`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // Silent fail for export
    } finally {
      setExporting(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={exporting || !data}
      style={{
        width: '100%',
        padding: '12px',
        backgroundColor:
          exporting || !data ? 'var(--border)' : 'var(--accent)',
        color: '#000',
        border: 'none',
        borderRadius: '8px',
        fontSize: '15px',
        fontWeight: 600,
        cursor: exporting || !data ? 'not-allowed' : 'pointer',
      }}
    >
      {exporting ? 'Exporting...' : 'Export as HTML'}
    </button>
  )
}

export default ExportButton
