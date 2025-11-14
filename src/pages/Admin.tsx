import { type FormEvent, useEffect, useState } from 'react'
import {
  type GalleryItem,
  type HeroContent,
  type ContactInfo,
  type Sponsor,
  useSiteData,
} from '../context/SiteDataContext.tsx'

const blankGallery: Omit<GalleryItem, 'id'> = {
  title: '',
  description: '',
  image: '/images/gallery-1.svg',
  category: 'Celebração',
}

const blankSponsor: Omit<Sponsor, 'id'> = {
  name: '',
  image: '/images/Patrocinadores/BP_SONORIZAÇÃO.png',
}

export default function Admin() {
  const {
    hero,
    contact,
    gallery,
    sponsors,
    isLoading,
    lastSyncError,
    updateHero,
    updateContact,
    addGalleryItem,
    removeGalleryItem,
    addSponsor,
    removeSponsor,
    isAuthenticated,
    login,
    logout,
  } = useSiteData()
  const [heroForm, setHeroForm] = useState<HeroContent>(hero)
  const [contactForm, setContactForm] = useState<ContactInfo>(contact)
  const [galleryForm, setGalleryForm] = useState(blankGallery)
  const [sponsorForm, setSponsorForm] = useState(blankSponsor)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')

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

  const handleSponsorSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage('')
    try {
      await addSponsor(sponsorForm)
      setSponsorForm(blankSponsor)
      setMessage('Novo patrocinador adicionado!')
      setErrorMessage('')
    } catch (error) {
      console.error(error)
      setErrorMessage('Não foi possível adicionar o patrocinador.')
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
      <section className="page-card">
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

      <section className="page-card">
        <p className="eyebrow">Patrocinadores</p>
        <h2>Gerencie o carrossel de logos</h2>
        <form className="gallery-form" onSubmit={handleSponsorSubmit}>
          <label>
            Nome do patrocinador
            <input
              value={sponsorForm.name}
              onChange={(event) => setSponsorForm((prev) => ({ ...prev, name: event.target.value }))}
              required
            />
          </label>
          <label>
            Caminho da imagem (ex.: /images/Patrocinadores/logo.png)
            <input
              value={sponsorForm.image}
              onChange={(event) => setSponsorForm((prev) => ({ ...prev, image: event.target.value }))}
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
    </div>
  )
}
