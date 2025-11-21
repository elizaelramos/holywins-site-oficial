import { useMemo, useState, useEffect } from 'react'
import { useSiteData, type GalleryItem } from '../context/SiteDataContext.tsx'

export default function Gallery() {
  const { gallery } = useSiteData()
  const categories = useMemo(() => ['Todos', ...new Set(gallery.map((item) => item.category))], [gallery])
  const [activeFilter, setActiveFilter] = useState('Todos')

  const [selectedGroup, setSelectedGroup] = useState<null | { key: string; title: string; description: string; category: string; images: GalleryItem[] }>(null)
  const [viewerIndex, setViewerIndex] = useState<number | null>(null)

  // Group items by title+description+category so a "gallery" can contain multiple images
  const groups = useMemo(() => {
    const map = new Map<string, { title: string; description: string; category: GalleryItem['category']; images: GalleryItem[] }>()
    for (const item of gallery) {
      const key = `${item.title}||${item.description}||${item.category}`
      if (!map.has(key)) {
        map.set(key, { title: item.title, description: item.description, category: item.category, images: [item] })
      } else {
        map.get(key)!.images.push(item)
      }
    }
    return Array.from(map.entries()).map(([key, value]) => {
      // Ensure cover image comes first
      value.images.sort((a, b) => (Number(b.isCover ?? 0) - Number(a.isCover ?? 0)))
      return ({ key, ...value })
    })
  }, [gallery])

  const filteredGroups = useMemo(() => {
    if (activeFilter === 'Todos') return groups
    return groups.filter((g) => g.category === activeFilter)
  }, [groups, activeFilter])

  // Keyboard navigation for image viewer
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (viewerIndex === null) return
      if (e.key === 'ArrowRight') setViewerIndex((i) => (i === null ? null : Math.min((selectedGroup?.images.length ?? 1) - 1, i + 1)))
      if (e.key === 'ArrowLeft') setViewerIndex((i) => (i === null ? null : Math.max(0, i - 1)))
      if (e.key === 'Escape') setViewerIndex(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [viewerIndex, selectedGroup])

  // When switching groups, reset viewer
  useEffect(() => {
    setViewerIndex(null)
  }, [selectedGroup])

  // helpers to open/close groups and keep URL in sync
  const openGroup = (g: { key: string; title: string; description: string; category: string; images: GalleryItem[] }) => {
    setSelectedGroup(g)
    try {
      const params = new URLSearchParams(window.location.search)
      params.set('group', g.key)
      history.replaceState(null, '', window.location.pathname + '?' + params.toString())
    } catch (err) {
      // ignore
    }
  }

  const closeGroup = () => {
    setSelectedGroup(null)
    try {
      const params = new URLSearchParams(window.location.search)
      params.delete('group')
      const newUrl = params.toString() ? window.location.pathname + '?' + params.toString() : window.location.pathname
      history.replaceState(null, '', newUrl)
    } catch (err) {
      // ignore
    }
    // Force elements to be visible immediately after closing
    setTimeout(() => {
      document.querySelectorAll<HTMLElement>('.reveal-on-scroll').forEach((el) => {
        el.classList.add('is-visible')
      })
    }, 0)
  }

  // If a ?group=... param is present, open that gallery automatically
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const enc = params.get('group')
    if (!enc) return
    try {
      const key = enc
      const match = groups.find((g) => g.key === key)
      if (match) {
        // use openGroup so URL/state stay in sync
        const params2 = new URLSearchParams(window.location.search)
        params2.set('group', match.key)
        history.replaceState(null, '', window.location.pathname + '?' + params2.toString())
        setSelectedGroup(match)
      }
    } catch (err) {
      console.warn('Group param invalid', err)
    }
  }, [groups])

  if (selectedGroup) {
    return (
      <div className="page-stack">
        <section className="page-card">
          <button className="ghost-btn" type="button" onClick={() => closeGroup()}>&larr; Voltar</button>
          <p className="eyebrow">{selectedGroup.category}</p>
          <h2>{selectedGroup.title}</h2>
          <p style={{ marginBottom: '1rem' }}>{selectedGroup.description}</p>
        </section>

        <section style={{ padding: '0 1rem 2rem' }}>
          <div className="gallery-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
            {selectedGroup.images.map((img, idx) => (
              <figure key={img.id} style={{ margin: 0, cursor: 'pointer' }}>
                <img
                  src={img.image}
                  alt={img.title}
                  style={{ width: '100%', height: '180px', objectFit: 'cover' }}
                  onClick={() => setViewerIndex(idx)}
                />
              </figure>
            ))}
          </div>
        </section>

        {viewerIndex !== null && selectedGroup && (
          <div
            role="dialog"
            aria-modal="true"
            className="lightbox-overlay"
            onClick={() => setViewerIndex(null)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000
            }}
          >
            <div style={{ position: 'relative', maxWidth: '95%', maxHeight: '95%' }} onClick={(e) => e.stopPropagation()}>
              <img
                src={selectedGroup.images[viewerIndex].image}
                alt={selectedGroup.images[viewerIndex].title}
                style={{ maxWidth: '100%', maxHeight: '80vh', display: 'block', margin: '0 auto' }}
              />
              <button
                aria-label="Fechar"
                onClick={() => setViewerIndex(null)}
                style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', padding: '6px 8px', cursor: 'pointer' }}
              >✕</button>
              <button
                aria-label="Anterior"
                onClick={() => setViewerIndex((i) => (i === null ? null : Math.max(0, i - 1)))}
                style={{ position: 'absolute', left: -40, top: '50%', transform: 'translateY(-50%)', background: 'transparent', color: '#fff', border: 'none', fontSize: '2rem', cursor: 'pointer' }}
              >
                ‹
              </button>
              <button
                aria-label="Próxima"
                onClick={() => setViewerIndex((i) => (i === null ? null : Math.min((selectedGroup.images.length ?? 1) - 1, i + 1)))}
                style={{ position: 'absolute', right: -40, top: '50%', transform: 'translateY(-50%)', background: 'transparent', color: '#fff', border: 'none', fontSize: '2rem', cursor: 'pointer' }}
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="page-stack">
      <section className="page-card reveal-on-scroll">
        <p className="eyebrow">Galeria oficial</p>
        <h1>Memórias que inspiram santidade</h1>
        <p>
          Confira registros das últimas edições e compartilhe com sua pastoral. Toda imagem possui autorização de uso
          concedida pelas famílias participantes.
        </p>
        <div className="filter-row" role="tablist" aria-label="Filtrar galeria">
          {categories.map((category) => (
            <button
              key={category}
              className={`chip ${activeFilter === category ? 'chip--active' : ''}`}
              onClick={() => setActiveFilter(category)}
              aria-pressed={activeFilter === category}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      <section className="gallery-grid reveal-on-scroll">
        {filteredGroups.map((group) => (
          <article key={group.key} className="gallery-card" style={{ cursor: 'default' }}>
            <img src={group.images[0].image} alt={group.title} loading="lazy" />
            <figcaption>
              <p className="eyebrow">{group.category}</p>
              <h3>{group.title}</h3>
              <p>{group.description}</p>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{group.images.length} imagem(s)</p>
              <div style={{ marginTop: '0.5rem' }}>
                <button
                  className="ghost-btn"
                  type="button"
                  onClick={() => openGroup(group)}
                >
                  Ver imagens
                </button>
              </div>
            </figcaption>
          </article>
        ))}
        {!filteredGroups.length && (
          <div className="empty-state">
            <p>Nenhum registro para este filtro ainda.</p>
          </div>
        )}
      </section>
    </div>
  )
}
