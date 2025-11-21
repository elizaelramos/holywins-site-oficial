import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  createGalleryItemRequest,
  setGalleryItemCoverRequest,
  createSlideRequest,
  createSponsorRequest,
  deleteGalleryItemRequest,
  deleteSlideRequest,
  deleteSponsorRequest,
  fetchSiteData,
  saveContact,
  saveHero,
  createBannerRequest,
  updateBannerRequest,
  deleteBannerRequest,
  createCommunityRequest,
  updateCommunityRequest,
  deleteCommunityRequest,
} from '../services/api'

export type HeroContent = {
  title: string
  subtitle: string
  date: string
  location: string
  callToAction: string
  instagramPostUrl?: string | null
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
  link?: string | null
}

export type GalleryItem = {
  id: string
  title: string
  description: string
  image: string
  // Category was changed to a free string to support edition years (ex: '2022')
  category: string
  // Optional persisted share link (may be another group's key or a URL)
  shareLink?: string | null
  isCover?: boolean
}

export type Sponsor = {
  id: string
  name: string
  image: string
}

export type BannerComponentType = 'text' | 'image' | 'imageWithLink'

export type BannerAnimationType =
  | 'fadeIn'
  | 'fadeInUp'
  | 'fadeInDown'
  | 'fadeInLeft'
  | 'fadeInRight'
  | 'slideInUp'
  | 'slideInDown'
  | 'slideInLeft'
  | 'slideInRight'
  | 'zoomIn'
  | 'bounce'
  | 'none'

export type BannerTextComponent = {
  id: string
  type: 'text'
  content: string
  x: number // position in pixels
  y: number
  fontSize: number
  fontFamily: string
  fontWeight: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900'
  fontStyle: 'normal' | 'italic'
  color: string
  textAlign: 'left' | 'center' | 'right'
  animation: BannerAnimationType
  animationDelay: number // in milliseconds
  animationDuration: number // in milliseconds
  width?: number // optional width constraint
  lineHeight?: number
  textShadow?: string
}

export type BannerImageComponent = {
  id: string
  type: 'image'
  src: string
  x: number
  y: number
  width: number
  height: number
  animation: BannerAnimationType
  animationDelay: number
  animationDuration: number
  borderRadius?: number
  opacity?: number
}

export type BannerImageWithLinkComponent = {
  id: string
  type: 'imageWithLink'
  src: string
  link: string
  x: number
  y: number
  width: number
  height: number
  animation: BannerAnimationType
  animationDelay: number
  animationDuration: number
  borderRadius?: number
  opacity?: number
}

export type BannerComponent = BannerTextComponent | BannerImageComponent | BannerImageWithLinkComponent

export type Banner = {
  id: string
  title: string
  image: string // Path to GIF or MP4 file (1351x725px)
  link?: string | null
  sortOrder: number
  // Legacy/builder fields (backward compatibility)
  imageMobile?: string | null
  backgroundImage?: string | null
  components?: BannerComponent[]
  isDraft?: boolean
  isPublished?: boolean
  updatedAt?: string
}

export type Community = {
  id: string;
  name: string;
  category: 'Catedral' | 'Santuário' | 'Paróquia' | 'Capela' | 'Comunidade';
  isMain: boolean;
  parentId: string | null;
  priestName: string;
  priestPhotoUrl: string;
  massSchedule: string;
  address: string;
  phone: string;
  instagramUrl: string;
  facebookUrl: string;
  dioceseUrl: string;
  imageUrl: string;
  latitude?: number | null;
  longitude?: number | null;
};

export type Message = {
  id: string
  name: string
  email: string
  phone?: string | null
  message: string
  isRead: boolean
  createdAt: string
}

export type SiteDataState = {
  hero: HeroContent
  contact: ContactInfo
  slides: Slide[]
  gallery: GalleryItem[]
  sponsors: Sponsor[]
  banners: Banner[]
  communities: Community[]
}

