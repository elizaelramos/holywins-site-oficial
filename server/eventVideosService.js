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
// applay360 serve arquivos .mov, .mp4 ou .m3u8 dependendo do upload.
const VIDEO_FILE_PATTERN = 'https?:\\/\\/[^"\'\\s<>]+\\.(?:mp4|mov|m3u8|webm)[^"\'\\s<>]*'
const VIDEO_FILE_TEST_RE = new RegExp(VIDEO_FILE_PATTERN, 'i')
const VIDEO_FILE_GLOBAL_RE = new RegExp(VIDEO_FILE_PATTERN, 'gi')
const NEXT_DATA_RE = /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i

export function isApplayUrl(url) {
  if (!url) return false
  return APPLAY_URL_RE.test(url) || APPLAY_APP_URL_RE.test(url)
}

// Procura recursivamente por uma URL de vídeo dentro do JSON da página.
function findVideoUrlInData(node) {
  if (!node) return null
  if (typeof node === 'string') {
    return VIDEO_FILE_TEST_RE.test(node) ? node : null
  }
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findVideoUrlInData(item)
      if (found) return found
    }
    return null
  }
  if (typeof node === 'object') {
    // Prioriza campos típicos de arquivo de vídeo.
    for (const key of ['url', 'file', 'src', 'video_url']) {
      const val = node[key]
      if (typeof val === 'string' && VIDEO_FILE_TEST_RE.test(val)) return val
    }
    for (const val of Object.values(node)) {
      const found = findVideoUrlInData(val)
      if (found) return found
    }
  }
  return null
}

export async function extractMp4FromApplay(url) {
  const resp = await fetch(url, {
    redirect: 'follow',
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml',
    },
  })
  if (!resp.ok) {
    throw new Error(`Falha ao acessar o link do vídeo (HTTP ${resp.status})`)
  }
  const html = await resp.text()

  // 1) Tenta extrair via __NEXT_DATA__ (app Next.js do applay360),
  //    selecionando o vídeo pelo parâmetro ?v= quando presente.
  const nextMatch = html.match(NEXT_DATA_RE)
  if (nextMatch) {
    try {
      const data = JSON.parse(nextMatch[1])
      const videos = data?.props?.pageProps?.data?.videos
      if (Array.isArray(videos) && videos.length) {
        let wanted = videos
        try {
          const vParam = new URL(url).searchParams.get('v')
          if (vParam) {
            const picked = videos.find((v) => String(v?.id) === vParam)
            if (picked) wanted = [picked]
          }
        } catch {
          // URL sem query param utilizável; usa todos os vídeos.
        }
        const fromVideos = findVideoUrlInData(wanted)
        if (fromVideos) return fromVideos
      }
      const fromProps = findVideoUrlInData(data?.props)
      if (fromProps) return fromProps
    } catch {
      // JSON inesperado; cai no fallback por regex abaixo.
    }
  }

  // 2) Fallback: procura qualquer URL de vídeo no HTML bruto.
  const matches = html.match(VIDEO_FILE_GLOBAL_RE)
  if (matches && matches.length) {
    const unique = [...new Set(matches)]
    unique.sort((a, b) => b.length - a.length)
    return unique[0]
  }

  throw new Error('Não foi possível localizar a URL do vídeo na página do applay360.')
}

export const VideoStatus = { PENDENTE: STATUS_PENDENTE, PRONTO: STATUS_PRONTO }
