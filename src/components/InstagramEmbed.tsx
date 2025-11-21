import { useEffect } from 'react'

type InstagramEmbedProps = {
  url?: string | null
}

export default function InstagramEmbed({ url }: InstagramEmbedProps) {
  useEffect(() => {
    if (!url) return

    // Carregar o script do Instagram se ainda não foi carregado
    if (!window.instgrm) {
      const script = document.createElement('script')
      script.src = 'https://www.instagram.com/embed.js'
      script.async = true
      script.onload = () => {
        if (window.instgrm) {
          window.instgrm.Embeds.process()
        }
      }
      document.body.appendChild(script)
    } else {
      // Se o script já foi carregado, processar os embeds
      window.instgrm.Embeds.process()
    }
  }, [url])

  if (!url) return null

  return (
    <div className="instagram-embed-container">
      <blockquote
        className="instagram-media"
        data-instgrm-permalink={url}
        data-instgrm-version="14"
        style={{
          background: '#FFF',
          border: 0,
          borderRadius: '3px',
          boxShadow: '0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15)',
          margin: '1px',
          maxWidth: '380px',
          minWidth: '260px',
          padding: 0,
          width: 'calc(100% - 2px)',
        }}
      >
        <a href={url} target="_blank" rel="noopener noreferrer">
          Ver publicação no Instagram
        </a>
      </blockquote>
    </div>
  )
}

// Adicionar declaração de tipo para window.instgrm
declare global {
  interface Window {
    instgrm?: {
      Embeds: {
        process: () => void
      }
    }
  }
}
