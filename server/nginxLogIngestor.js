import fs from 'fs'
import { pool } from './db.js'
import {
  detectBot,
  classifyThreat,
  geoLookup,
  recordRequestsBatch,
} from './analyticsService.js'

const LOG_PATH = process.env.NGINX_ACCESS_LOG || '/var/log/nginx/holywinscorumba_access.log'
const INTERVAL_MS = Number(process.env.NGINX_INGEST_INTERVAL_MS || 60000)
const STATE_NAME = 'nginx'

// Static assets we don't store unless they are flagged as a threat (keeps the
// table lean — these are high-volume and not security-relevant).
const STATIC_ASSET_RE = /\.(?:js|css|png|jpe?g|gif|ico|svg|woff2?|ttf|eot|map|jfif|webp|avif|mp4|webm)$/i

// Combined log format:
// 1.2.3.4 - - [03/Jun/2026:13:29:45 +0000] "GET /path HTTP/1.1" 200 123 "ref" "ua"
const LINE_RE =
  /^(\S+) \S+ \S+ \[([^\]]+)\] "(\S+)\s+(\S*?)\s*(?:HTTP\/[\d.]+)?" (\d{3}) (\S+) "([^"]*)" "([^"]*)"/

const MONTHS = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
}

// Parse nginx time_local "03/Jun/2026:13:29:45 +0000" -> 'YYYY-MM-DD HH:mm:ss' (UTC)
function parseTimeLocal(str) {
  const m = /^(\d{2})\/(\w{3})\/(\d{4}):(\d{2}):(\d{2}):(\d{2}) ([+-]\d{4})$/.exec(str)
  if (!m) return null
  const [, dd, mon, yyyy, hh, mi, ss, tz] = m
  const month = MONTHS[mon]
  if (month === undefined) return null
  const tzSign = tz[0] === '-' ? -1 : 1
  const tzMin = tzSign * (Number(tz.slice(1, 3)) * 60 + Number(tz.slice(3, 5)))
  const utc = Date.UTC(Number(yyyy), month, Number(dd), Number(hh), Number(mi), Number(ss)) - tzMin * 60000
  return new Date(utc).toISOString().slice(0, 19).replace('T', ' ')
}

export function parseCombinedLine(line) {
  const m = LINE_RE.exec(line)
  if (!m) return null
  const [, ip, timeLocal, method, rawPath, status, , referer, ua] = m
  const path = (rawPath || '/').split('?')[0]
  return {
    ip,
    created_at: parseTimeLocal(timeLocal),
    method,
    path: path || '/',
    status_code: Number(status),
    referer: referer && referer !== '-' ? referer : null,
    user_agent: ua && ua !== '-' ? ua : null,
  }
}

async function loadState() {
  const [rows] = await pool.execute(
    'SELECT inode, byte_offset FROM ingest_state WHERE name = ?',
    [STATE_NAME],
  )
  if (rows.length === 0) return { inode: null, offset: 0 }
  return { inode: rows[0].inode != null ? Number(rows[0].inode) : null, offset: Number(rows[0].byte_offset) || 0 }
}

async function saveState(inode, offset) {
  await pool.execute(
    `INSERT INTO ingest_state (name, inode, byte_offset) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE inode = VALUES(inode), byte_offset = VALUES(byte_offset)`,
    [STATE_NAME, inode, offset],
  )
}

// Read new bytes from `start`; returns { buffer, end } where end is the byte
// position of the last newline (so we never process a partial trailing line).
function readNewBytes(stat, start) {
  return new Promise((resolve, reject) => {
    if (stat.size <= start) return resolve({ text: '', end: start })
    const chunks = []
    const stream = fs.createReadStream(LOG_PATH, { start, end: stat.size - 1 })
    stream.on('data', (c) => chunks.push(c))
    stream.on('error', reject)
    stream.on('end', () => {
      const buf = Buffer.concat(chunks)
      const lastNl = buf.lastIndexOf(0x0a)
      if (lastNl === -1) return resolve({ text: '', end: start })
      resolve({ text: buf.subarray(0, lastNl).toString('utf8'), end: start + lastNl + 1 })
    })
  })
}

function buildRow(parsed) {
  const isBot = detectBot(parsed.user_agent || '')
  const threat = classifyThreat(parsed.path, parsed.status_code, isBot)
  // Drop high-volume static assets unless they're flagged as a threat
  if (!threat && STATIC_ASSET_RE.test(parsed.path)) return null
  const { country } = geoLookup(parsed.ip)
  return {
    ip: parsed.ip,
    method: parsed.method,
    path: parsed.path,
    status_code: parsed.status_code,
    response_time_ms: null,
    user_agent: parsed.user_agent,
    referer: parsed.referer,
    is_bot: isBot,
    threat_type: threat,
    country,
    source: 'nginx',
    created_at: parsed.created_at,
  }
}

let disabled = false

async function tick() {
  if (disabled) return
  let stat
  try {
    stat = await fs.promises.stat(LOG_PATH)
  } catch (err) {
    if (err.code === 'EACCES') {
      disabled = true
      console.warn(
        `[nginx-ingest] sem permissão de leitura em ${LOG_PATH}. ` +
        `Rode: sudo usermod -aG adm elizaelramos && pm2 kill && pm2 resurrect. Ingestor desligado.`,
      )
    } else if (err.code === 'ENOENT') {
      console.warn(`[nginx-ingest] arquivo não encontrado: ${LOG_PATH}`)
    } else {
      console.error('[nginx-ingest] stat error:', err.message)
    }
    return
  }

  try {
    const state = await loadState()
    let offset = state.offset
    // Detect rotation (new inode) or truncation (file shrank)
    if (state.inode !== null && state.inode !== stat.ino) offset = 0
    if (stat.size < offset) offset = 0

    const { text, end } = await readNewBytes(stat, offset)
    if (text) {
      const rows = []
      for (const line of text.split('\n')) {
        if (!line) continue
        const parsed = parseCombinedLine(line)
        if (!parsed) continue
        if (parsed.path.startsWith('/api')) continue // dedup: Express already logs these
        const row = buildRow(parsed)
        if (row) rows.push(row)
      }
      // Insert in chunks to keep statements reasonably sized
      for (let i = 0; i < rows.length; i += 500) {
        await recordRequestsBatch(rows.slice(i, i + 500))
      }
      if (rows.length) console.log(`[nginx-ingest] +${rows.length} requisições`)
    }
    await saveState(stat.ino, end)
  } catch (err) {
    console.error('[nginx-ingest] tick error:', err.message)
  }
}

export function startNginxIngestor() {
  console.log(`[nginx-ingest] ativo. Lendo ${LOG_PATH} a cada ${INTERVAL_MS}ms`)
  // Run once shortly after boot, then on the configured interval
  setTimeout(tick, 3000)
  setInterval(tick, INTERVAL_MS)
}
