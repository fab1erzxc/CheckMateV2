import { describe, it, expect } from 'vitest'
import { htmlReport, type StatsData } from '../htmlReport'

const mockStats: StatsData = {
  total: 345.5,
  by_category: [
    { category: 'базовая еда', amount: 150 },
    { category: 'курево', amount: 100 },
    { category: 'алкоголь', amount: 95.5 },
  ],
  by_period: [
    { period: '2026-06', amount: 200 },
    { period: '2026-07', amount: 145.5 },
  ],
  by_person: { user: 200.25, girlfriend: 145.25 },
}

describe('htmlReport', () => {
  it('returns a complete HTML document', () => {
    const html = htmlReport(mockStats)

    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('</html>')
    expect(html).toContain('CheckMate Statistics')
  })

  it('includes total amount', () => {
    const html = htmlReport(mockStats)
    expect(html).toContain('345.50 ₺')
  })

  it('includes all category rows', () => {
    const html = htmlReport(mockStats)
    expect(html).toContain('базовая еда')
    expect(html).toContain('150.00 ₺')
    expect(html).toContain('курево')
    expect(html).toContain('алкоголь')
  })

  it('includes all period rows', () => {
    const html = htmlReport(mockStats)
    expect(html).toContain('2026-06')
    expect(html).toContain('2026-07')
  })

  it('includes person breakdown', () => {
    const html = htmlReport(mockStats)
    expect(html).toContain('Me')
    expect(html).toContain('Girlfriend')
    expect(html).toContain('200.25 ₺')
    expect(html).toContain('145.25 ₺')
  })

  it('handles empty data gracefully', () => {
    const empty: StatsData = {
      total: 0,
      by_category: [],
      by_period: [],
      by_person: { user: 0, girlfriend: 0 },
    }
    const html = htmlReport(empty)
    expect(html).toContain('0.00 ₺')
    expect(html).toContain('Total')
  })
})
