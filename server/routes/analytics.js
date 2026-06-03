import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { requireAdmin } from './auth.js'
import {
  parseUA,
  detectBot,
  geoLookup,
  recordPageView,
  getOverview,
  getTimeseries,
  getTopPages,
  getReferrers,
  getDevices,
  getBrowsers,
  getCountries,
  getPeakHours,
  getSecurityOverview,
  getSecurityEvents,
  getThreatTypes,
} from '../analyticsService.js'

const router = Router()

const collectLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
})

// ---------- Público: beacon de page view ----------
// POST /api/analytics/collect
router.post('/collect', collectLimiter, async (req, res) => {
  try {
    const body = req.body || {}
    const ua = req.headers['user-agent'] || ''
    const { device_type, browser, os } = parseUA(ua)
    const { country, city } = geoLookup(req.ip)

    void recordPageView({
      visitor_id: typeof body.visitorId === 'string' ? body.visitorId.slice(0, 36) : null,
      session_id: typeof body.sessionId === 'string' ? body.sessionId.slice(0, 36) : null,
      path: typeof body.path === 'string' ? body.path : '/',
      referrer: typeof body.referrer === 'string' ? body.referrer : null,
      utm_source: body.utm?.source ?? null,
      utm_medium: body.utm?.medium ?? null,
      utm_campaign: body.utm?.campaign ?? null,
      user_agent: ua,
      device_type,
      browser,
      os,
      language: typeof body.language === 'string' ? body.language.slice(0, 20) : null,
      ip: req.ip,
      country,
      city,
      is_bot: detectBot(ua),
    })

    res.status(204).end()
  } catch (error) {
    console.error('collect error:', error.message)
    res.status(204).end()
  }
})

// ---------- Admin only ----------
router.use(requireAdmin)

router.get('/overview', async (req, res) => {
  try {
    res.json(await getOverview(req.query.from, req.query.to))
  } catch (e) {
    console.error('overview error:', e)
    res.status(500).json({ error: 'Erro ao carregar overview' })
  }
})

router.get('/timeseries', async (req, res) => {
  try {
    res.json(await getTimeseries(req.query.from, req.query.to))
  } catch (e) {
    console.error('timeseries error:', e)
    res.status(500).json({ error: 'Erro ao carregar série temporal' })
  }
})

// Combined breakdowns to reduce round-trips from the dashboard
router.get('/breakdowns', async (req, res) => {
  const { from, to } = req.query
  try {
    const [topPages, referrers, devices, browsers, countries, hours] = await Promise.all([
      getTopPages(from, to),
      getReferrers(from, to),
      getDevices(from, to),
      getBrowsers(from, to),
      getCountries(from, to),
      getPeakHours(from, to),
    ])
    res.json({ topPages, referrers, devices, browsers, countries, hours })
  } catch (e) {
    console.error('breakdowns error:', e)
    res.status(500).json({ error: 'Erro ao carregar detalhamentos' })
  }
})

router.get('/security/overview', async (req, res) => {
  try {
    res.json(await getSecurityOverview(req.query.from, req.query.to))
  } catch (e) {
    console.error('security overview error:', e)
    res.status(500).json({ error: 'Erro ao carregar segurança' })
  }
})

router.get('/security/events', async (req, res) => {
  try {
    const { page = 1, limit = 50, type, ip, from, to } = req.query
    res.json(await getSecurityEvents({ page, limit, type, ip, from, to }))
  } catch (e) {
    console.error('security events error:', e)
    res.status(500).json({ error: 'Erro ao carregar eventos' })
  }
})

router.get('/security/threat-types', async (_req, res) => {
  try {
    res.json(await getThreatTypes())
  } catch (e) {
    console.error('threat types error:', e)
    res.status(500).json({ error: 'Erro ao carregar tipos' })
  }
})

// CSV export for reports
router.get('/export', async (req, res) => {
  const { type = 'timeseries', from, to } = req.query
  try {
    let rows = []
    let headers = []
    if (type === 'timeseries') {
      rows = await getTimeseries(from, to)
      headers = ['day', 'views', 'visitors']
    } else if (type === 'top-pages') {
      rows = await getTopPages(from, to)
      headers = ['label', 'total']
    } else if (type === 'referrers') {
      rows = await getReferrers(from, to)
      headers = ['label', 'total']
    } else if (type === 'countries') {
      rows = await getCountries(from, to)
      headers = ['label', 'total']
    } else if (type === 'devices') {
      rows = await getDevices(from, to)
      headers = ['label', 'total']
    } else if (type === 'security-events') {
      const data = await getSecurityEvents({ page: 1, limit: 5000, from, to })
      rows = data.events
      headers = ['created_at', 'ip', 'country', 'method', 'path', 'status_code', 'threat_type', 'user_agent']
    } else {
      return res.status(400).json({ error: 'Tipo de exportação inválido' })
    }

    const escape = (v) => {
      const s = v === null || v === undefined ? '' : String(v)
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
    }
    const lines = [headers.join(',')]
    for (const row of rows) lines.push(headers.map((h) => escape(row[h])).join(','))
    const csv = '﻿' + lines.join('\n')

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="holywins-${type}.csv"`)
    res.send(csv)
  } catch (e) {
    console.error('export error:', e)
    res.status(500).json({ error: 'Erro ao exportar' })
  }
})

export default router
