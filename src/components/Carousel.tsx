import { useEffect, useMemo, useState } from 'react'
import type { Slide } from '../context/SiteDataContext.tsx'

type CarouselProps = {
  slides: Slide[]
  autoPlayMs?: number
}

export default function Carousel({ slides, autoPlayMs = 6000 }: CarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  const sanitizedSlides = useMemo(() => slides.filter(Boolean), [slides])

  useEffect(() => {
    if (!sanitizedSlides.length || isPaused) {
      return
    }

    const id = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % sanitizedSlides.length)
    }, autoPlayMs)

    return () => window.clearInterval(id)
  }, [autoPlayMs, sanitizedSlides, isPaused])

  if (!sanitizedSlides.length) {
    return (
      <div className="carousel placeholder">
        <p>Nenhum slide cadastrado ainda.</p>
      </div>
    )
  }

  const goTo = (index: number) => {
    setActiveIndex((index + sanitizedSlides.length) % sanitizedSlides.length)
  }

  const currentSlide = sanitizedSlides[activeIndex]

  return (
    <section
      className="carousel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-roledescription="carrossel"
    >
      <div className="carousel-visual">
        <img src={currentSlide.image} alt={currentSlide.title} loading="lazy" />
        <span className="carousel-pill" style={{ background: currentSlide.accent }}>
          {activeIndex + 1}/{sanitizedSlides.length}
        </span>
      </div>

      <article className="carousel-content">
        <p className="eyebrow">Próxima experiência</p>
        <h3>{currentSlide.title}</h3>
        <p>{currentSlide.description}</p>
        <div className="carousel-controls">
          <button type="button" onClick={() => goTo(activeIndex - 1)} aria-label="Slide anterior">
            ◀
          </button>
          <button type="button" onClick={() => goTo(activeIndex + 1)} aria-label="Próximo slide">
            ▶
          </button>
        </div>
      </article>

      <div className="carousel-indicators" role="tablist" aria-label="Selecione o slide do carrossel">
        {sanitizedSlides.map((slide, index) => (
          <button
            key={slide.id}
            className={`dot ${index === activeIndex ? 'active' : ''}`}
            onClick={() => goTo(index)}
            aria-label={`Ir para ${slide.title}`}
            aria-pressed={index === activeIndex}
          />
        ))}
      </div>
    </section>
  )
}
