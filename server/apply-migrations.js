#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { pool } from './db.js'

async function runSqlFile(filePath) {
  const sql = fs.readFileSync(filePath, 'utf8')
  // naive split by semicolon; ignore empty statements and comments
  const statements = sql
    .split(/;\s*\n/)
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--'))

  for (const stmt of statements) {
    try {
      // execute each statement
      await pool.execute(stmt)
    } catch (err) {
      console.error('Error executing statement:', stmt.slice(0, 120))
      throw err
    }
  }
}

async function main() {
  try {
    const migrationsDir = path.join(process.cwd(), 'server', 'migrations')
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'))
    console.log('Found migration files:', files)
    for (const file of files) {
      const fp = path.join(migrationsDir, file)
      console.log('Applying', file)
      await runSqlFile(fp)
      console.log('Applied', file)
    }
    console.log('All migrations applied successfully')
    process.exit(0)
  } catch (err) {
    console.error('Migration failed:', err && err.message ? err.message : err)
    process.exit(1)
  }
}

void main()
