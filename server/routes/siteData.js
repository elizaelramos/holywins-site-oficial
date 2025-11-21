import { Router } from 'express'
import multer from 'multer'
import rateLimit from 'express-rate-limit'
import {
  createGalleryItem,
  updateGalleryCover,
  createSlide,
  createSponsor,
  deleteGalleryItem,
  deleteSlide,
  deleteSponsor,
  getSiteData,
  createMessage,
  listMessages,
  deleteMessage,
  updateContact,
  updateHero,
  createBanner,
  updateBanner,
  listBanners,
  createCommunity,
  updateCommunity,
  deleteCommunity,
  deleteBanner,
  getCommunityById,
} from '../siteDataService.js'
import fs from 'fs'
import path from 'path'

console.log('siteDataService updateBanner import ->', typeof updateBanner)

const storage = multer.diskStorage({
  destination: 'public/images/Patrocinadores/',
  filename: (req, file, cb) => {
    cb(null, file.originalname)
  }
})

const upload = multer({ storage })

const slideStorage = multer.diskStorage({
  destination: 'public/images/slides/',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`)
  },
})

const slideUpload = multer({ storage: slideStorage })

const galleryStorage = multer.diskStorage({
  destination: 'public/images/gallery/',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`)
  },
})

const galleryUpload = multer({ storage: galleryStorage })
const bannerStorage = multer.diskStorage({
  destination: 'public/images/banners/',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`)
  },
})

const bannerUpload = multer({
  storage: bannerStorage,
  fileFilter: (req, file, cb) => {
    // Accept only GIF and MP4 files
    const allowedTypes = ['image/gif', 'video/mp4']
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Apenas arquivos GIF e MP4 são permitidos para banners.'))
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for videos
  },
})

const communityStorage = multer.diskStorage({
  destination: 'public/images/communities/',
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
})

const communityUpload = multer({ storage: communityStorage })

// Storage for playlist audio files (MP3)
const audioStorage = multer.diskStorage({
  destination: 'public/audio/',
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`),
})

const audioUpload = multer({
  storage: audioStorage,
  fileFilter: (_req, file, cb) => {
    const allowed = ['audio/mpeg', 'audio/mp3']
    if (allowed.includes(file.mimetype)) cb(null, true)
    else cb(new Error('Apenas arquivos MP3 são permitidos para a playlist.'))
  },
  limits: { fileSize: 15 * 1024 * 1024 },
})

// Storage for moments (3 images for the "RELEMBRE OS MOMENTOS MARCANTES" section)
const momentsStorage = multer.diskStorage({
  destination: 'public/images/moments/',
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`),
})

// Only accept PNG for moments
const momentsUpload = multer({
  storage: momentsStorage,
  fileFilter: (req, file, cb) => {
    const allowed = ['image/png']
    if (allowed.includes(file.mimetype)) cb(null, true)
    else cb(new Error('Apenas arquivos PNG são permitidos para Link Rápido.'))
  },
  limits: { fileSize: 5 * 1024 * 1024 },
})

const messageLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000), // 15 minutes
  max: Number(process.env.RATE_LIMIT_MAX ?? 10),
  standardHeaders: true,
  legacyHeaders: false,
})

async function verifyRecaptcha(token) {
  if (!process.env.RECAPTCHA_SECRET) return true
  try {
    const resp = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${encodeURIComponent(process.env.RECAPTCHA_SECRET)}&response=${encodeURIComponent(token)}`,
    })
    const data = await resp.json()
    return data.success === true
  } catch (err) {
    return false
  }
}

const router = Router()

router.get('/site-data', async (_req, res, next) => {
  try {
    const data = await getSiteData()
    res.json(data)
  } catch (error) {
    next(error)
  }
})

router.put('/hero', async (req, res, next) => {
  try {
    const { title, subtitle, date, location, callToAction } = req.body
    if (!title || !subtitle || !date || !location || !callToAction) {
      return res.status(400).json({ message: 'Todos os campos de hero são obrigatórios.' })
    }
    const hero = await updateHero({ title, subtitle, date, location, callToAction })
    res.json(hero)
  } catch (error) {
    next(error)
  }
})

router.put('/contact', async (req, res, next) => {
  try {
    const { phone, email, address, officeHours, whatsapp } = req.body
    if (!phone || !email || !address || !officeHours || !whatsapp) {
      return res.status(400).json({ message: 'Todos os campos de contato são obrigatórios.' })
    }
    const contact = await updateContact({ phone, email, address, officeHours, whatsapp })
    res.json(contact)
  } catch (error) {
    next(error)
  }
})

