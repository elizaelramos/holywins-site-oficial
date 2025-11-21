
import { type FormEvent, useState } from 'react'
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

export default function ContactForm() {
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
    <section className="page-card reveal-on-scroll">
      <div>
        <p className="eyebrow">QUERO SABER AS NOVIDADES DO HOLYWINS</p>
        <h2>Envie sua mensagem</h2>
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
  )
}
