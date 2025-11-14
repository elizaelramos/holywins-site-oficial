import { type FormEvent, useState } from 'react'
import { useSiteData } from '../context/SiteDataContext.tsx'
import { createMessageRequest } from '../services/api'

type ContactFormState = {
  name: string
  email: string
  phone?: string
  message: string
}

const initialForm: ContactFormState = {
  name: '',
  email: '',
  phone: '',
  message: '',
}

export default function Contact() {
  const { contact } = useSiteData()
  const [form, setForm] = useState(initialForm)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus('idle')
    try {
      await createMessageRequest({
        name: form.name,
        email: form.email,
        phone: form.phone,
        message: form.message,
      })
      setStatus('success')
      setForm(initialForm)
    } catch (error) {
      console.error('Erro ao enviar mensagem', error)
      setStatus('error')
    }
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
            <img
              src="/images/emoji_santidade_Holywins.png"
              alt="emoji santidade"
              className="emoji-icon"
            />
            <p className="map-title">Formulário de inscrições fechado no momento</p>
            <small className="map-sub">Fique tranquilo — quando abrirmos as inscrições, o formulário aparecerá neste local para você se cadastrar.</small>
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
            Telefone (WhatsApp)
            <input
              type="text"
              value={form.phone}
              onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
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
                  {status === 'error' && <p className="success-text" style={{ color: '#ff8ea3' }}>Falha ao enviar. Tente novamente.</p>}
        </form>
      </section>
    </div>
  )
}
