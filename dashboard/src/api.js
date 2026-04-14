const API_KEY = import.meta.env.VITE_API_KEY || 'dev-api-key'

// When VITE_API_URL is set (Railway build or direct mode), call backend directly.
// When unset, go through the /api proxy (Vite dev server or nginx).
const BACKEND = import.meta.env.VITE_API_URL || ''
const url = (path) => BACKEND ? `${BACKEND}${path}` : `/api${path}`

const headers = {
  Authorization: `Bearer ${API_KEY}`,
  'Content-Type': 'application/json',
}

export async function fetchMetrics(days = 30) {
  const res = await fetch(url(`/calls/metrics?days=${days}`), { headers })
  if (!res.ok) throw new Error(`Metrics fetch failed: ${res.status}`)
  return res.json()
}

export async function fetchCalls(page = 1, pageSize = 20) {
  const res = await fetch(url(`/calls/list?page=${page}&page_size=${pageSize}`), { headers })
  if (!res.ok) throw new Error(`Calls fetch failed: ${res.status}`)
  return res.json()
}

export async function fetchAllLoads() {
  const res = await fetch(url(`/loads/all`), { headers })
  if (!res.ok) throw new Error(`Loads fetch failed: ${res.status}`)
  return res.json()
}

export async function fetchGeoStats() {
  const res = await fetch(url(`/calls/geo`), { headers })
  if (!res.ok) throw new Error(`Geo stats fetch failed: ${res.status}`)
  return res.json()
}

export async function fetchAgingLoads(limit = 25) {
  const res = await fetch(url(`/loads/aging?limit=${limit}`), { headers })
  if (!res.ok) throw new Error(`Aging loads fetch failed: ${res.status}`)
  return res.json()
}
