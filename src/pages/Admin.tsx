import { type FormEvent, useEffect, useState } from 'react'
import {
  type GalleryItem,
  type HeroContent,
  type ContactInfo,
  type Slide,
  type Sponsor,
  type Message,
  useSiteData,
} from '../context/SiteDataContext.tsx'
import { fetchMessagesRequest } from '../services/api'

const blankGallery: Omit<GalleryItem, 'id'> = {
  title: '',
  description: '',
  image: '/images/gallery-1.svg',
  category: 'Celebração',
}

const blankSponsor: Omit<Sponsor, 'id' | 'image'> = {
  name: '',
}

const blankSlide: Omit<Slide, 'id'> = {
  title: '',
  description: '',
  accent: '#6ac8ff',
  link: '',
}

const blankBanner = {
  title: '',
  link: '',
}

export default function Admin() {
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
    addSponsor,
    removeSponsor,
    addSlide,
    removeSlide,
    addBanner,
    removeBanner,
    // messages will be fetched separately in admin
    isAuthenticated,
    login,
    logout,
  } = useSiteData()
  const [heroForm, setHeroForm] = useState<HeroContent>(hero)
  const [contactForm, setContactForm] = useState<ContactInfo>(contact)
  const [galleryForm, setGalleryForm] = useState(blankGallery)
  const [sponsorForm, setSponsorForm] = useState(blankSponsor)
  const [slideForm, setSlideForm] = useState(blankSlide)
  const [bannerForm, setBannerForm] = useState(blankBanner)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  // Top-level tab for separate admin sections
  type TabName = 'content' | 'gallery' | 'slides' | 'sponsors' | 'banners' | 'messages'
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
      await addGalleryItem(galleryForm)
      setGalleryForm(blankGallery)
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
    formData.set('link', slideForm.link)
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
    const formData = new FormData(event.currentTarget)
    formData.set('title', bannerForm.title)
    formData.set('link', bannerForm.link)
    try {
      await addBanner(formData)
      setBannerForm(blankBanner)
      event.currentTarget.reset()
      setMessage('Novo banner publicado!')
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

  const handleLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const success = login(password)
    if (!success) {
      setLoginError('Senha incorreta. Tente novamente.')
    } else {
      setLoginError('')
      setPassword('')
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="page-stack">
        <section className="page-card">
          <p className="eyebrow">Acesso restrito</p>
          <h1>Faça login para continuar</h1>
          <form className="contact-form" onSubmit={handleLogin}>
            <label>
              Senha
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>
            <button className="primary-btn" type="submit">
              Entrar
            </button>
            {loginError && <p className="success-text" style={{ color: '#ff8ea3' }}>{loginError}</p>}
          </form>
          <p className="eyebrow">Dica</p>
          <p>A senha padrão é fornecida apenas à coordenação do Holywins.</p>
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
          Slides
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
        <button className="ghost-btn" type="button" onClick={logout}>
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
        <h2>Adicionar nova foto</h2>
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
            Caminho da imagem (ex.: /images/gallery-1.svg)
            <input
              value={galleryForm.image}
              onChange={(event) => setGalleryForm((prev) => ({ ...prev, image: event.target.value }))}
              required
            />
          </label>
          <label>
            Categoria
            <select
              value={galleryForm.category}
              onChange={(event) =>
                setGalleryForm((prev) => ({ ...prev, category: event.target.value as GalleryItem['category'] }))
              }
            >
              <option value="Celebração">Celebração</option>
              <option value="Juventude">Juventude</option>
              <option value="Ação Social">Ação Social</option>
            </select>
          </label>
          <button className="primary-btn" type="submit">
            Adicionar foto
          </button>
        </form>

        <div className="gallery-admin-list">
          {gallery.map((item) => (
            <article key={item.id}>
              <div>
                <strong>{item.title}</strong>
                <p>{item.category}</p>
              </div>
              <button className="ghost-btn" type="button" onClick={() => handleRemoveGalleryItem(item.id)}>
                Remover
              </button>
            </article>
          ))}
        </div>
      </section>
    )}

      {activeTab === 'slides' && (
        <section className="page-card">
        <p className="eyebrow">Carrossel</p>
        <h2>Adicionar novo slide</h2>
        <form className="gallery-form" onSubmit={handleSlideSubmit} encType="multipart/form-data">
          <label>
            Título
            <input
              name="title"
              value={slideForm.title}
              onChange={(event) => setSlideForm((prev) => ({ ...prev, title: event.target.value }))}
              required
            />
          </label>
          <label>
            Descrição
            <textarea
              name="description"
              rows={3}
              value={slideForm.description}
              onChange={(event) => setSlideForm((prev) => ({ ...prev, description: event.target.value }))}
              required
            />
          </label>
          <label>
            Link (opcional)
            <input
              name="link"
              value={slideForm.link}
              onChange={(event) => setSlideForm((prev) => ({ ...prev, link: event.target.value }))}
              placeholder="/contato"
            />
          </label>
          <label>
            Cor de destaque
            <input
              type="color"
              name="accent"
              value={slideForm.accent}
              onChange={(event) => setSlideForm((prev) => ({ ...prev, accent: event.target.value }))}
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
            Adicionar slide
          </button>
        </form>

        <div className="gallery-admin-list" style={{ marginTop: '1.5rem' }}>
          {slides.map((slide) => (
            <article key={slide.id}>
              <div>
                <strong>{slide.title}</strong>
                <p>{slide.description}</p>
                {slide.link && (
                  <p>
                    <a href={slide.link} target="_blank" rel="noreferrer">
                      {slide.link}
                    </a>
                  </p>
                )}
              </div>
              <button className="ghost-btn" type="button" onClick={() => handleRemoveSlide(slide.id)}>
                Remover
              </button>
            </article>
          ))}
          {!slides.length && <p>Nenhum slide cadastrado.</p>}
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
      {activeTab === 'banners' && (
        <section className="page-card">
          <p className="eyebrow">Banners</p>
          <h2>Atualize a faixa principal</h2>
          <p>Envie artes oficiais com 1920x640px para a melhor experiência em desktop e mobile.</p>
          <form className="gallery-form" onSubmit={handleBannerSubmit} encType="multipart/form-data">
            <label>
              Título do banner
              <input
                name="title"
                value={bannerForm.title}
                onChange={(event) => setBannerForm((prev) => ({ ...prev, title: event.target.value }))}
                required
              />
            </label>
            <label>
              Link (opcional)
              <input
                name="link"
                value={bannerForm.link}
                onChange={(event) => setBannerForm((prev) => ({ ...prev, link: event.target.value }))}
                placeholder="https://instagram.com/holywinsbr"
              />
            </label>
            <label>
              Selecionar imagem
              <input type="file" name="image" accept="image/*" required />
            </label>
            <button className="primary-btn" type="submit">
              Publicar banner
            </button>
          </form>

          <div className="gallery-admin-list" style={{ marginTop: '1.5rem' }}>
            {banners.length ? (
              banners
                .slice()
                .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.title.localeCompare(b.title))
                .map((banner) => (
                  <article key={banner.id}>
                    <div>
                      <strong>{banner.title}</strong>
                      <p>{banner.link || 'Sem link'}</p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{banner.image}</p>
                    </div>
                    <button className="ghost-btn" type="button" onClick={() => handleRemoveBanner(banner.id)}>
                      Remover
                    </button>
                  </article>
                ))
            ) : (
              <p>Nenhum banner cadastrado.</p>
            )}
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
  )
}
