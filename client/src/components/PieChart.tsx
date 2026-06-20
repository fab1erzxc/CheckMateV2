import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface DataItem {
  category: string
  amount: number
}

const COLORS = [
  '#1db954', '#e53935', '#ff9800', '#2196f3',
  '#9c27b0', '#00bcd4', '#ff5722', '#607d8b',
]

interface PieChartProps {
  data: DataItem[]
}

function PieChart({ data }: PieChartProps) {
  if (data.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '40px',
          color: 'var(--text-secondary)',
          fontSize: '14px',
        }}
      >
        No data available
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <RechartsPieChart>
        <Pie
          data={data}
          dataKey="amount"
          nameKey="category"
          cx="50%"
          cy="50%"
          outerRadius={80}
          label={({ category, percent }) =>
            `${category} ${(percent * 100).toFixed(0)}%`
          }
          labelLine={false}
        >
          {data.map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill={COLORS[index % COLORS.length]}
            />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number) => [`${value.toFixed(2)} ₺`, 'Amount']}
          contentStyle={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            color: 'var(--text-primary)',
          }}
        />
        <Legend
          formatter={(value: string) => (
            <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
              {value}
            </span>
          )}
        />
      </RechartsPieChart>
    </ResponsiveContainer>
  )
}

export default PieChart
