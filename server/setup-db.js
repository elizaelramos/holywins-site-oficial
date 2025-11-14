import mysql from 'mysql2/promise'
import fs from 'fs'

const sql = fs.readFileSync('server/schema.sql', 'utf8')

const createDbSql = 'CREATE DATABASE IF NOT EXISTS holywins CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;'
const tablesSql = sql.replace(createDbSql + '\r\nUSE holywins;\r\n\r\n', '').trim()

// First, create the database
const connection1 = await mysql.createConnection({
  host: 'localhost',
  port: 3306,
  user: 'elizaelramos',
  password: 'Elizael@011224'
})
await connection1.execute(createDbSql)
await connection1.end()

// Then, connect to the database and create tables
const connection2 = await mysql.createConnection({
  host: 'localhost',
  port: 3306,
  user: 'elizaelramos',
  password: 'Elizael@011224',
  database: 'holywins'
})

const statements = tablesSql.split(';').filter(s => s.trim())
for (const statement of statements) {
  await connection2.execute(statement)
}
await connection2.end()

console.log('Banco de dados e tabelas criados com sucesso.')