import { useState, useEffect } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

interface ActivityLog {
  id: number
  user_id: number
  username: string
  email: string
  action: string
  entity_type: string | null
  entity_id: number | null
  details: string
  ip_address: string
  created_at: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function AdminLogs() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({
    userId: '',
    action: '',
  })
  const [availableActions, setAvailableActions] = useState<string[]>([])

  useEffect(() => {
    loadLogs()
    loadAvailableActions()
  }, [pagination.page, filters])

  const loadLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })

      if (filters.userId) params.append('userId', filters.userId)
      if (filters.action) params.append('action', filters.action)

      const response = await fetch(`${API_URL}/logs?${params}`, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Erro ao carregar logs')
      }

      const data = await response.json()
      setLogs(data.logs)
      setPagination(data.pagination)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadAvailableActions = async () => {
    try {
      const response = await fetch(`${API_URL}/logs/actions`, {
        credentials: 'include',
      })

      if (response.ok) {
        const actions = await response.json()
        setAvailableActions(actions)
      }
    } catch (err) {
      console.error('Error loading actions:', err)
    }
  }

  const formatAction = (action: string) => {
    const actionMap: Record<string, string> = {
      login: 'Login',
      logout: 'Logout',
      create_user: 'Criar Usuário',
      reset_password: 'Resetar Senha',
      change_password: 'Alterar Senha',
      toggle_user_status: 'Alterar Status',
      delete_user: 'Deletar Usuário',
      update_hero: 'Atualizar Hero',
      update_contact: 'Atualizar Contato',
      create_slide: 'Criar Slide',
      update_slide: 'Atualizar Slide',
      delete_slide: 'Deletar Slide',
      create_gallery: 'Criar Galeria',
      update_gallery: 'Atualizar Galeria',
      delete_gallery: 'Deletar Galeria',
      create_sponsor: 'Criar Patrocinador',
      update_sponsor: 'Atualizar Patrocinador',
      delete_sponsor: 'Deletar Patrocinador',
      create_banner: 'Criar Banner',
      update_banner: 'Atualizar Banner',
      delete_banner: 'Deletar Banner',
    }
    return actionMap[action] || action
  }

  if (loading && logs.length === 0) {
    return (
      <div className="page-stack">
        <section className="page-card">
          <p>Carregando logs...</p>
        </section>
      </div>
    )
  }

  return (
    <div className="page-stack">
      <section className="page-card">
        <div style={{ marginBottom: '2rem' }}>
          <p className="eyebrow">Sistema</p>
          <h1>Logs de Atividade</h1>
          <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>
            Total de {pagination.total} registros
          </p>
        </div>

        {error && (
          <div style={{
            padding: '1rem',
            marginBottom: '1rem',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            color: '#fca5a5',
          }}>
            {error}
          </div>
        )}

        {/* Filters */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
        }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
              ID do Usuário
            </label>
            <input
              type="number"
              value={filters.userId}
              onChange={(e) => {
                setFilters({ ...filters, userId: e.target.value })
                setPagination({ ...pagination, page: 1 })
              }}
              placeholder="Filtrar por usuário"
              style={{ padding: '0.5rem', width: '150px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
              Ação
            </label>
            <select
              value={filters.action}
              onChange={(e) => {
                setFilters({ ...filters, action: e.target.value })
                setPagination({ ...pagination, page: 1 })
              }}
              style={{ padding: '0.5rem', width: '200px' }}
            >
              <option value="">Todas as ações</option>
              {availableActions.map((action) => (
                <option key={action} value={action}>
                  {formatAction(action)}
                </option>
              ))}
            </select>
          </div>
          {(filters.userId || filters.action) && (
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                onClick={() => {
                  setFilters({ userId: '', action: '' })
                  setPagination({ ...pagination, page: 1 })
                }}
                className="ghost-btn"
              >
                Limpar Filtros
              </button>
            </div>
          )}
        </div>

        {/* Logs Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Data/Hora</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Usuário</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Ação</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Detalhes</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.75rem', whiteSpace: 'nowrap' }}>
                    {new Date(log.created_at).toLocaleString('pt-BR')}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <div>
                      <div style={{ fontWeight: 500 }}>{log.username}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.email}</div>
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      background: 'rgba(59, 130, 246, 0.2)',
                      color: '#93c5fd',
                      fontSize: '0.75rem',
                    }}>
                      {formatAction(log.action)}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem' }}>{log.details}</td>
                  <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{log.ip_address}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '1rem',
            marginTop: '2rem',
          }}>
            <button
              onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
              disabled={pagination.page === 1}
              className="ghost-btn"
            >
              ← Anterior
            </button>
            <span style={{ fontSize: '0.875rem' }}>
              Página {pagination.page} de {pagination.totalPages}
            </span>
            <button
              onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
              disabled={pagination.page >= pagination.totalPages}
              className="ghost-btn"
            >
              Próxima →
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