router.post('/gallery', galleryUpload.array('images', 20), async (req, res, next) => {
  try {
    const { title, description, category } = req.body
    const files = req.files || []
    if (!title || !description || !files.length || !category) {
      return res.status(400).json({ message: 'Preencha título, descrição, imagens e categoria.' })
    }

    const createdItems = []
    for (const file of files) {
      const image = '/images/gallery/' + file.filename
      const item = await createGalleryItem({ title, description, image, category })
      createdItems.push(item)
    }

    // Return the created items (array) so client can update state
    res.status(201).json(createdItems)
  } catch (error) {
    next(error)
  }
})

router.post('/messages', messageLimiter, async (req, res, next) => {
  try {
    const { name, email, message, phone, recaptchaToken } = req.body
    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Nome, e-mail e mensagem são obrigatórios.' })
    }

    // Optional reCAPTCHA
    if (process.env.RECAPTCHA_SECRET) {
      const ok = await verifyRecaptcha(recaptchaToken)
      if (!ok) return res.status(400).json({ message: 'Falha no reCAPTCHA' })
    }

    const created = await createMessage({
      name,
      email,
      phone: phone ?? null,
      message,
      ip: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    })

    res.status(201).json(created)
  } catch (error) {
    next(error)
  }
})

// Admin routes - list/delete
router.get('/messages', async (_req, res, next) => {
  try {
    const messages = await listMessages()
    res.json(messages)
  } catch (error) {
    next(error)
  }
})

router.delete('/messages/:id', async (req, res, next) => {
  try {
    await deleteMessage(req.params.id)
    res.status(204).send()
  } catch (error) {
    next(error)
  }
})

router.delete('/gallery/:id', async (req, res, next) => {
  try {
    await deleteGalleryItem(req.params.id)
    res.status(204).send()
  } catch (error) {
    next(error)
  }
})

router.put('/gallery/:id', async (req, res, next) => {
  try {
    const id = req.params.id
    const { title, description, category, shareLink } = req.body
    const updated = await updateGalleryItem(id, {
      title: title ?? undefined,
      description: description ?? undefined,
      category: category ?? undefined,
      shareLink: shareLink !== undefined ? shareLink : undefined,
    })
    if (!updated) return res.status(404).json({ message: 'Imagem não encontrada.' })
    res.json(updated)
  } catch (error) {
    next(error)
  }
})

router.put('/gallery/:id/cover', async (req, res, next) => {
  try {
    const id = req.params.id
    const updated = await updateGalleryCover(id)
    if (!updated) return res.status(404).json({ message: 'Imagem não encontrada.' })
    res.json(updated)
  } catch (error) {
    next(error)
  }
})

router.post('/slides', slideUpload.single('image'), async (req, res, next) => {
  try {
    const { title, description, accent, link } = req.body
    if (!title || !description || !req.file) {
      return res.status(400).json({ message: 'Título, descrição e imagem são obrigatórios.' })
    }
    const image = '/images/slides/' + req.file.filename
    const slide = await createSlide({
      title,
      description,
      image,
      accent: accent || '#6ac8ff',
      link: link || null,
    })
    res.status(201).json(slide)
  } catch (error) {
    next(error)
  }
})

router.delete('/slides/:id', async (req, res, next) => {
  try {
    await deleteSlide(req.params.id)
    res.status(204).send()
  } catch (error) {
    next(error)
  }
})

router.post('/sponsors', upload.single('image'), async (req, res, next) => {
  try {
    const { name } = req.body
    if (!name || !req.file) {
      return res.status(400).json({ message: 'Nome e imagem são obrigatórios.' })
    }
    const image = '/images/Patrocinadores/' + req.file.filename
    const sponsor = await createSponsor({ name, image })
    res.status(201).json(sponsor)
  } catch (error) {
    next(error)
  }
})

router.delete('/sponsors/:id', async (req, res, next) => {
  try {
    await deleteSponsor(req.params.id)
    res.status(204).send()
  } catch (error) {
    next(error)
  }
})

router.get('/banners', async (_req, res, next) => {
  try {
    const banners = await listBanners()
    res.json(banners)
  } catch (error) {
    next(error)
  }
})

// Upload individual banner images (background or component images)
router.post('/banners/upload-image', bannerUpload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Nenhuma imagem foi enviada.' })
    }
    const imageUrl = '/images/banners/' + req.file.filename
    res.json({ url: imageUrl })
  } catch (error) {
    next(error)
  }
})

