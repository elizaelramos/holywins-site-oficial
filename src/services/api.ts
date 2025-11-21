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

export async function createGalleryItemRequest(item: Omit<GalleryItem, 'id'> | FormData) {
  // Accept either a plain object (JSON) or a FormData (with one or many files)
  if (item instanceof FormData) {
    const response = await fetch(`${API_URL}/gallery`, {
      method: 'POST',
      body: item,
    })

    if (!response.ok) {
      const message = await response.text()
      throw new Error(message || 'Erro ao comunicar com a API Holywins')
    }

    // Server may return a single item or an array of items when multiple files uploaded
    const data = await response.json()
    return data as GalleryItem | GalleryItem[]
  }

  return request<GalleryItem>('/gallery', {
    method: 'POST',
    body: JSON.stringify(item),
  })
}

export async function deleteGalleryItemRequest(id: string) {
  await request<void>(`/gallery/${id}`, { method: 'DELETE' })
}

export async function updateGalleryItemRequest(id: string, data: Partial<{ title: string; description: string; category: string; shareLink: string | null }>) {
  return request<GalleryItem>(`/gallery/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function setGalleryItemCoverRequest(id: string) {
  const response = await fetch(`${API_URL}/gallery/${id}/cover`, {
    method: 'PUT',
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Erro ao comunicar com a API Holywins')
  }

  return (await response.json()) as GalleryItem[]
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

export async function uploadBannerImageRequest(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('image', file)

  const response = await fetch(`${API_URL}/banners/upload-image`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Erro ao fazer upload da imagem')
  }

  const data = await response.json()
  return data.url
}

export async function createBannerRequest(data: FormData | Partial<Banner>) {
  if (data instanceof FormData) {
    const response = await fetch(`${API_URL}/banners`, {
      method: 'POST',
      body: data,
    })

    if (!response.ok) {
      const message = await response.text()
      throw new Error(message || 'Erro ao comunicar com a API Holywins')
    }

    return (await response.json()) as Banner
  }

  // Send as JSON for builder banners
  return request<Banner>('/banners', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function deleteBannerRequest(id: string) {
  await request<void>(`/banners/${id}`, { method: 'DELETE' })
}

export async function updateBannerRequest(id: string, data: FormData | Partial<Banner>) {
  if (data instanceof FormData) {
    const response = await fetch(`${API_URL}/banners/${id}`, {
      method: 'PUT',
      body: data,
    })

    if (!response.ok) {
      const message = await response.text()
      throw new Error(message || 'Erro ao comunicar com a API Holywins')
    }

    return (await response.json()) as Banner
  }

  // Send as JSON for builder banners
  return request<Banner>(`/banners/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function createCommunityRequest(community: Partial<import('../context/SiteDataContext').Community> | FormData) {
  // Accept either FormData (for file uploads) or JSON payload
  if (community instanceof FormData) {
    const response = await fetch(`${API_URL}/communities`, {
      method: 'POST',
      body: community as unknown as FormData,
    })
    if (!response.ok) {
      const message = await response.text()
      throw new Error(message || 'Erro ao comunicar com a API Holywins')
    }
    return (await response.json()) as import('../context/SiteDataContext').Community
  }

  return request<import('../context/SiteDataContext').Community>('/communities', {
    method: 'POST',
    body: JSON.stringify(community),
  })
}

export async function updateCommunityRequest(id: string, community: Partial<import('../context/SiteDataContext').Community> | FormData) {
  if (community instanceof FormData) {
    const response = await fetch(`${API_URL}/communities/${id}`, {
      method: 'PUT',
      body: community as unknown as FormData,
    })
    if (!response.ok) {
      const message = await response.text()
      throw new Error(message || 'Erro ao comunicar com a API Holywins')
    }
    return (await response.json()) as import('../context/SiteDataContext').Community
  }

  return request<import('../context/SiteDataContext').Community>(`/communities/${id}`, {
    method: 'PUT',
    body: JSON.stringify(community),
  })
}

export async function deleteCommunityRequest(id: string) {
  return request<void>(`/communities/${id}`, { method: 'DELETE' })
}
