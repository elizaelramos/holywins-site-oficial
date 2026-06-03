import geoip from 'geoip-lite'
import { pool } from './db.js'

// ----------------------------------------------------------------------------
// Detection helpers
// ----------------------------------------------------------------------------

const BOT_UA_REGEX =
  /(bot|crawl|spider|slurp|mediapartners|facebookexternalhit|embedly|quora|pinterest|bingpreview|curl|wget|python-requests|python-urllib|go-http|java\/|libwww|httpclient|okhttp|scrapy|headlesschrome|phantomjs|selenium|axios|node-fetch|httpie|nikto|sqlmap|nmap|masscan|zgrab|censys|semrush|ahrefs|dotbot|mj12bot|petalbot|dataforseo)/i

export function detectBot(ua) {
  if (!ua || ua.trim() === '') return true
  return BOT_UA_REGEX.test(ua)
}

// Lightweight UA parser (no external dependency)
export function parseUA(ua = '') {
  const u = ua || ''
  let device_type = 'desktop'
  if (/bot|crawl|spider|slurp|curl|wget|python|headless|scrapy/i.test(u)) device_type = 'bot'
  else if (/ipad|tablet|playbook|silk|kindle/i.test(u)) device_type = 'tablet'
  else if (/mobi|iphone|ipod|android.*mobile|windows phone|blackberry|opera mini/i.test(u))
    device_type = 'mobile'

  let browser = 'Outro'
  if (/edg\//i.test(u)) browser = 'Edge'
  else if (/opr\/|opera/i.test(u)) browser = 'Opera'
  else if (/chrome\//i.test(u) && !/edg\//i.test(u)) browser = 'Chrome'
  else if (/firefox\//i.test(u)) browser = 'Firefox'
  else if (/safari\//i.test(u) && !/chrome\//i.test(u)) browser = 'Safari'
  else if (/msie|trident/i.test(u)) browser = 'Internet Explorer'

  let os = 'Outro'
  if (/windows nt/i.test(u)) os = 'Windows'
  else if (/android/i.test(u)) os = 'Android'
  else if (/iphone|ipad|ipod/i.test(u)) os = 'iOS'
  else if (/mac os x/i.test(u)) os = 'macOS'
  else if (/linux/i.test(u)) os = 'Linux'

  return { device_type, browser, os }
}

// Resolve approximate location from IP using local GeoIP database
export function geoLookup(ip) {
  if (!ip) return { country: null, city: null }
  // Normalize IPv6-mapped IPv4 (::ffff:1.2.3.4) and strip zone
  const clean = ip.replace(/^::ffff:/, '').split('%')[0]
  if (
    clean === '127.0.0.1' ||
    clean === '::1' ||
    clean.startsWith('10.') ||
    clean.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(clean)
  ) {
    return { country: 'Local', city: null }
  }
  try {
    const geo = geoip.lookup(clean)
    if (!geo) return { country: null, city: null }
    return { country: geo.country || null, city: geo.city || null }
  } catch {
    return { country: null, city: null }
  }
}

// Paths that indicate scanning / probing attempts
const SUSPICIOUS_PATTERNS = [
  /\/wp-admin/i,
  /\/wp-login/i,
  /wp-content/i,
  /xmlrpc\.php/i,
  /\/\.env/i,
  /\/\.git/i,
  /\/\.aws/i,
  /\/\.ssh/i,
  /phpmyadmin/i,
  /\/pma\//i,
  /\/vendor\//i,
  /\/config\.(php|json|yml|yaml)/i,
  /\.(bak|sql|old|backup|swp)$/i,
  /\/administrator\//i,
  /\/cgi-bin\//i,
  /\/shell/i,
  /\/(eval|exec)-stdin/i,
  /\/boaform/i,
  /\/solr\//i,
  /\/actuator/i,
]

// Classify a request into a threat type (or null when benign)
export function classifyThreat(path = '', status = 200, isBot = false) {
  if (SUSPICIOUS_PATTERNS.some((re) => re.test(path))) return 'suspicious_path'
  if (status === 401 || status === 403) {
    if (/\/auth\/login/i.test(path)) return 'auth_bruteforce'
    if (/\/videos\/.*unlock/i.test(path) || /\/unlock/i.test(path)) return 'unlock_bruteforce'
  }
  if (status === 429) return 'rate_limited'
  if (isBot) return 'bot'
  return null
}

// ----------------------------------------------------------------------------
// Writers (fire-and-forget, must never break the request flow)
// ----------------------------------------------------------------------------

export async function recordPageView(data) {
  try {
    await pool.execute(
      `INSERT INTO page_views
        (visitor_id, session_id, path, referrer, utm_source, utm_medium, utm_campaign,
         user_agent, device_type, browser, os, language, ip, country, city, is_bot)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        data.visitor_id ?? null,
        data.session_id ?? null,
        (data.path ?? '/').slice(0, 255),
        (data.referrer ?? null) && String(data.referrer).slice(0, 500),
        data.utm_source ?? null,
        data.utm_medium ?? null,
        data.utm_campaign ?? null,
        (data.user_agent ?? null) && String(data.user_agent).slice(0, 500),
        data.device_type ?? null,
        data.browser ?? null,
        data.os ?? null,
        data.language ?? null,
        data.ip ?? null,
        data.country ?? null,
        data.city ?? null,
        data.is_bot ? 1 : 0,
      ],
    )
  } catch (error) {
    console.error('recordPageView error:', error.message)
  }
}

export async function recordRequest(data) {
  try {
    await pool.execute(
      `INSERT INTO request_logs
        (ip, method, path, status_code, response_time_ms, user_agent, referer, is_bot, threat_type, country)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [
        data.ip ?? null,
        (data.method ?? '').slice(0, 10),
        (data.path ?? '/').slice(0, 255),
        data.status_code ?? null,
        data.response_time_ms ?? null,
        (data.user_agent ?? null) && String(data.user_agent).slice(0, 500),
        (data.referer ?? null) && String(data.referer).slice(0, 500),
        data.is_bot ? 1 : 0,
        data.threat_type ?? null,
        data.country ?? null,
      ],
    )
  } catch (error) {
    console.error('recordRequest error:', error.message)
  }
}

// ----------------------------------------------------------------------------
// Date-range helper
// ----------------------------------------------------------------------------

// Returns { from, to } as 'YYYY-MM-DD HH:mm:ss' strings. Defaults: last 30 days.
function resolveRange(fromStr, toStr) {
  const to = toStr ? new Date(toStr) : new Date()
  const from = fromStr ? new Date(fromStr) : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000)
  const fmt = (d) => d.toISOString().slice(0, 19).replace('T', ' ')
  // Include the whole "to" day when only a date was supplied
  if (toStr && /^\d{4}-\d{2}-\d{2}$/.test(toStr)) to.setHours(23, 59, 59, 999)
  if (fromStr && /^\d{4}-\d{2}-\d{2}$/.test(fromStr)) from.setHours(0, 0, 0, 0)
  return { from: fmt(from), to: fmt(to) }
}

// ----------------------------------------------------------------------------
// Analytics aggregations
// ----------------------------------------------------------------------------

export async function getOverview(fromStr, toStr) {
  const { from, to } = resolveRange(fromStr, toStr)
  const spanMs = new Date(to) - new Date(from)
  const prevFrom = new Date(new Date(from).getTime() - spanMs).toISOString().slice(0, 19).replace('T', ' ')

  const [[cur]] = await pool.execute(
    `SELECT
       COUNT(*) AS total_views,
       COUNT(DISTINCT visitor_id) AS unique_visitors,
       COUNT(DISTINCT session_id) AS sessions,
       SUM(is_bot) AS bot_views
     FROM page_views
     WHERE created_at BETWEEN ? AND ?`,
    [from, to],
  )

  const [[prev]] = await pool.execute(
    `SELECT COUNT(*) AS total_views, COUNT(DISTINCT visitor_id) AS unique_visitors
     FROM page_views
     WHERE created_at BETWEEN ? AND ?`,
    [prevFrom, from],
  )

  const days = Math.max(1, Math.round(spanMs / (24 * 60 * 60 * 1000)))
  const totalViews = Number(cur.total_views) || 0
  const botViews = Number(cur.bot_views) || 0
  const prevViews = Number(prev.total_views) || 0

  return {
    range: { from, to },
    totalViews,
    uniqueVisitors: Number(cur.unique_visitors) || 0,
    sessions: Number(cur.sessions) || 0,
    botViews,
    botPercent: totalViews ? Math.round((botViews / totalViews) * 1000) / 10 : 0,
    avgPerDay: Math.round(totalViews / days),
    prevViews,
    viewsChangePercent: prevViews
      ? Math.round(((totalViews - prevViews) / prevViews) * 1000) / 10
      : null,
  }
}

export async function getTimeseries(fromStr, toStr) {
  const { from, to } = resolveRange(fromStr, toStr)
  const [rows] = await pool.execute(
    `SELECT DATE(created_at) AS day,
            COUNT(*) AS views,
            COUNT(DISTINCT visitor_id) AS visitors
     FROM page_views
     WHERE created_at BETWEEN ? AND ?
     GROUP BY DATE(created_at)
     ORDER BY day ASC`,
    [from, to],
  )
  return rows.map((r) => ({
    day: r.day instanceof Date ? r.day.toISOString().slice(0, 10) : String(r.day),
    views: Number(r.views),
    visitors: Number(r.visitors),
  }))
}

async function topBy(column, fromStr, toStr, limit = 10, whereExtra = '') {
  const { from, to } = resolveRange(fromStr, toStr)
  const [rows] = await pool.execute(
    `SELECT ${column} AS label, COUNT(*) AS total
     FROM page_views
     WHERE created_at BETWEEN ? AND ? ${whereExtra}
     GROUP BY ${column}
     ORDER BY total DESC
     LIMIT ${Number(limit)}`,
    [from, to],
  )
  return rows.map((r) => ({ label: r.label ?? '(desconhecido)', total: Number(r.total) }))
}

export const getTopPages = (f, t) => topBy('path', f, t, 15)
export const getDevices = (f, t) => topBy('device_type', f, t, 10)
export const getBrowsers = (f, t) => topBy('browser', f, t, 10)
export const getCountries = (f, t) => topBy('country', f, t, 15)

export async function getReferrers(fromStr, toStr) {
  const { from, to } = resolveRange(fromStr, toStr)
  const [rows] = await pool.execute(
    `SELECT
       CASE
         WHEN referrer IS NULL OR referrer = '' THEN 'Direto'
         ELSE SUBSTRING_INDEX(SUBSTRING_INDEX(referrer, '/', 3), '//', -1)
       END AS label,
       COUNT(*) AS total
     FROM page_views
     WHERE created_at BETWEEN ? AND ?
     GROUP BY label
     ORDER BY total DESC
     LIMIT 15`,
    [from, to],
  )
  return rows.map((r) => ({ label: r.label, total: Number(r.total) }))
}

export async function getPeakHours(fromStr, toStr) {
  const { from, to } = resolveRange(fromStr, toStr)
  const [rows] = await pool.execute(
    `SELECT HOUR(created_at) AS hour, COUNT(*) AS total
     FROM page_views
     WHERE created_at BETWEEN ? AND ?
     GROUP BY HOUR(created_at)
     ORDER BY hour ASC`,
    [from, to],
  )
  const map = new Map(rows.map((r) => [Number(r.hour), Number(r.total)]))
  return Array.from({ length: 24 }, (_, h) => ({ hour: h, total: map.get(h) || 0 }))
}

// ----------------------------------------------------------------------------
// Security aggregations
// ----------------------------------------------------------------------------

export async function getSecurityOverview(fromStr, toStr) {
  const { from, to } = resolveRange(fromStr, toStr)

  const [[totals]] = await pool.execute(
    `SELECT
       COUNT(*) AS total_requests,
       SUM(is_bot) AS bot_requests,
       SUM(threat_type IS NOT NULL) AS threats,
       SUM(status_code >= 400 AND status_code < 500) AS errors_4xx,
       SUM(status_code >= 500) AS errors_5xx,
       COUNT(DISTINCT ip) AS unique_ips
     FROM request_logs
     WHERE created_at BETWEEN ? AND ?`,
    [from, to],
  )

  const [byType] = await pool.execute(
    `SELECT threat_type AS label, COUNT(*) AS total
     FROM request_logs
     WHERE created_at BETWEEN ? AND ? AND threat_type IS NOT NULL
     GROUP BY threat_type
     ORDER BY total DESC`,
    [from, to],
  )

  const [topIps] = await pool.execute(
    `SELECT ip AS label, country, COUNT(*) AS total,
            SUM(threat_type IS NOT NULL) AS threats
     FROM request_logs
     WHERE created_at BETWEEN ? AND ?
     GROUP BY ip, country
     ORDER BY threats DESC, total DESC
     LIMIT 15`,
    [from, to],
  )

  const [timeline] = await pool.execute(
    `SELECT DATE(created_at) AS day,
            COUNT(*) AS requests,
            SUM(threat_type IS NOT NULL) AS threats
     FROM request_logs
     WHERE created_at BETWEEN ? AND ?
     GROUP BY DATE(created_at)
     ORDER BY day ASC`,
    [from, to],
  )

  return {
    range: { from, to },
    totalRequests: Number(totals.total_requests) || 0,
    botRequests: Number(totals.bot_requests) || 0,
    threats: Number(totals.threats) || 0,
    errors4xx: Number(totals.errors_4xx) || 0,
    errors5xx: Number(totals.errors_5xx) || 0,
    uniqueIps: Number(totals.unique_ips) || 0,
    byType: byType.map((r) => ({ label: r.label, total: Number(r.total) })),
    topIps: topIps.map((r) => ({
      ip: r.label,
      country: r.country,
      total: Number(r.total),
      threats: Number(r.threats),
    })),
    timeline: timeline.map((r) => ({
      day: r.day instanceof Date ? r.day.toISOString().slice(0, 10) : String(r.day),
      requests: Number(r.requests),
      threats: Number(r.threats),
    })),
  }
}

export async function getSecurityEvents({ page = 1, limit = 50, type, ip, from, to } = {}) {
  const range = resolveRange(from, to)
  const where = ['created_at BETWEEN ? AND ?']
  const params = [range.from, range.to]

  if (type) {
    where.push('threat_type = ?')
    params.push(type)
  } else {
    where.push('threat_type IS NOT NULL')
  }
  if (ip) {
    where.push('ip = ?')
    params.push(ip)
  }

  const whereSql = where.join(' AND ')
  const offset = (Math.max(1, Number(page)) - 1) * Number(limit)

  const [rows] = await pool.execute(
    `SELECT id, ip, method, path, status_code, user_agent, threat_type, country, created_at
     FROM request_logs
     WHERE ${whereSql}
     ORDER BY created_at DESC
     LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
    params,
  )
  const [[{ total }]] = await pool.execute(
    `SELECT COUNT(*) AS total FROM request_logs WHERE ${whereSql}`,
    params,
  )

  return {
    events: rows,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: Number(total),
      totalPages: Math.ceil(Number(total) / Number(limit)),
    },
  }
}

export async function getThreatTypes() {
  const [rows] = await pool.execute(
    'SELECT DISTINCT threat_type FROM request_logs WHERE threat_type IS NOT NULL ORDER BY threat_type',
  )
  return rows.map((r) => r.threat_type)
}

// ----------------------------------------------------------------------------
// Rollup + retention (90 days of raw data, permanent daily aggregates)
// ----------------------------------------------------------------------------

export async function rollupAndPurge() {
  try {
    await pool.execute(
      `INSERT INTO daily_stats (day, total_views, unique_visitors)
       SELECT DATE(created_at), COUNT(*), COUNT(DISTINCT visitor_id)
       FROM page_views
       GROUP BY DATE(created_at)
       ON DUPLICATE KEY UPDATE
         total_views = VALUES(total_views),
         unique_visitors = VALUES(unique_visitors)`,
    )
    await pool.execute(
      `INSERT INTO daily_stats (day, api_requests, bot_requests, threats)
       SELECT DATE(created_at), COUNT(*), SUM(is_bot), SUM(threat_type IS NOT NULL)
       FROM request_logs
       GROUP BY DATE(created_at)
       ON DUPLICATE KEY UPDATE
         api_requests = VALUES(api_requests),
         bot_requests = VALUES(bot_requests),
         threats = VALUES(threats)`,
    )
    const [pv] = await pool.execute(
      'DELETE FROM page_views WHERE created_at < (NOW() - INTERVAL 90 DAY)',
    )
    const [rl] = await pool.execute(
      'DELETE FROM request_logs WHERE created_at < (NOW() - INTERVAL 90 DAY)',
    )
    console.log(`[analytics] rollup ok; purged ${pv.affectedRows} page_views, ${rl.affectedRows} request_logs`)
  } catch (error) {
    console.error('rollupAndPurge error:', error.message)
  }
}