// POST /banners - Simple GIF/MP4 upload
const createBannerHandler = async (req, res, next) => {
  try {
    const { title, link, sortOrder } = req.body
    if (!title || !req.file) {
      return res.status(400).json({ message: 'Título e arquivo (GIF ou MP4) são obrigatórios.' })
    }
    const banner = await createBanner({
      title,
      link: link || null,
      image: '/images/banners/' + req.file.filename,
      sortOrder: Number(sortOrder ?? 0),
    })
    res.status(201).json(banner)
  } catch (error) {
    next(error)
  }
}

router.post('/banners', bannerUpload.single('image'), createBannerHandler)

// PUT /banners/:id - accepts both FormData (legacy) and JSON (builder)
const updateBannerHandler = async (req, res, next) => {
  try {
    const id = req.params.id
    const isJson = req.is('application/json')

    if (isJson) {
      // Builder banner update
      const { title, backgroundImage, components, isDraft, isPublished, sortOrder } = req.body

      console.log('PUT /banners/:id (JSON) - Recebido:', { id, title, hasComponents: !!components, isDraft, isPublished })

      const updated = await updateBanner(id, {
        title: title ?? undefined,
        backgroundImage: backgroundImage ?? undefined,
        components: components ?? undefined,
        isDraft: isDraft !== undefined ? isDraft : undefined,
        isPublished: isPublished !== undefined ? isPublished : undefined,
        sortOrder: sortOrder !== undefined ? Number(sortOrder) : undefined,
      })

      console.log('PUT /banners/:id (JSON) - Resultado:', updated ? 'Atualizado' : 'Não encontrado')

      if (!updated) return res.status(404).json({ message: 'Banner não encontrado.' })
      return res.json(updated)
    }

    // Legacy FormData update
    const { title, link, sortOrder } = req.body
    const image = req.files?.image?.[0] ? '/images/banners/' + req.files.image[0].filename : undefined
    const imageMobile = req.files?.imageMobile?.[0] ? '/images/banners/' + req.files.imageMobile[0].filename : undefined

    console.log('PUT /banners/:id (FormData) - Recebido:', { id, title, link, sortOrder, hasImage: !!image, hasImageMobile: !!imageMobile })

    const updated = await updateBanner(id, {
      title: title ?? undefined,
      link: link ?? undefined,
      sortOrder: sortOrder !== undefined ? Number(sortOrder) : undefined,
      image,
      imageMobile,
    })

    console.log('PUT /banners/:id (FormData) - Resultado:', updated ? 'Atualizado' : 'Não encontrado')

    if (!updated) return res.status(404).json({ message: 'Banner não encontrado.' })
    res.json(updated)
  } catch (error) {
    console.error('Erro em PUT /banners/:id:', error)
    next(error)
  }
}

router.put('/banners/:id', bannerUpload.fields([{ name: 'image', maxCount: 1 }, { name: 'imageMobile', maxCount: 1 }]), updateBannerHandler)

router.delete('/banners/:id', async (req, res, next) => {
  try {
    await deleteBanner(req.params.id)
    res.status(204).send()
  } catch (error) {
    next(error)
  }
})

router.post('/communities', communityUpload.fields([{ name: 'image' }, { name: 'priestPhoto' }]), async (req, res, next) => {
  try {
    const body = { ...req.body }
    if (req.files?.image?.[0]) body.imageUrl = '/images/communities/' + req.files.image[0].filename
    if (req.files?.priestPhoto?.[0]) body.priestPhotoUrl = '/images/communities/' + req.files.priestPhoto[0].filename
    // Convert lat/lng strings to numbers if present
    if (body.latitude) body.latitude = Number(body.latitude)
    if (body.longitude) body.longitude = Number(body.longitude)
    console.log('POST /communities', { hasFiles: !!req.files?.image?.length || !!req.files?.priestPhoto?.length, body })
    const created = await createCommunity(body)
    res.status(201).json(created)
  } catch (error) {
    next(error)
  }
})

// Moments (Link Rápido) - support multiple entries (each entry: { id, images[], link })
router.get('/moments', async (_req, res, next) => {
  try {
    const p = path.join(process.cwd(), 'server', 'data', 'moments.json')
    if (!fs.existsSync(p)) return res.json([])
    const raw = fs.readFileSync(p, 'utf-8')
    let data = JSON.parse(raw)
    // Backwards compatibility: if stored as single object, convert to array
    if (!Array.isArray(data)) {
      data = [{ id: String(Date.now()), images: data.images || [], link: data.link || '' }]
    }
    res.json(data)
  } catch (err) {
    next(err)
  }
})

