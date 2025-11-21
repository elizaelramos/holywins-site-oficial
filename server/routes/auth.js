import express from 'express'
import bcrypt from 'bcryptjs'
import { getConnection, logActivity } from '../siteDataService.js'

const router = express.Router()

// Middleware to check if user is authenticated
export function requireAuth(req, res, next) {
  if (!req.session?.userId) {
    return res.status(401).json({ error: 'Não autenticado' })
  }
  next()
}

// Middleware to check if user is admin
export function requireAdmin(req, res, next) {
  if (!req.session?.userId) {
    return res.status(401).json({ error: 'Não autenticado' })
  }
  if (req.session.userRole !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' })
  }
  next()
}

// POST /api/auth/login - Login user
router.post('/login', async (req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({ error: 'Usuário e senha são obrigatórios' })
  }

  try {
    const db = await getConnection()
    const [users] = await db.execute(
      'SELECT id, username, email, password_hash, role, is_active FROM users WHERE username = ? OR email = ?',
      [username, username]
    )

    if (users.length === 0) {
      return res.status(401).json({ error: 'Credenciais inválidas' })
    }

    const user = users[0]

    if (!user.is_active) {
      return res.status(403).json({ error: 'Usuário desativado' })
    }

    const isValid = await bcrypt.compare(password, user.password_hash)
    if (!isValid) {
      return res.status(401).json({ error: 'Credenciais inválidas' })
    }

    // Update last login
    await db.execute('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id])

    // Set session
    req.session.userId = user.id
    req.session.username = user.username
    req.session.userEmail = user.email
    req.session.userRole = user.role

    // Log activity
    await logActivity(user.id, 'login', null, null, 'Usuário fez login', req.ip)

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Erro ao fazer login' })
  }
})

// POST /api/auth/logout - Logout user
router.post('/logout', requireAuth, async (req, res) => {
  const userId = req.session.userId

  try {
    await logActivity(userId, 'logout', null, null, 'Usuário fez logout', req.ip)
  } catch (error) {
    console.error('Error logging logout:', error)
  }

  req.session.destroy((err) => {
    if (err) {
      console.error('Session destroy error:', err)
      return res.status(500).json({ error: 'Erro ao fazer logout' })
    }
    res.clearCookie('connect.sid')
    res.json({ message: 'Logout realizado com sucesso' })
  })
})

// GET /api/auth/me - Get current user
router.get('/me', requireAuth, async (req, res) => {
  try {
    const db = await getConnection()
    const [users] = await db.execute(
      'SELECT id, username, email, role, created_at, last_login FROM users WHERE id = ?',
      [req.session.userId]
    )

    if (users.length === 0) {
      req.session.destroy()
      return res.status(401).json({ error: 'Usuário não encontrado' })
    }

    res.json(users[0])
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ error: 'Erro ao buscar usuário' })
  }
})

// POST /api/auth/change-password - Change own password
router.post('/change-password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias' })
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Nova senha deve ter no mínimo 6 caracteres' })
  }

  try {
    const db = await getConnection()
    const [users] = await db.execute(
      'SELECT password_hash FROM users WHERE id = ?',
      [req.session.userId]
    )

    if (users.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' })
    }

    const isValid = await bcrypt.compare(currentPassword, users[0].password_hash)
    if (!isValid) {
      return res.status(401).json({ error: 'Senha atual incorreta' })
    }

    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(newPassword, salt)

    await db.execute(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [passwordHash, req.session.userId]
    )

    await logActivity(req.session.userId, 'change_password', 'user', req.session.userId, 'Usuário alterou sua senha', req.ip)

    res.json({ message: 'Senha alterada com sucesso' })
  } catch (error) {
    console.error('Change password error:', error)
    res.status(500).json({ error: 'Erro ao alterar senha' })
  }
})

export default router
