import { Link } from 'react-router-dom'
import ContactForm from '../components/ContactForm.tsx'
import { useSiteData } from '../context/SiteDataContext.tsx'

export default function Contact() {
  const { contact } = useSiteData()

  return (
    <div className="page-stack">
      <section className="page-card contact-hero reveal-on-scroll">
        <div>
          <h1>Contato</h1>
          <p className="eyebrow">Fale conosco</p>
          <ul className="contact-list">
            <li>
              <span>Telefone</span>
              <strong>{contact.phone}</strong>
            </li>
            <li>
              <span>WhatsApp</span>
              <strong>{contact.whatsapp}</strong>
            </li>
            <li>
              <span>E-mail</span>
              <strong>{contact.email}</strong>
            </li>
            <li>
              <span>Endereço</span>
              <strong>{contact.address}</strong>
            </li>
            <li>
              <span>Atendimento</span>
              <strong>{contact.officeHours}</strong>
            </li>
          </ul>
        </div>
        <div className="map-placeholder">
          <div>
            <img
              src="/images/emoji_santidade_Holywins.png"
              alt=""
              className="emoji-icon"
            />
            <p className="map-title">Estamos com inscrições abertas!</p>
            <small className="map-sub">Garanta já a sua participação no Holywins.</small>
            <Link to="/inscricoes" className="primary-btn">
              Fazer inscrição
            </Link>
          </div>
        </div>
      </section>

      <ContactForm />
    </div>
  )
}
