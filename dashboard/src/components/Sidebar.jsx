import { useTheme } from '../context/ThemeContext'

const NAV_ITEMS = [
  { id: 'overview',  label: 'Overview',   icon: '⊞' },
  { id: 'map',       label: 'Load Map',   icon: '⊕' },
  { id: 'outcomes',  label: 'Analytics',  icon: '◉' },
]

export default function Sidebar({ active, onNavigate, lastRefresh, collapsed, onToggle }) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <aside
      style={{
        backgroundColor: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border)',
        width: collapsed ? 64 : 240,
        height: '100vh',
        position: 'sticky',
        top: 0,
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        transition: 'width 0.2s ease',
        overflow: 'hidden',
      }}
    >
      {/* Logo */}
      <div style={{ borderBottom: '1px solid var(--border)', padding: collapsed ? '20px 0 16px' : '20px 20px 16px', display: 'flex', justifyContent: collapsed ? 'center' : 'flex-start', flexShrink: 0 }}>
        {collapsed ? (
          <div
            style={{
              border: '2px solid var(--accent)',
              borderRadius: 6,
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ color: 'var(--accent)', fontWeight: 900, fontSize: 10, letterSpacing: '-0.5px' }}>ACME</span>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                border: '2px solid var(--accent)',
                borderRadius: 6,
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <span style={{ color: 'var(--accent)', fontWeight: 900, fontSize: 10, letterSpacing: '-0.5px' }}>ACME</span>
            </div>
            <div>
              <p style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 14, margin: 0, lineHeight: 1.3 }}>
                Acme Logistics
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: 11, margin: 0 }}>Carrier Desk</p>
            </div>
          </div>
        )}
      </div>

      {/* Collapse toggle — below logo, above nav */}
      <div style={{ borderBottom: '1px solid var(--border)', padding: collapsed ? '10px 0' : '10px 12px', display: 'flex', justifyContent: collapsed ? 'center' : 'flex-end', flexShrink: 0 }}>
        <button
          onClick={onToggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            backgroundColor: 'transparent',
            border: '1px solid var(--border)',
            color: 'var(--text-muted)',
            borderRadius: 7,
            width: collapsed ? 36 : 'auto',
            padding: collapsed ? '5px 0' : '5px 10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
        >
          <span style={{ fontSize: 13 }}>{collapsed ? '›' : '‹'}</span>
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>

      {/* Nav — scrollable if items overflow */}
      <nav style={{ flex: 1, padding: collapsed ? '16px 0' : '16px 12px', overflowY: 'auto' }}>
        {!collapsed && (
          <p style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0 12px', marginBottom: 8 }}>
            Menu
          </p>
        )}
        {NAV_ITEMS.map((item) => {
          const isActive = active === item.id
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              title={collapsed ? item.label : undefined}
              style={{
                backgroundColor: isActive ? 'var(--accent-dim)' : 'transparent',
                color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                borderTop: 'none',
                borderRight: 'none',
                borderBottom: 'none',
                borderLeft: collapsed ? 'none' : `3px solid ${isActive ? 'var(--accent)' : 'transparent'}`,
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'flex-start',
                gap: collapsed ? 0 : 10,
                padding: collapsed ? '10px 0' : '8px 12px',
                borderRadius: 8,
                marginBottom: 2,
                fontSize: 13,
                fontWeight: isActive ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                textAlign: 'left',
              }}
              onMouseEnter={e => {
                if (!isActive) e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'
              }}
              onMouseLeave={e => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <span style={{ fontSize: 16, width: collapsed ? 'auto' : 20, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
              {!collapsed && item.label}
            </button>
          )
        })}
      </nav>

      {/* Footer — always visible */}
      {!collapsed ? (
        <div style={{ borderTop: '1px solid var(--border)', padding: '16px 16px 20px', flexShrink: 0 }}>
          <button
            onClick={toggleTheme}
            style={{
              backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              padding: '7px 12px',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              marginBottom: 14,
            }}
          >
            <span>{isDark ? '☀  Light mode' : '☾  Dark mode'}</span>
            <div
              style={{
                width: 32,
                height: 18,
                backgroundColor: isDark ? 'var(--accent)' : 'var(--border)',
                borderRadius: 999,
                position: 'relative',
                transition: 'background-color 0.2s',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 12,
                  height: 12,
                  backgroundColor: '#fff',
                  borderRadius: '50%',
                  position: 'absolute',
                  top: 3,
                  left: isDark ? 17 : 3,
                  transition: 'left 0.2s',
                }}
              />
            </div>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ backgroundColor: '#00D4B4', borderRadius: 4, width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 9, fontWeight: 800, color: '#0F1117' }}>HR</span>
            </div>
            <div>
              <p style={{ color: '#00D4B4', fontWeight: 700, fontSize: 12, margin: 0, lineHeight: 1.2 }}>HappyRobot</p>
              {lastRefresh && (
                <p style={{ color: 'var(--text-muted)', fontSize: 10, margin: 0 }}>Updated {lastRefresh}</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ borderTop: '1px solid var(--border)', padding: '12px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <button
            onClick={toggleTheme}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{
              backgroundColor: 'transparent',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
              borderRadius: 8,
              width: 36,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            {isDark ? '☀' : '☾'}
          </button>
          <div style={{ backgroundColor: '#00D4B4', borderRadius: 4, width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 9, fontWeight: 800, color: '#0F1117' }}>HR</span>
          </div>
        </div>
      )}
    </aside>
  )
}
