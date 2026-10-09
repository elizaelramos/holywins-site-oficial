import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, FileText, Mail, MailOpen, Printer, X } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

interface Arquivo {
  id: number
  nomeOriginal: string | null
  mime: string
  tamanho: number
}

interface Carta {
  id: number
  protocolo: string
  nome: string
  idade: number | null
  telefone: string
  paroquia: string
  santo: string | null
  lida: boolean
  createdAt: string
  arquivos: Arquivo[]
}

type Filter = 'todas' | 'nao-lidas' | 'lidas'

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

function escapeHtml(text: string) {
  return text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string)
}

const isPdf = (a: Arquivo) => a.mime === 'application/pdf'

// Imprime via iframe oculto para não abrir pop-ups nem sair do painel
function imprimirIframe(setup: (iframe: HTMLIFrameElement) => void) {
  const iframe = document.createElement('iframe')
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;'
  iframe.onload = () => {
    window.setTimeout(() => {
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
      window.setTimeout(() => iframe.remove(), 60_000)
    }, 300)
  }
  setup(iframe)
  document.body.appendChild(iframe)
}

export default function AdminCartas() {
  const navigate = useNavigate()
  const { isAuthenticated, loading: authLoading, logout } = useAuth()
  const [cartas, setCartas] = useState<Carta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<Filter>('todas')
  const [search, setSearch] = useState('')
  const [abertaId, setAbertaId] = useState<number | null>(null)
  const [blobs, setBlobs] = useState<Record<number, string>>({})
  const [carregandoArquivos, setCarregandoArquivos] = useState(false)
  const blobsRef = useRef<Record<number, string>>({})

  useEffect(() => { blobsRef.current = blobs }, [blobs])

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate('/login')
  }, [authLoading, isAuthenticated, navigate])

  useEffect(() => {
    void loadCartas()
  }, [])

  useEffect(() => () => Object.values(blobsRef.current).forEach((url) => URL.revokeObjectURL(url)), [])

  async function loadCartas() {
    setLoading(true)
    try {
      const resp = await fetch(`${API_URL}/cartas-premiadas`, { credentials: 'include' })
      if (!resp.ok) throw new Error('Falha ao carregar as cartas.')
      setCartas(await resp.json())
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar as cartas.')
    } finally {
      setLoading(false)
    }
  }

  async function marcarLida(carta: Carta, lida: boolean) {
    try {
      const resp = await fetch(`${API_URL}/cartas-premiadas/${carta.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lida }),
      })
      if (!resp.ok) throw new Error()
      setCartas((prev) => prev.map((c) => (c.id === carta.id ? { ...c, lida } : c)))
    } catch {
      setError('Não foi possível atualizar a carta.')
    }
  }

  async function abrir(carta: Carta) {
    setAbertaId(carta.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    if (!carta.lida) void marcarLida(carta, true)
    const faltando = carta.arquivos.filter((a) => !blobsRef.current[a.id])
    if (!faltando.length) return
    setCarregandoArquivos(true)
    try {
      const baixados = await Promise.all(
        faltando.map(async (a) => {
          const resp = await fetch(`${API_URL}/cartas-premiadas/${carta.id}/arquivos/${a.id}`, { credentials: 'include' })
          if (!resp.ok) throw new Error()
          return [a.id, URL.createObjectURL(await resp.blob())] as const
        }),
      )
      setBlobs((prev) => ({ ...prev, ...Object.fromEntries(baixados) }))
    } catch {
      setError('Não foi possível carregar os arquivos desta carta.')
    } finally {
      setCarregandoArquivos(false)
    }
  }

  async function excluir(carta: Carta) {
    if (!window.confirm(`Excluir a carta ${carta.protocolo} de ${carta.nome}? Os arquivos também serão apagados.`)) return
    try {
      const resp = await fetch(`${API_URL}/cartas-premiadas/${carta.id}`, { method: 'DELETE', credentials: 'include' })
      if (!resp.ok) throw new Error()
      carta.arquivos.forEach((a) => blobs[a.id] && URL.revokeObjectURL(blobs[a.id]))
      setCartas((prev) => prev.filter((c) => c.id !== carta.id))
      if (abertaId === carta.id) setAbertaId(null)
    } catch {
      setError('Não foi possível excluir a carta.')
    }
  }

  // Uma folha com os dados de quem escreveu, seguida das páginas (imagens) da carta
  function imprimirCarta(carta: Carta) {
    const imagens = carta.arquivos.filter((a) => !isPdf(a) && blobs[a.id])
    const dados = [
      ['Protocolo', carta.protocolo],
      ['Nome', carta.nome + (carta.idade != null ? ` (${carta.idade} anos)` : '')],
      ['Telefone', carta.telefone],
      ['Paróquia / comunidade', carta.paroquia],
      ['Santo(a)', carta.santo || '—'],
      ['Recebida em', fmtDate(carta.createdAt)],
    ]
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Carta ${escapeHtml(carta.protocolo)}</title>
      <style>
        @page { margin: 12mm; }
        body { font-family: system-ui, sans-serif; color: #000; margin: 0; }
        header { border-bottom: 2px solid #000; padding-bottom: 6px; margin-bottom: 8px; font-size: 11pt; }
        header h1 { font-size: 14pt; margin: 0 0 4px; }
        header span { margin-right: 14px; display: inline-block; }
        img { display: block; max-width: 100%; max-height: 245mm; margin: 0 auto 8px; page-break-inside: avoid; }
        img + img { page-break-before: always; }
      </style></head><body>
      <header><h1>Carta Premiada · Holywins 2026</h1>
        ${dados.map(([k, v]) => `<span><b>${escapeHtml(k)}:</b> ${escapeHtml(v)}</span>`).join('')}
      </header>
      ${imagens.map((a) => `<img src="${blobs[a.id]}" alt="">`).join('')}
      </body></html>`
    imprimirIframe((iframe) => { iframe.srcdoc = html })
  }

  function imprimirPdf(arquivo: Arquivo) {
    const url = blobs[arquivo.id]
    if (url) imprimirIframe((iframe) => { iframe.src = url })
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return cartas.filter((c) => {
      if (filter === 'lidas' && !c.lida) return false
      if (filter === 'nao-lidas' && c.lida) return false
      if (!q) return true
      return [c.protocolo, c.nome, c.paroquia, c.santo ?? '', c.telefone].some((v) => v.toLowerCase().includes(q))
    })
  }, [cartas, filter, search])

  const naoLidas = cartas.filter((c) => !c.lida).length
  const aberta = cartas.find((c) => c.id === abertaId) ?? null

  if (authLoading || !isAuthenticated) {
    return (
      <div className="page-stack">
        <section className="page-card"><p>Carregando...</p></section>
      </div>
    )
  }

  return (
    <div className="page-stack" style={{ maxWidth: 1100, margin: '0 auto', padding: '1rem' }}>
      <section className="page-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <p className="eyebrow">Holywins 2026 · Concurso</p>
            <h1 style={{ margin: 0 }}>Carta Premiada</h1>
            <p style={{ marginTop: '0.35rem', color: 'var(--text-muted)' }}>
              {cartas.length} carta(s) recebida(s) · {naoLidas} não lida(s)
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link to="/admin" className="ghost-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <ArrowLeft size={16} /> Admin
            </Link>
            <button className="ghost-btn" onClick={() => { void logout(); navigate('/login') }}>Sair</button>
          </div>
        </div>
        {error && <p role="alert" style={{ color: '#ff6f7c', marginTop: '1rem' }}>{error}</p>}
      </section>

      {aberta && (
        <section className="page-card" aria-label={`Carta ${aberta.protocolo}`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <p className="eyebrow" style={{ letterSpacing: '0.08em' }}>{aberta.protocolo}</p>
              <h2 style={{ margin: 0 }}>{aberta.nome}{aberta.idade != null ? `, ${aberta.idade} anos` : ''}</h2>
              <p style={{ marginTop: '0.35rem', color: 'var(--text-muted)' }}>
                {aberta.paroquia} · {aberta.telefone}
                {aberta.santo ? <> · Santo(a): <strong>{aberta.santo}</strong></> : null}
                {' · '}recebida em {fmtDate(aberta.createdAt)}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {aberta.arquivos.some((a) => !isPdf(a)) && (
                <button className="primary-btn" onClick={() => imprimirCarta(aberta)} disabled={carregandoArquivos} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Printer size={16} /> Imprimir carta
                </button>
              )}
              <button className="ghost-btn" onClick={() => void marcarLida(aberta, !aberta.lida)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                {aberta.lida ? <><Mail size={16} /> Marcar como não lida</> : <><MailOpen size={16} /> Marcar como lida</>}
              </button>
              <button className="ghost-btn" onClick={() => setAbertaId(null)} aria-label="Fechar carta" style={{ display: 'inline-flex', alignItems: 'center' }}>
                <X size={18} />
              </button>
            </div>
          </div>

          {carregandoArquivos && <p style={{ marginTop: '1rem' }}>Carregando a carta...</p>}

          <div style={{ display: 'grid', gap: '1.25rem', marginTop: '1.25rem' }}>
            {aberta.arquivos.map((arquivo, i) => {
              const url = blobs[arquivo.id]
              const nomeDownload = `${aberta.protocolo}-${i + 1}.${isPdf(arquivo) ? 'pdf' : 'jpg'}`
              return (
                <figure key={arquivo.id} style={{ margin: 0, display: 'grid', gap: '0.5rem' }}>
                  <figcaption style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    <span>
                      {isPdf(arquivo) ? 'PDF' : 'Imagem'} {i + 1} de {aberta.arquivos.length}
                      {arquivo.nomeOriginal ? ` · ${arquivo.nomeOriginal}` : ''}
                    </span>
                    {url && (
                      <span style={{ display: 'flex', gap: '0.4rem' }}>
                        {isPdf(arquivo) && (
                          <button className="ghost-btn" onClick={() => imprimirPdf(arquivo)} style={{ fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Printer size={14} /> Imprimir PDF
                          </button>
                        )}
                        <a href={url} download={nomeDownload} className="ghost-btn" style={{ fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Download size={14} /> Baixar
                        </a>
                      </span>
                    )}
                  </figcaption>
                  {url ? (
                    isPdf(arquivo) ? (
                      <iframe src={url} title={`PDF da carta ${aberta.protocolo}`} style={{ width: '100%', height: '80vh', border: 0, borderRadius: 12, background: '#fff' }} />
                    ) : (
                      <img src={url} alt={`Página ${i + 1} da carta de ${aberta.nome}`} style={{ width: '100%', maxHeight: '90vh', objectFit: 'contain', borderRadius: 12, background: '#fff' }} />
                    )
                  ) : null}
                </figure>
              )
            })}
          </div>
        </section>
      )}

      <section className="page-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h2 style={{ margin: 0 }}>Cartas recebidas</h2>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por protocolo, nome, paróquia ou santo"
              style={{ minWidth: 240 }}
            />
            <select value={filter} onChange={(e) => setFilter(e.target.value as Filter)}>
              <option value="todas">Todas</option>
              <option value="nao-lidas">Não lidas</option>
              <option value="lidas">Lidas</option>
            </select>
            <button className="ghost-btn" onClick={() => void loadCartas()}>Recarregar</button>
          </div>
        </div>

        {loading ? (
          <p style={{ marginTop: '1rem' }}>Carregando...</p>
        ) : filtered.length === 0 ? (
          <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Nenhuma carta encontrada.</p>
        ) : (
          <div style={{ marginTop: '1rem', display: 'grid', gap: '0.75rem' }}>
            {filtered.map((carta) => (
              <article
                key={carta.id}
                style={{
                  border: `1px solid ${carta.id === abertaId ? '#66b2ff' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 12,
                  padding: '0.9rem 1rem',
                  background: carta.lida ? 'rgba(255,255,255,0.02)' : 'rgba(255,200,80,0.06)',
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}
              >
                <div style={{ display: 'grid', gap: '0.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <strong style={{ letterSpacing: '0.05em' }}>{carta.protocolo}</strong>
                    <span>{carta.nome}{carta.idade != null ? `, ${carta.idade} anos` : ''}</span>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        padding: '0.15rem 0.55rem',
                        borderRadius: 999,
                        background: carta.lida ? 'rgba(123,224,132,0.15)' : 'rgba(255,200,80,0.15)',
                        color: carta.lida ? '#7be084' : '#ffc850',
                        border: `1px solid ${carta.lida ? '#7be084' : '#ffc850'}55`,
                      }}
                    >
                      {carta.lida ? 'lida' : 'não lida'}
                    </span>
                  </div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {carta.paroquia}{carta.santo ? ` · ${carta.santo}` : ''} · {fmtDate(carta.createdAt)} ·{' '}
                    <FileText size={13} style={{ verticalAlign: '-2px' }} /> {carta.arquivos.length} arquivo(s)
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <button className="primary-btn" onClick={() => void abrir(carta)} style={{ fontSize: '0.85rem' }}>
                    Ler carta
                  </button>
                  <button className="ghost-btn" onClick={() => void excluir(carta)} style={{ fontSize: '0.8rem' }}>
                    Excluir
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
