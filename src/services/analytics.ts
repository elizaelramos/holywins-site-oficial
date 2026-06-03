// Client-side page-view tracking beacon.
// Sends one event per SPA route change to POST /api/analytics/collect.
// Public site only — admin/login routes are never tracked.

const RAW_API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'
const API_URL = RAW_API_URL.endsWith('/') ? RAW_API_URL.slice(0, -1) : RAW_API_URL

const VISITOR_KEY = 'hw_visitor_id'
const SESSION_KEY = 'hw_session_id'

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function getVisitorId(): string {
  try {
    let id = localStorage.getItem(VISITOR_KEY)
    if (!id) {
      id = uuid()
      localStorage.setItem(VISITOR_KEY, id)
    }
    return id
  } catch {
    return uuid()
  }
}

function getSessionId(): string {
  try {
    let id = sessionStorage.getItem(SESSION_KEY)
    if (!id) {
      id = uuid()
      sessionStorage.setItem(SESSION_KEY, id)
    }
    return id
  } catch {
    return uuid()
  }
}

function parseUtm(search: string) {
  const params = new URLSearchParams(search)
  return {
    source: params.get('utm_source') || undefined,
    medium: params.get('utm_medium') || undefined,
    campaign: params.get('utm_campaign') || undefined,
  }
}

// Don't track admin-area routes in public analytics
function shouldTrack(path: string): boolean {
  return !path.startsWith('/admin') && !path.startsWith('/login')
}

export function trackPageView(path: string, search = ''): void {
  if (typeof window === 'undefined') return
  if (!shouldTrack(path)) return

  const payload = {
    path,
    referrer: document.referrer || null,
    visitorId: getVisitorId(),
    sessionId: getSessionId(),
    language: navigator.language || null,
    utm: parseUtm(search),
  }

  const url = `${API_URL}/analytics/collect`
  try {
    const body = JSON.stringify(payload)
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' })
      const ok = navigator.sendBeacon(url, blob)
      if (ok) return
    }
    void fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      credentials: 'include',
      keepalive: true,
    }).catch(() => {})
  } catch {
    // Never let tracking break the page
  }
}
