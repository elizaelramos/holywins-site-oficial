import express from 'express'
import { getConnection } from '../siteDataService.js'
import { requireAdmin } from './auth.js'

const router = express.Router()

// All routes require admin
router.use(requireAdmin)

// GET /api/logs - Get activity logs
router.get('/', async (req, res) => {
  const { page = 1, limit = 50, userId, action } = req.query

  try {
    const db = await getConnection()
    const offset = (parseInt(page) - 1) * parseInt(limit)

    let query = `
      SELECT
        l.id,
        l.user_id,
        l.action,
        l.entity_type,
        l.entity_id,
        l.details,
        l.ip_address,
        l.created_at,
        u.username,
        u.email
      FROM activity_logs l
      LEFT JOIN users u ON l.user_id = u.id
      WHERE 1=1
    `
    const params = []

    if (userId) {
      query += ' AND l.user_id = ?'
      params.push(parseInt(userId))
    }

    if (action) {
      query += ' AND l.action = ?'
      params.push(action)
    }

    query += ' ORDER BY l.created_at DESC LIMIT ? OFFSET ?'
    params.push(parseInt(limit), offset)

    const [logs] = await db.execute(query, params)

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM activity_logs WHERE 1=1'
    const countParams = []

    if (userId) {
      countQuery += ' AND user_id = ?'
      countParams.push(parseInt(userId))
    }

    if (action) {
      countQuery += ' AND action = ?'
      countParams.push(action)
    }

    const [countResult] = await db.execute(countQuery, countParams)
    const total = countResult[0].total

    res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (error) {
    console.error('Get logs error:', error)
    res.status(500).json({ error: 'Erro ao buscar logs' })
  }
})

// GET /api/logs/actions - Get list of all actions (for filtering)
router.get('/actions', async (req, res) => {
  try {
    const db = await getConnection()
    const [actions] = await db.execute(
      'SELECT DISTINCT action FROM activity_logs ORDER BY action'
    )
    res.json(actions.map(a => a.action))
  } catch (error) {
    console.error('Get actions error:', error)
    res.status(500).json({ error: 'Erro ao buscar ações' })
  }
})

export default router
