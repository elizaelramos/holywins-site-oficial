import { useEffect, useRef, useState } from 'react'

type Item = { id: string; title: string; youtube?: string; audio?: string }

export default function PlaylistCarousel({ items, autoPlayMs = 5000 }: { items: Item[]; autoPlayMs?: number }) {
  const [active, setActive] = useState(0)
  const [playingIndex, setPlayingIndex] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isPaused, setIsPaused] = useState(false)
  const [winW, setWinW] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1200)

  useEffect(() => {
    if (!items.length || isPaused || playingIndex !== null) return
    const id = window.setInterval(() => setActive((a) => (a + 1) % items.length), autoPlayMs)
    return () => window.clearInterval(id)
  }, [items.length, autoPlayMs, isPaused, playingIndex])

  useEffect(() => {
    if (!containerRef.current) return
    const el = containerRef.current
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      el.style.setProperty('--mx', String((x / rect.width - 0.5) * 20))
      el.style.setProperty('--my', String((y / rect.height - 0.5) * -8))
    }
    el.addEventListener('mousemove', onMove)
    return () => el.removeEventListener('mousemove', onMove)
  }, [])

  useEffect(() => {
    const onResize = () => setWinW(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  if (!items.length) return null

  const go = (i: number) => setActive((i + items.length) % items.length)

  // coverflow tuning constants
  const SPACING_X = 48 // percent spacing between slides (used for desktop/tablet)
  const DEPTH_Z = 120 // px translateZ per step (higher = deeper)
  const ROT_Y = 18 // degrees rotation per step
  const SCALE_STEP = 0.12 // scale reduction per step

  const extractYouTubeId = (url?: string) => {
    if (!url) return null
    const m = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/)
    return m ? m[1] : null
  }

  const thumbnailFor = (url?: string) => {
    const id = extractYouTubeId(url)
    if (!id) return null
    return `https://img.youtube.com/vi/${id}/hqdefault.jpg`
  }



  const togglePlay = (i: number, youtube?: string) => {
    if (!youtube) {
      // no youtube, just toggle off any playing embed
      setPlayingIndex(null)
      return
    }
    setPlayingIndex((p) => (p === i ? null : i))
  }

  return (
    <section
      className="playlist-carousel"
      ref={containerRef}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="pc-viewport">
        {items.map((it, i) => {
          const offset = ((i - active) % items.length + items.length) % items.length
          // normalize to -floor(n/2)..+floor(n/2)
          const half = Math.floor(items.length / 2)
          const pos = offset > half ? offset - items.length : offset
          // compute pixel-based offset so the active slide sits exactly at container center
          const slideEl = containerRef.current?.querySelector('.pc-slide') as HTMLElement | null
          const slideW = slideEl ? slideEl.offsetWidth : 260
          const gapEl = containerRef.current?.querySelector('.pc-viewport') as HTMLElement | null
          const gap = gapEl ? parseInt(getComputedStyle(gapEl).gap || '16') : 16
          const spacingPx = slideW + gap
          const offsetPx = pos * spacingPx
          // Use pixel-based offset for precise centering on all sizes
          const transform = `translateX(calc(-50% + ${offsetPx}px)) translateZ(${-Math.abs(pos) * DEPTH_Z}px) rotateY(${pos * -ROT_Y}deg) scale(${1 - Math.abs(pos) * SCALE_STEP}) translateY(-50%)`
          const zIndex = items.length - Math.abs(pos)
          const thumb = thumbnailFor(it.youtube)
          const isActive = pos === 0
          const isPlaying = playingIndex === i

          const styleObj: any = { transform, zIndex, left: '50%', position: 'absolute' }

          return (
            <div
              key={it.id}
              className={`pc-slide ${pos === 0 ? 'active' : ''}`}
              style={styleObj}
              onClick={() => {
                if (isActive) {
                  // toggle play when clicking the active slide
                  togglePlay(i, it.youtube)
                } else {
                  go(i)
                }
              }}
            >
              <div className="pc-card">
                <div className="pc-thumb">
                  {thumb ? <img src={thumb} alt={it.title} className="pc-thumb-img" loading="lazy" /> : '🎵'}
                  {isActive && it.youtube && !isPlaying && (
                    <button
                      className="pc-play-btn"
                      onClick={(e) => { e.stopPropagation(); togglePlay(i, it.youtube) }}
                      aria-label="Reproduzir"
                    >
                      ▶
                    </button>
                  )}
                </div>
                <div className="pc-body">
                  <h4>{it.title}</h4>
                  {it.youtube ? <small className="pc-sub">YouTube</small> : <small className="pc-sub">Áudio</small>}
                </div>
                {/* If active and playing and has youtube, render iframe player */}
                {isActive && isPlaying && it.youtube && (
                  <div className="pc-embed">
                    <iframe
                      src={`https://www.youtube.com/embed/${extractYouTubeId(it.youtube)}?autoplay=1&rel=0`}
                      title={it.title}
                      frameBorder="0"
                      allow="autoplay; encrypted-media; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="pc-controls">
        <button onClick={() => go(active - 1)} aria-label="Anterior">◀</button>
        <div className="pc-dots">
          {items.map((_, i) => (
            <button key={i} className={i === active ? 'active' : ''} onClick={() => go(i)} aria-label={`Ir para ${i + 1}`} />
          ))}
        </div>
        <button onClick={() => go(active + 1)} aria-label="Próximo">▶</button>
      </div>
    </section>
  )
}
