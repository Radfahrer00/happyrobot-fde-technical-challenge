import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { useTheme } from '../context/ThemeContext'

const OUTCOME_LABELS = {
  booking_confirmed: 'Booked',
  negotiation_failed: 'Neg. Failed',
  carrier_ineligible: 'Ineligible',
  no_suitable_loads: 'No Loads',
  call_transferred: 'Transferred',
  other: 'Other',
}

const COLORS = ['#48b574', '#00D4B4', '#3a9960', '#6366F1', '#EF4444', '#6B7280']

export default function OutcomeChart({ breakdown }) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  if (!breakdown) return null

  const data = Object.entries(breakdown)
    .filter(([, v]) => v > 0)
    .map(([key, value]) => ({
      name: OUTCOME_LABELS[key] || key,
      value,
      key,
    }))

  const total = data.reduce((s, d) => s + d.value, 0)

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
        Call Outcome Distribution
      </h3>
      <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
        <ResponsiveContainer width="55%" height={220}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={90}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={entry.key} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? '#1A1D27' : '#fff',
                border: `1px solid ${isDark ? '#2A2D3A' : '#E2E8F0'}`,
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: isDark ? '#F8FAFC' : '#1A202C' }}
              itemStyle={{ color: isDark ? '#9CA3AF' : '#718096' }}
            />
          </PieChart>
        </ResponsiveContainer>

        <div style={{ flex: 1 }}>
          {data.map((entry, index) => (
            <div key={entry.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: COLORS[index % COLORS.length], flexShrink: 0 }} />
                <span style={{ color: 'var(--text-secondary)' }}>{entry.name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: 'var(--text-primary)', fontWeight: 700, fontFamily: 'ui-monospace, monospace' }}>{entry.value}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                  {total > 0 ? `${((entry.value / total) * 100).toFixed(0)}%` : ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
