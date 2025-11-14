import type {
  ContactInfo,
  GalleryItem,
  HeroContent,
  SiteDataState,
  Slide,
  Sponsor,
  Message,
  Banner,
} from '../context/SiteDataContext'

const RAW_API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'
const API_URL = RAW_API_URL.endsWith('/') ? RAW_API_URL.slice(0, -1) : RAW_API_URL

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Erro ao comunicar com a API Holywins')
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export async function fetchSiteData() {
  return request<SiteDataState>('/site-data')
}

export async function saveHero(hero: HeroContent) {
  return request<HeroContent>('/hero', {
    method: 'PUT',
    body: JSON.stringify(hero),
  })
}

export async function saveContact(contact: ContactInfo) {
  return request<ContactInfo>('/contact', {
    method: 'PUT',
    body: JSON.stringify(contact),
  })
}

export async function createGalleryItemRequest(item: Omit<GalleryItem, 'id'>) {
  return request<GalleryItem>('/gallery', {
    method: 'POST',
    body: JSON.stringify(item),
  })
}

export async function deleteGalleryItemRequest(id: string) {
  await request<void>(`/gallery/${id}`, { method: 'DELETE' })
}

export async function createSponsorRequest(formData: FormData) {
  const response = await fetch(`${API_URL}/sponsors`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Erro ao comunicar com a API Holywins')
  }

  return (await response.json()) as Sponsor
}

export async function deleteSponsorRequest(id: string) {
  await request<void>(`/sponsors/${id}`, { method: 'DELETE' })
}

export async function createMessageRequest(message: { name: string; email: string; phone?: string; message: string; recaptchaToken?: string }) {
  return request<Message>('/messages', {
    method: 'POST',
    body: JSON.stringify(message),
  })
}

export async function fetchMessagesRequest() {
  return request<Message[]>('/messages')
}

export async function deleteMessageRequest(id: string) {
  await request<void>(`/messages/${id}`, { method: 'DELETE' })
}

export async function createSlideRequest(formData: FormData) {
  const response = await fetch(`${API_URL}/slides`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Erro ao comunicar com a API Holywins')
  }

  return (await response.json()) as Slide
}

export async function deleteSlideRequest(id: string) {
  await request<void>(`/slides/${id}`, { method: 'DELETE' })
}

export async function fetchBannersRequest() {
  return request<Banner[]>('/banners')
}

export async function createBannerRequest(formData: FormData) {
  const response = await fetch(`${API_URL}/banners`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Erro ao comunicar com a API Holywins')
  }

  return (await response.json()) as Banner
}

export async function deleteBannerRequest(id: string) {
  await request<void>(`/banners/${id}`, { method: 'DELETE' })
}
