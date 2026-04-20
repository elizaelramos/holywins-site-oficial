import { pool } from './db.js'

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function generateCodigo() {
  let code = 'HW-'
  for (let i = 0; i < 4; i++) code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  return code
}

async function uniqueCodigo(conn) {
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = generateCodigo()
    const [rows] = await conn.query('SELECT id FROM inscricoes_responsaveis WHERE codigo = ? LIMIT 1', [code])
    if (rows.length === 0) return code
  }
  throw new Error('Não foi possível gerar um código único para a inscrição')
}

function normalizeParticipante(row) {
  return {
    id: row.id,
    nome: row.nome,
    idade: row.idade,
    paroquia: row.paroquia,
    movimento: row.movimento,
    restricaoAlimentar: row.restricao_alimentar,
    santoDevocao: row.santo_devocao,
    tamanhoCamiseta: row.tamanho_camiseta,
    participaDesfile: Boolean(row.participa_desfile),
    autorizaImagem: Boolean(row.autoriza_imagem),
    eResponsavel: Boolean(row.e_responsavel),
  }
}

function normalizeResponsavel(row, participantes = []) {
  return {
    id: row.id,
    codigo: row.codigo,
    nome: row.nome,
    email: row.email,
    telefone: row.telefone,
    paroquia: row.paroquia,
    endereco: row.endereco,
    comoSoube: row.como_soube,
    conhecePagina: Boolean(row.conhece_pagina),
    createdAt: row.created_at,
    participantes,
  }
}

export async function findResponsavelByEmail(email) {
  const [rows] = await pool.execute(
    'SELECT * FROM inscricoes_responsaveis WHERE email = ? LIMIT 1',
    [email],
  )
  return rows[0] ?? null
}

export async function findResponsavelByCodigo(codigo) {
  const [rows] = await pool.execute(
    'SELECT * FROM inscricoes_responsaveis WHERE codigo = ? LIMIT 1',
    [codigo],
  )
  if (!rows[0]) return null
  const [parts] = await pool.execute(
    'SELECT * FROM inscricoes_participantes WHERE responsavel_id = ? ORDER BY id ASC',
    [rows[0].id],
  )
  return normalizeResponsavel(rows[0], parts.map(normalizeParticipante))
}

export async function createInscricao(data) {
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    const codigo = await uniqueCodigo(conn)
    const [res] = await conn.execute(
      `INSERT INTO inscricoes_responsaveis
        (codigo, nome, email, telefone, paroquia, endereco, como_soube, conhece_pagina, ip, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        codigo,
        data.nome,
        data.email,
        data.telefone,
        data.paroquia ?? null,
        data.endereco ?? null,
        data.comoSoube ?? null,
        data.conhecePagina ? 1 : 0,
        data.ip ?? null,
        data.userAgent ?? null,
      ],
    )
    const responsavelId = res.insertId

    for (const p of data.participantes ?? []) {
      await conn.execute(
        `INSERT INTO inscricoes_participantes
          (responsavel_id, nome, idade, paroquia, movimento, restricao_alimentar, santo_devocao, tamanho_camiseta, participa_desfile, autoriza_imagem, e_responsavel)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          responsavelId,
          p.nome,
          p.idade ?? null,
          p.paroquia ?? null,
          p.movimento ?? null,
          p.restricaoAlimentar ?? null,
          p.santoDevocao ?? null,
          p.tamanhoCamiseta ?? null,
          p.participaDesfile ? 1 : 0,
          p.autorizaImagem === false ? 0 : 1,
          p.eResponsavel ? 1 : 0,
        ],
      )
    }

    await conn.commit()
    return await findResponsavelByCodigo(codigo)
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

export async function listInscricoes() {
  const [responsaveis] = await pool.execute(
    'SELECT * FROM inscricoes_responsaveis ORDER BY created_at DESC',
  )
  if (!responsaveis.length) return []
  const ids = responsaveis.map((r) => r.id)
  const [participantes] = await pool.query(
    'SELECT * FROM inscricoes_participantes WHERE responsavel_id IN (?) ORDER BY id ASC',
    [ids],
  )
  const byResp = new Map()
  for (const p of participantes) {
    if (!byResp.has(p.responsavel_id)) byResp.set(p.responsavel_id, [])
    byResp.get(p.responsavel_id).push(normalizeParticipante(p))
  }
  return responsaveis.map((r) => normalizeResponsavel(r, byResp.get(r.id) ?? []))
}

export async function deleteInscricao(id) {
  await pool.execute('DELETE FROM inscricoes_responsaveis WHERE id = ?', [id])
}

export function totalParticipantes(inscricoes) {
  return inscricoes.reduce((sum, r) => sum + r.participantes.length, 0)
}
