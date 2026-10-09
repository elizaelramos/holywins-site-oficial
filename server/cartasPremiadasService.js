import fs from 'fs/promises'
import path from 'path'
import sharp from 'sharp'
import { pool } from './db.js'

// Arquivos das cartas ficam fora de /public: só o admin autenticado acessa (via rota da API)
export const UPLOAD_DIR = process.env.CARTAS_UPLOAD_DIR || path.join(process.cwd(), 'server', 'uploads', 'cartas')

// Último instante para envio: fim do dia 31/10/2026 no horário de Corumbá (UTC-4)
export const PRAZO = new Date(process.env.CARTA_PREMIADA_PRAZO || '2026-11-01T04:00:00Z')

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function generateProtocolo() {
  let code = 'CP26-'
  for (let i = 0; i < 6; i++) code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  return code
}

async function uniqueProtocolo(conn) {
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = generateProtocolo()
    const [rows] = await conn.query('SELECT id FROM cartas_premiadas WHERE protocolo = ? LIMIT 1', [code])
    if (rows.length === 0) return code
  }
  throw new Error('Não foi possível gerar um protocolo único para a carta')
}

// Identifica o tipo real pelo conteúdo (não confia na extensão nem no mimetype enviado)
export function detectTipo(buffer) {
  if (buffer.length < 12) return null
  if (buffer.subarray(0, 5).toString('latin1') === '%PDF-') return 'pdf'
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'imagem'
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'imagem'
  if (buffer.subarray(0, 4).toString('latin1') === 'RIFF' && buffer.subarray(8, 12).toString('latin1') === 'WEBP') return 'imagem'
  return null
}

// Imagens são regravadas em JPEG: corrige a rotação do celular, limita o tamanho
// e remove metadados (como a localização GPS da foto).
async function prepararArquivo(file) {
  const tipo = detectTipo(file.buffer)
  if (tipo === 'pdf') return { buffer: file.buffer, mime: 'application/pdf', ext: 'pdf' }
  if (tipo === 'imagem') {
    const buffer = await sharp(file.buffer)
      .rotate()
      .resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer()
    return { buffer, mime: 'image/jpeg', ext: 'jpg' }
  }
  throw Object.assign(new Error('Envie apenas arquivos PDF ou imagens (JPG, PNG ou WEBP).'), { status: 400 })
}

function normalizeArquivo(row) {
  return {
    id: row.id,
    nomeOriginal: row.nome_original,
    mime: row.mime,
    tamanho: row.tamanho,
  }
}

function normalizeCarta(row, arquivos = []) {
  return {
    id: row.id,
    protocolo: row.protocolo,
    nome: row.nome,
    idade: row.idade,
    telefone: row.telefone,
    paroquia: row.paroquia,
    santo: row.santo,
    lida: Boolean(row.lida),
    createdAt: row.created_at,
    arquivos,
  }
}

export async function createCarta(data, files) {
  const preparados = []
  for (const file of files) {
    preparados.push({ ...(await prepararArquivo(file)), nomeOriginal: file.originalname?.slice(0, 255) || null })
  }

  await fs.mkdir(UPLOAD_DIR, { recursive: true })
  const gravados = []
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    const protocolo = await uniqueProtocolo(conn)
    const [res] = await conn.execute(
      `INSERT INTO cartas_premiadas (protocolo, nome, idade, telefone, paroquia, santo, ip, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [protocolo, data.nome, data.idade ?? null, data.telefone, data.paroquia, data.santo ?? null, data.ip ?? null, data.userAgent ?? null],
    )
    const cartaId = res.insertId

    for (const [i, arq] of preparados.entries()) {
      const nomeArquivo = `${protocolo}-${i + 1}.${arq.ext}`
      const destino = path.join(UPLOAD_DIR, nomeArquivo)
      await fs.writeFile(destino, arq.buffer, { flag: 'wx' })
      gravados.push(destino)
      await conn.execute(
        `INSERT INTO cartas_premiadas_arquivos (carta_id, arquivo, nome_original, mime, tamanho, ordem)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [cartaId, nomeArquivo, arq.nomeOriginal, arq.mime, arq.buffer.length, i],
      )
    }

    await conn.commit()
    return await getCarta(cartaId)
  } catch (err) {
    await conn.rollback()
    await Promise.all(gravados.map((f) => fs.unlink(f).catch(() => {})))
    throw err
  } finally {
    conn.release()
  }
}

async function arquivosPorCarta(ids) {
  if (!ids.length) return new Map()
  const [rows] = await pool.query(
    'SELECT * FROM cartas_premiadas_arquivos WHERE carta_id IN (?) ORDER BY ordem ASC, id ASC',
    [ids],
  )
  const map = new Map()
  for (const row of rows) {
    if (!map.has(row.carta_id)) map.set(row.carta_id, [])
    map.get(row.carta_id).push(normalizeArquivo(row))
  }
  return map
}

export async function getCarta(id) {
  const [rows] = await pool.execute('SELECT * FROM cartas_premiadas WHERE id = ? LIMIT 1', [id])
  if (!rows[0]) return null
  const arquivos = await arquivosPorCarta([rows[0].id])
  return normalizeCarta(rows[0], arquivos.get(rows[0].id) ?? [])
}

export async function listCartas() {
  const [rows] = await pool.execute('SELECT * FROM cartas_premiadas ORDER BY created_at DESC, id DESC')
  const arquivos = await arquivosPorCarta(rows.map((r) => r.id))
  return rows.map((r) => normalizeCarta(r, arquivos.get(r.id) ?? []))
}

export async function getArquivo(cartaId, arquivoId) {
  const [rows] = await pool.execute(
    'SELECT * FROM cartas_premiadas_arquivos WHERE id = ? AND carta_id = ? LIMIT 1',
    [arquivoId, cartaId],
  )
  if (!rows[0]) return null
  return { ...normalizeArquivo(rows[0]), caminho: path.join(UPLOAD_DIR, path.basename(rows[0].arquivo)) }
}

export async function setLida(id, lida) {
  await pool.execute('UPDATE cartas_premiadas SET lida = ? WHERE id = ?', [lida ? 1 : 0, id])
}

export async function deleteCarta(id) {
  const [rows] = await pool.execute('SELECT arquivo FROM cartas_premiadas_arquivos WHERE carta_id = ?', [id])
  await pool.execute('DELETE FROM cartas_premiadas WHERE id = ?', [id])
  await Promise.all(rows.map((r) => fs.unlink(path.join(UPLOAD_DIR, path.basename(r.arquivo))).catch(() => {})))
}
