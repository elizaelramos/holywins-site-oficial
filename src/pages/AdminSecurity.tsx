import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, Shield, Bot, AlertTriangle, ServerCrash, Globe } from 'lucide-react'

const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
const API_URL = RAW_API_URL.endsWith('/') ? RAW_API_URL.slice(0, -1) : RAW_API_URL

interface LabelTotal {
  label: string
  total: number
}

interface TopIp {
  ip: string
  country: string | null
  total: number
  threats: number
}

interface SecurityOverview {
  range: { from: string; to: string }
  totalRequests: number
  botRequests: number
  threats: number
  errors4xx: number
  errors5xx: number
  uniqueIps: number
  byType: LabelTotal[]
  bySource: { label: string; total: number; threats: number }[]
  topIps: TopIp[]
  timeline: { day: string; requests: number; threats: number }[]
}

interface SecurityEvent {
  id: number
  ip: string
  method: string
  path: string
  status_code: number
  user_agent: string
  threat_type: string
  country: string | null
  source: string
  created_at: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

const PRESETS = [
  { label: 'Últimos 7 dias', days: 7 },
  { label: 'Últimos 30 dias', days: 30 },
  { label: 'Últimos 90 dias', days: 90 },
]

const THREAT_LABELS: Record<string, string> = {
  suspicious_path: 'Caminho suspeito',
  auth_bruteforce: 'Brute-force (login)',
  unlock_bruteforce: 'Brute-force (vídeos)',
  rate_limited: 'Limite excedido',
  bot: 'Bot',
  scanner: 'Scanner',
}

function labelThreat(t: string) {
  return THREAT_LABELS[t] || t
}

function sourceBadge(s: string) {
  const isNginx = s === 'nginx'
  return (
    <span
      style={{
        padding: '0.15rem 0.45rem',
        borderRadius: '4px',
        background: isNginx ? 'rgba(168,139,250,0.18)' : 'rgba(96,165,250,0.18)',
        color: isNginx ? '#c4b5fd' : '#93c5fd',
        fontSize: '0.7rem',
        whiteSpace: 'nowrap',
      }}
    >
      {isNginx ? 'Nginx' : 'Express'}
    </span>
  )
}

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

function formatNumber(n: number) {
  return new Intl.NumberFormat('pt-BR').format(n)
}

const card: React.CSSProperties = {
  background: 'var(--surface, rgba(255,255,255,0.03))',
  border: '1px solid var(--border)',
  borderRadius: '12px',
  padding: '1.25rem',
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color?: string }) {
  return (
    <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
        {icon}
        <span style={{ fontSize: '0.8rem' }}>{label}</span>
      </div>
      <div style={{ fontSize: '1.75rem', fontWeight: 700, color: color || 'inherit' }}>{value}</div>
    </div>
  )
}

function threatBadge(t: string) {
  const danger = ['suspicious_path', 'auth_bruteforce', 'unlock_bruteforce', 'scanner'].includes(t)
  return (
    <span
      style={{
        padding: '0.25rem 0.5rem',
        borderRadius: '4px',
        background: danger ? 'rgba(239,68,68,0.18)' : 'rgba(234,179,8,0.18)',
        color: danger ? '#fca5a5' : '#fde047',
        fontSize: '0.72rem',
        whiteSpace: 'nowrap',
      }}
    >
      {labelThreat(t)}
    </span>
  )
}

