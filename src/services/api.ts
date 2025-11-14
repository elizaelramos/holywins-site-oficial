import type {
  ContactInfo,
  GalleryItem,
  HeroContent,
  SiteDataState,
  Sponsor,
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

export async function createSponsorRequest(sponsor: Omit<Sponsor, 'id'>) {
  return request<Sponsor>('/sponsors', {
    method: 'POST',
    body: JSON.stringify(sponsor),
  })
}

export async function deleteSponsorRequest(id: string) {
  await request<void>(`/sponsors/${id}`, { method: 'DELETE' })
}
