import { Router } from 'express'
import { Readable } from 'node:stream'
import rateLimit from 'express-rate-limit'
import { requireAuth } from './auth.js'
import {
  listVideos,
  findByCodigo,
  findById,
  createVideo,
  updateVideo,
  deleteVideo,
  registerUnlock,
  extractMp4FromApplay,
  isApplayUrl,
  VideoStatus,
} from '../eventVideosService.js'

const router = Router()

const unlockLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
})

function normalizeCodigo(value) {
  return String(value ?? '').trim().toUpperCase()
}

// ---------- Público ----------

router.post('/unlock', unlockLimiter, async (req, res, next) => {
  try {
    const codigo = normalizeCodigo(req.body?.codigo)
    const senha = String(req.body?.senha ?? '').trim()
    if (!codigo || !senha) {
      return res.status(400).json({ message: 'Informe o código e a senha.' })
    }
    const video = await findByCodigo(codigo)
    if (!video || video.senha !== senha) {
      return res.status(401).json({ message: 'Código ou senha inválidos.' })
    }
    if (video.status !== VideoStatus.PRONTO || !video.videoUrl) {
      return res.json({
        status: VideoStatus.PENDENTE,
        codigo: video.codigo,
        message: 'Seu vídeo ainda está sendo preparado. Tente novamente em instantes.',
      })
    }
    registerUnlock(video.id).catch(() => {})
    res.json({
      status: VideoStatus.PRONTO,
      codigo: video.codigo,
      videoUrl: video.videoUrl,
    })
  } catch (err) {
    next(err)
  }
})