// Create a new Link Rápido entry
router.post('/moments', momentsUpload.fields([{ name: 'image1' }, { name: 'image2' }, { name: 'image3' }]), async (req, res, next) => {
  try {
    const body = { ...req.body }
    const images = []
    for (const key of ['image1', 'image2', 'image3']) {
      const file = req.files?.[key]?.[0]
      if (file) images.push('/images/moments/' + file.filename)
    }

    const p = path.join(process.cwd(), 'server', 'data', 'moments.json')
    let arr = []
    if (fs.existsSync(p)) {
      try {
        arr = JSON.parse(fs.readFileSync(p, 'utf-8'))
        if (!Array.isArray(arr)) arr = []
      } catch (e) {
        arr = []
      }
    }

    const entry = {
      id: String(Date.now()),
      images,
      link: body.link ?? '',
    }
    arr.push(entry)
    fs.writeFileSync(p, JSON.stringify(arr, null, 2), 'utf-8')
    res.status(201).json(entry)
  } catch (err) {
    next(err)
  }
})

// Delete a specific Link Rápido entry by id
router.delete('/moments/:id', async (req, res, next) => {
  try {
    const id = req.params.id
    const p = path.join(process.cwd(), 'server', 'data', 'moments.json')
    if (!fs.existsSync(p)) return res.status(404).json({ message: 'Not found' })
    let arr = JSON.parse(fs.readFileSync(p, 'utf-8'))
    if (!Array.isArray(arr)) arr = []
    const idx = arr.findIndex((e) => String(e.id) === String(id))
    if (idx === -1) return res.status(404).json({ message: 'Not found' })
    const [removed] = arr.splice(idx, 1)
    // delete associated files
    try {
      for (const img of removed.images || []) {
        if (typeof img === 'string' && img.startsWith('/images/moments/')) {
          const filename = img.replace('/images/moments/', '')
          const fp = path.join(process.cwd(), 'public', 'images', 'moments', filename)
          if (fs.existsSync(fp)) fs.unlinkSync(fp)
        }
      }
    } catch (e) {
      console.warn('Failed to cleanup moment images', e)
    }
    fs.writeFileSync(p, JSON.stringify(arr, null, 2), 'utf-8')
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

// Delete all entries (clear moments)
router.delete('/moments', async (_req, res, next) => {
  try {
    const p = path.join(process.cwd(), 'server', 'data', 'moments.json')
    if (!fs.existsSync(p)) return res.status(204).send()
    const arr = JSON.parse(fs.readFileSync(p, 'utf-8')) || []
    try {
      for (const e of arr) {
        for (const img of e.images || []) {
          if (typeof img === 'string' && img.startsWith('/images/moments/')) {
            const filename = img.replace('/images/moments/', '')
            const fp = path.join(process.cwd(), 'public', 'images', 'moments', filename)
            if (fs.existsSync(fp)) fs.unlinkSync(fp)
          }
        }
      }
    } catch (e) {
      console.warn('Failed to cleanup moment images', e)
    }
    fs.writeFileSync(p, JSON.stringify([], null, 2), 'utf-8')
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

// Playlist management: simple CRUD for entries { id, title, youtube, audio }
router.get('/playlist', async (_req, res, next) => {
  try {
    const p = path.join(process.cwd(), 'server', 'data', 'playlist.json')
    if (!fs.existsSync(p)) return res.json([])
    const raw = fs.readFileSync(p, 'utf-8')
    const data = JSON.parse(raw)
    res.json(data)
  } catch (err) {
    next(err)
  }
})

router.post('/playlist', audioUpload.single('audio'), async (req, res, next) => {
  try {
    const { title, youtube } = req.body
    if (!title) return res.status(400).json({ message: 'Título é obrigatório.' })
    const audio = req.file ? '/audio/' + req.file.filename : null
    const p = path.join(process.cwd(), 'server', 'data', 'playlist.json')
    let arr = []
    if (fs.existsSync(p)) {
      try { arr = JSON.parse(fs.readFileSync(p, 'utf-8')) } catch (e) { arr = [] }
    }
    const entry = { id: String(Date.now()), title, youtube: youtube || '', audio }
    arr.push(entry)
    fs.writeFileSync(p, JSON.stringify(arr, null, 2), 'utf-8')
    res.status(201).json(entry)
  } catch (err) {
    next(err)
  }
})

router.delete('/playlist/:id', async (req, res, next) => {
  try {
    const id = req.params.id
    const p = path.join(process.cwd(), 'server', 'data', 'playlist.json')
    if (!fs.existsSync(p)) return res.status(404).json({ message: 'Not found' })
    let arr = JSON.parse(fs.readFileSync(p, 'utf-8'))
    if (!Array.isArray(arr)) arr = []
    const idx = arr.findIndex((e) => String(e.id) === String(id))
    if (idx === -1) return res.status(404).json({ message: 'Not found' })
    const [removed] = arr.splice(idx, 1)
    try {
      if (removed.audio && typeof removed.audio === 'string' && removed.audio.startsWith('/audio/')) {
        const filename = removed.audio.replace('/audio/', '')
        const fp = path.join(process.cwd(), 'public', 'audio', filename)
        if (fs.existsSync(fp)) fs.unlinkSync(fp)
      }
    } catch (e) {
      console.warn('Failed to cleanup playlist audio', e)
    }
    fs.writeFileSync(p, JSON.stringify(arr, null, 2), 'utf-8')
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

router.delete('/playlist', async (_req, res, next) => {
  try {
    const p = path.join(process.cwd(), 'server', 'data', 'playlist.json')
    if (!fs.existsSync(p)) return res.status(204).send()
    const arr = JSON.parse(fs.readFileSync(p, 'utf-8')) || []
    try {
      for (const e of arr) {
        if (e.audio && typeof e.audio === 'string' && e.audio.startsWith('/audio/')) {
          const filename = e.audio.replace('/audio/', '')
          const fp = path.join(process.cwd(), 'public', 'audio', filename)
          if (fs.existsSync(fp)) fs.unlinkSync(fp)
        }
      }
    } catch (e) {
      console.warn('Failed to cleanup playlist audio', e)
    }
    fs.writeFileSync(p, JSON.stringify([], null, 2), 'utf-8')
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

router.put('/communities/:id', communityUpload.fields([{ name: 'image' }, { name: 'priestPhoto' }]), async (req, res, next) => {
  try {
    const id = req.params.id
    // If a new file is uploaded, remove the previous stored images to avoid orphaned files
    const old = await getCommunityById(id)
    const body = { ...req.body }
    if (req.files?.image?.[0]) body.imageUrl = '/images/communities/' + req.files.image[0].filename
    if (req.files?.priestPhoto?.[0]) body.priestPhotoUrl = '/images/communities/' + req.files.priestPhoto[0].filename
    if (body.latitude) body.latitude = Number(body.latitude)
    if (body.longitude) body.longitude = Number(body.longitude)
    // Delete previous image files if they exist and were replaced
    try {
      if (old) {
        if (req.files?.image?.[0] && old.imageUrl) {
          const filePath = path.join(process.cwd(), 'public', old.imageUrl.replace(/^\//, ''))
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
        }
        if (req.files?.priestPhoto?.[0] && old.priestPhotoUrl) {
          const filePath = path.join(process.cwd(), 'public', old.priestPhotoUrl.replace(/^\//, ''))
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
        }
      }
    } catch (err) {
      console.warn('Failed to delete old community image: ', err)
    }
    const updated = await updateCommunity(id, body)
    if (!updated) return res.status(404).json({ message: 'Comunidade não encontrada.' })
    res.json(updated)
  } catch (error) {
    next(error)
  }
})

router.delete('/communities/:id', async (req, res, next) => {
  try {
    // remove associated images before deleting the database record
    const id = req.params.id
    const old = await getCommunityById(id)
    try {
      if (old?.imageUrl) {
        const filePath = path.join(process.cwd(), 'public', old.imageUrl.replace(/^\//, ''))
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
      }
      if (old?.priestPhotoUrl) {
        const filePath = path.join(process.cwd(), 'public', old.priestPhotoUrl.replace(/^\//, ''))
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
      }
    } catch (err) {
      console.warn('Failed to delete community images on remove', err)
    }
    await deleteCommunity(req.params.id)
    res.status(204).send()
  } catch (error) {
    next(error)
  }
})

// Communities CRUD
// NOTE: earlier in the file there are routes that accept multipart/form-data via multer
// for /communities (create/update) and they are the intended entrypoints. The
// plain JSON-only routes previously declared here were redundant and could cause
// ambiguity — we keep only the multipart routes above.

export default router
