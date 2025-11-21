#!/usr/bin/env node
import { pool } from './db.js'

async function main() {
  try {
    const [rows] = await pool.execute('SELECT id, username, email, role, is_active, created_at FROM users ORDER BY id DESC LIMIT 20')
    console.log('Found users:', rows.length)
    console.log(JSON.stringify(rows, null, 2))
    process.exit(0)
  } catch (err) {
    console.error('Error querying users table:', err && err.message ? err.message : err)
    process.exit(2)
  }
}

void main()
