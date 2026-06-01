import { pool } from './db.js'

const STATUS_PENDENTE = 'pendente'
const STATUS_PRONTO = 'pronto'

function normalize(row) {
  return {
    id: row.id,
    codigo: row.codigo,
    senha: row.senha,
    sourceUrl: row.source_url,
    videoUrl: row.video_url,
    status: row.status,
    observacao: row.observacao,
    unlockCount: row.unlock_count,
    lastUnlockedAt: row.last_unlocked_at,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function listVideos() {
  const [rows] = await pool.execute(
    'SELECT * FROM event_videos ORDER BY codigo ASC',
  )
  return rows.map(normalize)
}

export async function findByCodigo(codigo) {
  const [rows] = await pool.execute(
    'SELECT * FROM event_videos WHERE codigo = ? LIMIT 1',
    [codigo],
  )
  return rows[0] ? normalize(rows[0]) : null
}

export async function findById(id) {
  const [rows] = await pool.execute(
    'SELECT * FROM event_videos WHERE id = ? LIMIT 1',
    [id],
  )
  return rows[0] ? normalize(rows[0]) : null
}

export async function createVideo({ codigo, senha, observacao, createdBy }) {
  const [res] = await pool.execute(
    `INSERT INTO event_videos (codigo, senha, observacao, status, created_by)
     VALUES (?, ?, ?, ?, ?)`,
    [codigo, senha, observacao ?? null, STATUS_PENDENTE, createdBy ?? null],
  )
  return findById(res.insertId)
}

export async function updateVideo(id, fields) {
  const allowed = ['codigo', 'senha', 'observacao', 'source_url', 'video_url', 'status']
  const sets = []
  const values = []
  for (const key of allowed) {
    if (key in fields) {
      sets.push(`${key} = ?`)
      values.push(fields[key])
    }
  }
  if (!sets.length) return findById(id)
  values.push(id)
  await pool.execute(`UPDATE event_videos SET ${sets.join(', ')} WHERE id = ?`, values)
  return findById(id)
}

export async function deleteVideo(id) {
  await pool.execute('DELETE FROM event_videos WHERE id = ?', [id])
}

export async function registerUnlock(id) {
  await pool.execute(
    'UPDATE event_videos SET unlock_count = unlock_count + 1, last_unlocked_at = NOW() WHERE id = ?',
    [id],
  )
}

const APPLAY_URL_RE = /^https?:\/\/(?:www\.)?applay360\.com\//i
const APPLAY_APP_URL_RE = /^https?:\/\/(?:[a-z0-9-]+\.)*applay360\.com\//i
const MP4_RE = /https?:\/\/[^"'\s<>]+\.mp4[^"'\s<>]*/gi

export function isApplayUrl(url) {
  if (!url) return false
  return APPLAY_URL_RE.test(url) || APPLAY_APP_URL_RE.test(url)
}

export async function extractMp4FromApplay(url) {
  const resp = await fetch(url, {
    redirect: 'follow',
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; HolywinsBot/1.0)',
      Accept: 'text/html,application/xhtml+xml',
    },
  })
  if (!resp.ok) {
    throw new Error(`Falha ao acessar o link do vídeo (HTTP ${resp.status})`)
  }
  const html = await resp.text()
  const matches = html.match(MP4_RE)
  if (!matches || matches.length === 0) {
    throw new Error('Não foi possível localizar a URL do vídeo na página do applay360.')
  }
  // Prefer the longest match (usually the most specific signed URL); dedupe first.
  const unique = [...new Set(matches)]
  unique.sort((a, b) => b.length - a.length)
  return unique[0]
}

export const VideoStatus = { PENDENTE: STATUS_PENDENTE, PRONTO: STATUS_PRONTO }