export default function AdminSecurity() {
  const navigate = useNavigate()
  const [days, setDays] = useState(30)
  const [overview, setOverview] = useState<SecurityOverview | null>(null)
  const [events, setEvents] = useState<SecurityEvent[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 50, total: 0, totalPages: 0 })
  const [typeFilter, setTypeFilter] = useState('')
  const [ipFilter, setIpFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const range = useMemo(() => {
    const to = new Date()
    const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000)
    return { from: isoDate(from), to: isoDate(to) }
  }, [days])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const sp = sourceFilter ? `&source=${sourceFilter}` : ''
        const res = await fetch(`${API_URL}/analytics/security/overview?from=${range.from}&to=${range.to}${sp}`, { credentials: 'include' })
        if (!res.ok) throw new Error('Erro ao carregar visão de segurança')
        const data = await res.json()
        if (!cancelled) setOverview(data)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Erro ao carregar segurança')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [range, sourceFilter])

  useEffect(() => {
    let cancelled = false
    const loadEvents = async () => {
      try {
        const params = new URLSearchParams({
          page: String(pagination.page),
          limit: String(pagination.limit),
          from: range.from,
          to: range.to,
        })
        if (typeFilter) params.append('type', typeFilter)
        if (ipFilter) params.append('ip', ipFilter)
        if (sourceFilter) params.append('source', sourceFilter)
        const res = await fetch(`${API_URL}/analytics/security/events?${params}`, { credentials: 'include' })
        if (!res.ok) throw new Error('Erro ao carregar eventos')
        const data = await res.json()
        if (cancelled) return
        setEvents(data.events)
        setPagination((prev) => ({ ...prev, ...data.pagination }))
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Erro ao carregar eventos')
      }
    }
    loadEvents()
    return () => {
      cancelled = true
    }
  }, [pagination.page, pagination.limit, typeFilter, ipFilter, sourceFilter, range])

  const exportCsv = () => {
    window.open(`${API_URL}/analytics/export?type=security-events&from=${range.from}&to=${range.to}`, '_blank')
  }

  const maxType = Math.max(1, ...(overview?.byType.map((t) => t.total) ?? [1]))

  return (
    <div className="page-stack">
      <section className="page-card">
        <button
          onClick={() => navigate('/admin')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginBottom: '1rem', padding: 0, fontSize: '0.875rem' }}
        >
          <ArrowLeft size={16} /> Voltar ao Admin
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <p className="eyebrow">Monitoramento</p>
            <h1>Segurança</h1>
            <p style={{ marginTop: '0.25rem', color: 'var(--text-muted)' }}>
              Requisições à API · {range.from} a {range.to}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {PRESETS.map((p) => (
              <button
                key={p.days}
                onClick={() => setDays(p.days)}
                className="ghost-btn"
                style={days === p.days ? { fontWeight: 700, background: 'var(--muted)', color: 'white' } : {}}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div style={{ padding: '1rem', marginBottom: '1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#fca5a5' }}>
            {error}
          </div>
        )}

        {loading && !overview ? (
          <p>Carregando dados de segurança...</p>
        ) : (
          <>
            {/* KPI cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <StatCard icon={<Shield size={16} />} label="Total de requisições" value={formatNumber(overview?.totalRequests ?? 0)} />
              <StatCard icon={<AlertTriangle size={16} />} label="Ameaças detectadas" value={formatNumber(overview?.threats ?? 0)} color="#fca5a5" />
              <StatCard icon={<Bot size={16} />} label="Requisições de bots" value={formatNumber(overview?.botRequests ?? 0)} />
              <StatCard icon={<Globe size={16} />} label="IPs distintos" value={formatNumber(overview?.uniqueIps ?? 0)} />
              <StatCard icon={<AlertTriangle size={16} />} label="Erros 4xx" value={formatNumber(overview?.errors4xx ?? 0)} color="#fde047" />
              <StatCard icon={<ServerCrash size={16} />} label="Erros 5xx" value={formatNumber(overview?.errors5xx ?? 0)} color="#fca5a5" />
            </div>

            {/* Coverage by source */}
            <div style={{ ...card, marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1rem' }}>Cobertura por fonte</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Express = API · Nginx = todo o servidor (estáticos, SPA, sondagens na raiz)
                </span>
              </div>
              {(overview?.bySource.length ?? 0) === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 0 }}>
                  Apenas a API (Express) está sendo monitorada. Para capturar bots que batem direto no servidor,
                  habilite a ingestão do log do nginx (ver fonte "Nginx").
                </p>
              ) : (
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                  {overview!.bySource.map((s) => (
                    <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {sourceBadge(s.label)}
                      <span style={{ fontSize: '0.9rem' }}>
                        {formatNumber(s.total)} reqs
                        <span style={{ color: 'var(--text-muted)' }}> · {formatNumber(s.threats)} ameaças</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Threats by type + top IPs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={card}>
                <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1rem' }}>Ameaças por tipo</h3>
                {(overview?.byType.length ?? 0) === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Nenhuma ameaça registrada. 🎉</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {overview!.byType.map((t) => (
                      <div key={t.label}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.2rem' }}>
                          <span>{labelThreat(t.label)}</span>
                          <span style={{ color: 'var(--text-muted)' }}>{formatNumber(t.total)}</span>
                        </div>
                        <div style={{ height: '6px', borderRadius: '3px', background: 'var(--border)' }}>
                          <div style={{ height: '100%', borderRadius: '3px', width: `${(t.total / maxType) * 100}%`, background: '#f87171' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={card}>
                <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1rem' }}>IPs mais ativos</h3>
                {(overview?.topIps.length ?? 0) === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Sem dados.</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                        <th style={{ textAlign: 'left', padding: '0.4rem' }}>IP</th>
                        <th style={{ textAlign: 'left', padding: '0.4rem' }}>País</th>
                        <th style={{ textAlign: 'right', padding: '0.4rem' }}>Reqs</th>
                        <th style={{ textAlign: 'right', padding: '0.4rem' }}>Ameaças</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overview!.topIps.map((ip) => (
                        <tr key={ip.ip} style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => { setIpFilter(ip.ip); setPagination((p) => ({ ...p, page: 1 })) }}>
                          <td style={{ padding: '0.4rem', fontFamily: 'monospace' }}>{ip.ip}</td>
                          <td style={{ padding: '0.4rem', color: 'var(--text-muted)' }}>{ip.country || '—'}</td>
                          <td style={{ padding: '0.4rem', textAlign: 'right' }}>{formatNumber(ip.total)}</td>
                          <td style={{ padding: '0.4rem', textAlign: 'right', color: ip.threats > 0 ? '#fca5a5' : 'inherit' }}>{formatNumber(ip.threats)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Events table */}
            <div style={{ ...card }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1rem' }}>Requisições suspeitas</h3>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <select
                    value={typeFilter}
                    onChange={(e) => { setTypeFilter(e.target.value); setPagination((p) => ({ ...p, page: 1 })) }}
                    style={{ padding: '0.4rem' }}
                  >
                    <option value="">Todos os tipos</option>
                    {Object.keys(THREAT_LABELS).map((t) => (
                      <option key={t} value={t}>{labelThreat(t)}</option>
                    ))}
                  </select>
                  <select
                    value={sourceFilter}
                    onChange={(e) => { setSourceFilter(e.target.value); setPagination((p) => ({ ...p, page: 1 })) }}
                    style={{ padding: '0.4rem' }}
                  >
                    <option value="">Todas as fontes</option>
                    <option value="express">API (Express)</option>
                    <option value="nginx">Servidor (Nginx)</option>
                  </select>
                  <input
                    value={ipFilter}
                    onChange={(e) => { setIpFilter(e.target.value); setPagination((p) => ({ ...p, page: 1 })) }}
                    placeholder="Filtrar por IP"
                    style={{ padding: '0.4rem', width: '140px' }}
                  />
                  {(typeFilter || ipFilter || sourceFilter) && (
                    <button className="ghost-btn" onClick={() => { setTypeFilter(''); setIpFilter(''); setSourceFilter('') }}>Limpar</button>
                  )}
                  <button className="ghost-btn" onClick={exportCsv} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Download size={14} /> CSV
                  </button>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '0.5rem', textAlign: 'left' }}>Data/Hora</th>
                      <th style={{ padding: '0.5rem', textAlign: 'left' }}>IP</th>
                      <th style={{ padding: '0.5rem', textAlign: 'left' }}>País</th>
                      <th style={{ padding: '0.5rem', textAlign: 'left' }}>Método</th>
                      <th style={{ padding: '0.5rem', textAlign: 'left' }}>Caminho</th>
                      <th style={{ padding: '0.5rem', textAlign: 'left' }}>Status</th>
                      <th style={{ padding: '0.5rem', textAlign: 'left' }}>Tipo</th>
                      <th style={{ padding: '0.5rem', textAlign: 'left' }}>Fonte</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.length === 0 ? (
                      <tr><td colSpan={8} style={{ padding: '1rem', color: 'var(--text-muted)' }}>Nenhuma requisição suspeita no período.</td></tr>
                    ) : (
                      events.map((ev) => (
                        <tr key={ev.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '0.5rem', whiteSpace: 'nowrap' }}>{new Date(ev.created_at).toLocaleString('pt-BR')}</td>
                          <td style={{ padding: '0.5rem', fontFamily: 'monospace' }}>{ev.ip}</td>
                          <td style={{ padding: '0.5rem', color: 'var(--text-muted)' }}>{ev.country || '—'}</td>
                          <td style={{ padding: '0.5rem' }}>{ev.method}</td>
                          <td style={{ padding: '0.5rem', maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={`${ev.path}\n${ev.user_agent || ''}`}>{ev.path}</td>
                          <td style={{ padding: '0.5rem', color: ev.status_code >= 400 ? '#fca5a5' : 'inherit' }}>{ev.status_code}</td>
                          <td style={{ padding: '0.5rem' }}>{threatBadge(ev.threat_type)}</td>
                          <td style={{ padding: '0.5rem' }}>{sourceBadge(ev.source)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {pagination.totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
                  <button className="ghost-btn" disabled={pagination.page === 1} onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}>← Anterior</button>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Página {pagination.page} de {pagination.totalPages}</span>
                  <button className="ghost-btn" disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}>Próxima →</button>
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  )
}
