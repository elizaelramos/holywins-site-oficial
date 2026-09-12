import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { createInscricao, findResponsavelByCodigo, listInscricoes, deleteInscricao } from '../inscricoesService.js'
import { notifyNewInscricao } from '../notifyTelegram.js'
import { sendInscricaoConfirmation } from '../sendEmail.js'
import { requireAuth } from './auth.js'

const router = Router()
const inscricaoLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' },
})

export function validate(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return ['Dados inválidos']
  const errors = []
  const text = (value, label, max, required = false) => {
    if (value == null || value === '') {
      if (required) errors.push(label + ' é obrigatório')
    } else if (typeof value !== 'string' || value.length > max || (required && !value.trim())) {
      errors.push(label + ' inválido')
    }
  }
  text(payload.nome, 'Nome', 255, true)
  text(payload.telefone, 'Telefone', 40, true)
  text(payload.email, 'E-mail', 255)
  if (typeof payload.email === 'string' && payload.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email.trim())) errors.push('Confira o e-mail informado')
  for (const key of ['paroquia', 'comoSoube']) text(payload[key], key, 255)
  text(payload.endereco, 'Endereço', 500)
  if (!Array.isArray(payload.participantes) || !payload.participantes.length) {
    errors.push('Inclua ao menos uma pessoa que vai participar')
  } else {
    payload.participantes.forEach((p, i) => {
      if (!p || typeof p !== 'object' || Array.isArray(p)) {
        errors.push('Participante ' + (i + 1) + ' inválido')
        return
      }
      text(p.nome, 'Nome da pessoa ' + (i + 1), 255, true)
      if (typeof p.idade !== 'number' || !Number.isInteger(p.idade) || p.idade < 0 || p.idade > 120) errors.push('Idade inválida para a pessoa ' + (i + 1))
      for (const key of ['paroquia', 'movimento', 'restricaoAlimentar', 'santoDevocao']) text(p[key], key, 255)
      text(p.tamanhoCamiseta, 'Camiseta', 10)
      for (const key of ['participaDesfile', 'autorizaImagem', 'eResponsavel']) {
        if (p[key] != null && typeof p[key] !== 'boolean') errors.push(key + ' inválido')
      }
    })
    const temCrianca = payload.participantes.some((p) => Number.isInteger(p?.idade) && p.idade >= 0 && p.idade <= 10)
    const temAdulto = payload.participantes.some((p) => Number.isInteger(p?.idade) && p.idade >= 18 && p.idade <= 120)
    if (temCrianca && !temAdulto) errors.push('Crianças de até 10 anos precisam de um acompanhante adulto (18 anos ou mais) inscrito neste mesmo cadastro')
  }
  return errors
}

const inscricoesAbertas = () => (process.env.INSCRICOES_ABERTAS ?? process.env.VITE_INSCRICOES_ABERTAS) === 'true'

router.get('/status', (_req, res) => res.json({ abertas: inscricoesAbertas() }))

router.post('/', inscricaoLimiter, async (req, res, next) => {
  try {
    if (!inscricoesAbertas()) return res.status(403).json({ message: 'As inscrições ainda não estão abertas.' })
    const errors = validate(req.body)
    if (errors.length) return res.status(400).json({ errors })

    const created = await createInscricao({
      nome: req.body.nome.trim(),
      email: req.body.email?.trim().toLowerCase() || '',
      telefone: req.body.telefone.trim(),
      paroquia: req.body.paroquia?.trim() || null,
      endereco: req.body.endereco?.trim() || null,
      comoSoube: req.body.comoSoube?.trim() || null,
      conhecePagina: Boolean(req.body.conhecePagina),
      ip: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
      participantes: req.body.participantes.map((p) => ({
        nome: p.nome.trim(),
        idade: p.idade != null && p.idade !== '' ? p.idade : null,
        paroquia: p.paroquia?.trim() || null,
        movimento: p.movimento?.trim() || null,
        restricaoAlimentar: p.restricaoAlimentar?.trim() || null,
        santoDevocao: p.santoDevocao?.trim() || null,
        tamanhoCamiseta: p.tamanhoCamiseta?.trim() || null,
        participaDesfile: p.participaDesfile === true,
        autorizaImagem: p.autorizaImagem === true,
        eResponsavel: p.eResponsavel === true,
      })),
    })

    notifyNewInscricao(created).catch(() => {})
    if (created.email) sendInscricaoConfirmation(created).catch(() => {})
    res.status(201).json(created)
  } catch (err) {
    next(err)
  }
})

router.get('/lookup', requireAuth, async (req, res, next) => {
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

router.get('/', requireAuth, async (_req, res, next) => {
  try {
    res.json(await listInscricoes())
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    await deleteInscricao(Number(req.params.id))
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

export default router