const initialData: SiteDataState = {
  hero: {
    title: 'Holywins 2025',
    subtitle: 'Uma noite de luz, adoração e testemunho para toda a comunidade católica.',
    date: '31 de outubro · 19h',
    location: 'Paróquia São Miguel Arcanjo, Centro',
    callToAction: 'Quero participar',
    instagramPostUrl: null,
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
      link: '#inscricoes',
    },
    {
      id: 'slide-2',
      title: 'Adoração jovem',
      description: 'Momento de louvor conduzido pelo ministério de música Holywins.',
      image: '/images/slide-2.svg',
      accent: '#8ab5ff',
      link: '/galeria',
    },
    {
      id: 'slide-3',
      title: 'Festival de santos',
      description: 'Apresentações criativas contando histórias de santidade para toda a família.',
      image: '/images/slide-3.svg',
      accent: '#b0d4ff',
      link: '/contato',
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
  banners: [],
  communities: [],
}

type SiteDataContextValue = {
  hero: HeroContent
  contact: ContactInfo
  slides: Slide[]
  gallery: GalleryItem[]
  sponsors: Sponsor[]
  banners: Banner[]
  communities: Community[]
  isAuthenticated: boolean
  isLoading: boolean
  lastSyncError: string | null
  login: (password: string) => boolean
  logout: () => void
  updateHero: (hero: HeroContent) => Promise<void>
  updateContact: (contact: ContactInfo) => Promise<void>
  addGalleryItem: (item: Omit<GalleryItem, 'id'> | FormData) => Promise<void>
  removeGalleryItem: (id: string) => Promise<void>
  setGalleryItemCover: (id: string) => Promise<void>
  addSponsor: (formData: FormData) => Promise<void>
  removeSponsor: (id: string) => Promise<void>
  addSlide: (formData: FormData) => Promise<void>
  removeSlide: (id: string) => Promise<void>
  addBanner: (formData: FormData) => Promise<void>
  removeBanner: (id: string) => Promise<void>
  updateBanner: (id: string, formData: FormData) => Promise<void>
  addCommunity: (data: Partial<Community>) => Promise<void>
  updateCommunity: (id: string, data: Partial<Community>) => Promise<void>
  removeCommunity: (id: string) => Promise<void>
}

const SiteDataContext = createContext<SiteDataContextValue | undefined>(undefined)

export function SiteDataProvider({ children }: { children: ReactNode }) {
  const [hero, setHero] = useState(initialData.hero)
  const [contact, setContact] = useState(initialData.contact)
  const [slides, setSlides] = useState(initialData.slides)
  const [gallery, setGallery] = useState(initialData.gallery)
  const [sponsors, setSponsors] = useState(initialData.sponsors)
  const [banners, setBanners] = useState(initialData.banners)
  const [communities, setCommunities] = useState(initialData.communities)
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
        setBanners(payload.banners)
        setCommunities(payload.communities)
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

  const addGalleryItem = useCallback(async (item: Omit<GalleryItem, 'id'> | FormData) => {
    try {
      const created = await createGalleryItemRequest(item as any)
      // created may be a single item or an array when multiple files are uploaded
      if (Array.isArray(created)) {
        setGallery((current) => [...created, ...current])
      } else {
        setGallery((current) => [created, ...current])
      }
      setLastSyncError(null)
    } catch (error) {
      console.error('Erro ao adicionar galeria', error)
      setLastSyncError('Falha ao adicionar item na galeria.')
      throw error
    }
  }, [])

  const setGalleryItemCover = useCallback(async (id: string) => {
    try {
      const updated = await setGalleryItemCoverRequest(id)
      // updated is an array of items in the group; replace them in gallery state
      setGallery((current) => {
        const others = current.filter((g) => !updated.some((u) => u.id === g.id))
        return [...updated, ...others]
      })
      setLastSyncError(null)
    } catch (error) {
      console.error('Erro ao definir capa da galeria', error)
      setLastSyncError('Falha ao definir capa da galeria.')
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

  const addSlide = useCallback(async (formData: FormData) => {
    try {
      const created = await createSlideRequest(formData)
      setSlides((current) => [created, ...current])
      setLastSyncError(null)
    } catch (error) {
      console.error('Erro ao adicionar slide', error)
      setLastSyncError('Falha ao adicionar slide.')
      throw error
    }
  }, [])

  const removeSlide = useCallback(async (id: string) => {
    try {
      await deleteSlideRequest(id)
      setSlides((current) => current.filter((slide) => slide.id !== id))
      setLastSyncError(null)
    } catch (error) {
      console.error('Erro ao remover slide', error)
      setLastSyncError('Falha ao remover slide.')
      throw error
    }
  }, [])

  const addBanner = useCallback(async (formData: FormData) => {
    try {
      const created = await createBannerRequest(formData)
      setBanners((current) => [...current, created])
      setLastSyncError(null)
    } catch (error) {
      console.error('Erro ao adicionar banner', error)
      setLastSyncError('Falha ao adicionar banner.')
      throw error
    }
  }, [])

  const removeBanner = useCallback(async (id: string) => {
    try {
      await deleteBannerRequest(id)
      setBanners((current) => current.filter((banner) => banner.id !== id))
      setLastSyncError(null)
    } catch (error) {
      console.error('Erro ao remover banner', error)
      setLastSyncError('Falha ao remover banner.')
      throw error
    }
  }, [])

  const updateBanner = useCallback(async (id: string, formData: FormData) => {
    try {
      const updated = await updateBannerRequest(id, formData)
      setBanners((current) => current.map((b) => (b.id === id ? updated : b)))
      setLastSyncError(null)
    } catch (error) {
      console.error('Erro ao atualizar banner', error)
      setLastSyncError('Falha ao atualizar banner.')
      throw error
    }
  }, [])

  const addCommunity = useCallback(async (data: Partial<Community>) => {
    const created = await createCommunityRequest(data)
    setCommunities((prev) => [created, ...prev])
  }, [])

  const updateCommunityLocal = useCallback(async (id: string, data: Partial<Community>) => {
    const updated = await updateCommunityRequest(id, data)
    setCommunities((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
  }, [])

  const removeCommunity = useCallback(async (id: string) => {
    await deleteCommunityRequest(id)
    setCommunities((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const addSponsor = useCallback(async (formData: FormData) => {
    try {
      const created = await createSponsorRequest(formData)
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
      banners,
      communities,
      isAuthenticated,
      isLoading,
      lastSyncError,
      login,
      logout,
      updateHero,
      updateContact,
      addGalleryItem,
      removeGalleryItem,
      setGalleryItemCover,
      addSponsor,
      removeSponsor,
      addCommunity,
      updateCommunity: updateCommunityLocal,
      removeCommunity,
      addSlide,
      removeSlide,
      addBanner,
      removeBanner,
      updateBanner,
    }),
    [
      hero,
      contact,
      slides,
      gallery,
      sponsors,
      banners,
      communities,
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
      addCommunity,
      updateCommunityLocal,
      removeCommunity,
      addSlide,
      removeSlide,
      addBanner,
      removeBanner,
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
