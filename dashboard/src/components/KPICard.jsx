export default function KPICard({ title, value, subtitle, accent = false, teal = false }) {
  const valueColor = accent ? 'var(--accent)' : teal ? 'var(--teal)' : 'var(--text-primary)'
  const topBorderColor = accent ? 'var(--accent)' : teal ? 'var(--teal)' : 'var(--border)'

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderTop: `3px solid ${topBorderColor}`,
        boxShadow: 'var(--shadow)',
        borderRadius: 12,
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <p style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', margin: 0 }}>
        {title}
      </p>
      <p style={{ color: valueColor, fontSize: 30, fontWeight: 800, lineHeight: 1, margin: 0, fontFamily: 'ui-monospace, monospace' }}>
        {value ?? '—'}
      </p>
      {subtitle && (
        <p style={{ color: 'var(--text-secondary)', fontSize: 12, margin: 0 }}>{subtitle}</p>
      )}
    </div>
  )
}
