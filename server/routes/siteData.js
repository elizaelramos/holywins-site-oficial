import { Router } from 'express'
import multer from 'multer'
import rateLimit from 'express-rate-limit'
import {
  createGalleryItem,
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
  listBanners,
  deleteBanner,
} from '../siteDataService.js'

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

const bannerStorage = multer.diskStorage({
  destination: 'public/images/banners/',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`)
  },
})

const bannerUpload = multer({ storage: bannerStorage })

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

router.post('/gallery', async (req, res, next) => {
  try {
    const { title, description, image, category } = req.body
    if (!title || !description || !image || !category) {
      return res.status(400).json({ message: 'Preencha título, descrição, imagem e categoria.' })
    }
    const item = await createGalleryItem({ title, description, image, category })
    res.status(201).json(item)
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

router.post('/banners', bannerUpload.single('image'), async (req, res, next) => {
  try {
    const { title, link, sortOrder } = req.body
    if (!title || !req.file) {
      return res.status(400).json({ message: 'Título e imagem são obrigatórios.' })
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
})

router.delete('/banners/:id', async (req, res, next) => {
  try {
    await deleteBanner(req.params.id)
    res.status(204).send()
  } catch (error) {
    next(error)
  }
})

export default router
