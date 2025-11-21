import { useState, useEffect, FormEvent } from 'react'
import { useAuth } from '../hooks/useAuth'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

interface User {
  id: number
  username: string
  email: string
  role: 'admin' | 'editor'
  is_active: boolean
  created_at: string
  last_login: string | null
}

export default function AdminUsers() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // New user form
  const [showNewUserForm, setShowNewUserForm] = useState(false)
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    role: 'editor' as 'admin' | 'editor',
  })

  // Reset password form
  const [resetPasswordUserId, setResetPasswordUserId] = useState<number | null>(null)
  const [newPassword, setNewPassword] = useState('')

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/users`, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Erro ao carregar usuários')
      }

      const data = await response.json()
      setUsers(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')

    try {
      const response = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newUser),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar usuário')
      }

      setSuccessMessage('Usuário criado com sucesso!')
      setNewUser({ username: '', email: '', password: '', role: 'editor' })
      setShowNewUserForm(false)
      await loadUsers()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleResetPassword = async (userId: number) => {
    if (!newPassword) {
      setError('Digite a nova senha')
      return
    }

    try {
      const response = await fetch(`${API_URL}/users/${userId}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ newPassword }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao resetar senha')
      }

      setSuccessMessage('Senha resetada com sucesso!')
      setResetPasswordUserId(null)
      setNewPassword('')
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleToggleStatus = async (userId: number) => {
    try {
      const response = await fetch(`${API_URL}/users/${userId}/toggle-status`, {
        method: 'PATCH',
        credentials: 'include',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao alterar status')
      }

      setSuccessMessage(data.message)
      await loadUsers()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleDeleteUser = async (userId: number, username: string) => {
    if (!confirm(`Tem certeza que deseja deletar o usuário ${username}?`)) {
      return
    }

    try {
      const response = await fetch(`${API_URL}/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao deletar usuário')
      }

      setSuccessMessage('Usuário deletado com sucesso!')
      await loadUsers()
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (loading) {
    return (
      <div className="page-stack">
        <section className="page-card">
          <p>Carregando usuários...</p>
        </section>
      </div>
    )
  }

  return (
    <div className="page-stack">
      <section className="page-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <p className="eyebrow">Gerenciamento</p>
            <h1>Usuários</h1>
          </div>
          <button className="primary-btn" onClick={() => setShowNewUserForm(!showNewUserForm)}>
            {showNewUserForm ? 'Cancelar' : '+ Novo Usuário'}
          </button>
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

        {showNewUserForm && (
          <form onSubmit={handleCreateUser} style={{
            padding: '1.5rem',
            marginBottom: '2rem',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
          }}>
            <h3 style={{ marginBottom: '1rem' }}>Criar Novo Usuário</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Usuário</label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  required
                  style={{ width: '100%', padding: '0.5rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  required
                  style={{ width: '100%', padding: '0.5rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Senha</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  required
                  minLength={6}
                  style={{ width: '100%', padding: '0.5rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Tipo</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'admin' | 'editor' })}
                  style={{ width: '100%', padding: '0.5rem' }}
                >
                  <option value="editor">Editor</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
            </div>
            <button type="submit" className="primary-btn">Criar Usuário</button>
          </form>
        )}

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Usuário</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Email</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Tipo</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Status</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Último Login</th>
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.75rem' }}>{user.username}</td>
                  <td style={{ padding: '0.75rem' }}>{user.email}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.875rem',
                      background: user.role === 'admin' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                      color: user.role === 'admin' ? '#c4b5fd' : '#93c5fd',
                    }}>
                      {user.role === 'admin' ? 'Admin' : 'Editor'}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.875rem',
                      background: user.is_active ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                      color: user.is_active ? '#86efac' : '#fca5a5',
                    }}>
                      {user.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                    {user.last_login ? new Date(user.last_login).toLocaleString('pt-BR') : 'Nunca'}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => setResetPasswordUserId(user.id)}
                        className="ghost-btn"
                        style={{ fontSize: '0.875rem', padding: '0.25rem 0.5rem' }}
                      >
                        Resetar Senha
                      </button>
                      {user.id !== currentUser?.id && (
                        <>
                          <button
                            onClick={() => handleToggleStatus(user.id)}
                            className="ghost-btn"
                            style={{ fontSize: '0.875rem', padding: '0.25rem 0.5rem' }}
                          >
                            {user.is_active ? 'Desativar' : 'Ativar'}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id, user.username)}
                            className="ghost-btn"
                            style={{ fontSize: '0.875rem', padding: '0.25rem 0.5rem', color: '#fca5a5' }}
                          >
                            Deletar
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {resetPasswordUserId && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}>
            <div style={{
              background: 'var(--glass)',
              backdropFilter: 'blur(20px)',
              padding: '2rem',
              borderRadius: '12px',
              maxWidth: '400px',
              width: '90%',
              border: '1px solid var(--border)',
            }}>
              <h3 style={{ marginBottom: '1rem' }}>Resetar Senha</h3>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Nova Senha</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
                placeholder="Mínimo 6 caracteres"
                style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }}
              />
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    setResetPasswordUserId(null)
                    setNewPassword('')
                  }}
                  className="ghost-btn"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleResetPassword(resetPasswordUserId)}
                  className="primary-btn"
                >
                  Resetar
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
