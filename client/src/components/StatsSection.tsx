import PieChart from './PieChart'
import BarChart from './BarChart'
import LineChart from './LineChart'

interface CategoryStat {
  category: string
  amount: number
}

interface PeriodStat {
  period: string
  amount: number
}

interface StatsSectionProps {
  title: string
  total: number
  byCategory: CategoryStat[]
  byPeriod: PeriodStat[]
}

function StatsSection({
  title,
  total,
  byCategory,
  byPeriod,
}: StatsSectionProps) {
  return (
    <div
      style={{
        padding: '16px',
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '12px',
        border: '1px solid var(--border)',
        marginBottom: '16px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }}
      >
        <h3 style={{ fontSize: '16px' }}>{title}</h3>
        <span
          style={{
            fontSize: '20px',
            fontWeight: 700,
            color: 'var(--accent)',
          }}
        >
          {total.toFixed(2)} ₺
        </span>
      </div>

      {byCategory.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <h4
            style={{
              fontSize: '13px',
              color: 'var(--text-secondary)',
              marginBottom: '8px',
            }}
          >
            By Category
          </h4>
          <PieChart data={byCategory} />
        </div>
      )}

      {byPeriod.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <h4
            style={{
              fontSize: '13px',
              color: 'var(--text-secondary)',
              marginBottom: '8px',
            }}
          >
            Monthly
          </h4>
          <BarChart data={byPeriod} />
        </div>
      )}

      {byPeriod.length > 0 && (
        <div>
          <h4
            style={{
              fontSize: '13px',
              color: 'var(--text-secondary)',
              marginBottom: '8px',
            }}
          >
            Trend
          </h4>
          <LineChart data={byPeriod} />
        </div>
      )}
    </div>
  )
}

export default StatsSection
