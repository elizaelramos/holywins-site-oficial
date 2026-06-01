import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

interface EventVideo {
  id: number
  codigo: string
  senha: string
  sourceUrl: string | null
  videoUrl: string | null
  status: 'pendente' | 'pronto'
  observacao: string | null
  unlockCount: number
  lastUnlockedAt: string | null
  createdAt: string
  updatedAt: string
}

type Filter = 'todos' | 'pendente' | 'pronto'

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR')
}

export default function AdminVideos() {
  const navigate = useNavigate()
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth()
  const [videos, setVideos] = useState<EventVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [filter, setFilter] = useState<Filter>('todos')
  const [search, setSearch] = useState('')

  // Cadastro avulso
  const [newCodigo, setNewCodigo] = useState('')
  const [newSenha, setNewSenha] = useState('')
  const [newObs, setNewObs] = useState('')
  const [creating, setCreating] = useState(false)

  // Cadastro em massa
  const [bulkPrefix, setBulkPrefix] = useState('')
  const [bulkStart, setBulkStart] = useState(1)
  const [bulkEnd, setBulkEnd] = useState(20)
  const [bulkPadding, setBulkPadding] = useState(3)
  const [bulkSenhaPattern, setBulkSenhaPattern] = useState('holy{n}')
  const [bulking, setBulking] = useState(false)

  // Linha em edição (colar link)
  const [linkDrafts, setLinkDrafts] = useState<Record<number, string>>({})
  const [savingId, setSavingId] = useState<number | null>(null)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate('/login')
  }, [authLoading, isAuthenticated, navigate])

  useEffect(() => {
    void loadVideos()
  }, [])

  function flashSuccess(msg: string) {
    setSuccess(msg)
    setError('')
    window.setTimeout(() => setSuccess(''), 3500)
  }

  function flashError(msg: string) {
    setError(msg)
    setSuccess('')
  }

  async function loadVideos() {
    setLoading(true)
    try {
      const resp = await fetch(`${API_URL}/videos`, { credentials: 'include' })
      if (!resp.ok) throw new Error('Falha ao carregar a lista de vídeos.')
      const data = (await resp.json()) as EventVideo[]
      setVideos(data)
    } catch (err: any) {
      flashError(err.message || 'Erro ao carregar.')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault()
    setCreating(true)
    try {
      const resp = await fetch(`${API_URL}/videos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          codigo: newCodigo.trim(),
          senha: newSenha.trim(),
          observacao: newObs.trim() || null,
        }),
      })
      const data = await resp.json().catch(() => ({}))
      if (!resp.ok) throw new Error(data?.message || 'Erro ao criar código.')
      setVideos((prev) => [...prev, data].sort((a, b) => a.codigo.localeCompare(b.codigo, undefined, { numeric: true })))
      setNewCodigo('')
      setNewSenha('')
      setNewObs('')
      flashSuccess(`Código ${data.codigo} cadastrado.`)
    } catch (err: any) {
      flashError(err.message)
    } finally {
      setCreating(false)
    }
  }

  async function handleBulk(event: FormEvent) {
    event.preventDefault()
    setBulking(true)
    try {
      const resp = await fetch(`${API_URL}/videos/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          prefix: bulkPrefix,
          start: bulkStart,
          end: bulkEnd,
          padding: bulkPadding,
          senhaPattern: bulkSenhaPattern,
        }),
      })
      const data = await resp.json().catch(() => ({}))
      if (!resp.ok) throw new Error(data?.message || 'Erro no cadastro em massa.')
      await loadVideos()
      flashSuccess(
        `${data.created.length} código(s) criados.` +
          (data.skipped.length ? ` ${data.skipped.length} ignorados (já existiam).` : ''),
      )
    } catch (err: any) {
      flashError(err.message)
    } finally {
      setBulking(false)
    }
  }

  async function handleSaveLink(video: EventVideo) {
    const link = (linkDrafts[video.id] ?? video.sourceUrl ?? '').trim()
    setSavingId(video.id)
    try {
      const resp = await fetch(`${API_URL}/videos/${video.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ sourceUrl: link }),
      })
      const data = await resp.json().catch(() => ({}))
      if (!resp.ok) throw new Error(data?.message || 'Falha ao salvar o link.')
      setVideos((prev) => prev.map((v) => (v.id === video.id ? data : v)))
      setLinkDrafts((prev) => {
        const next = { ...prev }
        delete next[video.id]
        return next
      })
      flashSuccess(
        link
          ? `Vídeo ${data.codigo} liberado para o usuário.`
          : `Vídeo ${data.codigo} marcado como pendente.`,
      )
    } catch (err: any) {
      flashError(err.message)
    } finally {
      setSavingId(null)
    }
  }

  async function handleDelete(video: EventVideo) {
    if (!window.confirm(`Excluir o código ${video.codigo}? Esta ação não pode ser desfeita.`)) return
    try {
      const resp = await fetch(`${API_URL}/videos/${video.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!resp.ok && resp.status !== 204) {
        throw new Error('Erro ao excluir.')
      }
      setVideos((prev) => prev.filter((v) => v.id !== video.id))
      flashSuccess(`Código ${video.codigo} removido.`)
    } catch (err: any) {
      flashError(err.message)
    }
  }

  async function copyPublicLink(codigo: string) {
    const url = `${window.location.origin}/v?c=${encodeURIComponent(codigo)}`
    try {
      await navigator.clipboard.writeText(url)
      flashSuccess('Link público copiado.')
    } catch {
      window.prompt('Copie o link:', url)
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return videos
      .filter((v) => {
        if (filter !== 'todos' && v.status !== filter) return false
        if (!q) return true
        return (
          v.codigo.toLowerCase().includes(q) ||
          v.senha.toLowerCase().includes(q) ||
          (v.observacao || '').toLowerCase().includes(q)
        )
      })
      .sort((a, b) => a.codigo.localeCompare(b.codigo, undefined, { numeric: true }))
  }, [videos, filter, search])

  const counts = useMemo(() => {
    return {
      total: videos.length,
      pronto: videos.filter((v) => v.status === 'pronto').length,
      pendente: videos.filter((v) => v.status === 'pendente').length,
    }
  }, [videos])

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
            <p className="eyebrow">Holywins · Vídeos 360</p>
            <h1 style={{ margin: 0 }}>Distribuição de vídeos</h1>
            <p style={{ marginTop: '0.35rem', color: 'var(--text-muted)' }}>
              {counts.total} código(s) cadastrados · {counts.pronto} prontos · {counts.pendente} pendentes
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
        {success && <p style={{ color: '#7be084', marginTop: '1rem' }}>{success}</p>}

        <p style={{ marginTop: '1.25rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Fluxo: pré-cadastre os códigos e senhas (avulso ou em lote) com antecedência, imprima os comprovantes
          e, no dia do evento, cole o link do applay360 na linha do código correspondente. O usuário acessa{' '}
          <strong>{typeof window !== 'undefined' ? window.location.origin : ''}/v</strong>, digita o código e a
          senha e o vídeo aparece direto no nosso player.
        </p>
      </section>

      <section className="page-card">
        <h2 style={{ marginTop: 0 }}>Pré-cadastrar 1 código</h2>
        <form onSubmit={handleCreate} style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          <label style={{ display: 'grid', gap: '0.25rem' }}>
            <span>Código</span>
            <input value={newCodigo} onChange={(e) => setNewCodigo(e.target.value.toUpperCase())} placeholder="Ex.: 001" required />
          </label>
          <label style={{ display: 'grid', gap: '0.25rem' }}>
            <span>Senha</span>
            <input value={newSenha} onChange={(e) => setNewSenha(e.target.value)} placeholder="Ex.: holy001" required />
          </label>
          <label style={{ display: 'grid', gap: '0.25rem' }}>
            <span>Observação (opcional)</span>
            <input value={newObs} onChange={(e) => setNewObs(e.target.value)} placeholder="Nome do participante, mesa, etc." />
          </label>
          <div style={{ display: 'flex', alignItems: 'end' }}>
            <button type="submit" className="primary-btn" disabled={creating}>
              {creating ? 'Salvando...' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </section>

      <section className="page-card">
        <h2 style={{ marginTop: 0 }}>Pré-cadastrar em lote</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Gera códigos sequenciais — útil pra preparar tudo no dia anterior.
          O <code>{'{n}'}</code> no padrão de senha é trocado pelo número (com zeros à esquerda).
        </p>
        <form onSubmit={handleBulk} style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
          <label style={{ display: 'grid', gap: '0.25rem' }}>
            <span>Prefixo</span>
            <input value={bulkPrefix} onChange={(e) => setBulkPrefix(e.target.value.toUpperCase())} placeholder="(opcional)" />
          </label>
          <label style={{ display: 'grid', gap: '0.25rem' }}>
            <span>Início</span>
            <input type="number" min={0} value={bulkStart} onChange={(e) => setBulkStart(Number(e.target.value))} required />
          </label>
          <label style={{ display: 'grid', gap: '0.25rem' }}>
            <span>Fim</span>
            <input type="number" min={0} value={bulkEnd} onChange={(e) => setBulkEnd(Number(e.target.value))} required />
          </label>
          <label style={{ display: 'grid', gap: '0.25rem' }}>
            <span>Zeros à esquerda</span>
            <input type="number" min={1} max={6} value={bulkPadding} onChange={(e) => setBulkPadding(Number(e.target.value))} required />
          </label>
          <label style={{ display: 'grid', gap: '0.25rem' }}>
            <span>Padrão da senha</span>
            <input value={bulkSenhaPattern} onChange={(e) => setBulkSenhaPattern(e.target.value)} placeholder="holy{n}" required />
          </label>
          <div style={{ display: 'flex', alignItems: 'end' }}>
            <button type="submit" className="primary-btn" disabled={bulking}>
              {bulking ? 'Gerando...' : 'Gerar lote'}
            </button>
          </div>
        </form>
      </section>

      <section className="page-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h2 style={{ margin: 0 }}>Códigos cadastrados</h2>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por código, senha ou observação"
              style={{ minWidth: 240 }}
            />
            <select value={filter} onChange={(e) => setFilter(e.target.value as Filter)}>
              <option value="todos">Todos</option>
              <option value="pendente">Pendentes</option>
              <option value="pronto">Prontos</option>
            </select>
            <button className="ghost-btn" onClick={() => void loadVideos()}>Recarregar</button>
          </div>
        </div>

        {loading ? (
          <p style={{ marginTop: '1rem' }}>Carregando...</p>
        ) : filtered.length === 0 ? (
          <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Nenhum código encontrado.</p>
        ) : (
          <div style={{ marginTop: '1rem', display: 'grid', gap: '0.75rem' }}>
            {filtered.map((video) => {
              const draft = linkDrafts[video.id] ?? video.sourceUrl ?? ''
              const isPronto = video.status === 'pronto'
              return (
                <article
                  key={video.id}
                  style={{
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 12,
                    padding: '0.9rem 1rem',
                    background: 'rgba(255,255,255,0.02)',
                    display: 'grid',
                    gap: '0.6rem',
                  }}
                >
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '0.75rem', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: '1.15rem', letterSpacing: '0.05em' }}>{video.codigo}</strong>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        senha: <code>{video.senha}</code>
                      </span>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.15rem 0.55rem',
                          borderRadius: 999,
                          background: isPronto ? 'rgba(123,224,132,0.15)' : 'rgba(255,200,80,0.15)',
                          color: isPronto ? '#7be084' : '#ffc850',
                          border: `1px solid ${isPronto ? '#7be084' : '#ffc850'}55`,
                        }}
                      >
                        {isPronto ? 'pronto' : 'pendente'}
                      </span>
                      {video.observacao && (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>· {video.observacao}</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <button className="ghost-btn" onClick={() => copyPublicLink(video.codigo)} style={{ fontSize: '0.8rem' }}>
                        Copiar link
                      </button>
                      <button className="ghost-btn" onClick={() => handleDelete(video)} style={{ fontSize: '0.8rem' }}>
                        Excluir
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gap: '0.4rem', gridTemplateColumns: 'minmax(0, 1fr) auto auto' }}>
                    <input
                      value={draft}
                      onChange={(e) => setLinkDrafts((prev) => ({ ...prev, [video.id]: e.target.value }))}
                      placeholder="Cole aqui o link do applay360 (https://applay360.com/event/...)"
                    />
                    <button
                      className="primary-btn"
                      onClick={() => void handleSaveLink(video)}
                      disabled={savingId === video.id}
                      style={{ fontSize: '0.85rem' }}
                    >
                      {savingId === video.id ? 'Validando...' : isPronto ? 'Atualizar' : 'Liberar'}
                    </button>
                    {isPronto && (
                      <button
                        className="ghost-btn"
                        onClick={() => {
                          setLinkDrafts((prev) => ({ ...prev, [video.id]: '' }))
                          void handleSaveLink({ ...video, sourceUrl: '' })
                        }}
                        style={{ fontSize: '0.85rem' }}
                      >
                        Remover link
                      </button>
                    )}
                  </div>

                  {isPronto && video.videoUrl && (
                    <details style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <summary style={{ cursor: 'pointer' }}>
                        {video.unlockCount} acesso(s) · último: {fmtDate(video.lastUnlockedAt)}
                      </summary>
                      <p style={{ marginTop: '0.4rem', wordBreak: 'break-all' }}>
                        MP4: <a href={video.videoUrl} target="_blank" rel="noopener noreferrer">{video.videoUrl}</a>
                      </p>
                    </details>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </section>

      <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        Logado como {user?.username}
      </p>
    </div>
  )
}
