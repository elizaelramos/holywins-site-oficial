import { Router } from 'express'
import {
  createGalleryItem,
  createSponsor,
  deleteGalleryItem,
  deleteSponsor,
  getSiteData,
  updateContact,
  updateHero,
} from '../siteDataService.js'

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

router.delete('/gallery/:id', async (req, res, next) => {
  try {
    await deleteGalleryItem(req.params.id)
    res.status(204).send()
  } catch (error) {
    next(error)
  }
})

router.post('/sponsors', async (req, res, next) => {
  try {
    const { name, image } = req.body
    if (!name || !image) {
      return res.status(400).json({ message: 'Nome e imagem são obrigatórios.' })
    }
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

export default router
