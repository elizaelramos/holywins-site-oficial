import mysql from 'mysql2/promise'
import fs from 'fs'

const sql = fs.readFileSync('server/communities.sql', 'utf8')

// Then, connect to the database and create tables
const connection = await mysql.createConnection({
  host: 'localhost',
  port: 3306,
  user: 'elizaelramos',
  password: 'Elizael@011224',
  database: 'holywins',
  multipleStatements: true
})

await connection.query(sql);
await connection.end()

console.log('Tabela de comunidades criada com sucesso.')
