import { useState } from 'react'
import { useTheme } from '../context/ThemeContext'

const OUTCOME_CONFIG = {
  booking_confirmed:  { label: 'Booked',       color: '#48b574',  bg: 'rgba(72,181,116,0.12)' },
  negotiation_failed: { label: 'Neg. Failed',  color: '#EF4444',  bg: 'rgba(239,68,68,0.1)' },
  carrier_ineligible: { label: 'Ineligible',   color: '#F59E0B',  bg: 'rgba(245,158,11,0.1)' },
  no_suitable_loads:  { label: 'No Loads',     color: '#6366F1',  bg: 'rgba(99,102,241,0.1)' },
  call_transferred:   { label: 'Transferred',  color: '#00D4B4',  bg: 'rgba(0,212,180,0.1)' },
  other:              { label: 'Other',        color: '#6B7280',  bg: 'rgba(107,114,128,0.1)' },
}

const SENTIMENT_CONFIG = {
  positive:   { label: 'Positive',   color: '#48b574' },
  neutral:    { label: 'Neutral',    color: '#6B7280' },
  frustrated: { label: 'Frustrated', color: '#EF4444' },
  confused:   { label: 'Confused',   color: '#F59E0B' },
  other:      { label: 'Other',      color: '#A0AEC0' },
}

const COLUMNS = [
  { label: 'Timestamp',  key: 'timestamp' },
  { label: 'Carrier',    key: 'carrier_name' },
  { label: 'MC #',       key: 'mc_number' },
  { label: 'Load',       key: 'load_id' },
  { label: 'Rate',       key: 'agreed_rate' },
  { label: 'Rounds',     key: 'negotiation_rounds' },
  { label: 'Outcome',    key: 'outcome' },
  { label: 'Sentiment',  key: 'sentiment' },
]

function sortRows(rows, key, dir) {
  if (!key) return rows
  return [...rows].sort((a, b) => {
    const av = a[key] ?? ''
    const bv = b[key] ?? ''
    const cmp = typeof av === 'number' && typeof bv === 'number'
      ? av - bv
      : String(av).localeCompare(String(bv), undefined, { numeric: true })
    return dir === 'asc' ? cmp : -cmp
  })
}

function SortTh({ label, sortKey, active, dir, onSort }) {
  return (
    <th
      onClick={() => onSort(sortKey)}
      style={{
        textAlign: 'left',
        padding: '10px 14px',
        fontWeight: 700,
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: '0.07em',
        color: active ? 'var(--accent)' : 'var(--text-muted)',
        whiteSpace: 'nowrap',
        cursor: 'pointer',
        userSelect: 'none',
        transition: 'color 0.15s',
      }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {label}
        <span style={{ fontSize: 10, opacity: active ? 1 : 0.35 }}>
          {active ? (dir === 'asc' ? '↑' : '↓') : '↕'}
        </span>
      </span>
    </th>
  )
}

function Badge({ value, config }) {
  const cfg = config[value] || { label: value, color: '#6B7280', bg: 'rgba(107,114,128,0.1)' }
  return (
    <span
      style={{
        color: cfg.color,
        backgroundColor: cfg.bg || `${cfg.color}18`,
        fontSize: 11,
        fontWeight: 700,
        padding: '3px 9px',
        borderRadius: 999,
        whiteSpace: 'nowrap',
        display: 'inline-block',
      }}
    >
      {cfg.label}
    </span>
  )
}

function fmt(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function exportCSV(calls) {
  const headers = ['Timestamp', 'Carrier', 'MC #', 'Load ID', 'Agreed Rate', 'Loadboard Rate', 'Rounds', 'Outcome', 'Sentiment']
  const rows = calls.map(c => [
    c.timestamp ? new Date(c.timestamp).toLocaleString('en-US') : '',
    c.carrier_name || '',
    c.mc_number,
    c.load_id || '',
    c.agreed_rate ?? '',
    c.loadboard_rate ?? '',
    c.negotiation_rounds,
    c.outcome,
    c.sentiment,
  ])
  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `acme-calls-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function RecentCallsTable({ calls }) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [sortKey, setSortKey] = useState('timestamp')
  const [sortDir, setSortDir] = useState('desc')

  const handleSort = (key) => {
    if (key === sortKey) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  if (!calls || calls.length === 0) {
    return (
      <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 32, textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>No call records yet.</p>
      </div>
    )
  }

  const headerBg = isDark ? '#111420' : '#F8FAFC'
  const rowHoverBg = isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'
  const sorted = sortRows(calls, sortKey, sortDir)

  return (
    <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)', borderRadius: 12, overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', margin: 0 }}>
          {calls.length} Records
        </p>
        <button
          onClick={() => exportCSV(calls)}
          style={{
            backgroundColor: 'var(--accent-dim)',
            color: 'var(--accent)',
            border: '1px solid var(--accent)',
            borderRadius: 7,
            fontSize: 12,
            fontWeight: 700,
            padding: '5px 12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          ↓ Export CSV
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: headerBg }}>
              {COLUMNS.map(col => (
                <SortTh
                  key={col.key}
                  label={col.label}
                  sortKey={col.key}
                  active={sortKey === col.key}
                  dir={sortDir}
                  onSort={handleSort}
                />
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((call, idx) => (
              <tr
                key={call.call_id}
                style={{
                  borderBottom: '1px solid var(--border)',
                  backgroundColor: idx % 2 === 0 ? 'transparent' : isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)',
                  transition: 'background-color 0.1s',
                  cursor: 'default',
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = rowHoverBg}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? 'transparent' : isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)'}
              >
                <td style={{ padding: '10px 14px', color: 'var(--text-secondary)', fontSize: 12, whiteSpace: 'nowrap' }}>
                  {fmt(call.timestamp)}
                </td>
                <td style={{ padding: '10px 14px', color: 'var(--text-primary)', fontWeight: 600, maxWidth: 140 }}>
                  <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={call.carrier_name}>
                    {call.carrier_name || '—'}
                  </span>
                </td>
                <td style={{ padding: '10px 14px', color: 'var(--text-secondary)', fontSize: 12, fontFamily: 'ui-monospace, monospace' }}>
                  {call.mc_number}
                </td>
                <td style={{ padding: '10px 14px', color: 'var(--text-secondary)', fontFamily: 'ui-monospace, monospace' }}>
                  {call.load_id || '—'}
                </td>
                <td style={{ padding: '10px 14px' }}>
                  {call.agreed_rate ? (
                    <span style={{ color: '#48b574', fontWeight: 700, fontFamily: 'ui-monospace, monospace' }}>
                      ${call.agreed_rate.toLocaleString()}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>—</span>
                  )}
                </td>
                <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                  <span
                    style={{
                      fontFamily: 'ui-monospace, monospace',
                      fontWeight: 700,
                      color: call.negotiation_rounds >= 3 ? '#EF4444' : call.negotiation_rounds > 0 ? '#48b574' : 'var(--text-muted)',
                    }}
                  >
                    {call.negotiation_rounds}
                  </span>
                </td>
                <td style={{ padding: '10px 14px' }}>
                  <Badge value={call.outcome} config={OUTCOME_CONFIG} />
                </td>
                <td style={{ padding: '10px 14px' }}>
                  <Badge value={call.sentiment} config={SENTIMENT_CONFIG} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
