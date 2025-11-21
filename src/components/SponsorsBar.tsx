import { useMemo, useState, useEffect } from 'react'
import { useSiteData } from '../context/SiteDataContext.tsx'

export default function SponsorsBar() {
  const { sponsors } = useSiteData()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  // No mobile: mostra todos sem duplicar. No desktop: duplica para carrossel infinito
  const displayItems = useMemo(() => {
    if (isMobile) {
      return sponsors
    }
    const repeats = sponsors.length < 5 ? 4 : 2
    return Array(repeats).fill(sponsors).flat()
  }, [sponsors, isMobile])

  if (!sponsors.length) {
    return null
  }

  return (
    <section className="sponsors-wrapper reveal-on-scroll" aria-label="Patrocinadores oficiais">
      <div className="sponsors-title">
        <p className="eyebrow">Patrocínio</p>
        <h3>Quem apoia o Holywins</h3>
      </div>
      <div className="sponsors-bar">
        <div className="sponsors-track">
          {displayItems.map((sponsor, index) => (
            <figure key={`${sponsor.id}-${index}`} className="sponsor-pill">
              <img src={sponsor.image} alt={sponsor.name} loading="lazy" />
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
