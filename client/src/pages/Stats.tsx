import { useState, useEffect } from 'react'
import FilterPanel from '../components/FilterPanel'
import StatsSection from '../components/StatsSection'
import ExportButton from '../components/ExportButton'
import { DEFAULT_CATEGORIES } from '../utils'

interface Category {
  id: number
  name: string
}

interface StatsData {
  total: number
  by_category: Array<{ category: string; amount: number }>
  by_period: Array<{ period: string; amount: number }>
  by_person: { user: number; girlfriend: number }
}

function getToday(): string {
  return new Date().toISOString().split('T')[0]
}

function getMonthStart(): string {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
}

function Stats() {
  const [period, setPeriod] = useState('month')
  const [selectedCategories, setSelectedCategories] = useState<number[]>([])
  const [person, setPerson] = useState('both')
  const [startDate, setStartDate] = useState(getMonthStart)
  const [endDate, setEndDate] = useState(getToday)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [statsData, setStatsData] = useState<StatsData | null>(null)

  // My and Her stats (computed from person-filtered calls)
  const [myStats, setMyStats] = useState<StatsData | null>(null)
  const [herStats, setHerStats] = useState<StatsData | null>(null)

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchCategories() {
    try {
      const res = await fetch('/api/categories')
      if (res.ok) setCategories(await res.json())
    } catch {
      setCategories(DEFAULT_CATEGORIES)
    }
  }

  async function fetchStats() {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      params.set('period', period)
      if (selectedCategories.length > 0) {
        params.set('category', selectedCategories.join(','))
      }
      if (period === 'custom') {
        params.set('start_date', startDate)
        params.set('end_date', endDate)
      }

      const [totalRes, myRes, herRes] = await Promise.all([
        fetch(`/api/stats?${params}&person=both`),
        fetch(`/api/stats?${params}&person=user`),
        fetch(`/api/stats?${params}&person=girlfriend`),
      ])

      if (totalRes.ok) setStatsData(await totalRes.json())
      if (myRes.ok) setMyStats(await myRes.json())
      if (herRes.ok) setHerStats(await herRes.json())
    } catch {
      setError('Failed to load statistics')
    } finally {
      setLoading(false)
    }
  }

  function handleApply() {
    fetchStats()
  }

  return (
    <div className="container">
      <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Statistics</h2>

      <FilterPanel
        period={period}
        onPeriodChange={setPeriod}
        selectedCategories={selectedCategories}
        onCategoriesChange={setSelectedCategories}
        person={person}
        onPersonChange={setPerson}
        onApply={handleApply}
        categories={categories}
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
      />

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '3px solid var(--border)',
              borderTopColor: 'var(--accent)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 16px',
            }}
          />
          <p style={{ color: 'var(--text-secondary)' }}>Loading statistics...</p>
        </div>
      )}

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

      {!loading && statsData && (
        <>
          <StatsSection
            title="Мои расходы"
            total={myStats?.total ?? 0}
            byCategory={myStats?.by_category ?? []}
            byPeriod={myStats?.by_period ?? []}
          />

          <StatsSection
            title="Её расходы"
            total={herStats?.total ?? 0}
            byCategory={herStats?.by_category ?? []}
            byPeriod={herStats?.by_period ?? []}
          />

          <StatsSection
            title="Общие расходы"
            total={statsData.total}
            byCategory={statsData.by_category}
            byPeriod={statsData.by_period}
          />

          <ExportButton data={statsData} />
        </>
      )}
    </div>
  )
}

export default Stats
