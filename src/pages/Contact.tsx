import { type FormEvent, useState } from 'react'
import { useSiteData } from '../context/SiteDataContext.tsx'

type ContactFormState = {
  name: string
  email: string
  message: string
}

const initialForm: ContactFormState = {
  name: '',
  email: '',
  message: '',
}

export default function Contact() {
  const { contact } = useSiteData()
  const [form, setForm] = useState(initialForm)
  const [status, setStatus] = useState<'idle' | 'success'>('idle')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus('success')
    setForm(initialForm)
  }

  return (
    <div className="page-stack">
      <section className="page-card contact-hero">
        <div>
          <p className="eyebrow">Fale conosco</p>
          <h1>Conecte sua pastoral ao Holywins</h1>
          <p>
            Use os canais oficiais para tirar dúvidas sobre voluntariado, caravanas e apoio às atividades de evangelização
            nas ruas.
          </p>
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
        <div className="map-placeholder" aria-hidden>
          <div>
            <p>Mapa interativo em breve</p>
            <small>Inclua aqui o embed oficial quando estiver disponível.</small>
          </div>
        </div>
      </section>

      <section className="page-card">
        <div>
          <p className="eyebrow">Envie sua mensagem</p>
          <h2>Responderemos em até 2 dias úteis</h2>
        </div>
        <form className="contact-form" onSubmit={handleSubmit}>
          <label>
            Nome completo
            <input
              type="text"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              required
            />
          </label>
          <label>
            E-mail
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              required
            />
          </label>
          <label>
            Mensagem
            <textarea
              rows={4}
              value={form.message}
              onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
              required
            />
          </label>
          <button type="submit" className="primary-btn">
            Enviar mensagem
          </button>
          {status === 'success' && <p className="success-text">Mensagem enviada! Retornaremos em breve.</p>}
        </form>
      </section>
    </div>
  )
}
