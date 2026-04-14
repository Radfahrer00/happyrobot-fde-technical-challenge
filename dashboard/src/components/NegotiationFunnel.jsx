import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts'
import { useTheme } from '../context/ThemeContext'

const BOOKED_COLOR = '#48b574'
const FAILED_COLOR = '#EF4444'

function CustomTooltip({ active, payload, label, isDark }) {
  if (!active || !payload?.length) return null
  return (
    <div
      style={{
        backgroundColor: isDark ? '#1A1D27' : '#fff',
        border: `1px solid ${isDark ? '#2A2D3A' : '#E2E8F0'}`,
        borderRadius: 8,
        padding: '10px 14px',
        fontSize: 12,
      }}
    >
      <p style={{ color: isDark ? '#F8FAFC' : '#1A202C', fontWeight: 700, margin: '0 0 6px' }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color, margin: '2px 0' }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
      {payload.length === 2 && (
        <p style={{ color: isDark ? '#9CA3AF' : '#718096', margin: '6px 0 0', borderTop: `1px solid ${isDark ? '#2A2D3A' : '#E2E8F0'}`, paddingTop: 6 }}>
          Close rate:{' '}
          <strong>
            {payload[0].value + payload[1].value > 0
              ? `${Math.round((payload[0].value / (payload[0].value + payload[1].value)) * 100)}%`
              : '—'}
          </strong>
        </p>
      )}
    </div>
  )
}

export default function NegotiationFunnel({ data }) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  if (!data || data.length === 0) return null

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
        marginTop: 14,
      }}
    >
      <h3 style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 4, marginTop: 0 }}>
        Negotiation Funnel — Close Rate by Round
      </h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: 12, margin: '0 0 16px' }}>
        How many deals close on the first offer vs after counters
      </p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }} barCategoryGap="30%">
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: axisColor, fontSize: 12 }}
            axisLine={{ stroke: gridColor }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: axisColor, fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip isDark={isDark} />} />
          <Legend
            wrapperStyle={{ fontSize: 12, color: isDark ? '#9CA3AF' : '#718096', paddingTop: 8 }}
          />
          <Bar dataKey="booked" name="Booked" fill={BOOKED_COLOR} radius={[4, 4, 0, 0]} maxBarSize={60} />
          <Bar dataKey="failed" name="Failed" fill={FAILED_COLOR} radius={[4, 4, 0, 0]} maxBarSize={60} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
