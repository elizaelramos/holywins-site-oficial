import { Router } from 'express'
import multer from 'multer'
import rateLimit from 'express-rate-limit'
import { PRAZO, createCarta, listCartas, getCarta, getArquivo, setLida, deleteCarta } from '../cartasPremiadasService.js'
import { notifyNewCarta } from '../notifyTelegram.js'
import { requireAuth } from './auth.js'

const router = Router()

const MAX_ARQUIVOS = 4
const MAX_TAMANHO = 10 * 1024 * 1024 // 10MB por arquivo

const envioLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' },
})

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_TAMANHO, files: MAX_ARQUIVOS, fields: 10, fieldSize: 1024 },
})

function receberArquivos(req, res, next) {
  upload.array('arquivos', MAX_ARQUIVOS)(req, res, (err) => {
    if (!err) return next()
    if (err instanceof multer.MulterError) {
      console.warn('[cartas-premiadas] upload recusado:', err.code, err.field ?? '')
      const msg = err.code === 'LIMIT_FILE_SIZE'
        ? 'Cada arquivo pode ter no máximo 10 MB.'
        : err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE'
          ? `Envie no máximo ${MAX_ARQUIVOS} arquivos.`
          : 'Não foi possível receber os arquivos.'
      return res.status(400).json({ message: msg })
    }
    next(err)
  })
}

export function validate(body, files) {
  const errors = []
  const text = (value, label, max, required = false) => {
    if (value == null || value === '') {
      if (required) errors.push(label + ' é obrigatório')
    } else if (typeof value !== 'string' || value.length > max || (required && !value.trim())) {
      errors.push(label + ' inválido')
    }
  }
  text(body.nome, 'Nome', 255, true)
  text(body.telefone, 'Telefone', 40, true)
  text(body.paroquia, 'Paróquia / comunidade', 255, true)
  text(body.santo, 'Santo(a) escolhido(a)', 255)
  if (body.idade != null && body.idade !== '') {
    const idade = Number(body.idade)
    if (!Number.isInteger(idade) || idade < 0 || idade > 120) errors.push('Idade inválida')
  }
  if (!files?.length) errors.push('Anexe a sua carta (PDF ou imagem)')
  return errors
}

const recebendo = () => Date.now() < PRAZO.getTime()

router.get('/status', (_req, res) => res.json({ abertas: recebendo(), prazo: PRAZO.toISOString() }))

router.post('/', envioLimiter, receberArquivos, async (req, res, next) => {
  try {
    if (!recebendo()) return res.status(403).json({ message: 'O prazo para envio das cartas foi encerrado.' })
    const errors = validate(req.body, req.files)
    if (errors.length) return res.status(400).json({ errors })

    const carta = await createCarta(
      {
        nome: req.body.nome.trim(),
        idade: req.body.idade != null && req.body.idade !== '' ? Number(req.body.idade) : null,
        telefone: req.body.telefone.trim(),
        paroquia: req.body.paroquia.trim(),
        santo: req.body.santo?.trim() || null,
        ip: req.ip,
        userAgent: req.headers['user-agent'] ?? null,
      },
      req.files,
    )

    notifyNewCarta(carta).catch(() => {})
    res.status(201).json({
      protocolo: carta.protocolo,
      nome: carta.nome,
      santo: carta.santo,
      createdAt: carta.createdAt,
      arquivos: carta.arquivos.length,
    })
  } catch (err) {
    if (err.status === 400) return res.status(400).json({ message: err.message })
    next(err)
  }
})

router.get('/', requireAuth, async (_req, res, next) => {
  try {
    res.json(await listCartas())
  } catch (err) {
    next(err)
  }
})

router.get('/:id/arquivos/:arquivoId', requireAuth, async (req, res, next) => {
  try {
    const arquivo = await getArquivo(Number(req.params.id), Number(req.params.arquivoId))
    if (!arquivo) return res.status(404).json({ message: 'Arquivo não encontrado' })
    res.setHeader('Content-Type', arquivo.mime)
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('Cache-Control', 'private, no-store')
    res.sendFile(arquivo.caminho, (err) => {
      if (err && !res.headersSent) res.status(404).json({ message: 'Arquivo não encontrado' })
    })
  } catch (err) {
    next(err)
  }
})

router.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    if (typeof req.body?.lida !== 'boolean') return res.status(400).json({ message: 'Informe lida: true/false' })
    await setLida(Number(req.params.id), req.body.lida)
    const carta = await getCarta(Number(req.params.id))
    if (!carta) return res.status(404).json({ message: 'Carta não encontrada' })
    res.json(carta)
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    await deleteCarta(Number(req.params.id))
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

export default router
