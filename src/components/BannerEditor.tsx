import { useState, useRef } from 'react'
import type { Banner, BannerComponent, BannerAnimationType } from '../context/SiteDataContext'
import { uploadBannerImageRequest } from '../services/api'

type BannerEditorProps = {
  banner: Partial<Banner>
  onUpdate: (banner: Partial<Banner>) => void
  onSave: (isDraft: boolean) => void
  onCancel: () => void
}

const BANNER_WIDTH = 1351
const BANNER_HEIGHT = 750
const SCALE = 0.8

type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' | null

export default function BannerEditor({ banner, onUpdate, onSave, onCancel }: BannerEditorProps) {
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle>(null)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [initialSize, setInitialSize] = useState({ width: 0, height: 0 })
  const [initialPos, setInitialPos] = useState({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const componentFileInputRef = useRef<HTMLInputElement>(null)

  const components = banner.components || []

  const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate dimensions before uploading
    const reader = new FileReader()
    reader.onload = async (event) => {
      const img = new Image()
      img.onload = async () => {
        if (img.width !== BANNER_WIDTH || img.height !== BANNER_HEIGHT) {
          alert(`Atenção: A imagem deveria ter ${BANNER_WIDTH}x${BANNER_HEIGHT}px. Sua imagem tem ${img.width}x${img.height}px.`)
        }

        // Upload the image to server
        try {
          const url = await uploadBannerImageRequest(file)
          onUpdate({ ...banner, backgroundImage: url })
        } catch (error) {
          console.error('Erro ao fazer upload da imagem:', error)
          alert('Erro ao fazer upload da imagem. Tente novamente.')
        }
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const handleAddText = () => {
    const newComponent: BannerComponent = {
      id: `text-${Date.now()}`,
      type: 'text',
      content: 'Novo Texto',
      x: 100,
      y: 100,
      fontSize: 32,
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'bold',
      fontStyle: 'normal',
      color: '#ffffff',
      textAlign: 'left',
      animation: 'fadeIn',
      animationDelay: 0,
      animationDuration: 1000,
      lineHeight: 1.2,
      textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
    }
    onUpdate({ ...banner, components: [...components, newComponent] })
    setSelectedComponent(newComponent.id)
  }

  const handleAddImage = () => {
    componentFileInputRef.current?.click()
  }

  const handleComponentImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      // Upload the image to server first
      const url = await uploadBannerImageRequest(file)

      const newComponent: BannerComponent = {
        id: `image-${Date.now()}`,
        type: 'image',
        src: url,
        x: 100,
        y: 100,
        width: 200,
        height: 200,
        animation: 'fadeIn',
        animationDelay: 0,
        animationDuration: 1000,
        borderRadius: 0,
        opacity: 1,
      }
      onUpdate({ ...banner, components: [...components, newComponent] })
      setSelectedComponent(newComponent.id)
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error)
      alert('Erro ao fazer upload da imagem. Tente novamente.')
    }
  }

  const handleDeleteComponent = (id: string) => {
    onUpdate({ ...banner, components: components.filter((c) => c.id !== id) })
    if (selectedComponent === id) setSelectedComponent(null)
  }

  const handleUpdateComponent = (id: string, updates: Partial<BannerComponent>) => {
    onUpdate({
      ...banner,
      components: components.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    })
  }

  const handleMouseDown = (e: React.MouseEvent, componentId: string, handle?: ResizeHandle) => {
    e.stopPropagation()
    setSelectedComponent(componentId)

    const component = components.find((c) => c.id === componentId)
    if (!component) return

    if (handle) {
      // Start resizing
      setIsResizing(true)
      setResizeHandle(handle)
      setDragStart({ x: e.clientX, y: e.clientY })
      setInitialPos({ x: component.x, y: component.y })

      if (component.type === 'text') {
        setInitialSize({ width: component.width || 200, height: component.fontSize })
      } else {
        setInitialSize({ width: component.width, height: component.height })
      }
    } else {
      // Prepare for dragging
      setDragStart({ x: e.clientX - component.x * SCALE, y: e.clientY - component.y * SCALE })

      const startX = e.clientX
      const startY = e.clientY

      const handleMove = (moveEvent: MouseEvent) => {
        const deltaX = Math.abs(moveEvent.clientX - startX)
        const deltaY = Math.abs(moveEvent.clientY - startY)

        if (deltaX > 5 || deltaY > 5) {
          setIsDragging(true)
          window.removeEventListener('mousemove', handleMove)
        }
      }

      const handleUp = () => {
        window.removeEventListener('mousemove', handleMove)
        window.removeEventListener('mouseup', handleUp)
      }

      window.addEventListener('mousemove', handleMove)
      window.addEventListener('mouseup', handleUp)
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!selectedComponent) return

    if (isResizing && resizeHandle) {
      const deltaX = (e.clientX - dragStart.x) / SCALE
      const deltaY = (e.clientY - dragStart.y) / SCALE

      const component = components.find((c) => c.id === selectedComponent)
      if (!component) return

      let newWidth = initialSize.width
      let newHeight = initialSize.height
      let newX = initialPos.x
      let newY = initialPos.y

      // Calculate new dimensions based on handle
      if (resizeHandle.includes('e')) newWidth = initialSize.width + deltaX
      if (resizeHandle.includes('w')) {
        newWidth = initialSize.width - deltaX
        newX = initialPos.x + deltaX
      }
      if (resizeHandle.includes('s')) newHeight = initialSize.height + deltaY
      if (resizeHandle.includes('n')) {
        newHeight = initialSize.height - deltaY
        newY = initialPos.y + deltaY
      }

      // Apply minimum sizes
      newWidth = Math.max(20, newWidth)
      newHeight = Math.max(20, newHeight)

      if (component.type === 'text') {
        handleUpdateComponent(selectedComponent, {
          fontSize: Math.max(12, newHeight),
          width: newWidth,
          x: newX,
          y: newY,
        })
      } else {
        handleUpdateComponent(selectedComponent, {
          width: newWidth,
          height: newHeight,
          x: newX,
          y: newY,
        })
      }
    } else if (isDragging) {
      const x = Math.max(0, Math.min(BANNER_WIDTH, (e.clientX - dragStart.x) / SCALE))
      const y = Math.max(0, Math.min(BANNER_HEIGHT, (e.clientY - dragStart.y) / SCALE))

      handleUpdateComponent(selectedComponent, { x, y })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    setIsResizing(false)
    setResizeHandle(null)
  }

  const selectedComp = components.find((c) => c.id === selectedComponent)

  const renderResizeHandles = (comp: BannerComponent) => {
    const handles: ResizeHandle[] = ['nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w']

    const getHandleStyle = (handle: ResizeHandle): React.CSSProperties => {
      const baseStyle: React.CSSProperties = {
        position: 'absolute',
        background: '#66b2ff',
        border: '2px solid white',
        borderRadius: '50%',
        width: 10,
        height: 10,
        transform: 'translate(-50%, -50%)',
        cursor: handle.length === 2 ? `${handle}-resize` : `${handle}-resize`,
        zIndex: 10,
      }

      const width = comp.type === 'text' ? (comp.width || 200) : comp.width
      const height = comp.type === 'text' ? comp.fontSize : comp.height

      if (handle.includes('n')) baseStyle.top = 0
      if (handle.includes('s')) baseStyle.top = height * SCALE
      if (handle.includes('e')) baseStyle.left = width * SCALE
      if (handle.includes('w')) baseStyle.left = 0
      if (handle === 'n' || handle === 's') baseStyle.left = (width * SCALE) / 2
      if (handle === 'e' || handle === 'w') baseStyle.top = (height * SCALE) / 2

      return baseStyle
    }

    return handles.map((handle) => (
      <div
        key={handle}
        style={getHandleStyle(handle)}
        onMouseDown={(e) => {
          e.stopPropagation()
          handleMouseDown(e, comp.id, handle)
        }}
      />
    ))
  }

  return (
    <div className="banner-editor">
      <div className="banner-editor__header">
        <div>
          <h3>Editor de Banner</h3>
          <input
            type="text"
            value={banner.title || ''}
            onChange={(e) => onUpdate({ ...banner, title: e.target.value })}
            placeholder="Título do banner"
            style={{
              marginTop: '0.5rem',
              padding: '0.5rem',
              fontSize: '1rem',
              maxWidth: '400px',
            }}
          />
        </div>
        <div className="banner-editor__actions">
          <button className="ghost-btn" type="button" onClick={onCancel}>
            Cancelar
          </button>
          <button className="ghost-btn" type="button" onClick={() => onSave(true)}>
            💾 Salvar Rascunho
          </button>
          <button className="primary-btn" type="button" onClick={() => onSave(false)}>
            ✓ Publicar
          </button>
        </div>
      </div>

      <div className="banner-editor__main">
        <div className="banner-editor__canvas-container">
          <div className="banner-editor__toolbar">
            <button className="ghost-btn" type="button" onClick={() => fileInputRef.current?.click()}>
              📷 Escolher Background
            </button>
            <button className="ghost-btn" type="button" onClick={handleAddText}>
              📝 Adicionar Texto
            </button>
            <button className="ghost-btn" type="button" onClick={handleAddImage}>
              🖼️ Adicionar Imagem
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleBackgroundUpload}
            />
            <input
              ref={componentFileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleComponentImageUpload}
            />
          </div>

          <div
            ref={canvasRef}
            className="banner-editor__canvas"
            style={{
              width: BANNER_WIDTH * SCALE,
              height: BANNER_HEIGHT * SCALE,
              backgroundImage: banner.backgroundImage ? `url(${banner.backgroundImage})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onClick={() => setSelectedComponent(null)}
          >
            {!banner.backgroundImage && (
              <div className="banner-editor__placeholder">
                Clique em "Escolher Background" para começar
              </div>
            )}

            {components.map((comp) => (
              <div
                key={comp.id}
                className={`banner-component ${selectedComponent === comp.id ? 'selected' : ''}`}
                style={{
                  position: 'absolute',
                  left: comp.x * SCALE,
                  top: comp.y * SCALE,
                  cursor: isDragging ? 'grabbing' : 'grab',
                  transform: `scale(${SCALE})`,
                  transformOrigin: 'top left',
                }}
                onMouseDown={(e) => handleMouseDown(e, comp.id)}
                onClick={(e) => e.stopPropagation()}
              >
                {comp.type === 'text' && (
                  <div
                    style={{
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
                )}
                {(comp.type === 'image' || comp.type === 'imageWithLink') && (
                  <img
                    src={comp.src}
                    alt=""
                    style={{
                      width: comp.width,
                      height: comp.height,
                      borderRadius: comp.borderRadius,
                      opacity: comp.opacity,
                      pointerEvents: 'none',
                    }}
                  />
                )}
                {selectedComponent === comp.id && renderResizeHandles(comp)}
              </div>
            ))}
          </div>

          <div className="banner-editor__info">
            Dimensões: {BANNER_WIDTH} × {BANNER_HEIGHT}px | Zoom: {Math.round(SCALE * 100)}% |
            Dica: Arraste para mover, use os círculos azuis para redimensionar
          </div>
        </div>

        <div className="banner-editor__properties">
          <h4>Propriedades</h4>

          {!selectedComp && (
            <div className="banner-editor__no-selection">
              Selecione um componente para editar suas propriedades
            </div>
          )}

          {selectedComp && (
            <div className="banner-editor__properties-form">
              <div className="form-actions">
                <button
                  className="ghost-btn"
                  type="button"
                  onClick={() => handleDeleteComponent(selectedComp.id)}
                  style={{ color: '#ff4444' }}
                >
                  🗑️ Excluir
                </button>
              </div>

              {selectedComp.type === 'text' && (
                <>
                  <label>
                    Texto
                    <textarea
                      rows={3}
                      value={selectedComp.content}
                      onChange={(e) => handleUpdateComponent(selectedComp.id, { content: e.target.value })}
                    />
                  </label>

                  <label>
                    Cor
                    <input
                      type="color"
                      value={selectedComp.color}
                      onChange={(e) => handleUpdateComponent(selectedComp.id, { color: e.target.value })}
                    />
                  </label>

                  <div className="form-row">
                    <label>
                      Peso
                      <select
                        value={selectedComp.fontWeight}
                        onChange={(e) => handleUpdateComponent(selectedComp.id, { fontWeight: e.target.value as any })}
                      >
                        <option value="100">Thin</option>
                        <option value="300">Light</option>
                        <option value="normal">Normal</option>
                        <option value="500">Medium</option>
                        <option value="bold">Bold</option>
                        <option value="900">Black</option>
                      </select>
                    </label>
                    <label>
                      Estilo
                      <select
                        value={selectedComp.fontStyle}
                        onChange={(e) => handleUpdateComponent(selectedComp.id, { fontStyle: e.target.value as any })}
                      >
                        <option value="normal">Normal</option>
                        <option value="italic">Itálico</option>
                      </select>
                    </label>
                  </div>

                  <label>
                    Fonte
                    <select
                      value={selectedComp.fontFamily}
                      onChange={(e) => handleUpdateComponent(selectedComp.id, { fontFamily: e.target.value })}
                    >
                      <option value="Arial, sans-serif">Arial</option>
                      <option value="'Times New Roman', serif">Times New Roman</option>
                      <option value="'Courier New', monospace">Courier New</option>
                      <option value="Georgia, serif">Georgia</option>
                      <option value="Verdana, sans-serif">Verdana</option>
                      <option value="'Trebuchet MS', sans-serif">Trebuchet MS</option>
                      <option value="Impact, sans-serif">Impact</option>
                    </select>
                  </label>

                  <label>
                    Alinhamento
                    <select
                      value={selectedComp.textAlign}
                      onChange={(e) => handleUpdateComponent(selectedComp.id, { textAlign: e.target.value as any })}
                    >
                      <option value="left">Esquerda</option>
                      <option value="center">Centro</option>
                      <option value="right">Direita</option>
                    </select>
                  </label>
                </>
              )}

              {(selectedComp.type === 'image' || selectedComp.type === 'imageWithLink') && (
                <>
                  <div className="form-row">
                    <label>
                      Arredondamento
                      <input
                        type="number"
                        value={selectedComp.borderRadius || 0}
                        onChange={(e) =>
                          handleUpdateComponent(selectedComp.id, { borderRadius: Number(e.target.value) })
                        }
                      />
                    </label>
                    <label>
                      Opacidade
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.1"
                        value={selectedComp.opacity || 1}
                        onChange={(e) => handleUpdateComponent(selectedComp.id, { opacity: Number(e.target.value) })}
                      />
                    </label>
                  </div>

                  {selectedComp.type === 'imageWithLink' && (
                    <label>
                      Link
                      <input
                        type="url"
                        value={selectedComp.link}
                        onChange={(e) => handleUpdateComponent(selectedComp.id, { link: e.target.value })}
                        placeholder="https://..."
                      />
                    </label>
                  )}

                  <label>
                    <input
                      type="checkbox"
                      checked={selectedComp.type === 'imageWithLink'}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleUpdateComponent(selectedComp.id, { type: 'imageWithLink', link: '' } as any)
                        } else {
                          const { link, ...rest } = selectedComp as any
                          handleUpdateComponent(selectedComp.id, { ...rest, type: 'image' })
                        }
                      }}
                      style={{ width: 'auto', marginRight: '0.5rem' }}
                    />
                    Esta imagem tem link
                  </label>
                </>
              )}

              <hr />

              <h5>Animação</h5>
              <label>
                Efeito
                <select
                  value={selectedComp.animation}
                  onChange={(e) =>
                    handleUpdateComponent(selectedComp.id, { animation: e.target.value as BannerAnimationType })
                  }
                >
                  <option value="none">Nenhum</option>
                  <option value="fadeIn">Fade In</option>
                  <option value="fadeInUp">Fade In Up</option>
                  <option value="fadeInDown">Fade In Down</option>
                  <option value="fadeInLeft">Fade In Left</option>
                  <option value="fadeInRight">Fade In Right</option>
                  <option value="slideInUp">Slide In Up</option>
                  <option value="slideInDown">Slide In Down</option>
                  <option value="slideInLeft">Slide In Left</option>
                  <option value="slideInRight">Slide In Right</option>
                  <option value="zoomIn">Zoom In</option>
                  <option value="bounce">Bounce</option>
                </select>
              </label>

              <div className="form-row">
                <label>
                  Atraso (ms)
                  <input
                    type="number"
                    step="100"
                    value={selectedComp.animationDelay}
                    onChange={(e) =>
                      handleUpdateComponent(selectedComp.id, { animationDelay: Number(e.target.value) })
                    }
                  />
                </label>
                <label>
                  Duração (ms)
                  <input
                    type="number"
                    step="100"
                    value={selectedComp.animationDuration}
                    onChange={(e) =>
                      handleUpdateComponent(selectedComp.id, { animationDuration: Number(e.target.value) })
                    }
                  />
                </label>
              </div>

              <hr />

              <h5>Posição & Tamanho</h5>
              <div className="form-row">
                <label>
                  X (px)
                  <input
                    type="number"
                    value={Math.round(selectedComp.x)}
                    onChange={(e) => handleUpdateComponent(selectedComp.id, { x: Number(e.target.value) })}
                  />
                </label>
                <label>
                  Y (px)
                  <input
                    type="number"
                    value={Math.round(selectedComp.y)}
                    onChange={(e) => handleUpdateComponent(selectedComp.id, { y: Number(e.target.value) })}
                  />
                </label>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.5rem 0' }}>
                💡 Use os círculos azuis no componente para redimensionar visualmente
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
