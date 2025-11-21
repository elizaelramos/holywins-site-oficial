import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  type GalleryItem,
  type HeroContent,
  type ContactInfo,
  type Slide,
  type Sponsor,
  type Banner,
  type Community,
  type Message,
  useSiteData,
} from '../context/SiteDataContext.tsx'
import { fetchMessagesRequest } from '../services/api'
import { useAuth } from '../hooks/useAuth'

const blankGallery: Omit<GalleryItem, 'id'> = {
  title: '',
  description: '',
  image: '/images/gallery-1.svg',
  category: String(new Date().getFullYear()),
}

const blankSponsor: Omit<Sponsor, 'id' | 'image'> = {
  name: '',
}

const blankSlide: Omit<Slide, 'id'> = {
  title: '',
  description: '',
  accent: '#6ac8ff',
  link: '',
  image: '/images/slide-1.svg',
}
    

const blankBanner = {
  title: '',
  link: '',
}

export default function Admin() {
  const navigate = useNavigate()
  const { user, logout: authLogout, isAdmin, isAuthenticated, loading: authLoading } = useAuth()
  const {
    hero,
    contact,
    gallery,
    sponsors,
    slides,
    banners,
    isLoading,
    lastSyncError,
    updateHero,
    updateContact,
    addGalleryItem,
    removeGalleryItem,
    setGalleryItemCover,
    addSponsor,
    removeSponsor,
    addSlide,
    removeSlide,
    addBanner,
    updateBanner,
    removeBanner,
    communities,
    addCommunity,
    updateCommunity: updateCommunityLocal,
    removeCommunity,
  } = useSiteData()

  const handleLogout = async () => {
    await authLogout()
    navigate('/login')
  }
  const [heroForm, setHeroForm] = useState<HeroContent>(hero)
  const [contactForm, setContactForm] = useState<ContactInfo>(contact)
  const [galleryForm, setGalleryForm] = useState(blankGallery)
  const [galleryPreview, setGalleryPreview] = useState<string[]>([])
  const [expandedGalleryKey, setExpandedGalleryKey] = useState<string | null>(null)
  const [sponsorForm, setSponsorForm] = useState(blankSponsor)
  const [slideForm, setSlideForm] = useState(blankSlide)
  const [isCreatingBanner, setIsCreatingBanner] = useState(false)
  const [newBannerForm, setNewBannerForm] = useState<{
    title?: string
    link?: string
    sortOrder?: number
    imageFile?: File
  }>({})
  const [newCommunityForm, setNewCommunityForm] = useState<Partial<Community>>({ name: '', address: '', category: 'Comunidade' })
  
  const newCommunityMapRef = useRef<HTMLDivElement | null>(null)
  const newCommunityMapInstance = useRef<L.Map | null>(null)
  const [newCommunityMarker, setNewCommunityMarker] = useState<L.Marker | null>(null)
  const [newCommunityImagePreview, setNewCommunityImagePreview] = useState<string | null>(null)
  const [newCommunityPriestPreview, setNewCommunityPriestPreview] = useState<string | null>(null)
  const editCommunityMapRef = useRef<HTMLDivElement | null>(null)
  const editCommunityMapInstance = useRef<L.Map | null>(null)
  const editCommunityMarker = useRef<L.Marker | null>(null)
  const [editCommunityImagePreview, setEditCommunityImagePreview] = useState<string | null>(null)
  const [editCommunityPriestPreview, setEditCommunityPriestPreview] = useState<string | null>(null)
  const [editingCommunityId, setEditingCommunityId] = useState<string | null>(null)
  const [editCommunityForm, setEditCommunityForm] = useState<Partial<Community> | null>(null)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [momentsVersion, setMomentsVersion] = useState(0)
  const [playlistVersion, setPlaylistVersion] = useState(0)
  // Top-level tab for separate admin sections
  type TabName = 'content' | 'gallery' | 'slides' | 'playlist' | 'sponsors' | 'banners' | 'messages' | 'igrejas'
  const [activeTab, setActiveTab] = useState<TabName>('content')

  useEffect(() => {
    setHeroForm(hero)
  }, [hero])

  useEffect(() => {
    setContactForm(contact)
  }, [contact])

  const handleHeroSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage('')
    try {
      await updateHero(heroForm)
      setMessage('Informações principais atualizadas com sucesso!')
      setErrorMessage('')
    } catch (error) {
      console.error(error)
      setErrorMessage('Não foi possível salvar o hero. Confira o servidor e tente novamente.')
    }
  }

  const handleContactSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage('')
    try {
      await updateContact(contactForm)
      setMessage('Contatos atualizados!')
      setErrorMessage('')
    } catch (error) {
      console.error(error)
      setErrorMessage('Erro ao salvar os dados de contato.')
    }
  }

  const handleGallerySubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage('')
    try {
      const formData = new FormData(event.currentTarget)
      formData.set('title', galleryForm.title)
      formData.set('description', galleryForm.description)
      formData.set('category', galleryForm.category)
      await addGalleryItem(formData)
      setGalleryForm(blankGallery)
      event.currentTarget.reset()
      setGalleryPreview([])
      setMessage('Nova foto adicionada à galeria!')
      setErrorMessage('')
    } catch (error) {
      console.error(error)
      setErrorMessage('Não foi possível cadastrar a foto.')
    }
  }

  const handleSlideSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage('')
    const formData = new FormData(event.currentTarget)
    formData.set('title', slideForm.title)
    formData.set('description', slideForm.description)
    formData.set('accent', slideForm.accent)
    formData.set('link', slideForm.link ?? '')
    try {
      await addSlide(formData)
      setSlideForm(blankSlide)
      event.currentTarget.reset()
      setMessage('Novo slide adicionado ao carrossel!')
      setErrorMessage('')
    } catch (error) {
      console.error(error)
      setErrorMessage('Não foi possível adicionar o slide.')
    }
  }

  const handleSponsorSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage('')
    const formData = new FormData(event.currentTarget)
    formData.set('name', sponsorForm.name)
    try {
      await addSponsor(formData)
      setSponsorForm(blankSponsor)
      event.currentTarget.reset()
      setMessage('Novo patrocinador adicionado!')
      setErrorMessage('')
    } catch (error) {
      console.error(error)
      setErrorMessage('Não foi possível adicionar o patrocinador.')
    }
  }

  const handleBannerSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage('')
    try {
      const formData = new FormData(event.currentTarget)
      formData.set('title', bannerForm.title)
      formData.set('link', bannerForm.link ?? '')
      const imageInput = event.currentTarget.querySelector('input[name="image"]') as HTMLInputElement
      const imageMobileInput = event.currentTarget.querySelector('input[name="imageMobile"]') as HTMLInputElement
      if (imageInput?.files?.[0]) {
        formData.set('image', imageInput.files[0])
      }
      if (imageMobileInput?.files?.[0]) {
        formData.set('imageMobile', imageMobileInput.files[0])
      }
      await addBanner(formData)
      setBannerForm(blankBanner)
      event.currentTarget.reset()
      setMessage('Banner publicado com sucesso!')
      setErrorMessage('')
    } catch (error) {
      console.error(error)
      setErrorMessage('Não foi possível adicionar o banner.')
    }
  }

  const handleRemoveGalleryItem = async (id: string) => {
    setMessage('')
    try {
      await removeGalleryItem(id)
      setMessage('Item da galeria removido.')
      setErrorMessage('')
    } catch (error) {
      console.error(error)
      setErrorMessage('Erro ao remover item da galeria.')
    }
  }

  const handleRemoveGalleryGroup = async (images: { id: string }[]) => {
    if (!confirm('Remover todas as imagens desta galeria? Esta ação não pode ser desfeita.')) return
    setMessage('')
    try {
      await Promise.all(images.map((img) => removeGalleryItem(img.id)))
      setMessage('Galeria removida com sucesso.')
      setErrorMessage('')
      setExpandedGalleryKey(null)
    } catch (error) {
      console.error(error)
      setErrorMessage('Erro ao remover galeria.')
    }
  }

  // Small component to preview current moments (Link Rápido) config - now supports multiple entries
  function MomentsPreview() {
    const [entries, setEntries] = useState<Array<{ id: string; images: string[]; link: string }> | null>(null)

    const load = async () => {
      try {
        const resp = await fetch(`${import.meta.env.VITE_API_URL ?? '/api'}/moments`)
        if (!resp.ok) throw new Error('failed')
        const json = await resp.json()
        setEntries(json)
      } catch (err) {
        console.warn('Could not load moments preview', err)
        setEntries([])
      }
    }

    useEffect(() => { void load() }, [])

    if (!entries) return <p>Carregando configuração atual...</p>

    if (!entries.length) return <p>Nenhum Link Rápido cadastrado.</p>

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {entries.map((e) => (
          <div key={e.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 8, borderRadius: 8, background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {(e.images || []).map((img) => (
                <img key={img} src={img} alt="moment" style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 6 }} />
              ))}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.95rem' }}><strong>Link:</strong> {e.link || <em>Nenhum</em>}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>ID: {e.id}</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="ghost-btn" type="button" onClick={async () => {
                if (!confirm('Remover este Link Rápido?')) return
                try {
                  const resp = await fetch(`${import.meta.env.VITE_API_URL ?? '/api'}/moments/${e.id}`, { method: 'DELETE' })
                  if (!resp.ok) throw new Error('failed')
                  await load()
                } catch (err) {
                  console.error(err)
                  alert('Falha ao remover o item')
                }
              }}>Remover</button>
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Playlist preview + management
  function PlaylistPreview() {
    const [entries, setEntries] = useState<Array<{ id: string; title: string; youtube: string; audio?: string }> | null>(null)

    const load = async () => {
      try {
        const resp = await fetch(`${import.meta.env.VITE_API_URL ?? '/api'}/playlist`)
        if (!resp.ok) throw new Error('failed')
        const json = await resp.json()
        setEntries(json)
      } catch (err) {
        console.warn('Could not load playlist preview', err)
        setEntries([])
      }
    }

    useEffect(() => { void load() }, [playlistVersion])

    if (!entries) return <p>Carregando playlist...</p>
    if (!entries.length) return <p>Nenhuma música na playlist.</p>

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {entries.map((e) => (
          <div key={e.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 8 }}>
            <div style={{ flex: 1 }}>
              <strong>{e.title}</strong>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{e.youtube || <em>Sem link YouTube</em>}</div>
              {e.audio && <div style={{ marginTop: 6 }}><a href={e.audio} target="_blank" rel="noreferrer">Baixar MP3</a></div>}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="ghost-btn" type="button" onClick={async () => {
                if (!confirm('Remover esta música da playlist?')) return
                try {
                  const resp = await fetch(`${import.meta.env.VITE_API_URL ?? '/api'}/playlist/${e.id}`, { method: 'DELETE' })
                  if (!resp.ok) throw new Error('failed')
                  setPlaylistVersion(v => v + 1)
                } catch (err) {
                  console.error(err)
                  alert('Falha ao remover a música')
                }
              }}>Remover</button>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const galleryGroups = useMemo<{
    key: string
    title: string
    description: string
    category: GalleryItem['category']
    images: GalleryItem[]
  }[]>(() => {
    const map = new Map<string, { title: string; description: string; category: GalleryItem['category']; images: GalleryItem[] }>()
    for (const item of gallery) {
      const key = `${item.title}||${item.description}||${item.category}`
      if (!map.has(key)) {
        map.set(key, { title: item.title, description: item.description, category: item.category, images: [item] })
      } else {
        map.get(key)!.images.push(item)
      }
    }
    return Array.from(map.entries()).map(([key, value]) => ({ key, ...value }))
  }, [gallery])

  const handleRemoveSponsor = async (id: string) => {
    setMessage('')
    try {
      await removeSponsor(id)
      setMessage('Patrocinador removido.')
      setErrorMessage('')
    } catch (error) {
      console.error(error)
      setErrorMessage('Erro ao remover patrocinador.')
    }
  }

  const handleRemoveSlide = async (id: string) => {
    setMessage('')
    try {
      await removeSlide(id)
      setMessage('Slide removido do carrossel.')
      setErrorMessage('')
    } catch (error) {
      console.error(error)
      setErrorMessage('Erro ao remover o slide.')
    }
  }

  const handleRemoveBanner = async (id: string) => {
    setMessage('')
    try {
      await removeBanner(id)
      setMessage('Banner removido.')
      setErrorMessage('')
    } catch (error) {
      console.error(error)
      setErrorMessage('Erro ao remover o banner.')
    }
  }

  const handleAddBanner = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage('')
    setErrorMessage('')

    if (!newBannerForm.title || !newBannerForm.imageFile) {
      setErrorMessage('Título e arquivo são obrigatórios.')
      return
    }

    try {
      const formData = new FormData()
      formData.append('title', newBannerForm.title)
      formData.append('image', newBannerForm.imageFile)
      if (newBannerForm.link) {
        formData.append('link', newBannerForm.link)
      }
      formData.append('sortOrder', String(newBannerForm.sortOrder ?? 0))

      await addBanner(formData)
      setMessage('Banner adicionado com sucesso!')
      setNewBannerForm({})
      setIsCreatingBanner(false)
    } catch (error) {
      console.error('Erro ao adicionar banner:', error)
      setErrorMessage('Não foi possível adicionar o banner.')
    }
  }

  const handleCancelBannerBuilder = () => {
    setIsCreatingBanner(false)
    setNewBannerForm({})
  }

  const handleCreateNewBanner = () => {
    setNewBannerForm({})
    setIsCreatingBanner(true)
  }

  // Communities admin actions
  const handleAddCommunity = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage('')
    setErrorMessage('')
    
    console.log('=== ADICIONAR COMUNIDADE ===')
    console.log('newCommunityForm:', newCommunityForm)
    
    try {
      // If there are files in the form, send as FormData; otherwise send JSON
      const formElement = event.currentTarget
      const imageInput = formElement.querySelector('input[name="image"]') as HTMLInputElement
      const priestPhotoInput = formElement.querySelector('input[name="priestPhoto"]') as HTMLInputElement
      const hasFiles = !!(imageInput?.files?.length || priestPhotoInput?.files?.length)
      
      console.log('hasFiles:', hasFiles)
      console.log('imageInput files:', imageInput?.files?.length)
      console.log('priestPhotoInput files:', priestPhotoInput?.files?.length)
      
      if (hasFiles) {
        const payload = new FormData()
        Object.entries(newCommunityForm).forEach(([k, v]) => { 
          if (v !== undefined && v !== null) {
            payload.set(k, String(v))
            console.log(`FormData: ${k} = ${v}`)
          }
        })
        if (imageInput?.files?.[0]) {
          payload.set('image', imageInput.files[0])
          setNewCommunityImagePreview(URL.createObjectURL(imageInput.files[0]))
          console.log('Adicionou imagem ao FormData')
        }
        if (priestPhotoInput?.files?.[0]) {
          payload.set('priestPhoto', priestPhotoInput.files[0])
          setNewCommunityPriestPreview(URL.createObjectURL(priestPhotoInput.files[0]))
          console.log('Adicionou foto do pároco ao FormData')
        }
        console.log('Enviando FormData...')
        await addCommunity(payload as unknown as Partial<Community>)
      } else {
        console.log('Enviando JSON:', newCommunityForm)
        await addCommunity(newCommunityForm)
      }
      
      console.log('Igreja adicionada com sucesso!')
      setNewCommunityForm({ name: '', address: '', category: 'Comunidade' })
      setNewCommunityImagePreview(null)
      setNewCommunityPriestPreview(null)
      setMessage('Igreja adicionada com sucesso!')
      setErrorMessage('')
    } catch (error) {
      console.error('Erro ao adicionar igreja:', error)
      setErrorMessage(`Não foi possível adicionar igreja: ${error instanceof Error ? error.message : 'erro desconhecido'}`)
    }
  }

  const handleEditCommunity = (id: string) => {
    const community = communities.find((c) => c.id === id)
    if (!community) return
    setEditingCommunityId(id)
    setEditCommunityForm({ ...community })
    setTimeout(() => {
      // initialize map for editing if coordinates exist
      if (editCommunityMapRef.current && !editCommunityMapInstance.current) {
        const map = L.map(editCommunityMapRef.current, { center: [-19.00706698361968, -57.651763387259805], zoom: 13 })
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map)
        editCommunityMapInstance.current = map
      }
      if (community.latitude && community.longitude && editCommunityMapInstance.current) {
        const m = L.marker([community.latitude, community.longitude]).addTo(editCommunityMapInstance.current)
        editCommunityMarker.current = m
        editCommunityMapInstance.current.setView([community.latitude, community.longitude], 14)
      }
    }, 50)
  }

  const handleCancelEditCommunity = () => {
    setEditingCommunityId(null)
    setEditCommunityForm(null)
    if (editCommunityMarker.current) {
      editCommunityMarker.current.remove()
      editCommunityMarker.current = null
    }
    if (editCommunityMapInstance.current) {
      editCommunityMapInstance.current.remove()
      editCommunityMapInstance.current = null
    }
  }

  const handleSaveCommunity = async (id: string) => {
    if (!editCommunityForm) {
      console.error('editCommunityForm está vazio')
      return
    }
    setMessage('')
    setErrorMessage('')
    
    console.log('Salvando comunidade:', id, editCommunityForm)
    
    try {
      // Check for files in the editing article
      const imageInput = document.querySelector(`input[data-community-image-id='${id}']`) as HTMLInputElement
      const priestPhotoInput = document.querySelector(`input[data-community-priest-id='${id}']`) as HTMLInputElement
      const hasFiles = !!(imageInput?.files?.length || priestPhotoInput?.files?.length)
      
      console.log('hasFiles:', hasFiles, 'imageInput:', imageInput, 'priestPhotoInput:', priestPhotoInput)
      
      if (hasFiles) {
        const fd = new FormData()
        Object.entries(editCommunityForm).forEach(([k, v]) => { 
          if (v !== undefined && v !== null) {
            fd.set(k, String(v))
          }
        })
        if (imageInput?.files?.[0]) fd.set('image', imageInput.files[0])
        if (priestPhotoInput?.files?.[0]) fd.set('priestPhoto', priestPhotoInput.files[0])
        console.log('Enviando FormData com arquivos')
        await updateCommunityLocal(id, fd as unknown as Partial<Community>)
      } else {
        console.log('Enviando JSON sem arquivos')
        await updateCommunityLocal(id, editCommunityForm)
      }
      
      setMessage('Igreja atualizada com sucesso!')
      setErrorMessage('')
      setEditingCommunityId(null)
      setEditCommunityForm(null)
      setEditCommunityImagePreview(null)
      setEditCommunityPriestPreview(null)
      
      // Limpar o mapa de edição
      if (editCommunityMarker.current) {
        editCommunityMarker.current.remove()
        editCommunityMarker.current = null
      }
      if (editCommunityMapInstance.current) {
        editCommunityMapInstance.current.remove()
        editCommunityMapInstance.current = null
      }
    } catch (error) {
      console.error('Erro ao salvar igreja:', error)
      setErrorMessage(`Não foi possível salvar a igreja: ${error instanceof Error ? error.message : 'erro desconhecido'}`)
    }
  }

  // Initialize new community map when igrejas tab is active
  useEffect(() => {
    if (activeTab !== 'igrejas') return
    
    const timer = setTimeout(() => {
      if (!newCommunityMapRef.current || newCommunityMapInstance.current) return
      
      console.log('Inicializando mapa de nova comunidade...')
      const map = L.map(newCommunityMapRef.current, { center: [-19.00706698361968, -57.651763387259805], zoom: 13 })
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map)
      newCommunityMapInstance.current = map
      
      map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng
        console.log('Coordenadas clicadas:', lat, lng)
        setNewCommunityForm((prev) => ({ ...prev, latitude: lat, longitude: lng }))
        if (newCommunityMarker) newCommunityMarker.remove()
        const m = L.marker([lat, lng]).addTo(map)
        setNewCommunityMarker(m)
      })
    }, 200)
    
    return () => clearTimeout(timer)
  }, [activeTab, newCommunityMarker])

  // Initialize / observe edit community map after DOM updates
  useEffect(() => {
    if (!editingCommunityId) return

    // Wait for DOM to render the edit map container
    const id = editingCommunityId
    setTimeout(() => {
      if (!editCommunityMapRef.current) return
      if (editCommunityMapInstance.current) {
        editCommunityMapInstance.current.remove()
        editCommunityMapInstance.current = null
      }
      const map = L.map(editCommunityMapRef.current, { center: [-19.00706698361968, -57.651763387259805], zoom: 13 })
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map)
      editCommunityMapInstance.current = map
      const c = communities.find((c) => c.id === id)
      if (c && c.latitude && c.longitude) {
        const m = L.marker([c.latitude, c.longitude]).addTo(map)
        editCommunityMarker.current = m
        map.setView([c.latitude, c.longitude], 14)
      }
      map.on('click', (e) => {
        const { lat, lng } = e.latlng
        setEditCommunityForm((prev) => ({ ...prev!, latitude: lat, longitude: lng }))
        if (editCommunityMarker.current) editCommunityMarker.current.remove()
        const m = L.marker([lat, lng]).addTo(map)
        editCommunityMarker.current = m
      })
    }, 100)
  }, [editingCommunityId, communities])

  const handleDeleteCommunity = async (id: string) => {
    if (!confirm('Remover igreja? Esta ação não pode ser desfeita.')) return
    setMessage('')
    try {
      await removeCommunity(id)
      setMessage('Igreja removida!')
      setErrorMessage('')
    } catch (error) {
      console.error(error)
      setErrorMessage('Erro ao remover a igreja.')
    }
  }

  // Messages listing
  const [messages, setMessages] = useState<Message[]>([])
  const fetchMessages = async () => {
    try {
      const data = await fetchMessagesRequest()
      setMessages(data)
    } catch (err) {
      console.error('Erro ao buscar mensagens', err)
    }
  }

  useEffect(() => {
    if (isAuthenticated && activeTab === 'messages') {
      void fetchMessages()
    }
  }, [isAuthenticated, activeTab])

  // Deletion of messages is reserved for DB administration only. UI does not expose a delete action.

  // If the user is not authenticated via server session, redirect to the dedicated login page
  // which performs server authentication (`/api/auth/login`). This allows using credentials
  // like `admin` / `admin123` seeded in the DB.
  useEffect(() => {
    // Wait for auth check to finish before redirecting to login
    if (!isAuthenticated && !authLoading) {
      navigate('/login')
    }
  }, [isAuthenticated, authLoading, navigate])

  if (!isAuthenticated) {
    return (
      <div className="page-stack">
        <section className="page-card">
          <p className="eyebrow">Redirecionando</p>
          <h1>Acesso restrito</h1>
          <p>Você será levado para a tela de login.</p>
        </section>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="page-stack">
        <section className="page-card">
          <p className="eyebrow">Carregando painel</p>
          <h1>Sincronizando com o banco de dados…</h1>
          <p>Mantenha o servidor em execução para editar o conteúdo.</p>
        </section>
      </div>
    )
  }

  return (
    <>
      {/* Admin Navigation Bar */}
      <div style={{
        background: 'rgba(2, 13, 38, 0.95)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)',
        padding: '1rem 2rem',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '1400px',
          margin: '0 auto',
        }}>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <Link to="/" style={{ fontSize: '1.25rem', fontWeight: 'bold', textDecoration: 'none' }}>
              Holywins Admin
            </Link>
            <nav style={{ display: 'flex', gap: '1rem' }}>
              <Link to="/admin" className="ghost-btn" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
                Conteúdo
              </Link>
              {isAdmin && (
                <>
                  <Link to="/admin/users" className="ghost-btn" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
                    Usuários
                  </Link>
                  <Link to="/admin/logs" className="ghost-btn" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
                    Logs
                  </Link>
                </>
              )}
              <Link to="/admin/profile" className="ghost-btn" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
                Perfil
              </Link>
            </nav>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              {user?.username} ({user?.role === 'admin' ? 'Admin' : 'Editor'})
            </span>
            <button onClick={handleLogout} className="ghost-btn" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
              Sair
            </button>
          </div>
        </div>
      </div>

      <div className="page-stack">
        {/* Top navigation tabs to toggle admin sections */}
        <div className="admin-tabs" role="tablist" aria-label="Admin sections">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'content'}
          className={`admin-tab ${activeTab === 'content' ? 'admin-tab--active' : ''}`}
          onClick={() => setActiveTab('content')}
        >
          Conteúdo
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'gallery'}
          className={`admin-tab ${activeTab === 'gallery' ? 'admin-tab--active' : ''}`}
          onClick={() => setActiveTab('gallery')}
        >
          Galeria
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'slides'}
          className={`admin-tab ${activeTab === 'slides' ? 'admin-tab--active' : ''}`}
          onClick={() => setActiveTab('slides')}
        >
          Link Rápido
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'playlist'}
          className={`admin-tab ${activeTab === 'playlist' ? 'admin-tab--active' : ''}`}
          onClick={() => setActiveTab('playlist')}
        >
          Playlist
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'sponsors'}
          className={`admin-tab ${activeTab === 'sponsors' ? 'admin-tab--active' : ''}`}
          onClick={() => setActiveTab('sponsors')}
        >
          Patrocinadores
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'banners'}
          className={`admin-tab ${activeTab === 'banners' ? 'admin-tab--active' : ''}`}
          onClick={() => setActiveTab('banners')}
        >
          Banners
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'igrejas'}
          className={`admin-tab ${activeTab === 'igrejas' ? 'admin-tab--active' : ''}`}
          onClick={() => setActiveTab('igrejas')}
        >
          Igrejas
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'messages'}
          className={`admin-tab ${activeTab === 'messages' ? 'admin-tab--active' : ''}`}
          onClick={() => setActiveTab('messages')}
        >
          Mensagens
        </button>
      </div>

      <section className="page-card" style={{ display: activeTab === 'gallery' ? undefined : 'none' }}>
        <p className="eyebrow">Painel administrativo</p>
        <h1>Gerencie o conteúdo em tempo real</h1>
        <p>As alterações são gravadas diretamente no banco MySQL configurado para a API.</p>
        {message && <p className="success-text">{message}</p>}
        {(errorMessage || lastSyncError) && (
          <p className="success-text" style={{ color: '#ff8ea3' }}>
            {errorMessage || lastSyncError}
          </p>
        )}
        <button className="ghost-btn" type="button" onClick={handleLogout}>
          Sair do painel
        </button>
      </section>

      {activeTab === 'content' && (
        <section className="page-card admin-grid">
        <form onSubmit={handleHeroSubmit}>
          <p className="eyebrow">Hero</p>
          <h2>Chamada principal</h2>
          <label>
            Título
            <input
              value={heroForm.title}
              onChange={(event) => setHeroForm((prev) => ({ ...prev, title: event.target.value }))}
              required
            />
          </label>
          <label>
            Subtítulo
            <textarea
              rows={3}
              value={heroForm.subtitle}
              onChange={(event) => setHeroForm((prev) => ({ ...prev, subtitle: event.target.value }))}
              required
            />
          </label>
          <label>
            Data
            <input
              value={heroForm.date}
              onChange={(event) => setHeroForm((prev) => ({ ...prev, date: event.target.value }))}
              required
            />
          </label>
          <label>
            Local
            <input
              value={heroForm.location}
              onChange={(event) => setHeroForm((prev) => ({ ...prev, location: event.target.value }))}
              required
            />
          </label>
          <label>
            Call to action
            <input
              value={heroForm.callToAction}
              onChange={(event) => setHeroForm((prev) => ({ ...prev, callToAction: event.target.value }))}
              required
            />
          </label>
          <label>
            URL do post do Instagram (opcional)
            <input
              type="url"
              value={heroForm.instagramPostUrl || ''}
              onChange={(event) => setHeroForm((prev) => ({ ...prev, instagramPostUrl: event.target.value || null }))}
              placeholder="https://www.instagram.com/p/ABC123..."
            />
          </label>
          <button className="primary-btn" type="submit">
            Atualizar hero
          </button>
        </form>

        <form onSubmit={handleContactSubmit}>
          <p className="eyebrow">Contato</p>
          <h2>Atualize os canais</h2>
          <label>
            Telefone
            <input
              value={contactForm.phone}
              onChange={(event) => setContactForm((prev) => ({ ...prev, phone: event.target.value }))}
              required
            />
          </label>
          <label>
            WhatsApp
            <input
              value={contactForm.whatsapp}
              onChange={(event) => setContactForm((prev) => ({ ...prev, whatsapp: event.target.value }))}
              required
            />
          </label>
          <label>
            E-mail
            <input
              value={contactForm.email}
              onChange={(event) => setContactForm((prev) => ({ ...prev, email: event.target.value }))}
              required
            />
          </label>
          <label>
            Endereço
            <input
              value={contactForm.address}
              onChange={(event) => setContactForm((prev) => ({ ...prev, address: event.target.value }))}
              required
            />
          </label>
          <label>
            Expediente
            <input
              value={contactForm.officeHours}
              onChange={(event) => setContactForm((prev) => ({ ...prev, officeHours: event.target.value }))}
              required
            />
          </label>
          <button className="primary-btn" type="submit">
            Atualizar contato
          </button>
        </form>
        </section>
      )}
    {activeTab === 'gallery' && (
      <section className="page-card">
        <p className="eyebrow">Galeria</p>
        <h2>Adicionar nova galeria</h2>
        <form className="gallery-form" onSubmit={handleGallerySubmit}>
          <label>
            Título
            <input
              value={galleryForm.title}
              onChange={(event) => setGalleryForm((prev) => ({ ...prev, title: event.target.value }))}
              required
            />
          </label>
          <label>
            Descrição
            <textarea
              rows={3}
              value={galleryForm.description}
              onChange={(event) => setGalleryForm((prev) => ({ ...prev, description: event.target.value }))}
              required
            />
          </label>
          <label>
            Selecionar imagens (múltiplas)
            <input
              type="file"
              name="images"
              accept="image/*"
              required
              multiple
              onChange={(event) => {
                const files = Array.from((event.target as HTMLInputElement).files || [])
                if (files.length) {
                  const urls = files.map((f) => URL.createObjectURL(f))
                  setGalleryPreview(urls)
                } else {
                  setGalleryPreview([])
                }
              }}
            />
            {galleryPreview.length > 0 && (
              <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {galleryPreview.map((p, i) => (
                  <img key={i} src={p} alt={`Prévia ${i + 1}`} style={{ maxWidth: 120, display: 'block' }} />
                ))}
              </div>
            )}
          </label>
          <label>
            Edição
            <select
              value={galleryForm.category}
              onChange={(event) => setGalleryForm((prev) => ({ ...prev, category: event.target.value }))}
            >
              {
                // generate years from 2022 to current year (newest first)
              }
              {(() => {
                const start = 2022
                const end = new Date().getFullYear()
                const years = [] as string[]
                for (let y = end; y >= start; y--) years.push(String(y))
                return years.map((y) => <option key={y} value={y}>{y}</option>)
              })()}
            </select>
          </label>
          <button className="primary-btn" type="submit">
            Adicionar foto
          </button>
        </form>

        <div className="gallery-admin-list">
          {galleryGroups.map((group) => (
            <article key={group.key} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.5rem 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <img src={group.images[0].image} alt={group.title} style={{ width: 96, height: 64, objectFit: 'cover', borderRadius: 6 }} />
                  <div>
                    <strong>{group.title}</strong>
                    <p style={{ margin: 0 }}>{group.category} · {group.images.length} imagem(s)</p>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>{group.description}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={() => setExpandedGalleryKey(expandedGalleryKey === group.key ? null : group.key)}
                  >
                    {expandedGalleryKey === group.key ? 'Fechar' : 'Abrir'}
                  </button>
                  <button className="ghost-btn" type="button" onClick={() => handleRemoveGalleryGroup(group.images)}>
                    Remover galeria
                  </button>
                </div>
              </div>
              {expandedGalleryKey === group.key && (
                <div style={{ width: '100%', marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <div style={{ width: '100%', marginBottom: 8 }}>
                    <label style={{ display: 'block', marginBottom: 6 }}>
                      Link de compartilhamento (cole um `group.key` ou URL)
                      <input
                        value={group.images[0].shareLink ?? ''}
                        onChange={(e) => {
                          // optimistic in-memory update of the first image; save applies to all images
                          const v = e.target.value
                          setGalleryForm((prev) => prev) // noop to keep lint happy
                        }}
                        placeholder="/galeria?group=... ou https://..."
                      />
                    </label>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      <button
                        className="primary-btn"
                        type="button"
                        onClick={async () => {
                          const link = (document.activeElement as HTMLElement)?.closest('label')?.querySelector('input')?.value ?? ''
                          if (!link) return alert('Informe o link a ser gravado.')
                          if (!confirm('Aplicar este link a todas as imagens desta galeria?')) return
                          try {
                            // update each image in the group with the shareLink
                            await Promise.all(group.images.map((img) => updateGalleryItemRequest(img.id, { shareLink: link })))
                            setMessage('Link salvo para a galeria.')
                            setErrorMessage('')
                          } catch (err) {
                            console.error(err)
                            setErrorMessage('Falha ao salvar o link da galeria.')
                          }
                        }}
                      >
                        Salvar link
                      </button>
                      <button
                        className="ghost-btn"
                        type="button"
                        onClick={() => {
                          // copy share URL to clipboard
                          const key = encodeURIComponent(group.key)
                          const url = `${location.origin}/galeria?group=${key}`
                          navigator.clipboard.writeText(url).then(() => alert('Link de galeria copiado!')).catch(() => alert('Não foi possível copiar o link.'))
                        }}
                      >
                        Copiar link da galeria
                      </button>
                    </div>
                  </div>

                  {group.images.map((img) => (
                    <div key={img.id} style={{ width: 120, textAlign: 'center' }}>
                      <img src={img.image} alt={img.title} style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 4 }} />
                      <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                        {img.isCover ? (
                          <span style={{ padding: '0.25rem 0.5rem', background: 'rgba(255,255,255,0.06)', borderRadius: 4 }}>Capa</span>
                        ) : (
                          <button
                            className="ghost-btn"
                            type="button"
                            style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                            onClick={async () => {
                              try {
                                await setGalleryItemCover(img.id)
                                setMessage('Capa atualizada com sucesso.')
                                setErrorMessage('')
                              } catch (err) {
                                console.error(err)
                                setErrorMessage('Não foi possível atualizar a capa.')
                              }
                            }}
                          >
                            Definir capa
                          </button>
                        )}
                        <button className="ghost-btn" type="button" style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }} onClick={() => handleRemoveGalleryItem(img.id)}>Remover</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      </section>
    )}

      {activeTab === 'slides' && (
        <section className="page-card">
          <p className="eyebrow">Link Rápido</p>
          <h2>Gerenciar seção "RELEMBRE OS MOMENTOS MARCANTES"</h2>
          <p>Envie até 3 imagens PNG (.png) e um link opcional que a seção usará.</p>
          <form
            className="gallery-form"
            onSubmit={async (e) => {
              e.preventDefault()
              setMessage('')
              setErrorMessage('')
              try {
                const formData = new FormData(e.currentTarget as HTMLFormElement)
                const resp = await fetch(`${import.meta.env.VITE_API_URL ?? '/api'}/moments`, {
                  method: 'POST',
                  body: formData,
                })
                if (!resp.ok) throw new Error(await resp.text())
                const created = await resp.json()
                setMessage('Link Rápido criado com sucesso!')
                setMomentsVersion((v) => v + 1)
                ;(e.currentTarget as HTMLFormElement).reset()
              } catch (err) {
                console.error(err)
                setErrorMessage('Não foi possível criar Link Rápido.')
              }
            }}
            encType="multipart/form-data"
          >
            <label>
              Imagem 1 (PNG)
              <input type="file" name="image1" accept="image/png" />
            </label>
            <label>
              Imagem 2 (PNG)
              <input type="file" name="image2" accept="image/png" />
            </label>
            <label>
              Imagem 3 (PNG)
              <input type="file" name="image3" accept="image/png" />
            </label>
            <label>
              Link (opcional)
              <input type="text" name="link" placeholder="/galeria ou https://..." />
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button className="primary-btn" type="submit">Criar Link Rápido</button>
              <button
                className="ghost-btn"
                type="button"
                onClick={async () => {
                  if (!confirm('Remover todos os Links Rápidos? Esta ação remove também os arquivos enviados.')) return
                  try {
                    const resp = await fetch(`${import.meta.env.VITE_API_URL ?? '/api'}/moments`, { method: 'DELETE' })
                    if (!resp.ok) throw new Error('failed')
                    setMessage('Todos os Links Rápidos foram removidos.')
                    setMomentsVersion((v) => v + 1)
                  } catch (err) {
                    console.error(err)
                    setErrorMessage('Falha ao remover Links Rápidos.')
                  }
                }}
              >
                Remover todos
              </button>
            </div>
          </form>

          <div className="gallery-admin-list" style={{ marginTop: '1.5rem' }}>
            {/* Show current moments config (refreshes quando momentsVersion muda) */}
            <div key={`moments-${momentsVersion}`}>
              <MomentsPreview />
            </div>
          </div>
        </section>
      )}

      {activeTab === 'playlist' && (
        <section className="page-card">
          <p className="eyebrow">Playlist</p>
          <h2>Gerenciar Playlist Holywins</h2>
          <p>Adicione músicas à playlist: título, link público do YouTube (opcional) e arquivo MP3.</p>
          <form className="gallery-form" onSubmit={async (e) => {
            e.preventDefault()
            setMessage('')
            setErrorMessage('')
            try {
              const formData = new FormData(e.currentTarget as HTMLFormElement)
              const resp = await fetch(`${import.meta.env.VITE_API_URL ?? '/api'}/playlist`, { method: 'POST', body: formData })
              if (!resp.ok) throw new Error(await resp.text())
              setMessage('Música adicionada à playlist!')
              setPlaylistVersion(v => v + 1)
              ;(e.currentTarget as HTMLFormElement).reset()
            } catch (err) {
              console.error(err)
              setErrorMessage('Não foi possível adicionar a música.')
            }
          }} encType="multipart/form-data">
            <label>
              Título
              <input name="title" required />
            </label>
            <label>
              Link público do YouTube (https://www.youtube.com/watch?v=...)
              <input name="youtube" placeholder="https://..." />
            </label>
            <label>
              Arquivo MP3
              <input type="file" name="audio" accept="audio/mpeg,audio/mp3" />
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="primary-btn" type="submit">Adicionar música</button>
              <button className="ghost-btn" type="button" onClick={async () => {
                if (!confirm('Remover todas as músicas da playlist?')) return
                try {
                  const resp = await fetch(`${import.meta.env.VITE_API_URL ?? '/api'}/playlist`, { method: 'DELETE' })
                  if (!resp.ok) throw new Error('failed')
                  setMessage('Playlist limpa.')
                  setPlaylistVersion(v => v + 1)
                } catch (err) {
                  console.error(err)
                  setErrorMessage('Falha ao limpar a playlist')
                }
              }}>Limpar playlist</button>
            </div>
          </form>

          <div style={{ marginTop: 16 }}>
            <PlaylistPreview />
          </div>
        </section>
      )}

      {activeTab === 'sponsors' && (
        <section className="page-card">
        <p className="eyebrow">Patrocinadores</p>
        <h2>Gerencie o carrossel de logos</h2>
        <form className="gallery-form" onSubmit={handleSponsorSubmit} encType="multipart/form-data">
          <label>
            Nome do patrocinador
            <input
              name="name"
              value={sponsorForm.name}
              onChange={(event) => setSponsorForm((prev) => ({ ...prev, name: event.target.value }))}
              required
            />
          </label>
          <label>
            Selecionar imagem
            <input
              type="file"
              name="image"
              accept="image/*"
              required
            />
          </label>
          <button className="primary-btn" type="submit">
            Adicionar patrocinador
          </button>
        </form>

        <div className="gallery-admin-list" style={{ marginTop: '1.5rem' }}>
          {sponsors.map((sponsor) => (
            <article key={sponsor.id}>
              <div>
                <strong>{sponsor.name}</strong>
                <p>{sponsor.image}</p>
              </div>
              <button className="ghost-btn" type="button" onClick={() => handleRemoveSponsor(sponsor.id)}>
                Remover
              </button>
            </article>
          ))}
          {!sponsors.length && <p>Nenhum patrocinador cadastrado.</p>}
        </div>
        </section>
      )}
      {activeTab === 'banners' && !isCreatingBanner && (
        <section className="page-card">
          <p className="eyebrow">Banners</p>
          <h2>Gerencie os banners do site</h2>
          <p>
            Adicione banners em formato GIF ou MP4. Dimensões recomendadas: <strong>1351x725px</strong>.
          </p>

          <div style={{ marginBottom: '1.5rem' }}>
            <button className="primary-btn" type="button" onClick={handleCreateNewBanner}>
              ✨ Criar Novo Banner
            </button>
          </div>

          <div className="gallery-admin-list">
            {banners.length ? (
              banners
                .slice()
                .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.title.localeCompare(b.title))
                .map((banner) => (
                  <article key={banner.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <strong>{banner.title}</strong>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        Arquivo: {banner.image}
                      </p>
                      {banner.link && <p style={{ margin: 0, fontSize: '0.85rem' }}>Link: {banner.link}</p>}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="ghost-btn"
                        type="button"
                        onClick={() => handleRemoveBanner(banner.id)}
                        style={{ color: '#ff4444' }}
                      >
                        🗑️ Remover
                      </button>
                    </div>
                  </article>
                ))
            ) : (
              <p>Nenhum banner cadastrado. Crie seu primeiro banner customizado!</p>
            )}
          </div>
        </section>
      )}

      {activeTab === 'banners' && isCreatingBanner && (
        <section className="page-card">
          <p className="eyebrow">Novo Banner</p>
          <h2>Adicionar Banner (GIF ou MP4)</h2>
          <p>
            Faça upload de um arquivo GIF ou MP4 com dimensões de <strong>1351x725px</strong>.
          </p>

          <form onSubmit={handleAddBanner} className="gallery-form">
            <label>
              Título (interno, não visível no site)
              <input
                value={newBannerForm.title ?? ''}
                onChange={(e) => setNewBannerForm((prev) => ({ ...prev, title: e.target.value }))}
                required
              />
            </label>

            <label>
              Arquivo (GIF ou MP4 - 1351x725px)
              <input
                type="file"
                accept=".gif,.mp4,video/mp4,image/gif"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setNewBannerForm((prev) => ({ ...prev, imageFile: file }))
                  }
                }}
                required
              />
            </label>

            <label>
              Link (opcional)
              <input
                type="url"
                value={newBannerForm.link ?? ''}
                onChange={(e) => setNewBannerForm((prev) => ({ ...prev, link: e.target.value }))}
                placeholder="https://..."
              />
            </label>

            <label>
              Ordem de Exibição
              <input
                type="number"
                min="0"
                value={newBannerForm.sortOrder ?? 0}
                onChange={(e) => setNewBannerForm((prev) => ({ ...prev, sortOrder: Number(e.target.value) }))}
              />
            </label>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button className="primary-btn" type="submit">
                ✓ Adicionar Banner
              </button>
              <button className="ghost-btn" type="button" onClick={handleCancelBannerBuilder}>
                Cancelar
              </button>
            </div>
          </form>
        </section>
      )}

      {activeTab === 'igrejas' && (
        <section className="page-card">
          <p className="eyebrow">Igrejas</p>
          <h2>Gerenciar igrejas</h2>
          <form onSubmit={handleAddCommunity} className="gallery-form">
            <label>
              Nome
              <input
                value={newCommunityForm.name ?? ''}
                onChange={(e) => setNewCommunityForm((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            </label>
            <label>
              Categoria
              <select
                value={newCommunityForm.category ?? 'Comunidade'}
                onChange={(e) => setNewCommunityForm((prev) => ({ ...prev, category: e.target.value as Community['category'] }))}
                required
              >
                <option value="Catedral">Catedral</option>
                <option value="Santuário">Santuário</option>
                <option value="Paróquia">Paróquia</option>
                <option value="Capela">Capela</option>
                <option value="Comunidade">Comunidade</option>
              </select>
            </label>
            <label>
              Igreja Principal (opcional)
              <select
                value={newCommunityForm.parentId ?? ''}
                onChange={(e) => setNewCommunityForm((prev) => ({ ...prev, parentId: e.target.value || null }))}
              >
                <option value="">Nenhuma (é independente)</option>
                {communities.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.category})</option>
                ))}
              </select>
            </label>
            <label>
              <input
                type="checkbox"
                checked={newCommunityForm.isMain ?? false}
                onChange={(e) => setNewCommunityForm((prev) => ({ ...prev, isMain: e.target.checked }))}
                style={{ width: 'auto', marginRight: '0.5rem' }}
              />
              Esta é uma igreja principal/matriz
            </label>
            <label>
              Endereço
              <input
                value={newCommunityForm.address ?? ''}
                onChange={(e) => setNewCommunityForm((prev) => ({ ...prev, address: e.target.value }))}
                required
              />
            </label>
            <label>
              Telefone
              <input
                value={newCommunityForm.phone ?? ''}
                onChange={(e) => setNewCommunityForm((prev) => ({ ...prev, phone: e.target.value }))}
              />
            </label>
            <label>
              Horários de Missa
              <input
                value={newCommunityForm.massSchedule ?? ''}
                onChange={(e) => setNewCommunityForm((prev) => ({ ...prev, massSchedule: e.target.value }))}
              />
            </label>
            <label>
              Nome do Pároco
              <input
                value={newCommunityForm.priestName ?? ''}
                onChange={(e) => setNewCommunityForm((prev) => ({ ...prev, priestName: e.target.value }))}
              />
            </label>
            <label>
              Instagram (URL completa)
              <input
                value={newCommunityForm.instagramUrl ?? ''}
                onChange={(e) => setNewCommunityForm((prev) => ({ ...prev, instagramUrl: e.target.value }))}
                placeholder="https://www.instagram.com/exemplo"
              />
            </label>
            <label>
              Facebook (URL completa)
              <input
                value={newCommunityForm.facebookUrl ?? ''}
                onChange={(e) => setNewCommunityForm((prev) => ({ ...prev, facebookUrl: e.target.value }))}
                placeholder="https://www.facebook.com/exemplo"
              />
            </label>
            <label>
              Link Diocese (URL completa)
              <input
                value={newCommunityForm.dioceseUrl ?? ''}
                onChange={(e) => setNewCommunityForm((prev) => ({ ...prev, dioceseUrl: e.target.value }))}
                placeholder="https://diocesecorumba.org.br/paroquia/exemplo"
              />
            </label>
            <label>
              Foto da Comunidade
                      <input type="file" name="image" accept="image/*" onChange={(e) => {
                const f = (e.target as HTMLInputElement).files?.[0]
                if (f) setNewCommunityImagePreview(URL.createObjectURL(f))
              }} />
              {newCommunityImagePreview && <img src={newCommunityImagePreview} alt="preview" style={{ width: 120, marginTop: 8 }} />}
            </label>
            <label>
              Foto do Pároco
                      <input type="file" name="priestPhoto" accept="image/*" onChange={(e) => {
                const f = (e.target as HTMLInputElement).files?.[0]
                if (f) setNewCommunityPriestPreview(URL.createObjectURL(f))
              }} />
              {newCommunityPriestPreview && <img src={newCommunityPriestPreview} alt="priest preview" style={{ width: 88, marginTop: 8, borderRadius: 999 }} />}
            </label>
            <button className="primary-btn" type="submit">Adicionar igreja</button>
          </form>

            <div style={{ marginTop: '0.75rem' }}>
              <div style={{ marginBottom: '0.5rem' }}>Clique no mapa para selecionar coordenadas</div>
              <div ref={newCommunityMapRef} style={{ height: 220, borderRadius: 12, overflow: 'hidden' }} />
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                Lat: {newCommunityForm.latitude ?? '-'} · Lng: {newCommunityForm.longitude ?? '-'}
              </div>
            </div>

          <div style={{ marginTop: '1.25rem' }}>
            {communities.map((c) => (
              <article key={c.id} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div style={{ flex: 1 }}>
                  {editingCommunityId === c.id ? (
                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                      <input placeholder="Nome" value={editCommunityForm?.name ?? ''} onChange={(e) => setEditCommunityForm((prev) => ({ ...prev!, name: e.target.value }))} />
                      <select value={editCommunityForm?.category ?? 'Comunidade'} onChange={(e) => setEditCommunityForm((prev) => ({ ...prev!, category: e.target.value as Community['category'] }))}>
                        <option value="Catedral">Catedral</option>
                        <option value="Santuário">Santuário</option>
                        <option value="Paróquia">Paróquia</option>
                        <option value="Capela">Capela</option>
                        <option value="Comunidade">Comunidade</option>
                      </select>
                      <select value={editCommunityForm?.parentId ?? ''} onChange={(e) => setEditCommunityForm((prev) => ({ ...prev!, parentId: e.target.value || null }))}>
                        <option value="">Nenhuma (independente)</option>
                        {communities.filter(comm => comm.id !== c.id).map(comm => (
                          <option key={comm.id} value={comm.id}>{comm.name} ({comm.category})</option>
                        ))}
                      </select>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input
                          type="checkbox"
                          checked={editCommunityForm?.isMain ?? false}
                          onChange={(e) => setEditCommunityForm((prev) => ({ ...prev!, isMain: e.target.checked }))}
                          style={{ width: 'auto' }}
                        />
                        Igreja principal/matriz
                      </label>
                      <input placeholder="Endereço" value={editCommunityForm?.address ?? ''} onChange={(e) => setEditCommunityForm((prev) => ({ ...prev!, address: e.target.value }))} />
                      <input placeholder="Telefone" value={editCommunityForm?.phone ?? ''} onChange={(e) => setEditCommunityForm((prev) => ({ ...prev!, phone: e.target.value }))} />
                      <input placeholder="Horários de Missa" value={editCommunityForm?.massSchedule ?? ''} onChange={(e) => setEditCommunityForm((prev) => ({ ...prev!, massSchedule: e.target.value }))} />
                      <input placeholder="Nome do Pároco" value={editCommunityForm?.priestName ?? ''} onChange={(e) => setEditCommunityForm((prev) => ({ ...prev!, priestName: e.target.value }))} />
                      <input placeholder="Instagram (URL)" value={editCommunityForm?.instagramUrl ?? ''} onChange={(e) => setEditCommunityForm((prev) => ({ ...prev!, instagramUrl: e.target.value }))} />
                      <input placeholder="Facebook (URL)" value={editCommunityForm?.facebookUrl ?? ''} onChange={(e) => setEditCommunityForm((prev) => ({ ...prev!, facebookUrl: e.target.value }))} />
                      <input placeholder="Link Diocese (URL)" value={editCommunityForm?.dioceseUrl ?? ''} onChange={(e) => setEditCommunityForm((prev) => ({ ...prev!, dioceseUrl: e.target.value }))} />
                      <label>
                        Foto da Comunidade
                        <input data-community-image-id={c.id} type="file" name="image" accept="image/*" onChange={(e) => {
                          const f = (e.target as HTMLInputElement).files?.[0]
                          if (f) setEditCommunityImagePreview(URL.createObjectURL(f))
                        }} />
                        {editCommunityImagePreview && <img src={editCommunityImagePreview} alt="preview" style={{ width: 120, marginTop: 8 }} />}
                      </label>
                      <label>
                        Foto do Pároco
                        <input data-community-priest-id={c.id} type="file" name="priestPhoto" accept="image/*" onChange={(e) => {
                          const f = (e.target as HTMLInputElement).files?.[0]
                          if (f) setEditCommunityPriestPreview(URL.createObjectURL(f))
                        }} />
                        {editCommunityPriestPreview && <img src={editCommunityPriestPreview} alt="priest preview" style={{ width: 88, marginTop: 8, borderRadius: 999 }} />}
                      </label>
                      <div style={{ marginTop: '0.5rem' }}>
                        <div ref={editCommunityMapRef} style={{ height: 180, borderRadius: 12, overflow: 'hidden' }} />
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                          Lat: {editCommunityForm?.latitude ?? '-'} · Lng: {editCommunityForm?.longitude ?? '-'}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <strong>{c.name}</strong>
                      <p style={{ margin: 0 }}>{c.address}</p>
                      <p style={{ margin: 0 }}>{c.phone}</p>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {editingCommunityId === c.id ? (
                    <>
                      <button className="ghost-btn" type="button" onClick={() => handleSaveCommunity(c.id)}>Salvar</button>
                      <button className="ghost-btn" type="button" onClick={handleCancelEditCommunity}>Cancelar</button>
                    </>
                  ) : (
                    <>
                      <button className="ghost-btn" type="button" onClick={() => handleEditCommunity(c.id)}>Editar</button>
                      <button className="ghost-btn" type="button" onClick={() => handleDeleteCommunity(c.id)}>Remover</button>
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
      {activeTab === 'messages' && (
        <section className="page-card">
        <p className="eyebrow">Contatos</p>
        <h2>Mensagens recebidas</h2>
        <div className="gallery-admin-list" style={{ marginTop: '1.5rem' }}>
          {messages.length ? (
            <table className="messages-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>E-mail</th>
                  <th>Telefone</th>
                  <th>Mensagem</th>
                  <th>Data de envio</th>
                </tr>
              </thead>
              <tbody>
                {messages.map((m) => (
                  <tr key={m.id}>
                    <td data-label="Nome">{m.name}</td>
                    <td data-label="E-mail">{m.email}</td>
                    <td data-label="Telefone">{m.phone ?? '-'}</td>
                    <td data-label="Mensagem" style={{ maxWidth: '45ch', wordBreak: 'break-word' }}>{m.message}</td>
                    <td data-label="Data de envio">{m.createdAt ? new Date(m.createdAt).toLocaleString('pt-BR') : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>Nenhuma mensagem recebida.</p>
          )}
          {!messages.length && <p>Nenhuma mensagem recebida.</p>}
        </div>
        </section>
      )}
    </div>
    </>
  )
}
