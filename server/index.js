import 'dotenv/config'
import express from 'express'
import path from 'path'
import cors from 'cors'
import session from 'express-session'
import cookieParser from 'cookie-parser'
import siteDataRoutes from './routes/siteData.js'
import authRoutes from './routes/auth.js'
import usersRoutes from './routes/users.js'
import logsRoutes from './routes/logs.js'

const app = express()
// When the app is behind a reverse proxy (nginx, load balancer), enable trust proxy
// so express can correctly detect the original request protocol (https) and
// session cookies with `secure: true` work as expected.
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1)
}
const port = Number(process.env.PORT ?? 4000)

// Get origins from env and add defaults
const envOrigins = process.env.CLIENT_ORIGIN?.split(',').map((origin) => origin.trim()).filter(Boolean) || []
const defaultOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'http://localhost:5175',
]
const allowedOrigins = [...new Set([...envOrigins, ...defaultOrigins])]

console.log('CLIENT_ORIGIN env:', process.env.CLIENT_ORIGIN)
console.log('Allowed origins:', allowedOrigins)

const allowAll = allowedOrigins.includes('*')

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowAll || allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error(`Origem não autorizada: ${origin}`))
      }
    },
    credentials: true, // Allow cookies
  }),
)
// Aumentar limite de payload JSON para 500MB (para uploads grandes)
app.use(express.json({ limit: '500mb' }))
app.use(express.urlencoded({ limit: '500mb', extended: true }))
app.use(cookieParser())

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'holywins-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: (() => {
      const secure = process.env.NODE_ENV === 'production'
      // Allow overriding SameSite via env var SESSION_SAMESITE (e.g. 'none', 'lax', 'strict')
      const sameSite = (process.env.SESSION_SAMESITE || (process.env.NODE_ENV === 'production' ? 'strict' : 'lax'))
      return {
        secure,
        httpOnly: true,
        // Allow overriding cookie domain via env var (ex: '.holywinscorumba.com')
        domain: process.env.SESSION_COOKIE_DOMAIN || undefined,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite,
      }
    })(),
  })
)

// Serve static files (uploaded images, etc.)
app.use('/images', express.static(path.join(process.cwd(), 'public', 'images')))
// Also serve images that may exist under the server folder (some uploads ended up here)
app.use('/images', express.static(path.join(process.cwd(), 'server', 'public', 'images')))

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/logs', logsRoutes)
app.use('/api', siteDataRoutes)

app.use((err, _req, res, _next) => {
  console.error(err)
  if (err && err.stack) console.error(err.stack)
  res.status(500).json({ message: 'Erro interno. Verifique o servidor.', detail: err.message })
})

app.listen(port, () => {
  console.log(`API Holywins ouvindo em http://localhost:${port}`)
})
