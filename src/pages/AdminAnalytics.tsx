import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, Users, Eye, MousePointerClick, Bot, TrendingUp, TrendingDown } from 'lucide-react'

const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
const API_URL = RAW_API_URL.endsWith('/') ? RAW_API_URL.slice(0, -1) : RAW_API_URL

interface Overview {
  range: { from: string; to: string }
  totalViews: number
  uniqueVisitors: number
  sessions: number
  botViews: number
  botPercent: number
  avgPerDay: number
  prevViews: number
  viewsChangePercent: number | null
}

interface SeriesPoint {
  day: string
  views: number
  visitors: number
}

interface LabelTotal {
  label: string
  total: number
}

interface Breakdowns {
  topPages: LabelTotal[]
  referrers: LabelTotal[]
  devices: LabelTotal[]
  browsers: LabelTotal[]
  countries: LabelTotal[]
  hours: { hour: number; total: number }[]
}

const PRESETS = [
  { label: 'Últimos 7 dias', days: 7 },
  { label: 'Últimos 30 dias', days: 30 },
  { label: 'Últimos 90 dias', days: 90 },
]

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

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub?: React.ReactNode
}) {
  return (
    <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
        {icon}
        <span style={{ fontSize: '0.8rem' }}>{label}</span>
      </div>
      <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>{value}</div>
      {sub && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{sub}</div>}
    </div>
  )
}

