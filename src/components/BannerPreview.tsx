import { useEffect, useState } from 'react'
import type { Banner, BannerComponent } from '../context/SiteDataContext'

type BannerPreviewProps = {
  banner: Banner
  autoPlay?: boolean
}

export default function BannerPreview({ banner, autoPlay = true }: BannerPreviewProps) {
  const [playAnimation, setPlayAnimation] = useState(false)

  useEffect(() => {
    if (autoPlay) {
      setPlayAnimation(false)
      const timer = setTimeout(() => setPlayAnimation(true), 100)
      return () => clearTimeout(timer)
    }
  }, [autoPlay, banner.components])

  const components = banner.components || []
  const backgroundImage = banner.backgroundImage || banner.image

  const renderComponent = (comp: BannerComponent) => {
    const animationClass = playAnimation && comp.animation !== 'none' ? `animate-${comp.animation}` : ''
    const animationStyle = playAnimation
      ? {
          animationDelay: `${comp.animationDelay}ms`,
          animationDuration: `${comp.animationDuration}ms`,
        }
      : {}

    const baseStyle = {
      position: 'absolute' as const,
      left: comp.x,
      top: comp.y,
      ...animationStyle,
    }

    if (comp.type === 'text') {
      return (
        <div
          key={comp.id}
          className={`banner-preview__text ${animationClass}`}
          style={{
            ...baseStyle,
            fontSize: comp.fontSize,
            fontFamily: comp.fontFamily,
            fontWeight: comp.fontWeight,
            fontStyle: comp.fontStyle,
            color: comp.color,
            textAlign: comp.textAlign,
            lineHeight: comp.lineHeight,
            textShadow: comp.textShadow,
            width: comp.width,
            whiteSpace: 'pre-wrap',
          }}
        >
          {comp.content}
        </div>
      )
    }

    if (comp.type === 'image') {
      return (
        <img
          key={comp.id}
          className={`banner-preview__image ${animationClass}`}
          src={comp.src}
          alt=""
          style={{
            ...baseStyle,
            width: comp.width,
            height: comp.height,
            borderRadius: comp.borderRadius,
            opacity: comp.opacity,
          }}
        />
      )
    }

    if (comp.type === 'imageWithLink') {
      return (
        <a
          key={comp.id}
          href={comp.link}
          target="_blank"
          rel="noreferrer"
          className={`banner-preview__image-link ${animationClass}`}
          style={baseStyle}
        >
          <img
            src={comp.src}
            alt=""
            style={{
              width: comp.width,
              height: comp.height,
              borderRadius: comp.borderRadius,
              opacity: comp.opacity,
            }}
          />
        </a>
      )
    }

    return null
  }

  return (
    <div
      className="banner-preview"
      style={{
        position: 'relative',
        width: 1351,
        height: 750,
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        overflow: 'hidden',
      }}
    >
      {!backgroundImage && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#666',
            fontSize: 24,
          }}
        >
          Sem background definido
        </div>
      )}
      {components.map(renderComponent)}
    </div>
  )
}
