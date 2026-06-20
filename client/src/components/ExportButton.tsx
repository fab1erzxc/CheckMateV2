import { useState } from 'react'

interface StatsData {
  total: number
  by_category: Array<{ category: string; amount: number }>
  by_period: Array<{ period: string; amount: number }>
  by_person: { user: number; girlfriend: number }
}

interface ExportButtonProps {
  data: StatsData | null
}

function ExportButton({ data }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false)

  async function handleExport() {
    if (!data) return
    setExporting(true)

    try {
      const html = generateHtml(data)
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

  function generateHtml(stats: StatsData): string {
    const categoryRows = stats.by_category
      .map(
        (c) =>
          `<tr><td>${c.category}</td><td>${c.amount.toFixed(2)} ₺</td></tr>`
      )
      .join('')

    const periodRows = stats.by_period
      .map(
        (p) =>
          `<tr><td>${p.period}</td><td>${p.amount.toFixed(2)} ₺</td></tr>`
      )
      .join('')

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CheckMate Statistics</title>
  <style>
    body { font-family: -apple-system, sans-serif; padding: 20px; background: #121212; color: #fff; }
    h1 { margin-bottom: 8px; }
    .total { font-size: 32px; font-weight: 700; margin-bottom: 24px; }
    .section { margin-bottom: 24px; }
    h2 { font-size: 18px; margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #333; }
    th { color: #b3b3b3; font-size: 12px; text-transform: uppercase; }
    .person { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #333; }
  </style>
</head>
<body>
  <h1>CheckMate Statistics</h1>
  <div class="total">Total: ${stats.total.toFixed(2)} ₺</div>

  <div class="section">
    <h2>By Person</h2>
    <div class="person"><span>Me</span><span>${stats.by_person.user.toFixed(2)} ₺</span></div>
    <div class="person"><span>Girlfriend</span><span>${stats.by_person.girlfriend.toFixed(2)} ₺</span></div>
  </div>

  <div class="section">
    <h2>By Category</h2>
    <table>
      <thead><tr><th>Category</th><th>Amount</th></tr></thead>
      <tbody>${categoryRows}</tbody>
    </table>
  </div>

  <div class="section">
    <h2>By Period</h2>
    <table>
      <thead><tr><th>Period</th><th>Amount</th></tr></thead>
      <tbody>${periodRows}</tbody>
    </table>
  </div>
</body>
</html>`
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
