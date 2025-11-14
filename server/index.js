import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import siteDataRoutes from './routes/siteData.js'

const app = express()
const port = Number(process.env.PORT ?? 4000)
const allowedOrigins = (process.env.CLIENT_ORIGIN?.split(',').map((origin) => origin.trim()).filter(Boolean) ?? [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
])

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
  }),
)
app.use(express.json())
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})
app.use('/api', siteDataRoutes)

app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ message: 'Erro interno. Verifique o servidor.', detail: err.message })
})

app.listen(port, () => {
  console.log(`API Holywins ouvindo em http://localhost:${port}`)
})
