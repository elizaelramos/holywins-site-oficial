import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  createGalleryItemRequest,
  createSponsorRequest,
  deleteGalleryItemRequest,
  deleteSponsorRequest,
  fetchSiteData,
  saveContact,
  saveHero,
} from '../services/api'

export type HeroContent = {
  title: string
  subtitle: string
  date: string
  location: string
  callToAction: string
}

export type ContactInfo = {
  phone: string
  email: string
  address: string
  officeHours: string
  whatsapp: string
}

export type Slide = {
  id: string
  title: string
  description: string
  image: string
  accent: string
}

export type GalleryItem = {
  id: string
  title: string
  description: string
  image: string
  category: 'Celebração' | 'Ação Social' | 'Juventude'
}

export type Sponsor = {
  id: string
  name: string
  image: string
}

export type SiteDataState = {
  hero: HeroContent
  contact: ContactInfo
  slides: Slide[]
  gallery: GalleryItem[]
  sponsors: Sponsor[]
}

const initialData: SiteDataState = {
  hero: {
    title: 'Holywins 2025',
    subtitle: 'Uma noite de luz, adoração e testemunho para toda a comunidade católica.',
    date: '31 de outubro · 19h',
    location: 'Paróquia São Miguel Arcanjo, Centro',
    callToAction: 'Quero participar',
  },
  contact: {
    phone: '(11) 4002-8922',
    email: 'contato@holywins.com.br',
    address: 'Rua da Esperança, 77 · São Paulo/SP',
    officeHours: 'Atendimento de terça a sábado · 14h às 21h',
    whatsapp: '(11) 98888-5566',
  },
  slides: [
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
  ],
  gallery: [
    {
      id: 'gallery-1',
      title: 'Louvor da juventude',
      description: 'Ministério Holywins guiando momentos de adoração.',
      image: '/images/gallery-1.svg',
      category: 'Juventude',
    },
    {
      id: 'gallery-2',
      title: 'Entrada dos santos',
      description: 'Crianças representando santos brasileiros.',
      image: '/images/gallery-2.svg',
      category: 'Celebração',
    },
    {
      id: 'gallery-3',
      title: 'Adoração noturna',
      description: 'Capela preparada para vigília.',
      image: '/images/gallery-3.svg',
      category: 'Celebração',
    },
    {
      id: 'gallery-4',
      title: 'Mutirão solidário',
      description: 'Equipe servindo refeições aos moradores em situação de rua.',
      image: '/images/gallery-4.svg',
      category: 'Ação Social',
    },
    {
      id: 'gallery-5',
      title: 'Ateliê infantil',
      description: 'Oficina de criatividade para os pequenos.',
      image: '/images/gallery-5.svg',
      category: 'Juventude',
    },
    {
      id: 'gallery-6',
      title: 'Famílias em missão',
      description: 'Casais apresentando testemunhos.',
      image: '/images/gallery-6.svg',
      category: 'Ação Social',
    },
  ],
  sponsors: [
    { id: 'sponsor-bp', name: 'BP Sonorização', image: '/images/Patrocinadores/BP_SONORIZAÇÃO.png' },
    { id: 'sponsor-cantinho', name: 'Cantinho da Fé', image: '/images/Patrocinadores/Cantinho_da_fe.jpg' },
    { id: 'sponsor-demolidora', name: 'Demolidora Lanches', image: '/images/Patrocinadores/DEMOLIDORA_LANCHES.jpg' },
    { id: 'sponsor-radi', name: 'RADI', image: '/images/Patrocinadores/RADI.jpg' },
    { id: 'sponsor-jovan', name: 'Vereador Jovan', image: '/images/Patrocinadores/VEREADOR_JOVAN.jpg' },
    { id: 'sponsor-marcelo', name: 'Vereador Marcelo Araújo', image: '/images/Patrocinadores/VEREADOR_MARCELO_ARAÚJO.jpg' },
    { id: 'sponsor-vasconcellos', name: 'Vereador Vasconcellos', image: '/images/Patrocinadores/VEREADOR_VASCONCELLOS.jpg' },
  ],
}

type SiteDataContextValue = {
  hero: HeroContent
  contact: ContactInfo
  slides: Slide[]
  gallery: GalleryItem[]
  sponsors: Sponsor[]
  isAuthenticated: boolean
  isLoading: boolean
  lastSyncError: string | null
  login: (password: string) => boolean
  logout: () => void
  updateHero: (hero: HeroContent) => Promise<void>
  updateContact: (contact: ContactInfo) => Promise<void>
  addGalleryItem: (item: Omit<GalleryItem, 'id'>) => Promise<void>
  removeGalleryItem: (id: string) => Promise<void>
  addSponsor: (sponsor: Omit<Sponsor, 'id'>) => Promise<void>
  removeSponsor: (id: string) => Promise<void>
}

