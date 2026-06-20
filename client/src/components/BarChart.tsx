import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface DataItem {
  period: string
  amount: number
}

interface BarChartProps {
  data: DataItem[]
}

function BarChart({ data }: BarChartProps) {
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
    <ResponsiveContainer width="100%" height={200}>
      <RechartsBarChart data={data}>
        <XAxis
          dataKey="period"
          tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
          axisLine={{ stroke: 'var(--border)' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
          axisLine={{ stroke: 'var(--border)' }}
          tickLine={false}
        />
        <Tooltip
          formatter={(value: number) => [`${value.toFixed(2)} ₺`, 'Amount']}
          contentStyle={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            color: 'var(--text-primary)',
          }}
        />
        <Bar dataKey="amount" fill="var(--accent)" radius={[4, 4, 0, 0]} />
      </RechartsBarChart>
    </ResponsiveContainer>
  )
}

export default BarChart
