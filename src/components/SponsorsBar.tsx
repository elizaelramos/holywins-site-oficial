import { useMemo } from 'react'
import { useSiteData } from '../context/SiteDataContext.tsx'

export default function SponsorsBar() {
  const { sponsors } = useSiteData()
  const marqueeItems = useMemo(() => [...sponsors, ...sponsors], [sponsors])

  if (!sponsors.length) {
    return null
  }

  return (
    <section className="sponsors-wrapper" aria-label="Patrocinadores oficiais">
      <div className="sponsors-title">
        <p className="eyebrow">Patrocínio</p>
        <h3>Quem apoia o Holywins</h3>
      </div>
      <div className="sponsors-bar">
        <div className="sponsors-track">
          {marqueeItems.map((sponsor, index) => (
            <figure key={`${sponsor.id}-${index}`} className="sponsor-pill">
              <img src={sponsor.image} alt={sponsor.name} loading="lazy" />
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
