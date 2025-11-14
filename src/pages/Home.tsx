import { Link } from 'react-router-dom'
import Carousel from '../components/Carousel.tsx'
import BannerCarousel from '../components/BannerCarousel.tsx'
import InstagramEmbed from '../components/InstagramEmbed.tsx'
import { useSiteData } from '../context/SiteDataContext.tsx'

const highlights = [
  {
    title: 'Música Holywins',
    detail: 'Escute a música oficial do evento',
    icon: '🎶',
    audio: '/audio/musica-holywins.mp3',
  },
  {
    title: 'Cartinha Premiada',
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
  const { hero, slides, banners } = useSiteData()

  return (
    <div className="page-stack">
      <BannerCarousel banners={banners} />
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">Evento oficial Holywins</p>
          <h1>{hero.title}</h1>
          <p className="lead">{hero.subtitle}</p>
          <ul className="hero-info">
            <li>
              <span>Data</span>
              <strong>{hero.date}</strong>
            </li>
            <li>
              <span>Local</span>
              <strong>{hero.location}</strong>
            </li>
          </ul>
          <div className="cta-row" id="inscricoes">
            <Link className="primary-btn" to="/contato">
              {hero.callToAction}
            </Link>
            <Link className="ghost-btn" to="/galeria">
              Ver memórias
            </Link>
          </div>
        </div>
        <Carousel slides={slides} />
      </section>

      <section className="page-card grid-3">
        {highlights.map((item) => (
          <article className="glass-card" key={item.title}>
            <span className="icon-badge" aria-hidden>
              {item.icon}
            </span>
            <h3>{item.title}</h3>
            <p>{item.detail}</p>
            {item.audio && (
              <audio controls style={{ width: '100%', marginTop: '1rem' }}>
                <source src={item.audio} type="audio/mpeg" />
                Seu navegador não suporta o elemento de áudio.
              </audio>
            )}
          </article>
        ))}
      </section>

      <section className="timeline-card">
        <div>
          <p className="eyebrow">Programação oficial</p>
          <h2>Uma festa do céu na terra</h2>
            <p>
            No Holywins 2025, cristãos se reuniram para celebrar a santidade de forma criativa e alegre, 
            vestindo-se como seus santos favoritos. Foi uma noite de fé, comunhão e testemunho, onde 
            cada fantasia contou a história de vidas dedicadas a Cristo.
            </p>
            <InstagramEmbed url={hero.instagramPostUrl} />
        </div>
        <ol>
          {schedule.map((item) => (
            <li key={item.time}>
              <div className="schedule-time">{item.time}</div>
              <div>
                <strong>{item.title}</strong>
                <p>{item.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
