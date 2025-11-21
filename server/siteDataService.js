import { pool } from './db.js'

// Export getConnection for auth routes
export async function getConnection() {
  return pool
}

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
  shareLink: row.share_link || null,
  isCover: Boolean(row.is_cover),
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
  imageMobile: row.image_mobile,
  link: row.link,
  sortOrder: row.sort_order,
  backgroundImage: row.background_image,
  components: row.components ? (typeof row.components === 'string' ? JSON.parse(row.components) : row.components) : null,
  isDraft: Boolean(row.is_draft),
  isPublished: Boolean(row.is_published),
  updatedAt: row.updated_at,
})

const normalizeCommunity = (row) => ({
  id: String(row.id),
  name: row.name,
  category: row.category || 'Comunidade',
  isMain: Boolean(row.is_main),
  parentId: row.parent_id ? String(row.parent_id) : null,
  priestName: row.priest_name,
  priestPhotoUrl: row.priest_photo_url,
  massSchedule: row.mass_schedule,
  address: row.address,
  phone: row.phone,
  instagramUrl: row.instagram_url,
  facebookUrl: row.facebook_url,
  dioceseUrl: row.diocese_url,
  imageUrl: row.image_url,
  latitude: row.latitude !== undefined ? Number(row.latitude) : null,
  longitude: row.longitude !== undefined ? Number(row.longitude) : null,
});

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
    `INSERT INTO gallery_items (title, description, image, category, share_link) VALUES (?, ?, ?, ?, ?)`,
    [item.title, item.description, item.image, item.category, item.shareLink ?? null],
  )
  return {
    id: String(result.insertId),
    ...item,
  }
}

export async function updateGalleryItem(id, data) {
  const fields = []
  const params = []
  if (data.title !== undefined) {
    fields.push('title = ?')
    params.push(data.title)
  }
  if (data.description !== undefined) {
    fields.push('description = ?')
    params.push(data.description)
  }
  if (data.category !== undefined) {
    fields.push('category = ?')
    params.push(data.category)
  }
  if (data.shareLink !== undefined) {
    fields.push('share_link = ?')
    params.push(data.shareLink ?? null)
  }

  if (!fields.length) {
    const [rows] = await pool.execute('SELECT * FROM gallery_items WHERE id = ?', [id])
    if (!rows || !rows.length) return null
    return normalizeGalleryItem(rows[0])
  }

  params.push(id)
  await pool.execute(`UPDATE gallery_items SET ${fields.join(', ')} WHERE id = ?`, params)
  const [rows] = await pool.execute('SELECT * FROM gallery_items WHERE id = ?', [id])
  if (!rows || !rows.length) return null
  return normalizeGalleryItem(rows[0])
}

export async function deleteGalleryItem(id) {
  await pool.execute('DELETE FROM gallery_items WHERE id = ?', [id])
}

export async function updateGalleryCover(id) {
  // Find the item to determine the group (title, description, category)
  const [rows] = await pool.execute('SELECT * FROM gallery_items WHERE id = ?', [id])
  if (!rows || rows.length === 0) return null
  const item = rows[0]
  const { title, description, category } = item

  // Reset cover for the whole group
  try {
    await pool.execute('UPDATE gallery_items SET is_cover = 0 WHERE title = ? AND description = ? AND category = ?', [title, description, category])
    // Set the selected id as cover
    await pool.execute('UPDATE gallery_items SET is_cover = 1 WHERE id = ?', [id])
  } catch (err) {
    // If the column does not exist, add it and retry once
    if (err && err.code === 'ER_BAD_FIELD_ERROR') {
      await pool.execute('ALTER TABLE gallery_items ADD COLUMN is_cover TINYINT(1) NOT NULL DEFAULT 0')
      await pool.execute('UPDATE gallery_items SET is_cover = 0 WHERE title = ? AND description = ? AND category = ?', [title, description, category])
      await pool.execute('UPDATE gallery_items SET is_cover = 1 WHERE id = ?', [id])
    } else {
      throw err
    }
  }

  // Return the updated group items
  const [updated] = await pool.execute('SELECT * FROM gallery_items WHERE title = ? AND description = ? AND category = ? ORDER BY is_cover DESC, created_at DESC', [title, description, category])
  return updated.map(normalizeGalleryItem)
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
  const componentsJson = banner.components ? JSON.stringify(banner.components) : null
  const [result] = await pool.execute(
    `INSERT INTO banners (title, image, image_mobile, link, sort_order, background_image, components, is_draft, is_published)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      banner.title,
      banner.image ?? '',
      banner.imageMobile ?? null,
      banner.link ?? null,
      banner.sortOrder ?? 0,
      banner.backgroundImage ?? null,
      componentsJson,
      banner.isDraft ?? false,
      banner.isPublished ?? true,
    ],
  )
  const [rows] = await pool.execute('SELECT * FROM banners WHERE id = ?', [result.insertId])
  return normalizeBanner(rows[0])
}

export async function deleteBanner(id) {
  await pool.execute('DELETE FROM banners WHERE id = ?', [id])
}

export async function updateBanner(id, banner) {
  // banner may include title, link, sortOrder, image, imageMobile
  const fields = []
  const params = []
  if (banner.title !== undefined) {
    fields.push('title = ?')
    params.push(banner.title)
  }
  if (banner.link !== undefined) {
    fields.push('link = ?')
    params.push(banner.link ?? null)
  }
  if (banner.sortOrder !== undefined) {
    fields.push('sort_order = ?')
    params.push(Number(banner.sortOrder))
  }
  if (banner.image !== undefined) {
    fields.push('image = ?')
    params.push(banner.image)
  }
  if (banner.imageMobile !== undefined) {
    fields.push('image_mobile = ?')
    params.push(banner.imageMobile)
  }
  if (banner.backgroundImage !== undefined) {
    fields.push('background_image = ?')
    params.push(banner.backgroundImage ?? null)
  }
  if (banner.components !== undefined) {
    fields.push('components = ?')
    params.push(banner.components ? JSON.stringify(banner.components) : null)
  }
  if (banner.isDraft !== undefined) {
    fields.push('is_draft = ?')
    params.push(banner.isDraft ? 1 : 0)
  }
  if (banner.isPublished !== undefined) {
    fields.push('is_published = ?')
    params.push(banner.isPublished ? 1 : 0)
  }

  if (!fields.length) {
    // No fields changed — return current record so callers can still receive banner data
    const [rows] = await pool.execute('SELECT * FROM banners WHERE id = ?', [id])
    if (!rows || !rows.length) return null
    return normalizeBanner(rows[0])
  }

  params.push(id)
  const sql = `UPDATE banners SET ${fields.join(', ')} WHERE id = ?`
  await pool.execute(sql, params)

  const [rows] = await pool.execute('SELECT * FROM banners WHERE id = ?', [id])
  if (!rows || !rows.length) return null
  return normalizeBanner(rows[0])
}

export async function listCommunities() {
  const [rows] = await pool.execute('SELECT * FROM communities ORDER BY is_main DESC, parent_id ASC, name ASC');
  return rows.map(normalizeCommunity);
}

export async function getCommunityById(id) {
  const [rows] = await pool.execute('SELECT * FROM communities WHERE id = ?', [id])
  if (!rows || rows.length === 0) return null
  return normalizeCommunity(rows[0])
}

export async function createCommunity(data) {
  const [result] = await pool.execute(
    `INSERT INTO communities (name, category, is_main, parent_id, priest_name, priest_photo_url, mass_schedule, address, phone, instagram_url, facebook_url, diocese_url, image_url, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.name,
      data.category || 'Comunidade',
      data.isMain ? 1 : 0,
      data.parentId ?? null,
      data.priestName ?? '',
      data.priestPhotoUrl ?? '',
      data.massSchedule ?? '',
      data.address ?? '',
      data.phone ?? '',
      data.instagramUrl ?? '',
      data.facebookUrl ?? '',
      data.dioceseUrl ?? '',
      data.imageUrl ?? '',
      data.latitude ?? null,
      data.longitude ?? null,
    ],
  )
  const [rows] = await pool.execute('SELECT * FROM communities WHERE id = ?', [result.insertId])
  return normalizeCommunity(rows[0])
}

