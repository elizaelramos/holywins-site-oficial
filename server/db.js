import mysql from 'mysql2/promise'

const requiredEnv = ['MYSQL_HOST', 'MYSQL_PORT', 'MYSQL_DATABASE', 'MYSQL_USER', 'MYSQL_PASSWORD']
const missing = requiredEnv.filter((name) => !process.env[name])
if (missing.length) {
  throw new Error(`Variáveis de ambiente faltantes para o banco: ${missing.join(', ')}`)
}

export const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT ?? 3306),
  database: process.env.MYSQL_DATABASE,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: true,
})

export async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params)
  return rows
}
