import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface DataItem {
  period: string
  amount: number
}

interface MyLineChartProps {
  data: DataItem[]
}

function MyLineChart({ data }: MyLineChartProps) {
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
      <RechartsLineChart data={data}>
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
        <Line
          type="monotone"
          dataKey="amount"
          stroke="var(--accent)"
          strokeWidth={2}
          dot={{ fill: 'var(--accent)', r: 3 }}
        />
      </RechartsLineChart>
    </ResponsiveContainer>
  )
}

export default MyLineChart
