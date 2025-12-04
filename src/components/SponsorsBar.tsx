import { useMemo, useState, useEffect } from 'react'
import { useSiteData } from '../context/SiteDataContext.tsx'

export default function SponsorsBar() {
  const { sponsors } = useSiteData()
  const [isMobile, setIsMobile] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  // Debug log
  useEffect(() => {
    console.log('[SponsorsBar] sponsors from context:', sponsors)
  }, [sponsors])

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Para o carrossel infinito funcionar, duplicamos os itens
  const displayItems = useMemo(() => {
    if (isMobile || sponsors.length === 0) {
      return sponsors
    }
    // Triplicar para garantir loop suave
    return [...sponsors, ...sponsors, ...sponsors]
  }, [sponsors, isMobile])

  if (!sponsors.length) {
    return null
  }

  return (
    <section className="sponsors-section reveal-on-scroll" aria-label="Patrocinadores oficiais">
      <div className="sponsors-header">
        <p className="eyebrow">Patrocínio</p>
        <h3>Quem apoia o Holywins</h3>
        <p className="sponsors-subtitle">
          Agradecemos a todos que tornam este evento possível
        </p>
      </div>
      
      {isMobile ? (
        // Mobile: Grid estático elegante
        <div className="sponsors-grid">
          {sponsors.map((sponsor) => (
            <figure key={sponsor.id} className="sponsor-card">
              <div className="sponsor-card-inner">
                <img src={sponsor.image} alt={sponsor.name} loading="lazy" />
              </div>
              <figcaption>{sponsor.name}</figcaption>
            </figure>
          ))}
        </div>
      ) : (
        // Desktop: Carrossel infinito com marquee
        <div 
          className="sponsors-marquee"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className={`sponsors-marquee-track ${isPaused ? 'paused' : ''}`}>
            {displayItems.map((sponsor, index) => (
              <figure key={`${sponsor.id}-${index}`} className="sponsor-card">
                <div className="sponsor-card-inner">
                  <img src={sponsor.image} alt={sponsor.name} loading="lazy" />
                </div>
                <figcaption>{sponsor.name}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
