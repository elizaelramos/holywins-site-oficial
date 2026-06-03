import {
  detectBot,
  classifyThreat,
  geoLookup,
  recordRequest,
} from '../analyticsService.js'

// Paths we don't want to log (noise / would create a feedback loop)
const IGNORE_EXACT = new Set(['/health', '/api/analytics/collect'])

// Express middleware that records every request hitting the API for traffic
// and security monitoring. Recording is fire-and-forget so it never delays
// or breaks the actual response.
export default function requestLogger(req, res, next) {
  const start = process.hrtime.bigint()

  res.on('finish', () => {
    try {
      const path = (req.originalUrl || req.url || '').split('?')[0]
      if (IGNORE_EXACT.has(path)) return

      const ua = req.headers['user-agent'] || ''
      const isBot = detectBot(ua)
      const status = res.statusCode
      const threat = classifyThreat(path, status, isBot)
      const { country } = geoLookup(req.ip)
      const elapsedMs = Number(process.hrtime.bigint() - start) / 1e6

      void recordRequest({
        ip: req.ip,
        method: req.method,
        path,
        status_code: status,
        response_time_ms: Math.round(elapsedMs),
        user_agent: ua,
        referer: req.headers['referer'] || req.headers['referrer'] || null,
        is_bot: isBot,
        threat_type: threat,
        country,
      })
    } catch (error) {
      console.error('requestLogger error:', error.message)
    }
  })

  next()
}