function LineChart({ data }: { data: SeriesPoint[] }) {
  const width = 760
  const height = 220
  const pad = { top: 16, right: 16, bottom: 28, left: 40 }
  const innerW = width - pad.left - pad.right
  const innerH = height - pad.top - pad.bottom

  if (data.length === 0) {
    return <p style={{ color: 'var(--text-muted)' }}>Sem dados no período.</p>
  }

  const maxY = Math.max(1, ...data.map((d) => d.views))
  const stepX = data.length > 1 ? innerW / (data.length - 1) : 0
  const x = (i: number) => pad.left + (data.length > 1 ? i * stepX : innerW / 2)
  const y = (v: number) => pad.top + innerH - (v / maxY) * innerH

  const line = (key: 'views' | 'visitors') =>
    data.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(d[key]).toFixed(1)}`).join(' ')

  const ticks = 4
  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto' }} role="img" aria-label="Visitas ao longo do tempo">
      {Array.from({ length: ticks + 1 }).map((_, i) => {
        const val = Math.round((maxY / ticks) * (ticks - i))
        const yy = pad.top + (innerH / ticks) * i
        return (
          <g key={i}>
            <line x1={pad.left} y1={yy} x2={width - pad.right} y2={yy} stroke="var(--border)" strokeWidth={1} opacity={0.4} />
            <text x={pad.left - 6} y={yy + 4} textAnchor="end" fontSize={10} fill="var(--text-muted)">
              {val}
            </text>
          </g>
        )
      })}
      <path d={line('views')} fill="none" stroke="#60a5fa" strokeWidth={2} />
      <path d={line('visitors')} fill="none" stroke="#34d399" strokeWidth={2} />
      {data.map((d, i) => (
        <circle key={i} cx={x(i)} cy={y(d.views)} r={2.5} fill="#60a5fa">
          <title>{`${d.day}: ${d.views} visitas, ${d.visitors} visitantes`}</title>
        </circle>
      ))}
      {data.map((d, i) => {
        if (data.length > 12 && i % Math.ceil(data.length / 8) !== 0 && i !== data.length - 1) return null
        return (
          <text key={`x${i}`} x={x(i)} y={height - 8} textAnchor="middle" fontSize={9} fill="var(--text-muted)">
            {d.day.slice(5)}
          </text>
        )
      })}
    </svg>
  )
}

function BarList({ title, items }: { title: string; items: LabelTotal[] }) {
  const max = Math.max(1, ...items.map((i) => i.total))
  return (
    <div style={card}>
      <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1rem' }}>{title}</h3>
      {items.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Sem dados.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {items.map((it, idx) => (
            <div key={idx}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.2rem' }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '75%' }} title={it.label}>
                  {it.label}
                </span>
                <span style={{ color: 'var(--text-muted)' }}>{formatNumber(it.total)}</span>
              </div>
              <div style={{ height: '6px', borderRadius: '3px', background: 'var(--border)' }}>
                <div style={{ height: '100%', borderRadius: '3px', width: `${(it.total / max) * 100}%`, background: '#60a5fa' }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function HoursChart({ hours }: { hours: { hour: number; total: number }[] }) {
  const max = Math.max(1, ...hours.map((h) => h.total))
  return (
    <div style={card}>
      <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1rem' }}>Horários de pico</h3>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '120px' }}>
        {hours.map((h) => (
          <div key={h.hour} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }} title={`${h.hour}h: ${h.total}`}>
            <div style={{ width: '100%', background: '#a78bfa', borderRadius: '2px 2px 0 0', height: `${(h.total / max) * 100}%`, minHeight: h.total > 0 ? '2px' : 0 }} />
            {h.hour % 3 === 0 && <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '2px' }}>{h.hour}h</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AdminAnalytics() {
  const navigate = useNavigate()
  const [days, setDays] = useState(30)
  const [overview, setOverview] = useState<Overview | null>(null)
  const [series, setSeries] = useState<SeriesPoint[]>([])
  const [breakdowns, setBreakdowns] = useState<Breakdowns | null>(null)
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
        const qs = `from=${range.from}&to=${range.to}`
        const [o, t, b] = await Promise.all([
          fetch(`${API_URL}/analytics/overview?${qs}`, { credentials: 'include' }),
          fetch(`${API_URL}/analytics/timeseries?${qs}`, { credentials: 'include' }),
          fetch(`${API_URL}/analytics/breakdowns?${qs}`, { credentials: 'include' }),
        ])
        if (!o.ok || !t.ok || !b.ok) throw new Error('Erro ao carregar analytics')
        const [oj, tj, bj] = await Promise.all([o.json(), t.json(), b.json()])
        if (cancelled) return
        setOverview(oj)
        setSeries(tj)
        setBreakdowns(bj)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Erro ao carregar analytics')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [range])

  const exportCsv = (type: string) => {
    window.open(`${API_URL}/analytics/export?type=${type}&from=${range.from}&to=${range.to}`, '_blank')
  }

  const change = overview?.viewsChangePercent
  const positive = (change ?? 0) >= 0

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
            <p className="eyebrow">Relatórios</p>
            <h1>Analytics</h1>
            <p style={{ marginTop: '0.25rem', color: 'var(--text-muted)' }}>
              Acessos ao site público · {range.from} a {range.to}
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
          <p>Carregando analytics...</p>
        ) : (
          <>
            {/* KPI cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <StatCard
                icon={<Eye size={16} />}
                label="Visitas (page views)"
                value={formatNumber(overview?.totalViews ?? 0)}
                sub={
                  change === null || change === undefined ? (
                    'sem período anterior'
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: positive ? '#34d399' : '#fca5a5' }}>
                      {positive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      {Math.abs(change)}% vs período anterior
                    </span>
                  )
                }
              />
              <StatCard icon={<Users size={16} />} label="Visitantes únicos" value={formatNumber(overview?.uniqueVisitors ?? 0)} />
              <StatCard icon={<MousePointerClick size={16} />} label="Sessões" value={formatNumber(overview?.sessions ?? 0)} />
              <StatCard icon={<TrendingUp size={16} />} label="Média por dia" value={formatNumber(overview?.avgPerDay ?? 0)} />
              <StatCard icon={<Bot size={16} />} label="Tráfego de bots" value={`${overview?.botPercent ?? 0}%`} sub={`${formatNumber(overview?.botViews ?? 0)} visitas`} />
            </div>

            {/* Timeseries */}
            <div style={{ ...card, marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h3 style={{ margin: 0, fontSize: '1rem' }}>Visitas ao longo do tempo</h3>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span style={{ color: '#60a5fa' }}>●</span> Visitas &nbsp; <span style={{ color: '#34d399' }}>●</span> Visitantes
                  </span>
                  <button className="ghost-btn" onClick={() => exportCsv('timeseries')} style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Download size={14} /> CSV
                  </button>
                </div>
              </div>
              <LineChart data={series} />
            </div>

            {/* Breakdowns */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <BarList title="Páginas mais acessadas" items={breakdowns?.topPages ?? []} />
              <BarList title="Origem do tráfego (referrers)" items={breakdowns?.referrers ?? []} />
              <BarList title="Dispositivos" items={breakdowns?.devices ?? []} />
              <BarList title="Navegadores" items={breakdowns?.browsers ?? []} />
              <BarList title="Países" items={breakdowns?.countries ?? []} />
              <HoursChart hours={breakdowns?.hours ?? []} />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', alignSelf: 'center' }}>Exportar relatório:</span>
              {['top-pages', 'referrers', 'countries', 'devices'].map((t) => (
                <button key={t} className="ghost-btn" onClick={() => exportCsv(t)} style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Download size={14} /> {t}
                </button>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  )
}
