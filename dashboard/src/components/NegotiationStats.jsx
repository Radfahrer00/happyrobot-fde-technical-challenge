export default function NegotiationStats({ metrics }) {
  if (!metrics) return null

  const {
    avg_negotiation_rounds,
    avg_agreed_rate,
    avg_loadboard_rate,
    avg_rate_delta_pct,
    booked_count,
    total_calls,
  } = metrics

  const convRate = total_calls > 0 ? ((booked_count / total_calls) * 100).toFixed(1) : null
  const delta = avg_rate_delta_pct != null ? avg_rate_delta_pct.toFixed(1) : null
  const deltaPositive = delta != null && parseFloat(delta) > 0
  const deltaSign = delta != null && parseFloat(delta) > 0 ? '+' : ''

  const card = {
    backgroundColor: 'var(--bg-primary)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: 20,
  }

  const label = {
    color: 'var(--text-muted)',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.07em',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 0,
  }

  const bigNum = {
    color: 'var(--text-primary)',
    fontWeight: 800,
    fontSize: 28,
    margin: 0,
    lineHeight: 1.1,
  }

  const sub = {
    color: 'var(--text-muted)',
    fontSize: 11,
    margin: '6px 0 0',
  }

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
      <h3 style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 20, marginTop: 0 }}>
        Negotiation Performance
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* Rate waterfall */}
        <div style={{ ...card, gridColumn: '1 / -1' }}>
          <p style={label}>Rate Negotiation — Booked Loads</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Loadboard rate */}
            <div style={{ flex: 1, textAlign: 'center' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: 12, margin: '0 0 6px' }}>Loadboard Rate</p>
              <p style={{ ...bigNum, color: 'var(--text-secondary)', fontSize: 24 }}>
                {avg_loadboard_rate ? `$${avg_loadboard_rate.toLocaleString()}` : '—'}
              </p>
            </div>

            {/* Arrow + delta badge */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 20, lineHeight: 1 }}>→</span>
              {delta != null && (
                <span
                  style={{
                    backgroundColor: deltaPositive ? 'rgba(239,68,68,0.1)' : 'rgba(72,181,116,0.12)',
                    color: deltaPositive ? 'var(--red)' : 'var(--accent)',
                    border: `1px solid ${deltaPositive ? 'rgba(239,68,68,0.25)' : 'rgba(72,181,116,0.3)'}`,
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '2px 8px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {deltaSign}{delta}%
                </span>
              )}
            </div>

            {/* Agreed rate */}
            <div style={{ flex: 1, textAlign: 'center' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: 12, margin: '0 0 6px' }}>Agreed Rate</p>
              <p style={{ ...bigNum, color: 'var(--accent)', fontSize: 24 }}>
                {avg_agreed_rate ? `$${avg_agreed_rate.toLocaleString()}` : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Avg rounds */}
        <div style={card}>
          <p style={label}>Avg. Rounds</p>
          <p style={bigNum}>{avg_negotiation_rounds ?? '—'}</p>
          <p style={sub}>per negotiated call</p>
        </div>

        {/* Conversion rate */}
        <div style={card}>
          <p style={label}>Conversion Rate</p>
          <p style={{ ...bigNum, color: 'var(--teal)' }}>
            {convRate != null ? `${convRate}%` : '—'}
          </p>
          <p style={sub}>calls → booked</p>
        </div>
      </div>
    </div>
  )
}
