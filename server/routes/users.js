import express from 'express'
import bcrypt from 'bcryptjs'
import { getConnection, logActivity } from '../siteDataService.js'
import { requireAuth, requireAdmin } from './auth.js'

const router = express.Router()

// All routes require admin
router.use(requireAdmin)

// GET /api/users - List all users
router.get('/', async (req, res) => {
  try {
    const db = await getConnection()
    const [users] = await db.execute(
      'SELECT id, username, email, role, is_active, created_at, last_login FROM users ORDER BY created_at DESC'
    )
    res.json(users)
  } catch (error) {
    console.error('List users error:', error)
    res.status(500).json({ error: 'Erro ao listar usuários' })
  }
})

// POST /api/users - Create new user
router.post('/', async (req, res) => {
  const { username, email, password, role } = req.body

  if (!username || !email || !password || !role) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios' })
  }

  if (!['admin', 'editor'].includes(role)) {
    return res.status(400).json({ error: 'Tipo de usuário inválido' })
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Senha deve ter no mínimo 6 caracteres' })
  }

  try {
    const db = await getConnection()

    // Check if username or email already exists
    const [existing] = await db.execute(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    )

    if (existing.length > 0) {
      return res.status(409).json({ error: 'Usuário ou email já existe' })
    }

    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(password, salt)

    const [result] = await db.execute(
      'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [username, email, passwordHash, role]
    )

    await logActivity(req.session.userId, 'create_user', 'user', result.insertId, `Criou usuário ${username} (${role})`, req.ip)

    res.status(201).json({
      id: result.insertId,
      username,
      email,
      role,
      is_active: true
    })
  } catch (error) {
    console.error('Create user error:', error)
    res.status(500).json({ error: 'Erro ao criar usuário' })
  }
})

// POST /api/users/:id/reset-password - Reset user password
router.post('/:id/reset-password', async (req, res) => {
  const userId = parseInt(req.params.id)
  const { newPassword } = req.body

  if (!newPassword) {
    return res.status(400).json({ error: 'Nova senha é obrigatória' })
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Senha deve ter no mínimo 6 caracteres' })
  }

  try {
    const db = await getConnection()

    const [users] = await db.execute('SELECT username FROM users WHERE id = ?', [userId])
    if (users.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' })
    }

    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(newPassword, salt)

    await db.execute(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [passwordHash, userId]
    )

    await logActivity(req.session.userId, 'reset_password', 'user', userId, `Resetou senha do usuário ${users[0].username}`, req.ip)

    res.json({ message: 'Senha resetada com sucesso' })
  } catch (error) {
    console.error('Reset password error:', error)
    res.status(500).json({ error: 'Erro ao resetar senha' })
  }
})

// PATCH /api/users/:id/toggle-status - Activate/deactivate user
router.patch('/:id/toggle-status', async (req, res) => {
  const userId = parseInt(req.params.id)

  // Prevent admin from deactivating themselves
  if (userId === req.session.userId) {
    return res.status(400).json({ error: 'Você não pode desativar sua própria conta' })
  }

  try {
    const db = await getConnection()

    const [users] = await db.execute('SELECT username, is_active FROM users WHERE id = ?', [userId])
    if (users.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' })
    }

    const newStatus = !users[0].is_active

    await db.execute(
      'UPDATE users SET is_active = ? WHERE id = ?',
      [newStatus, userId]
    )

    await logActivity(
      req.session.userId,
      'toggle_user_status',
      'user',
      userId,
      `${newStatus ? 'Ativou' : 'Desativou'} usuário ${users[0].username}`,
      req.ip
    )

    res.json({ message: `Usuário ${newStatus ? 'ativado' : 'desativado'} com sucesso`, is_active: newStatus })
  } catch (error) {
    console.error('Toggle status error:', error)
    res.status(500).json({ error: 'Erro ao alterar status do usuário' })
  }
})

// DELETE /api/users/:id - Delete user
router.delete('/:id', async (req, res) => {
  const userId = parseInt(req.params.id)

  // Prevent admin from deleting themselves
  if (userId === req.session.userId) {
    return res.status(400).json({ error: 'Você não pode deletar sua própria conta' })
  }

  try {
    const db = await getConnection()

    const [users] = await db.execute('SELECT username FROM users WHERE id = ?', [userId])
    if (users.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' })
    }

    await db.execute('DELETE FROM users WHERE id = ?', [userId])

    await logActivity(req.session.userId, 'delete_user', 'user', userId, `Deletou usuário ${users[0].username}`, req.ip)

    res.json({ message: 'Usuário deletado com sucesso' })
  } catch (error) {
    console.error('Delete user error:', error)
    res.status(500).json({ error: 'Erro ao deletar usuário' })
  }
})

export default router
