import { pool } from './db.js'

const slideDeck = [
  {
    id: 'slide-1',
    title: 'Procissão luminosa',
    description: 'Traga sua vela e participe de um ato público de fé pelas ruas do bairro.',
    image: '/images/slide-1.svg',
    accent: '#6ac8ff',
  },
  {
    id: 'slide-2',
    title: 'Adoração jovem',
    description: 'Momento de louvor conduzido pelo ministério de música Holywins.',
    image: '/images/slide-2.svg',
    accent: '#8ab5ff',
  },
  {
    id: 'slide-3',
    title: 'Festival de santos',
    description: 'Apresentações criativas contando histórias de santidade para toda a família.',
    image: '/images/slide-3.svg',
    accent: '#b0d4ff',
  },
]

const normalizeHero = (row) => ({
  title: row.title,
  subtitle: row.subtitle,
  date: row.date,
  location: row.location,
  callToAction: row.call_to_action,
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
       SET title = ?, subtitle = ?, date = ?, location = ?, call_to_action = ?
     WHERE id = ?`,
    [hero.title, hero.subtitle, hero.date, hero.location, hero.callToAction, row.id],
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

export async function getSiteData() {
  const [hero, contact, gallery, sponsors] = await Promise.all([
    getHero(),
    getContact(),
    listGallery(),
    listSponsors(),
  ])
  return {
    hero,
    contact,
    slides: slideDeck,
    gallery,
    sponsors,
  }
}
