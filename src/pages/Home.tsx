import BannerCarousel from '../components/BannerCarousel.tsx'
import InstagramEmbed from '../components/InstagramEmbed.tsx'
import { useSiteData } from '../context/SiteDataContext.tsx'
import { useEffect, useState } from 'react'
import ContactForm from '../components/ContactForm.tsx'
import PlaylistCarousel from '../components/PlaylistCarousel.tsx'

const highlights = [
  {
    title: 'Música Holywins',
    detail: 'Escute a música oficial do evento',
    icon: '🎶',
    audio: '/audio/musica-holywins.mp3',
  },
  {
    title: 'Carta Premiada',
    detail: 'Resultado do concurso da melhor carta do Holywins-2025',
    icon: '✨',
  },
  {
    title: 'Resultados do desfile',
    detail: 'Veja os ganhadores com as melhores caracterização do Holywins-2025',
    icon: '🏆',
  },
]

const schedule = [
  { time: '18h00', title: 'Boas-vindas & Eucaristia', description: 'Santa Missa, Solenidade de Todos os Santos' },
  { time: '19h15', title: 'Desfile, Música e alimentação', description: 'Início do Holywins no Centro Juvenil' },
  { time: '21h00', title: 'Música', description: 'Show com Coral de Ladário' },
  { time: '22h30', title: 'Premiação e Mais Música', description: 'Grupo da Paróquia e bênção final' },
]

export default function Home() {
  const { hero, banners } = useSiteData()
  const [moments, setMoments] = useState<Array<{ id: string; images: string[]; link: string }> | null>(null)
  const [playlist, setPlaylist] = useState<Array<{ id: string; title: string; youtube?: string; audio?: string }> | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const resp = await fetch(`${import.meta.env.VITE_API_URL ?? '/api'}/moments`)
        if (!resp.ok) return
        const json = await resp.json()
        if (mounted) setMoments(json)
      } catch (err) {
        console.warn('Could not load moments', err)
      }
    })()
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const resp = await fetch(`${import.meta.env.VITE_API_URL ?? '/api'}/playlist`)
        if (!resp.ok) return
        const json = await resp.json()
        if (mounted) setPlaylist(json)
      } catch (err) {
        console.warn('Could not load playlist', err)
      }
    })()
    return () => { mounted = false }
  }, [])

  return (
    <>
      <BannerCarousel banners={banners} />

      <section className="moments-section">
        <h2 className="moments-title">
          RELEMBRE OS MOMENTOS MARCANTES
          <br />
          DO HOLYWINS
        </h2>
        <div className="moments-grid">
          {(moments && moments.length && moments.length >= 1) ? (
            // Each entry corresponds to one layered card (images: [bg, front, hover])
            moments.map((entry) => {
              const bg = entry.images?.[0] ?? ''
              const front = entry.images?.[1] ?? ''
              const hover = entry.images?.[2] ?? ''
              const href = entry.link || '/galeria'
              return (
                <a key={entry.id} href={href} className="moment-card">
                  {bg ? <div className="moment-bg" style={{ backgroundImage: `url(${bg})` }} /> : <div className="moment-bg" />}
                  {front && <div className="moment-front" style={{ backgroundImage: `url(${front})` }} />}
                  {hover && <div className="moment-hover" style={{ backgroundImage: `url(${hover})` }} />}
                </a>
              )
            })
          ) : (
            // fallback to static assets (keep a single 3-card fallback)
            [1,2,3].map((i) => (
              <a key={i} href="/galeria" className="moment-card">
                <div className="moment-bg" style={{ backgroundImage: `url(/images/gallery/moment${i}-bg.png)` }} />
              </a>
            ))
          )}
        </div>
      </section>

      <div className="page-stack">
        <ContactForm />

      <section className="page-card reveal-on-scroll">
        <p className="eyebrow">Playlist</p>
        <h2>Playlist Holywins</h2>
        <div>
          {(playlist && playlist.length) ? (
            <PlaylistCarousel items={playlist} />
          ) : (
            <article className="glass-card">
              <span className="icon-badge" aria-hidden>🎶</span>
              <h3>Música Holywins</h3>
              <p>Escute a música oficial do evento</p>
              <audio controls style={{ width: '100%', marginTop: '1rem' }}>
                <source src="/audio/musica-holywins.mp3" type="audio/mpeg" />
                Seu navegador não suporta o elemento de áudio.
              </audio>
            </article>
          )}
        </div>
      </section>

      
      </div>
    </>
  )
}