export async function updateCommunity(id, data) {
  const fields = []
  const params = []
  if (data.name !== undefined) { fields.push('name = ?'); params.push(data.name) }
  if (data.category !== undefined) { fields.push('category = ?'); params.push(data.category) }
  if (data.isMain !== undefined) { fields.push('is_main = ?'); params.push(data.isMain ? 1 : 0) }
  if (data.parentId !== undefined) { fields.push('parent_id = ?'); params.push(data.parentId ?? null) }
  if (data.priestName !== undefined) { fields.push('priest_name = ?'); params.push(data.priestName) }
  if (data.priestPhotoUrl !== undefined) { fields.push('priest_photo_url = ?'); params.push(data.priestPhotoUrl) }
  if (data.massSchedule !== undefined) { fields.push('mass_schedule = ?'); params.push(data.massSchedule) }
  if (data.address !== undefined) { fields.push('address = ?'); params.push(data.address) }
  if (data.phone !== undefined) { fields.push('phone = ?'); params.push(data.phone) }
  if (data.instagramUrl !== undefined) { fields.push('instagram_url = ?'); params.push(data.instagramUrl) }
  if (data.facebookUrl !== undefined) { fields.push('facebook_url = ?'); params.push(data.facebookUrl) }
  if (data.dioceseUrl !== undefined) { fields.push('diocese_url = ?'); params.push(data.dioceseUrl) }
  if (data.imageUrl !== undefined) { fields.push('image_url = ?'); params.push(data.imageUrl) }
  if (data.latitude !== undefined) { fields.push('latitude = ?'); params.push(data.latitude) }
  if (data.longitude !== undefined) { fields.push('longitude = ?'); params.push(data.longitude) }

  if (!fields.length) return null
  params.push(id)

  const sql = `UPDATE communities SET ${fields.join(', ')} WHERE id = ?`
  await pool.execute(sql, params)

  const [rows] = await pool.execute('SELECT * FROM communities WHERE id = ?', [id])
  if (!rows || !rows.length) return null
  return normalizeCommunity(rows[0])
}

export async function deleteCommunity(id) {
  await pool.execute('DELETE FROM communities WHERE id = ?', [id])
}

export async function getSiteData() {
  const [hero, contact, gallery, sponsors, slides, banners, communities] = await Promise.all([
    getHero(),
    getContact(),
    listGallery(),
    listSponsors(),
    listSlides(),
    listBanners(),
    listCommunities(),
  ])
  return {
    hero,
    contact,
    slides,
    gallery,
    sponsors,
    banners,
    communities,
  }
}

// Log user activity
export async function logActivity(userId, action, entityType, entityId, details, ipAddress) {
  try {
    const db = await getConnection()
    await db.execute(
      'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, action, entityType, entityId, details, ipAddress]
    )
  } catch (error) {
    console.error('Error logging activity:', error)
    // Don't throw error - logging should not break the main flow
  }
}
