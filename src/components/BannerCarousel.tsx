import { useEffect, useMemo, useState } from 'react'
import type { Banner } from '../context/SiteDataContext'

const EMOJI_SRC = '/images/emoji_santidade_Holywins.png'
const API_BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:4000'

type BannerCarouselProps = {
  banners: Banner[]
  autoPlayMs?: number
}

export default function BannerCarousel({ banners, autoPlayMs = 7000 }: BannerCarouselProps) {
  const sanitized = useMemo(() => {
    return [...banners]
      .filter(Boolean)
      .filter((b) => b.isPublished !== false) // Only show published banners
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.title.localeCompare(b.title))
  }, [banners])
  const [activeIndex, setActiveIndex] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [playAnimation, setPlayAnimation] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (!sanitized.length) return
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % sanitized.length)
      setPlayAnimation(false)
      setTimeout(() => setPlayAnimation(true), 50)
    }, autoPlayMs)
    return () => window.clearInterval(timer)
  }, [autoPlayMs, sanitized])

  useEffect(() => {
    setPlayAnimation(true)
  }, [])

  if (!sanitized.length) {
    return null
  }

  const visibleIndex = activeIndex % sanitized.length
  const current = sanitized[visibleIndex]

  // Determina o arquivo do banner (GIF ou MP4)
  const bannerFile = isMobile && current.imageMobile ? current.imageMobile : current.image
  const isVideo = bannerFile.toLowerCase().endsWith('.mp4')

  // Convert relative paths to absolute backend URLs (ensure single slash between base and path)
  const bannerUrl = bannerFile.startsWith('http')
    ? bannerFile
    : `${API_BASE_URL}${bannerFile.startsWith('/') ? '' : '/'}${bannerFile}`

  const card = (
    <article className="banner-card" style={{ position: 'relative', overflow: 'hidden' }}>
      {isVideo ? (
        <video
          key={bannerUrl}
          autoPlay
          muted
          playsInline
          loop
          preload="metadata"
          onError={(e) => {
            console.warn('Banner video failed to load:', bannerUrl)
            try { (e.currentTarget as HTMLVideoElement).style.display = 'none' } catch (err) {}
          }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        >
          <source src={bannerUrl} type="video/mp4" />
        </video>
      ) : (
        <img
          key={bannerUrl}
          src={bannerUrl}
          alt={current.title}
          loading="lazy"
          onError={(e) => {
            // Hide broken image and log to console for troubleshooting
            try { e.currentTarget.style.display = 'none' } catch (err) {}
            console.warn('Banner image failed to load:', bannerUrl)
          }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
      )}
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

  const handlePrev = () => {
    setActiveIndex((current) => (current - 1 + sanitized.length) % sanitized.length)
    setPlayAnimation(false)
    setTimeout(() => setPlayAnimation(true), 50)
  }

  const handleNext = () => {
    setActiveIndex((current) => (current + 1) % sanitized.length)
    setPlayAnimation(false)
    setTimeout(() => setPlayAnimation(true), 50)
  }

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

      {sanitized.length > 1 && (
        <>
          <button
            className="banner-nav banner-nav--prev"
            onClick={handlePrev}
            aria-label="Banner anterior"
          >
            ‹
          </button>
          <button
            className="banner-nav banner-nav--next"
            onClick={handleNext}
            aria-label="Próximo banner"
          >
            ›
          </button>
        </>
      )}

      {dots}
    </section>
  )
}
