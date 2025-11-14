import { pool } from './db.js'

const normalizeSlide = (row) => ({
  id: String(row.id),
  title: row.title,
  description: row.description,
  image: row.image,
  accent: row.accent,
  link: row.link,
})

const normalizeHero = (row) => ({
  title: row.title,
  subtitle: row.subtitle,
  date: row.date,
  location: row.location,
  callToAction: row.call_to_action,
  instagramPostUrl: row.instagram_post_url,
})

const normalizeContact = (row) => ({
  phone: row.phone,
  email: row.email,
  address: row.address,
  officeHours: row.office_hours,
  whatsapp: row.whatsapp,
})

const normalizeGalleryItem = (row) => ({
  id: String(row.id),
  title: row.title,
  description: row.description,
  image: row.image,
  category: row.category,
})

const normalizeSponsor = (row) => ({
  id: String(row.id),
  name: row.name,
  image: row.image,
})

const normalizeBanner = (row) => ({
  id: String(row.id),
  title: row.title,
  image: row.image,
  link: row.link,
  sortOrder: row.sort_order,
})

async function getSingleton(table) {
  const [rows] = await pool.execute(`SELECT * FROM ${table} ORDER BY id LIMIT 1`)
  if (!rows || rows.length === 0) {
    throw new Error(`Nenhum registro encontrado para ${table}. Execute o script de seed.`)
  }
  return rows[0]
}

export async function getHero() {
  const row = await getSingleton('hero_content')
  return normalizeHero(row)
}

export async function updateHero(hero) {
  const row = await getSingleton('hero_content')
  await pool.execute(
    `UPDATE hero_content
       SET title = ?, subtitle = ?, date = ?, location = ?, call_to_action = ?, instagram_post_url = ?
     WHERE id = ?`,
    [hero.title, hero.subtitle, hero.date, hero.location, hero.callToAction, hero.instagramPostUrl || null, row.id],
  )
  return getHero()
}

export async function getContact() {
  const row = await getSingleton('contact_info')
  return normalizeContact(row)
}

export async function updateContact(contact) {
  const row = await getSingleton('contact_info')
  await pool.execute(
    `UPDATE contact_info
       SET phone = ?, email = ?, address = ?, office_hours = ?, whatsapp = ?
     WHERE id = ?`,
    [contact.phone, contact.email, contact.address, contact.officeHours, contact.whatsapp, row.id],
  )
  return getContact()
}

export async function listGallery() {
  const [rows] = await pool.execute('SELECT * FROM gallery_items ORDER BY created_at DESC')
  return rows.map(normalizeGalleryItem)
}

export async function listSlides() {
  const [rows] = await pool.execute('SELECT * FROM slides ORDER BY created_at DESC')
  return rows.map(normalizeSlide)
}

export async function createSlide(slide) {
  const [result] = await pool.execute(
    `INSERT INTO slides (title, description, image, accent, link) VALUES (?, ?, ?, ?, ?)`,
    [slide.title, slide.description, slide.image, slide.accent, slide.link ?? null],
  )
  return {
    id: String(result.insertId),
    ...slide,
  }
}

export async function deleteSlide(id) {
  await pool.execute('DELETE FROM slides WHERE id = ?', [id])
}

export async function createGalleryItem(item) {
  const [result] = await pool.execute(
    `INSERT INTO gallery_items (title, description, image, category) VALUES (?, ?, ?, ?)`,
    [item.title, item.description, item.image, item.category],
  )
  return {
    id: String(result.insertId),
    ...item,
  }
}

export async function deleteGalleryItem(id) {
  await pool.execute('DELETE FROM gallery_items WHERE id = ?', [id])
}

export async function listSponsors() {
  const [rows] = await pool.execute('SELECT * FROM sponsors ORDER BY created_at DESC')
  return rows.map(normalizeSponsor)
}

export async function createMessage(message) {
  const [result] = await pool.execute(
    `INSERT INTO messages (name, email, phone, message, ip, user_agent) VALUES (?, ?, ?, ?, ?, ?)`,
    [message.name, message.email, message.phone ?? null, message.message, message.ip ?? null, message.userAgent ?? null],
  )
  return {
    id: String(result.insertId),
    ...message,
  }
}

export async function listMessages() {
  const [rows] = await pool.execute('SELECT * FROM messages ORDER BY created_at DESC')
  return rows.map((row) => ({
    id: String(row.id),
    name: row.name,
    email: row.email,
    phone: row.phone,
    message: row.message,
    isRead: Boolean(row.is_read),
    createdAt: row.created_at,
  }))
}

export async function deleteMessage(id) {
  await pool.execute('DELETE FROM messages WHERE id = ?', [id])
}

export async function createSponsor(sponsor) {
  const [result] = await pool.execute(
    `INSERT INTO sponsors (name, image) VALUES (?, ?)`,
    [sponsor.name, sponsor.image],
  )
  return {
    id: String(result.insertId),
    ...sponsor,
  }
}

export async function deleteSponsor(id) {
  await pool.execute('DELETE FROM sponsors WHERE id = ?', [id])
}

export async function listBanners() {
  try {
    const [rows] = await pool.execute('SELECT * FROM banners ORDER BY sort_order ASC, created_at DESC')
    return rows.map(normalizeBanner)
  } catch (error) {
    if (error?.code === 'ER_NO_SUCH_TABLE') {
      console.warn('Tabela "banners" não encontrada. Execute server/schema.sql para habilitar o recurso.')
      return []
    }
    console.error('Falha ao listar banners', { code: error?.code, errno: error?.errno, message: error?.message })
    throw error
  }
}

export async function createBanner(banner) {
  const [result] = await pool.execute(
    `INSERT INTO banners (title, image, link, sort_order) VALUES (?, ?, ?, ?)`,
    [banner.title, banner.image, banner.link ?? null, banner.sortOrder ?? 0],
  )
  return {
    id: String(result.insertId),
    ...banner,
  }
}

export async function deleteBanner(id) {
  await pool.execute('DELETE FROM banners WHERE id = ?', [id])
}

export async function getSiteData() {
  const [hero, contact, gallery, sponsors, slides, banners] = await Promise.all([
    getHero(),
    getContact(),
    listGallery(),
    listSponsors(),
    listSlides(),
    listBanners(),
  ])
  return {
    hero,
    contact,
    slides,
    gallery,
    sponsors,
    banners,
  }
}
