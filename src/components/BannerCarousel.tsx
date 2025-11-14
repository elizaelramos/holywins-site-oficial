import { useEffect, useMemo, useState } from 'react'
import type { Banner } from '../context/SiteDataContext'

const EMOJI_SRC = '/images/emoji_santidade_Holywins.png'

type BannerCarouselProps = {
  banners: Banner[]
  autoPlayMs?: number
}

export default function BannerCarousel({ banners, autoPlayMs = 7000 }: BannerCarouselProps) {
  const sanitized = useMemo(() => {
    return [...banners]
      .filter(Boolean)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.title.localeCompare(b.title))
  }, [banners])
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (!sanitized.length) return
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % sanitized.length)
    }, autoPlayMs)
    return () => window.clearInterval(timer)
  }, [autoPlayMs, sanitized])

  if (!sanitized.length) {
    return null
  }

  const visibleIndex = activeIndex % sanitized.length
  const current = sanitized[visibleIndex]

  const card = (
    <article className="banner-card" style={{ backgroundImage: `url(${current.image})` }}>
      <div className="banner-card__overlay" />
      <div className="banner-card__content">
        <span className="banner-card__emoji" aria-hidden>
          <img src={EMOJI_SRC} alt="Emoji Holywins" />
        </span>
        <div>
          <p className="eyebrow">Destaque oficial</p>
          <h2>{current.title}</h2>
        </div>
      </div>
    </article>
  )

  const dots = (
    <div className="banner-dots" role="tablist" aria-label="Selecionar banner">
      {sanitized.map((banner, index) => (
        <button
          key={banner.id}
          className={`dot ${index === visibleIndex ? 'active' : ''}`}
          onClick={() => setActiveIndex(index)}
          aria-label={`Ver ${banner.title}`}
          aria-pressed={index === visibleIndex}
        />
      ))}
    </div>
  )

  const isExternal = current.link?.startsWith('http')

  return (
    <section className="banner-carousel" aria-label="Carrossel principal">
      {current.link ? (
        <a
          className="banner-card__link"
          href={current.link}
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noreferrer' : undefined}
        >
          {card}
        </a>
      ) : (
        card
      )}
      {dots}
    </section>
  )
}
