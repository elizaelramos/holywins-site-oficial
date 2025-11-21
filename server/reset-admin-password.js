#!/usr/bin/env node
import bcrypt from 'bcryptjs'
import { pool } from './db.js'

async function main() {
  try {
    const username = process.env.TARGET_USER || 'admin'
    const newPass = process.env.NEW_PASS || 'admin123'

    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(newPass, salt)

    const [result] = await pool.execute('UPDATE users SET password_hash = ? WHERE username = ?', [passwordHash, username])
    console.log('Password reset for', username, '— rows affected:', result.affectedRows ?? result.affectedRows === undefined ? result.affectedRows : result[0])
    console.log('Now you can test with the new password (or change it after login).')
    process.exit(0)
  } catch (err) {
    console.error('Failed to reset password:', err && err.message ? err.message : err)
    process.exit(1)
  }
}

void main()
