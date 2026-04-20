import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import {
  createInscricao,
  findResponsavelByEmail,
  findResponsavelByCodigo,
  listInscricoes,
  deleteInscricao,
} from '../inscricoesService.js'
import { notifyNewInscricao } from '../notifyTelegram.js'
import { sendInscricaoConfirmation } from '../sendEmail.js'

const router = Router()

const inscricaoLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
})

function validate(payload) {
  const errors = []
  if (!payload || typeof payload !== 'object') {
    return ['Payload inválido']
  }
  if (!payload.nome?.trim()) errors.push('Nome do responsável é obrigatório')
  if (!payload.email?.trim()) errors.push('E-mail é obrigatório')
  if (!payload.telefone?.trim()) errors.push('Telefone é obrigatório')
  if (!Array.isArray(payload.participantes) || payload.participantes.length === 0) {
    errors.push('Inclua ao menos um participante')
  } else {
    payload.participantes.forEach((p, i) => {
      if (!p?.nome?.trim()) errors.push(`Nome do participante #${i + 1} é obrigatório`)
    })
  }
  return errors
}

router.post('/', inscricaoLimiter, async (req, res, next) => {
  try {
    const errors = validate(req.body)
    if (errors.length) return res.status(400).json({ errors })

    const existing = await findResponsavelByEmail(req.body.email.trim().toLowerCase())
    if (existing) {
      return res.status(409).json({
        message: 'Já existe uma inscrição com este e-mail.',
        codigo: existing.codigo,
      })
    }

    const created = await createInscricao({
      nome: req.body.nome.trim(),
      email: req.body.email.trim().toLowerCase(),
      telefone: req.body.telefone.trim(),
      paroquia: req.body.paroquia?.trim() || null,
      endereco: req.body.endereco?.trim() || null,
      comoSoube: req.body.comoSoube?.trim() || null,
      conhecePagina: Boolean(req.body.conhecePagina),
      ip: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
      participantes: req.body.participantes.map((p) => ({
        nome: String(p.nome ?? '').trim(),
        idade: p.idade != null && p.idade !== '' ? Number(p.idade) : null,
        paroquia: p.paroquia?.trim() || null,
        movimento: p.movimento?.trim() || null,
        restricaoAlimentar: p.restricaoAlimentar?.trim() || null,
        santoDevocao: p.santoDevocao?.trim() || null,
        tamanhoCamiseta: p.tamanhoCamiseta?.trim() || null,
        participaDesfile: Boolean(p.participaDesfile),
        autorizaImagem: p.autorizaImagem !== false,
        eResponsavel: Boolean(p.eResponsavel),
      })),
    })

    notifyNewInscricao(created).catch(() => {})
    sendInscricaoConfirmation(created).catch(() => {})

    res.status(201).json(created)
  } catch (err) {
    next(err)
  }
})

router.get('/lookup', async (req, res, next) => {
  try {
    const codigo = String(req.query.codigo ?? '').trim().toUpperCase()
    if (!codigo) return res.status(400).json({ message: 'Informe o código' })
    const resp = await findResponsavelByCodigo(codigo)
    if (!resp) return res.status(404).json({ message: 'Código não encontrado' })
    res.json(resp)
  } catch (err) {
    next(err)
  }
})

router.get('/', async (_req, res, next) => {
  try {
    res.json(await listInscricoes())
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    await deleteInscricao(Number(req.params.id))
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

export default router
