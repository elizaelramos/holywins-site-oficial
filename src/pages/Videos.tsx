import { FormEvent, useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

type UnlockResult =
  | { status: 'pronto'; codigo: string; videoUrl: string }
  | { status: 'pendente'; codigo: string; message: string }

export default function Videos() {
  const [searchParams] = useSearchParams()
  const initialCodigo = (searchParams.get('c') || '').toUpperCase()
  const [codigo, setCodigo] = useState(initialCodigo)
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<UnlockResult | null>(null)
  const [copied, setCopied] = useState(false)
  const senhaRef = useRef<HTMLInputElement | null>(null)
  const pollTimer = useRef<number | null>(null)

  useEffect(() => {
    if (initialCodigo && senhaRef.current) senhaRef.current.focus()
  }, [initialCodigo])

  useEffect(() => {
    return () => {
      if (pollTimer.current) window.clearTimeout(pollTimer.current)
    }
  }, [])

  async function submitUnlock(silent = false) {
    if (!silent) {
      setError('')
      setLoading(true)
    }
    try {
      const resp = await fetch(`${API_URL}/videos/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo: codigo.trim(), senha: senha.trim() }),
      })
      const data = await resp.json().catch(() => ({}))
      if (!resp.ok) {
        if (!silent) setError(data?.message || 'Não foi possível liberar o vídeo.')
        return
      }
      setResult(data as UnlockResult)
      if (data.status === 'pendente') {
        pollTimer.current = window.setTimeout(() => submitUnlock(true), 15000)
      }
    } catch {
      if (!silent) setError('Falha de conexão. Tente novamente.')
    } finally {
      if (!silent) setLoading(false)
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    submitUnlock(false)
  }

  function resetForm() {
    if (pollTimer.current) window.clearTimeout(pollTimer.current)
    setResult(null)
    setSenha('')
    setError('')
  }

  async function copyShareLink() {
    if (!result || result.status !== 'pronto') return
    const url = `${window.location.origin}/v?c=${encodeURIComponent(result.codigo)}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2200)
    } catch {
      window.prompt('Copie o link abaixo:', url)
    }
  }

  async function nativeShare() {
    if (!result || result.status !== 'pronto') return
    const url = `${window.location.origin}/v?c=${encodeURIComponent(result.codigo)}`
    const shareData = {
      title: `Meu vídeo Holywins ${result.codigo}`,
      text: `Assista o meu vídeo 360 do Holywins (código ${result.codigo}).`,
      url,
    }
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share(shareData)
        return
      } catch {
        /* fallback */
      }
    }
    copyShareLink()
  }

  if (result?.status === 'pronto') {
    return (
      <section className="page-card" style={{ maxWidth: 880, margin: '2rem auto' }}>
        <p className="eyebrow">Seu vídeo 360 · {result.codigo}</p>
        <h1>Pronto! Aproveite o seu momento.</h1>
        <p style={{ marginBottom: '1rem' }}>
          O vídeo já está liberado. Toque em play, baixe para guardar ou compartilhe com a família e amigos.
        </p>

        <div style={{
          borderRadius: 16,
          overflow: 'hidden',
          background: '#000',
          aspectRatio: '16/9',
          marginBottom: '1rem',
        }}>
          <video
            src={result.videoUrl}
            controls
            playsInline
            preload="metadata"
            controlsList="nodownload"
            style={{ width: '100%', height: '100%', display: 'block' }}
          />
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          <a
            href={result.videoUrl}
            download={`holywins-${result.codigo}.mp4`}
            target="_blank"
            rel="noopener noreferrer"
            className="primary-btn"
          >
            Baixar vídeo
          </a>
          <button type="button" className="ghost-btn" onClick={nativeShare}>
            Compartilhar
          </button>
          <button type="button" className="ghost-btn" onClick={copyShareLink}>
            {copied ? 'Link copiado!' : 'Copiar link'}
          </button>
          <button type="button" className="ghost-btn" onClick={resetForm}>
            Usar outro código
          </button>
        </div>

        <p style={{ marginTop: '1.25rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Guarde o seu comprovante: ele continua válido para você reassistir quando quiser.
        </p>
      </section>
    )
  }

  if (result?.status === 'pendente') {
    return (
      <section className="page-card" style={{ maxWidth: 640, margin: '2rem auto', textAlign: 'center' }}>
        <p className="eyebrow">Código {result.codigo}</p>
        <h1>Seu vídeo está sendo preparado</h1>
        <p style={{ marginTop: '0.75rem', marginBottom: '1.25rem' }}>
          {result.message}
        </p>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          Esta página vai verificar sozinha de tempos em tempos. Você também pode fechar e voltar mais tarde
          usando o QR Code do seu comprovante.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button type="button" className="primary-btn" onClick={() => submitUnlock(false)} disabled={loading}>
            {loading ? 'Verificando...' : 'Verificar agora'}
          </button>
          <button type="button" className="ghost-btn" onClick={resetForm}>
            Voltar
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="page-card" style={{ maxWidth: 520, margin: '2rem auto' }}>
      <p className="eyebrow">Vídeos Holywins 360</p>
      <h1>Acesse o seu vídeo</h1>
      <p style={{ marginBottom: '1.25rem' }}>
        Digite o <strong>código</strong> e a <strong>senha</strong> que aparecem no seu comprovante
        para assistir, baixar ou compartilhar o seu vídeo 360.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
        <label style={{ display: 'grid', gap: '0.35rem' }}>
          <span>Código</span>
          <input
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            placeholder="Ex.: 001"
            autoComplete="off"
            inputMode="text"
            required
          />
        </label>
        <label style={{ display: 'grid', gap: '0.35rem' }}>
          <span>Senha</span>
          <input
            ref={senhaRef}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Ex.: holy001"
            autoComplete="off"
            required
          />
        </label>

        {error && (
          <p role="alert" style={{ color: '#ff6f7c', margin: 0, fontSize: '0.95rem' }}>{error}</p>
        )}

        <button type="submit" className="primary-btn" disabled={loading}>
          {loading ? 'Verificando...' : 'Acessar vídeo'}
        </button>
      </form>

      <p style={{ marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
        Não recebeu um comprovante? <Link to="/contato">Fale com a organização</Link>.
      </p>
    </section>
  )
}
