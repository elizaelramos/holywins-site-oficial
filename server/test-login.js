#!/usr/bin/env node
import bcrypt from 'bcryptjs'
import { pool } from './db.js'

async function main() {
  try {
    const username = process.env.TEST_USER || 'admin'
    const plain = process.env.TEST_PASS || 'admin123'
    const [rows] = await pool.execute('SELECT id, username, email, password_hash, is_active FROM users WHERE username = ? OR email = ?', [username, username])
    if (!rows || rows.length === 0) {
      console.error('User not found for', username)
      process.exit(2)
    }
    const user = rows[0]
    console.log('Found user:', { id: user.id, username: user.username, email: user.email, is_active: user.is_active })
    const ok = await bcrypt.compare(plain, user.password_hash)
    console.log('Password match:', ok)
    process.exit(ok ? 0 : 3)
  } catch (err) {
    console.error('Error testing login:', err && err.message ? err.message : err)
    process.exit(4)
  }
}

void main()
