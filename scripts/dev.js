import { spawn } from 'node:child_process'
import net from 'node:net'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const API_PORT = Number(process.env.DEV_API_PORT ?? 4000)
const VITE_PORT = Number(process.env.DEV_VITE_PORT ?? 5173)
const API_URL = `http://localhost:${API_PORT}/api`
const READY_TIMEOUT_MS = 45_000

const nodeMajor = Number(process.versions.node.split('.')[0])
if (nodeMajor < 20) {
  console.error(`[dev] Node ${process.versions.node} detectado. Vite exige Node 20.19+ ou 22.12+. Rode: nvm use 20`)
  process.exit(1)
}

function portFree(port) {
  return new Promise((resolve) => {
    const s = net.createServer()
    s.once('error', () => resolve(false))
    s.once('listening', () => s.close(() => resolve(true)))
    s.listen(port, '127.0.0.1')
  })
}

function waitForHttp(url, label) {
  const deadline = Date.now() + READY_TIMEOUT_MS
  return new Promise((resolve, reject) => {
    const tick = () => {
      const req = http.get(url, (res) => {
        res.resume()
        if (res.statusCode && res.statusCode < 500) return resolve()
        retry()
      })
      req.on('error', retry)
      req.setTimeout(2000, () => { req.destroy(); retry() })
    }
    const retry = () => {
      if (Date.now() > deadline) reject(new Error(`timeout aguardando ${label} em ${url}`))
      else setTimeout(tick, 500)
    }
    tick()
  })
}

const procs = []
function launch(name, args, env) {
  const child = spawn(process.execPath, args, {
    cwd: ROOT,
    env: { ...process.env, ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  const pipe = (stream, out) => stream.on('data', (d) => {
    for (const line of d.toString().split('\n')) {
      if (line.trim()) out.write(`[${name}] ${line}\n`)
    }
  })
  pipe(child.stdout, process.stdout)
  pipe(child.stderr, process.stderr)
  child.on('exit', (code, signal) => {
    if (!shuttingDown) {
      console.error(`\n[dev] [${name}] saiu (code=${code}, signal=${signal}). Encerrando tudo.`)
      shutdown(1)
    }
  })
  procs.push(child)
  return child
}

let shuttingDown = false
function shutdown(code = 0) {
  if (shuttingDown) return
  shuttingDown = true
  for (const p of procs) { try { p.kill('SIGTERM') } catch {} }
  setTimeout(() => process.exit(code), 300)
}
process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))

if (!(await portFree(API_PORT))) {
  console.error(`[dev] Porta ${API_PORT} ocupada. Libere-a ou rode com DEV_API_PORT=<outra>.`)
  process.exit(1)
}
if (!(await portFree(VITE_PORT))) {
  console.error(`[dev] Porta ${VITE_PORT} ocupada. Libere-a ou rode com DEV_VITE_PORT=<outra>.`)
  process.exit(1)
}

console.log(`[dev] Subindo API (porta ${API_PORT}) e Vite (porta ${VITE_PORT})...`)

launch('api', ['server/index.js'], { PORT: String(API_PORT) })
launch('vite', ['node_modules/vite/bin/vite.js', '--port', String(VITE_PORT), '--strictPort'], {
  VITE_API_URL: API_URL,
})

try {
  await Promise.all([
    waitForHttp(`http://localhost:${API_PORT}/health`, 'API'),
    waitForHttp(`http://localhost:${VITE_PORT}/`, 'Vite'),
  ])
  const bar = '-'.repeat(54)
  console.log(`\n${bar}`)
  console.log(`[dev] Tudo no ar`)
  console.log(`      API:       http://localhost:${API_PORT}  (health: /health)`)
  console.log(`      Frontend:  http://localhost:${VITE_PORT}`)
  console.log(`[dev] Ctrl+C para encerrar ambos`)
  console.log(`${bar}\n`)
} catch (err) {
  console.error(`\n[dev] Falha na verificação: ${err.message}`)
  shutdown(1)
}
