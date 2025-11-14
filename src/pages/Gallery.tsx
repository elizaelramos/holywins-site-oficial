import { useMemo, useState } from 'react'
import { useSiteData } from '../context/SiteDataContext.tsx'

export default function Gallery() {
  const { gallery } = useSiteData()
  const categories = useMemo(() => ['Todos', ...new Set(gallery.map((item) => item.category))], [gallery])
  const [activeFilter, setActiveFilter] = useState('Todos')

  const filteredItems =
    activeFilter === 'Todos' ? gallery : gallery.filter((item) => item.category === activeFilter)

  return (
    <div className="page-stack">
      <section className="page-card">
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

      <section className="gallery-grid">
        {filteredItems.map((item) => (
          <figure key={item.id} className="gallery-card">
            <img src={item.image} alt={item.title} loading="lazy" />
            <figcaption>
              <p className="eyebrow">{item.category}</p>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </figcaption>
          </figure>
        ))}
        {!filteredItems.length && (
          <div className="empty-state">
            <p>Nenhum registro para este filtro ainda.</p>
          </div>
        )}
      </section>
    </div>
  )
}