// Proxy de download same-origin.
//
// O videoUrl aponta para o CDN do applay360 (cross-origin) e o Safari do iPhone
// ignora o atributo `download` de <a>, abrindo o vídeo no player em vez de baixar.
// Este endpoint valida código+senha, busca o vídeo de origem e o retransmite pela
// nossa origem com `Content-Disposition: attachment`. Isso permite que o front-end
// leia o arquivo como blob (sem barreira de CORS) e o entregue via Web Share
// ("Salvar Vídeo"/"Salvar em Arquivos" no iOS) ou download por blob nos demais.
router.post('/download', unlockLimiter, async (req, res, next) => {
  try {
    const codigo = normalizeCodigo(req.body?.codigo)
    const senha = String(req.body?.senha ?? '').trim()
    if (!codigo || !senha) {
      return res.status(400).json({ message: 'Informe o código e a senha.' })
    }
    const video = await findByCodigo(codigo)
    if (!video || video.senha !== senha) {
      return res.status(401).json({ message: 'Código ou senha inválidos.' })
    }
    if (video.status !== VideoStatus.PRONTO || !video.videoUrl) {
      return res.status(409).json({ message: 'O vídeo ainda está sendo preparado.' })
    }

    const upstream = await fetch(video.videoUrl)
    if (!upstream.ok || !upstream.body) {
      return res.status(502).json({ message: 'Não foi possível obter o vídeo de origem.' })
    }

    const ext =
      video.videoUrl.split(/[?#]/)[0].match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase() || 'mp4'
    const contentType = upstream.headers.get('content-type') || 'video/mp4'
    const contentLength = upstream.headers.get('content-length')

    res.setHeader('Content-Type', contentType)
    res.setHeader('Content-Disposition', `attachment; filename="holywins-${codigo}.${ext}"`)
    if (contentLength) res.setHeader('Content-Length', contentLength)

    const nodeStream = Readable.fromWeb(upstream.body)
    nodeStream.on('error', () => {
      if (!res.headersSent) res.status(502).end()
      else res.destroy()
    })
    nodeStream.pipe(res)
  } catch (err) {
    next(err)
  }
})

// ---------- Admin ----------

router.use(requireAuth)

router.get('/', async (_req, res, next) => {
  try {
    res.json(await listVideos())
  } catch (err) {
    next(err)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const codigo = normalizeCodigo(req.body?.codigo)
    const senha = String(req.body?.senha ?? '').trim()
    const observacao = req.body?.observacao?.trim() || null
    if (!codigo) return res.status(400).json({ message: 'Código é obrigatório.' })
    if (!senha) return res.status(400).json({ message: 'Senha é obrigatória.' })
    const existing = await findByCodigo(codigo)
    if (existing) {
      return res.status(409).json({ message: `Já existe um vídeo com o código ${codigo}.` })
    }
    const created = await createVideo({
      codigo,
      senha,
      observacao,
      createdBy: req.session?.userId ?? null,
    })
    res.status(201).json(created)
  } catch (err) {
    next(err)
  }
})

router.post('/bulk', async (req, res, next) => {
  try {
    const prefix = String(req.body?.prefix ?? '').trim()
    const start = Number(req.body?.start)
    const end = Number(req.body?.end)
    const padding = Number(req.body?.padding ?? 3)
    const senhaPattern = String(req.body?.senhaPattern ?? '').trim()
    if (!Number.isInteger(start) || !Number.isInteger(end) || end < start) {
      return res.status(400).json({ message: 'Informe um intervalo numérico válido (início ≤ fim).' })
    }
    if (end - start + 1 > 500) {
      return res.status(400).json({ message: 'Crie no máximo 500 códigos por vez.' })
    }
    if (!senhaPattern.includes('{n}')) {
      return res.status(400).json({ message: 'O padrão de senha precisa conter {n} (ex.: holy{n}).' })
    }
    const created = []
    const skipped = []
    for (let n = start; n <= end; n++) {
      const num = String(n).padStart(padding, '0')
      const codigo = normalizeCodigo(`${prefix}${num}`)
      const senha = senhaPattern.replace(/\{n\}/g, num)
      const existing = await findByCodigo(codigo)
      if (existing) {
        skipped.push(codigo)
        continue
      }
      const row = await createVideo({
        codigo,
        senha,
        createdBy: req.session?.userId ?? null,
      })
      created.push(row)
    }
    res.status(201).json({ created, skipped })
  } catch (err) {
    next(err)
  }
})

router.patch('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const current = await findById(id)
    if (!current) return res.status(404).json({ message: 'Vídeo não encontrado.' })

    const updates = {}

    if ('codigo' in req.body) {
      const codigo = normalizeCodigo(req.body.codigo)
      if (!codigo) return res.status(400).json({ message: 'Código não pode ficar em branco.' })
      if (codigo !== current.codigo) {
        const other = await findByCodigo(codigo)
        if (other) return res.status(409).json({ message: `Já existe um vídeo com o código ${codigo}.` })
        updates.codigo = codigo
      }
    }

    if ('senha' in req.body) {
      const senha = String(req.body.senha ?? '').trim()
      if (!senha) return res.status(400).json({ message: 'Senha não pode ficar em branco.' })
      updates.senha = senha
    }

    if ('observacao' in req.body) {
      const obs = req.body.observacao
      updates.observacao = obs?.trim() ? obs.trim() : null
    }

    if ('sourceUrl' in req.body) {
      const raw = String(req.body.sourceUrl ?? '').trim()
      if (!raw) {
        updates.source_url = null
        updates.video_url = null
        updates.status = VideoStatus.PENDENTE
      } else {
        if (!isApplayUrl(raw)) {
          return res.status(400).json({ message: 'O link precisa ser do applay360.com.' })
        }
        try {
          const mp4 = await extractMp4FromApplay(raw)
          updates.source_url = raw
          updates.video_url = mp4
          updates.status = VideoStatus.PRONTO
        } catch (err) {
          return res.status(422).json({ message: err.message || 'Falha ao extrair o vídeo do link.' })
        }
      }
    }

    const updated = await updateVideo(id, updates)
    res.json(updated)
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    await deleteVideo(Number(req.params.id))
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

export default router