const SiteDataContext = createContext<SiteDataContextValue | undefined>(undefined)

export function SiteDataProvider({ children }: { children: ReactNode }) {
  const [hero, setHero] = useState(initialData.hero)
  const [contact, setContact] = useState(initialData.contact)
  const [slides, setSlides] = useState(initialData.slides)
  const [gallery, setGallery] = useState(initialData.gallery)
  const [sponsors, setSponsors] = useState(initialData.sponsors)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [lastSyncError, setLastSyncError] = useState<string | null>(null)

  useEffect(() => {
    async function bootstrap() {
      try {
        const payload = await fetchSiteData()
        setHero(payload.hero)
        setContact(payload.contact)
        setSlides(payload.slides)
        setGallery(payload.gallery)
        setSponsors(payload.sponsors)
        setLastSyncError(null)
      } catch (error) {
        console.error('Erro ao buscar dados iniciais', error)
        setLastSyncError('Não foi possível sincronizar com o servidor. Exibindo conteúdo padrão.')
      } finally {
        setIsLoading(false)
      }
    }

    void bootstrap()
  }, [])

  const login = useCallback((password: string) => {
    const success = password === 'holywins2025'
    setIsAuthenticated(success)
    return success
  }, [])

  const logout = useCallback(() => setIsAuthenticated(false), [])

  const updateHero = useCallback(async (nextHero: HeroContent) => {
    try {
      const saved = await saveHero(nextHero)
      setHero(saved)
      setLastSyncError(null)
    } catch (error) {
      console.error('Erro ao salvar hero', error)
      setLastSyncError('Falha ao salvar o hero. Tente novamente.')
      throw error
    }
  }, [])

  const updateContact = useCallback(async (nextContact: ContactInfo) => {
    try {
      const saved = await saveContact(nextContact)
      setContact(saved)
      setLastSyncError(null)
    } catch (error) {
      console.error('Erro ao salvar contato', error)
      setLastSyncError('Falha ao salvar os contatos. Tente novamente.')
      throw error
    }
  }, [])

  const addGalleryItem = useCallback(async (item: Omit<GalleryItem, 'id'>) => {
    try {
      const created = await createGalleryItemRequest(item)
      setGallery((current) => [created, ...current])
      setLastSyncError(null)
    } catch (error) {
      console.error('Erro ao adicionar galeria', error)
      setLastSyncError('Falha ao adicionar item na galeria.')
      throw error
    }
  }, [])

  const removeGalleryItem = useCallback(async (id: string) => {
    try {
      await deleteGalleryItemRequest(id)
      setGallery((current) => current.filter((item) => item.id !== id))
      setLastSyncError(null)
    } catch (error) {
      console.error('Erro ao remover galeria', error)
      setLastSyncError('Falha ao remover item da galeria.')
      throw error
    }
  }, [])

  const addSponsor = useCallback(async (sponsor: Omit<Sponsor, 'id'>) => {
    try {
      const created = await createSponsorRequest(sponsor)
      setSponsors((current) => [...current, created])
      setLastSyncError(null)
    } catch (error) {
      console.error('Erro ao adicionar patrocinador', error)
      setLastSyncError('Falha ao adicionar patrocinador.')
      throw error
    }
  }, [])

  const removeSponsor = useCallback(async (id: string) => {
    try {
      await deleteSponsorRequest(id)
      setSponsors((current) => current.filter((sponsor) => sponsor.id !== id))
      setLastSyncError(null)
    } catch (error) {
      console.error('Erro ao remover patrocinador', error)
      setLastSyncError('Falha ao remover patrocinador.')
      throw error
    }
  }, [])

  const value = useMemo(
    () => ({
      hero,
      contact,
      slides,
      gallery,
      sponsors,
      isAuthenticated,
      isLoading,
      lastSyncError,
      login,
      logout,
      updateHero,
      updateContact,
      addGalleryItem,
      removeGalleryItem,
      addSponsor,
      removeSponsor,
    }),
    [
      hero,
      contact,
      slides,
      gallery,
      sponsors,
      isAuthenticated,
      isLoading,
      lastSyncError,
      login,
      logout,
      updateHero,
      updateContact,
      addGalleryItem,
      removeGalleryItem,
      addSponsor,
      removeSponsor,
    ],
  )

  return <SiteDataContext.Provider value={value}>{children}</SiteDataContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSiteData() {
  const context = useContext(SiteDataContext)
  if (!context) {
    throw new Error('useSiteData precisa ser usado dentro do SiteDataProvider')
  }
  return context
}
