import { useState, useEffect } from 'react'

interface PromoSpotlightProps {
  imageSrc: string
  title?: string
  description?: string
}

export default function PromoSpotlight({
  imageSrc,
  title = 'Promoção de Carreteiro 2026',
  description = 'Participe! Compartilhe com seus amigos e familiares.',
}: PromoSpotlightProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [canNativeShare, setCanNativeShare] = useState(false)

  const pageUrl = typeof window !== 'undefined' ? window.location.href : ''
  const imageAbsoluteUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${imageSrc}`
      : imageSrc

  const shareText = `${title}\n${description}`

  useEffect(() => {
    setCanNativeShare(typeof navigator !== 'undefined' && !!navigator.share)
  }, [])

  // Fechar modal com ESC
  useEffect(() => {
    if (!modalOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModalOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [modalOpen])

  // Tenta compartilhar a imagem como arquivo; cai de volta para URL se não suportado
  const shareImageFile = async (): Promise<File | null> => {
    try {
      const resp = await fetch(imageSrc)
      const blob = await resp.blob()
      const ext = blob.type.includes('png') ? 'png' : 'jpeg'
      return new File([blob], `promo-carreteiro-2026.${ext}`, { type: blob.type })
    } catch {
      return null
    }
  }

  const handleNativeShare = async () => {
    try {
      const file = await shareImageFile()
      if (file && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title,
          text: description,
          files: [file],
        })
      } else {
        await navigator.share({
          title,
          text: shareText,
          url: pageUrl,
        })
      }
    } catch {
      /* cancelado pelo usuário */
    }
  }

  const shareWhatsApp = () => {
    const msg = encodeURIComponent(`${shareText}\n${pageUrl}`)
    window.open(`https://api.whatsapp.com/send?text=${msg}`, '_blank', 'noopener,noreferrer')
  }

  const shareFacebook = () => {
    const url = encodeURIComponent(pageUrl)
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      '_blank',
      'noopener,noreferrer,width=600,height=500'
    )
  }

  const shareTwitter = () => {
    const text = encodeURIComponent(shareText)
    const url = encodeURIComponent(pageUrl)
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      '_blank',
      'noopener,noreferrer,width=600,height=400'
    )
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      /* fallback: selecionar texto */
    }
  }

  return (
    <>
      {/* Card de destaque */}
      <section className="promo-spotlight reveal-on-scroll" aria-label={title}>
        <div className="promo-spotlight__badge">🎉 Evento em destaque</div>
        <div
          className="promo-spotlight__image-wrapper"
          role="button"
          tabIndex={0}
          aria-label="Visualizar imagem em tela cheia"
          onClick={() => setModalOpen(true)}
          onKeyDown={(e) => e.key === 'Enter' && setModalOpen(true)}
        >
          <img
            src={imageSrc}
            alt={title}
            className="promo-spotlight__image"
            loading="lazy"
          />
          <div className="promo-spotlight__overlay">
            <span className="promo-spotlight__zoom-icon" aria-hidden>🔍</span>
            <span>Clique para ampliar</span>
          </div>
        </div>

        <div className="promo-spotlight__info">
          <h3 className="promo-spotlight__title">{title}</h3>
          <p className="promo-spotlight__desc">{description}</p>

          <div className="promo-spotlight__actions">
            {canNativeShare ? (
              <button
                className="promo-share-btn promo-share-btn--native"
                onClick={handleNativeShare}
                aria-label="Compartilhar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" aria-hidden><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                Compartilhar
              </button>
            ) : null}

            <button
              className="promo-share-btn promo-share-btn--whatsapp"
              onClick={shareWhatsApp}
              aria-label="Compartilhar no WhatsApp"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp
            </button>

            <button
              className="promo-share-btn promo-share-btn--facebook"
              onClick={shareFacebook}
              aria-label="Compartilhar no Facebook"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              Facebook
            </button>

            <button
              className="promo-share-btn promo-share-btn--twitter"
              onClick={shareTwitter}
              aria-label="Compartilhar no X (Twitter)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.26 5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              X / Twitter
            </button>

            <button
              className={`promo-share-btn promo-share-btn--copy ${copied ? 'promo-share-btn--copied' : ''}`}
              onClick={copyLink}
              aria-label="Copiar link"
            >
              {copied ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" aria-hidden><polyline points="20 6 9 17 4 12"/></svg>
                  Copiado!
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" aria-hidden><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  Copiar link
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Modal / Lightbox */}
      {modalOpen && (
        <div
          className="promo-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label={`Imagem: ${title}`}
          onClick={() => setModalOpen(false)}
        >
          <div
            className="promo-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="promo-modal__close"
              onClick={() => setModalOpen(false)}
              aria-label="Fechar"
            >
              ✕
            </button>
            <img
              src={imageSrc}
              alt={title}
              className="promo-modal__image"
            />
            <div className="promo-modal__footer">
              <p className="promo-modal__caption">{title}</p>
              <div className="promo-modal__share">
                <button
                  className="promo-share-btn promo-share-btn--whatsapp"
                  onClick={shareWhatsApp}
                  aria-label="Compartilhar no WhatsApp"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  WhatsApp
                </button>
                <a
                  href={imageAbsoluteUrl}
                  download
                  className="promo-share-btn promo-share-btn--download"
                  aria-label="Baixar imagem"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16" aria-hidden><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Baixar
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
