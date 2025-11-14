import { Link } from 'react-router-dom'
import Carousel from '../components/Carousel.tsx'
import { useSiteData } from '../context/SiteDataContext.tsx'

const highlights = [
  {
    title: 'Vigília Jovem',
    detail: 'Adoração guiada por ministérios locais',
    icon: '🎶',
  },
  {
    title: 'Festival de Santos',
    detail: 'Apresentações artísticas e testemunhos',
    icon: '✨',
  },
  {
    title: 'Ação Solidária',
    detail: 'Arrecadação de alimentos e agasalhos',
    icon: '🤝',
  },
]

const schedule = [
  { time: '19h00', title: 'Boas-vindas & louvor', description: 'Ministério Holywins' },
  { time: '20h15', title: 'Procissão luminosa', description: 'Saída pelas ruas do bairro' },
  { time: '21h00', title: 'Festival de santos', description: 'Teatro, música e testemunhos' },
  { time: '22h30', title: 'Adoração e envio', description: 'Momento de intercessão e bênção final' },
]

export default function Home() {
  const { hero, slides } = useSiteData()

  return (
    <div className="page-stack">
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
          </article>
        ))}
      </section>

      <section className="timeline-card">
        <div>
          <p className="eyebrow">Programação oficial</p>
          <h2>Uma noite inteira de luz</h2>
          <p>
            Vivencie momentos de evangelização urbana, testemunhos inspiradores e adoração que abraça toda a
            comunidade. Cada momento foi pensado para famílias, jovens e crianças.
          </p>
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
