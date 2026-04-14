import { useState, useEffect, useCallback } from 'react'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import Sidebar from './components/Sidebar'
import KPICard from './components/KPICard'
import OutcomeChart from './components/OutcomeChart'
import SentimentChart from './components/SentimentChart'
import CallsOverTime from './components/CallsOverTime'
import NegotiationStats from './components/NegotiationStats'
import NegotiationFunnel from './components/NegotiationFunnel'
import RecentCallsTable from './components/RecentCallsTable'
import LoadAgingTable from './components/LoadAgingTable'
import LoadMap from './components/LoadMap'
import { fetchMetrics, fetchCalls, fetchAgingLoads } from './api'

const REFRESH_INTERVAL = 30_000

function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 256 }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function ErrorBanner({ message, onRetry }) {
  return (
    <div style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <p style={{ color: '#EF4444', fontSize: 13, margin: 0 }}>{message}</p>
      <button onClick={onRetry} style={{ color: 'var(--accent)', fontSize: 12, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', marginLeft: 16, textDecoration: 'underline' }}>
        Retry
      </button>
    </div>
  )
}

function PageHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h1 style={{ color: 'var(--text-primary)', fontSize: 22, fontWeight: 800, margin: 0 }}>{title}</h1>
      {subtitle && <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4, marginBottom: 0 }}>{subtitle}</p>}
    </div>
  )
}

// ── Views ─────────────────────────────────────────────────────────────────────

function OverviewView({ metrics, loading, error, onRetry }) {
  if (loading) return <LoadingSpinner />
  if (error) return <ErrorBanner message={error} onRetry={onRetry} />
  if (!metrics) return null

  return (
    <>
      <PageHeader
        title="Overview"
        subtitle="Real-time performance snapshot for Acme Logistics inbound carrier calls"
      />
      {/* 4-column KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 14 }}>
        <KPICard title="Total Calls" value={metrics.total_calls.toLocaleString()} subtitle="Last 30 days" />
        <KPICard title="Booking Rate" value={`${metrics.booking_rate}%`} subtitle={`${metrics.booked_count} loads booked`} accent />
        <KPICard title="Avg Agreed Rate" value={metrics.avg_agreed_rate ? `$${metrics.avg_agreed_rate.toLocaleString()}` : '—'} subtitle="Booked loads only" teal />
        <KPICard
          title="Rate vs Board"
          value={metrics.avg_rate_delta_pct != null ? `${metrics.avg_rate_delta_pct > 0 ? '+' : ''}${metrics.avg_rate_delta_pct.toFixed(1)}%` : '—'}
          subtitle="Agreed vs loadboard"
        />
      </div>
      {/* 3-column chart row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', gap: 14 }}>
        <OutcomeChart breakdown={metrics.outcome_breakdown} />
        <SentimentChart breakdown={metrics.sentiment_breakdown} />
        <CallsOverTime data={metrics.calls_over_time} />
      </div>
    </>
  )
}

function MapView() {
  return (
    <>
      <PageHeader title="Load Map" subtitle="Available freight lanes and booking demand hubs across the US" />
      <LoadMap />
    </>
  )
}

const ANALYTICS_TABS = [
  { id: 'outcomes',    label: 'Outcomes & Sentiment' },
  { id: 'negotiation', label: 'Negotiation' },
  { id: 'aging',       label: 'Load Aging' },
  { id: 'calls',       label: 'Recent Calls' },
]

function AnalyticsView({ metrics, loading, error, onRetry, calls, callsLoading, callsError, onCallsRetry, agingLoads, agingLoading, agingError }) {
  const [activeTab, setActiveTab] = useState('outcomes')

  return (
    <>
      <PageHeader title="Analytics" />

      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
        {ANALYTICS_TABS.map(tab => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: `2px solid ${isActive ? 'var(--accent)' : 'transparent'}`,
                color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                fontWeight: isActive ? 600 : 500,
                fontSize: 13,
                padding: '8px 18px',
                cursor: 'pointer',
                marginBottom: -1,
                transition: 'color 0.15s ease, border-color 0.15s ease',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = 'var(--text-primary)' }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = 'var(--text-secondary)' }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Outcomes & Sentiment tab */}
      {activeTab === 'outcomes' && (
        loading ? <LoadingSpinner /> :
        error ? <ErrorBanner message={error} onRetry={onRetry} /> :
        metrics ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 14 }}>
              <KPICard title="Booked" value={metrics.outcome_breakdown.booking_confirmed || 0} accent />
              <KPICard title="Negotiation Failed" value={metrics.outcome_breakdown.negotiation_failed || 0} />
              <KPICard title="Transferred" value={metrics.outcome_breakdown.call_transferred || 0} teal />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <OutcomeChart breakdown={metrics.outcome_breakdown} />
              <SentimentChart breakdown={metrics.sentiment_breakdown} />
            </div>
          </>
        ) : null
      )}

      {/* Negotiation tab */}
      {activeTab === 'negotiation' && (
        loading ? <LoadingSpinner /> :
        error ? <ErrorBanner message={error} onRetry={onRetry} /> :
        metrics ? (
          <>
            <NegotiationStats metrics={metrics} />
            <NegotiationFunnel data={metrics.negotiation_funnel} />
          </>
        ) : null
      )}

      {/* Load Aging tab */}
      {activeTab === 'aging' && (
        <LoadAgingTable loads={agingLoads} loading={agingLoading} error={agingError} />
      )}

      {/* Recent Calls tab */}
      {activeTab === 'calls' && (
        callsLoading ? <LoadingSpinner /> :
        callsError ? <ErrorBanner message={callsError} onRetry={onCallsRetry} /> :
        <RecentCallsTable calls={calls} />
      )}
    </>
  )
}

