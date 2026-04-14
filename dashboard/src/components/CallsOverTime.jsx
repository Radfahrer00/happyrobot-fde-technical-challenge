import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useTheme } from '../context/ThemeContext'

export default function CallsOverTime({ data }) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  if (!data || data.length === 0) return null

  const formatted = data.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }))

  const gridColor = isDark ? '#2A2D3A' : '#EDF2F7'
  const axisColor = isDark ? '#6B7280' : '#A0AEC0'

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow)',
        borderRadius: 12,
        padding: 20,
      }}
    >
      <h3 style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 16, marginTop: 0 }}>
        Call Volume — Last 30 Days
      </h3>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={formatted} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <defs>
            <linearGradient id="callGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#48b574" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#48b574" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis
            dataKey="label"
            tick={{ fill: axisColor, fontSize: 10 }}
            axisLine={{ stroke: gridColor }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: axisColor, fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? '#1A1D27' : '#fff',
              border: `1px solid ${isDark ? '#2A2D3A' : '#E2E8F0'}`,
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: isDark ? '#F8FAFC' : '#1A202C' }}
            itemStyle={{ color: '#48b574' }}
            cursor={{ stroke: '#48b574', strokeWidth: 1 }}
          />
          <Area
            type="monotone"
            dataKey="count"
            name="Calls"
            stroke="#48b574"
            strokeWidth={2}
            fill="url(#callGrad)"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
