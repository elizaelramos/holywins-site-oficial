import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

const SITE_URL = 'https://www.holywinscorumba.com'

// Páginas com prévia própria ao compartilhar o link (WhatsApp, Facebook...).
// Os robôs dessas redes não executam JS, então geramos um HTML estático
// por rota com as meta tags ajustadas; o nginx serve dist/<rota>/index.html.
const sharePages = [
  {
    path: 'inscricoes',
    title: 'Inscrições abertas — Holywins',
    description: 'Estamos com inscrições abertas! Garanta já a sua participação no Holywins.',
  },
]

function sharePreviews(): Plugin {
  return {
    name: 'share-previews',
    apply: 'build',
    writeBundle(options) {
      const outDir = options.dir ?? 'dist'
      const html = readFileSync(join(outDir, 'index.html'), 'utf8')
      for (const page of sharePages) {
        const out = html
          .replace(/<title>.*?<\/title>/, `<title>${page.title}</title>`)
          .replace(/(property="og:url" content=")[^"]*/, `$1${SITE_URL}/${page.path}/`)
          .replace(/((?:property="og:title"|name="twitter:title") content=")[^"]*/g, `$1${page.title}`)
          .replace(/((?:property="og:description"|name="twitter:description") content=")[^"]*/g, `$1${page.description}`)
        mkdirSync(join(outDir, page.path), { recursive: true })
        writeFileSync(join(outDir, page.path, 'index.html'), out)
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), sharePreviews()],
})