// ── App shell ─────────────────────────────────────────────────────────────────

function AppShell() {
  const [activeView, setActiveView] = useState('overview')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try { return localStorage.getItem('acme-sidebar') === 'collapsed' } catch { return false }
  })
  const [metrics, setMetrics] = useState(null)
  const [calls, setCalls] = useState([])
  const [agingLoads, setAgingLoads] = useState([])
  const [loading, setLoading] = useState(true)
  const [callsLoading, setCallsLoading] = useState(false)
  const [agingLoading, setAgingLoading] = useState(false)
  const [error, setError] = useState(null)
  const [callsError, setCallsError] = useState(null)
  const [agingError, setAgingError] = useState(null)
  const [lastRefresh, setLastRefresh] = useState(null)

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => {
      const next = !prev
      try { localStorage.setItem('acme-sidebar', next ? 'collapsed' : 'expanded') } catch {}
      return next
    })
  }, [])

  const loadMetrics = useCallback(async () => {
    try {
      setError(null)
      const data = await fetchMetrics(30)
      setMetrics(data)
      setLastRefresh(new Date().toLocaleTimeString())
    } catch (e) {
      setError(`Failed to load metrics: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadCalls = useCallback(async () => {
    try {
      setCallsError(null)
      setCallsLoading(true)
      const data = await fetchCalls(1, 50)
      setCalls(data.items || [])
    } catch (e) {
      setCallsError(`Failed to load calls: ${e.message}`)
    } finally {
      setCallsLoading(false)
    }
  }, [])

  const loadAging = useCallback(async () => {
    try {
      setAgingError(null)
      setAgingLoading(true)
      const data = await fetchAgingLoads(25)
      setAgingLoads(data)
    } catch (e) {
      setAgingError(`Failed to load aging loads: ${e.message}`)
    } finally {
      setAgingLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMetrics()
    loadCalls()
    loadAging()
    const interval = setInterval(() => { loadMetrics(); loadCalls(); loadAging() }, REFRESH_INTERVAL)
    return () => clearInterval(interval)
  }, [loadMetrics, loadCalls, loadAging])

  const mainProps = { metrics, loading, error, onRetry: loadMetrics }

  return (
    <div style={{ display: 'flex', width: '100%', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      <Sidebar
        active={activeView}
        onNavigate={setActiveView}
        lastRefresh={lastRefresh}
        collapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
      />

      <main style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        {/* Topbar */}
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            borderBottom: '1px solid var(--border)',
            padding: '12px 32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          {/* Live indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#48b574', animation: 'pulse 2s infinite' }} />
            <span style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 500 }}>AI Agent Active</span>
            <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Auto-refresh every 30s</span>
            <button
              onClick={() => { loadMetrics(); loadCalls() }}
              style={{
                backgroundColor: 'var(--accent-dim)',
                color: 'var(--accent)',
                border: '1px solid var(--accent)',
                fontSize: 12,
                fontWeight: 700,
                padding: '5px 14px',
                borderRadius: 6,
                cursor: 'pointer',
                opacity: 1,
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              Refresh
            </button>

            {/* Acme logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 12, borderLeft: '1px solid var(--border)' }}>
              <div style={{ width: 28, height: 28, border: '2px solid var(--accent)', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: 'var(--accent)', fontWeight: 900, fontSize: 8, letterSpacing: '-0.3px' }}>ACME</span>
              </div>
              <div>
                <p style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 12, margin: 0, lineHeight: 1.2 }}>Acme Logistics</p>
                <p style={{ color: 'var(--text-muted)', fontSize: 10, margin: 0 }}>Est. 1964</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '24px 32px', flex: 1 }}>
          {activeView === 'overview' && <OverviewView {...mainProps} />}
          {activeView === 'map'      && <MapView />}
          {activeView === 'outcomes' && (
            <AnalyticsView
              {...mainProps}
              calls={calls}
              callsLoading={callsLoading}
              callsError={callsError}
              onCallsRetry={loadCalls}
              agingLoads={agingLoads}
              agingLoading={agingLoading}
              agingError={agingError}
            />
          )}
        </div>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  )
}
