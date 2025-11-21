import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

export default function AdminProfile() {
  const { user, refreshAuth } = useAuth()
  const navigate = useNavigate()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')

    if (newPassword !== confirmPassword) {
      setError('As senhas não conferem')
      return
    }

    if (newPassword.length < 6) {
      setError('A nova senha deve ter no mínimo 6 caracteres')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao alterar senha')
      }

      setSuccessMessage('Senha alterada com sucesso!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      await refreshAuth()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-stack">
      <section className="page-card">
        <div style={{ marginBottom: '2rem' }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              marginBottom: '1rem',
              padding: 0,
              fontSize: '0.875rem',
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = 'var(--text)')}
            onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <ArrowLeft size={16} />
            Voltar
          </button>
          <p className="eyebrow">Configurações</p>
          <h1>Meu Perfil</h1>
        </div>

        <div style={{
          padding: '1.5rem',
          marginBottom: '2rem',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
        }}>
          <h3 style={{ marginBottom: '1rem' }}>Informações da Conta</h3>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <div>
              <strong>Usuário:</strong> {user?.username}
            </div>
            <div>
              <strong>Email:</strong> {user?.email}
            </div>
            <div>
              <strong>Tipo:</strong>{' '}
              <span style={{
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                fontSize: '0.875rem',
                background: user?.role === 'admin' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                color: user?.role === 'admin' ? '#c4b5fd' : '#93c5fd',
              }}>
                {user?.role === 'admin' ? 'Administrador' : 'Editor'}
              </span>
            </div>
            {user?.last_login && (
              <div>
                <strong>Último login:</strong> {new Date(user.last_login).toLocaleString('pt-BR')}
              </div>
            )}
          </div>
        </div>

        <div style={{
          padding: '1.5rem',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
        }}>
          <h3 style={{ marginBottom: '1rem' }}>Alterar Senha</h3>

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

          {successMessage && (
            <div style={{
              padding: '1rem',
              marginBottom: '1rem',
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: '8px',
              color: '#86efac',
            }}>
              {successMessage}
            </div>
          )}

          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label htmlFor="currentPassword" style={{ display: 'block', marginBottom: '0.5rem' }}>
                Senha Atual
              </label>
              <input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                style={{ width: '100%', padding: '0.5rem', maxWidth: '400px' }}
              />
            </div>

            <div>
              <label htmlFor="newPassword" style={{ display: 'block', marginBottom: '0.5rem' }}>
                Nova Senha
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                style={{ width: '100%', padding: '0.5rem', maxWidth: '400px' }}
              />
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Mínimo 6 caracteres
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" style={{ display: 'block', marginBottom: '0.5rem' }}>
                Confirmar Nova Senha
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                style={{ width: '100%', padding: '0.5rem', maxWidth: '400px' }}
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="primary-btn"
              >
                {loading ? 'Alterando...' : 'Alterar Senha'}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  )
}
