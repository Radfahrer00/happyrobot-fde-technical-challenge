import { useState } from 'react'
import { useTheme } from '../context/ThemeContext'

const EQUIP_COLORS = {
  'Dry Van':   { color: '#6366F1', bg: 'rgba(99,102,241,0.1)' },
  'Reefer':    { color: '#00D4B4', bg: 'rgba(0,212,180,0.1)' },
  'Flatbed':   { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  'Step Deck': { color: '#F97316', bg: 'rgba(249,115,22,0.1)' },
}

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

function SortTh({ label, sortKey, active, dir, onSort, style = {} }) {
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
        ...style,
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

function UrgencyBadge({ days }) {
  let color, bg, label
  if (days < 0) {
    color = '#6B7280'; bg = 'rgba(107,114,128,0.1)'; label = 'Overdue'
  } else if (days <= 1) {
    color = '#EF4444'; bg = 'rgba(239,68,68,0.1)'; label = days === 0 ? 'Today' : 'Tomorrow'
  } else if (days <= 3) {
    color = '#F59E0B'; bg = 'rgba(245,158,11,0.1)'; label = `${days}d`
  } else {
    color = '#48b574'; bg = 'rgba(72,181,116,0.12)'; label = `${days}d`
  }
  return (
    <span style={{ color, backgroundColor: bg, fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 999, whiteSpace: 'nowrap' }}>
      {label}
    </span>
  )
}

function EquipBadge({ type }) {
  const cfg = EQUIP_COLORS[type] || { color: '#6B7280', bg: 'rgba(107,114,128,0.1)' }
  return (
    <span style={{ color: cfg.color, backgroundColor: cfg.bg, fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 999, whiteSpace: 'nowrap' }}>
      {type}
    </span>
  )
}

function fmtDate(str) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const COLUMNS = [
  { label: 'Load ID',            key: 'load_id' },
  { label: 'Origin',             key: 'origin' },
  { label: 'Destination',        key: 'destination' },
  { label: 'Equipment',          key: 'equipment_type' },
  { label: 'Pickup Date',        key: 'pickup_datetime' },
  { label: 'Pickup In',          key: 'days_until_pickup' },
  { label: 'Rate',               key: 'loadboard_rate' },
]

export default function LoadAgingTable({ loads, loading, error }) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [sortKey, setSortKey] = useState('days_until_pickup')
  const [sortDir, setSortDir] = useState('asc')

  const handleSort = (key) => {
    if (key === sortKey) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const headerBg = isDark ? '#111420' : '#F8FAFC'
  const rowHoverBg = isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'

  if (loading) return null
  if (error) return (
    <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
      <p style={{ color: '#EF4444', fontSize: 13, margin: 0 }}>{error}</p>
    </div>
  )
  if (!loads || loads.length === 0) return (
    <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 32, textAlign: 'center' }}>
      <p style={{ color: 'var(--text-muted)', margin: 0 }}>All loads are booked.</p>
    </div>
  )

  const overdue = loads.filter(l => l.days_until_pickup < 0).length
  const urgent = loads.filter(l => l.days_until_pickup >= 0 && l.days_until_pickup <= 3).length
  const sorted = sortRows(loads, sortKey, sortDir)

  return (
    <div>
      {/* Summary row */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)', borderRadius: 12, padding: '14px 20px', flex: 1 }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', margin: '0 0 4px' }}>Unbooked Loads</p>
          <p style={{ color: 'var(--text-primary)', fontSize: 26, fontWeight: 800, margin: 0 }}>{loads.length}</p>
        </div>
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)', borderRadius: 12, padding: '14px 20px', flex: 1 }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', margin: '0 0 4px' }}>Urgent (≤3 days)</p>
          <p style={{ color: urgent > 0 ? '#F59E0B' : 'var(--text-primary)', fontSize: 26, fontWeight: 800, margin: 0 }}>{urgent}</p>
        </div>
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)', borderRadius: 12, padding: '14px 20px', flex: 1 }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', margin: '0 0 4px' }}>Overdue</p>
          <p style={{ color: overdue > 0 ? '#EF4444' : 'var(--text-primary)', fontSize: 26, fontWeight: 800, margin: 0 }}>{overdue}</p>
        </div>
      </div>

      {/* Table */}
      <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)', borderRadius: 12, overflow: 'hidden' }}>
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
              {sorted.map((load, idx) => (
                <tr
                  key={load.load_id}
                  style={{
                    borderBottom: '1px solid var(--border)',
                    backgroundColor: idx % 2 === 0 ? 'transparent' : isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)',
                    transition: 'background-color 0.1s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = rowHoverBg}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? 'transparent' : isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)'}
                >
                  <td style={{ padding: '10px 14px', color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600 }}>
                    {load.load_id}
                  </td>
                  <td style={{ padding: '10px 14px', color: 'var(--text-primary)', fontWeight: 500 }}>
                    {load.origin}
                  </td>
                  <td style={{ padding: '10px 14px', color: 'var(--text-primary)', fontWeight: 500 }}>
                    {load.destination}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <EquipBadge type={load.equipment_type} />
                  </td>
                  <td style={{ padding: '10px 14px', color: 'var(--text-secondary)', fontSize: 12, whiteSpace: 'nowrap' }}>
                    {fmtDate(load.pickup_datetime)}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <UrgencyBadge days={load.days_until_pickup} />
                  </td>
                  <td style={{ padding: '10px 14px', color: '#48b574', fontWeight: 700 }}>
                    ${load.loadboard_rate.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
