import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup } from 'react-leaflet'
import { fetchAllLoads, fetchGeoStats } from '../api'
import { useTheme } from '../context/ThemeContext'

const EQUIPMENT_COLORS = {
  'Dry Van':  '#48b574',
  'Flatbed':  '#F59E0B',
  'Reefer':   '#00D4B4',
  'Step Deck':'#6366F1',
}

const TILE_URLS = {
  light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  dark:  'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
}

const FILTERS = ['All', 'Dry Van', 'Flatbed', 'Reefer', 'Step Deck']

export default function LoadMap() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [loads, setLoads] = useState([])
  const [geoStats, setGeoStats] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('All')

  useEffect(() => {
    Promise.all([fetchAllLoads(), fetchGeoStats()])
      .then(([l, g]) => { setLoads(l); setGeoStats(g) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const filteredLoads = filter === 'All'
    ? loads
    : loads.filter(l => l.equipment_type === filter)

  const maxTotal = Math.max(...geoStats.map(g => g.total_loads), 1)

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow)',
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{ borderBottom: '1px solid var(--border)', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}
      >
        <div>
          <h3 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 15, margin: 0 }}>
            Freight Load Map
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 12, margin: '2px 0 0' }}>
            {loads.length} available loads · circles = booking demand hubs
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                backgroundColor: filter === f ? 'var(--accent-dim)' : 'transparent',
                color: filter === f ? 'var(--accent)' : 'var(--text-secondary)',
                border: `1px solid ${filter === f ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 600,
                padding: '4px 10px',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div style={{ height: 520, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} />
        </div>
      )}

      {error && (
        <div style={{ height: 520, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: '#EF4444', fontSize: 13 }}>{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div style={{ position: 'relative' }}>
          <MapContainer
            center={[38.5, -96]}
            zoom={4}
            style={{ height: 520, width: '100%', zIndex: 0 }}
            scrollWheelZoom={true}
          >
            <TileLayer
              key={theme}
              url={TILE_URLS[theme]}
              attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
            />

            {/* Load lanes */}
            {filteredLoads
              .filter(l => l.origin_lat != null && l.dest_lat != null)
              .map(l => (
                <Polyline
                  key={l.load_id}
                  positions={[[l.origin_lat, l.origin_lng], [l.dest_lat, l.dest_lng]]}
                  color={EQUIPMENT_COLORS[l.equipment_type] || '#6B7280'}
                  weight={1.5}
                  opacity={0.45}
                >
                  <Popup>
                    <div style={{ fontSize: 12, minWidth: 160 }}>
                      <p style={{ fontWeight: 700, marginBottom: 4, marginTop: 0 }}>{l.load_id} · {l.equipment_type}</p>
                      <p style={{ margin: '0 0 4px', color: '#718096' }}>{l.origin} → {l.destination}</p>
                      <p style={{ color: '#48b574', fontWeight: 700, margin: '0 0 2px' }}>
                        ${l.loadboard_rate.toLocaleString()} · {l.miles} mi
                      </p>
                      <p style={{ color: '#A0AEC0', fontSize: 11, margin: 0 }}>
                        Pickup {new Date(l.pickup_datetime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </Popup>
                </Polyline>
              ))}

            {/* Demand hubs */}
            {geoStats.map(city => {
              const radius = 6 + (city.total_loads / maxTotal) * 26
              const bookedRatio = city.total_loads > 0 ? city.booked / city.total_loads : 0
              return (
                <CircleMarker
                  key={city.city}
                  center={[city.lat, city.lng]}
                  radius={radius}
                  fillColor="#48b574"
                  color={isDark ? '#0F1117' : '#fff'}
                  weight={1.5}
                  fillOpacity={0.25 + bookedRatio * 0.55}
                >
                  <Popup>
                    <div style={{ fontSize: 12, minWidth: 150 }}>
                      <p style={{ fontWeight: 700, marginBottom: 6, marginTop: 0 }}>{city.city}</p>
                      <p style={{ margin: '0 0 3px', color: '#718096' }}>
                        Total loads: <strong style={{ color: '#1A202C' }}>{city.total_loads}</strong>
                      </p>
                      <p style={{ margin: 0, color: '#718096' }}>
                        Booked: <strong style={{ color: '#48b574' }}>{city.booked}</strong>
                        {city.total_loads > 0 && (
                          <span style={{ color: '#A0AEC0', fontSize: 11 }}> ({Math.round(city.booked / city.total_loads * 100)}%)</span>
                        )}
                      </p>
                    </div>
                  </Popup>
                </CircleMarker>
              )
            })}
          </MapContainer>

          {/* Legend */}
          <div
            style={{
              position: 'absolute',
              bottom: 16,
              right: 16,
              backgroundColor: isDark ? 'rgba(26,29,39,0.95)' : 'rgba(255,255,255,0.95)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: '12px 14px',
              zIndex: 500,
              fontSize: 11,
              minWidth: 140,
              backdropFilter: 'blur(8px)',
            }}
          >
            <p style={{ color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8, marginTop: 0 }}>
              Legend
            </p>
            {Object.entries(EQUIPMENT_COLORS).map(([type, color]) => (
              <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                <div style={{ width: 22, height: 2, backgroundColor: color, borderRadius: 1 }} />
                <span style={{ color: 'var(--text-secondary)' }}>{type}</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid var(--border)', marginTop: 8, paddingTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: '#48b574', opacity: 0.6, flexShrink: 0 }} />
              <span style={{ color: 'var(--text-secondary)' }}>Demand hub</span>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
