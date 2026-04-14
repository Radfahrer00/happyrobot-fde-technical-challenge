import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useTheme } from '../context/ThemeContext'

const SENTIMENT_CONFIG = {
  positive:   { label: 'Positive',   color: '#48b574', emoji: '😊' },
  neutral:    { label: 'Neutral',    color: '#6B7280', emoji: '😐' },
  frustrated: { label: 'Frustrated', color: '#EF4444', emoji: '😤' },
  confused:   { label: 'Confused',   color: '#F59E0B', emoji: '😕' },
  other:      { label: 'Other',      color: '#A0AEC0', emoji: '🔷' },
}

export default function SentimentChart({ breakdown }) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  if (!breakdown) return null

  const data = Object.entries(SENTIMENT_CONFIG)
    .filter(([key]) => breakdown[key] != null)
    .map(([key, cfg]) => ({
      name: cfg.label,
      value: breakdown[key] || 0,
      color: cfg.color,
      emoji: cfg.emoji,
    }))
    .filter((d) => d.value > 0)

  const total = data.reduce((s, d) => s + d.value, 0)
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
        Carrier Sentiment Breakdown
      </h3>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis
            dataKey="name"
            tick={{ fill: axisColor, fontSize: 11 }}
            axisLine={{ stroke: gridColor }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: axisColor, fontSize: 11 }}
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
            itemStyle={{ color: isDark ? '#9CA3AF' : '#718096' }}
            cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }}
          />
          <Bar dataKey="value" radius={[5, 5, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
        {data.map((entry) => (
          <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-secondary)' }}>
            <span>{entry.emoji}</span>
            <span>{entry.name}</span>
            <span style={{ fontWeight: 700, color: entry.color, fontFamily: 'ui-monospace, monospace' }}>
              {total > 0 ? `${((entry.value / total) * 100).toFixed(0)}%` : ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
