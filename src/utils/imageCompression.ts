/**
 * Comprime uma imagem para aproximadamente 500KB
 * Redimensiona para no máximo 1920px e ajusta a qualidade
 */
export async function compressImage(file: File, maxSizeKB = 500): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const reader = new FileReader()

    reader.onload = (e) => {
      img.src = e.target?.result as string
    }

    reader.onerror = reject

    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        reject(new Error('Não foi possível obter contexto do canvas'))
        return
      }

      // Calcular novo tamanho mantendo aspect ratio
      let { width, height } = img
      const maxDimension = 1920

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = (height / width) * maxDimension
          width = maxDimension
        } else {
          width = (width / height) * maxDimension
          height = maxDimension
        }
      }

      canvas.width = width
      canvas.height = height

      // Desenhar imagem redimensionada
      ctx.drawImage(img, 0, 0, width, height)

      // Tentar diferentes qualidades até atingir o tamanho desejado
      let quality = 0.85
      let blob: Blob | null = null

      const tryCompress = (q: number) => {
        canvas.toBlob(
          (b) => {
            if (!b) {
              reject(new Error('Falha ao comprimir imagem'))
              return
            }

            blob = b
            const sizeKB = blob.size / 1024

            console.log(`[Compressão] Qualidade: ${(q * 100).toFixed(0)}% | Tamanho: ${sizeKB.toFixed(0)}KB`)

            // Se ainda está muito grande e pode reduzir qualidade, tenta novamente
            if (sizeKB > maxSizeKB && q > 0.3) {
              quality = q - 0.1
              tryCompress(quality)
            } else {
              // Criar novo arquivo com o blob comprimido
              const compressedFile = new File(
                [blob],
                file.name.replace(/\.[^.]+$/, '.jpg'), // Força extensão .jpg
                { type: 'image/jpeg' }
              )

              console.log(
                `[Compressão] Original: ${(file.size / 1024 / 1024).toFixed(2)}MB → ` +
                `Comprimido: ${(compressedFile.size / 1024).toFixed(0)}KB ` +
                `(redução de ${(((file.size - compressedFile.size) / file.size) * 100).toFixed(1)}%)`
              )

              resolve(compressedFile)
            }
          },
          'image/jpeg',
          q
        )
      }

      tryCompress(quality)
    }

    img.onerror = () => reject(new Error('Erro ao carregar imagem'))

    reader.readAsDataURL(file)
  })
}

/**
 * Comprime múltiplas imagens em paralelo
 */
export async function compressImages(files: File[], maxSizeKB = 500): Promise<File[]> {
  console.log(`[Compressão] Iniciando compressão de ${files.length} imagens...`)
  const startTime = Date.now()

  const compressed = await Promise.all(
    files.map((file) => compressImage(file, maxSizeKB))
  )

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1)
  const originalSize = files.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024
  const compressedSize = compressed.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024

  console.log(
    `[Compressão] Concluída em ${totalTime}s | ` +
    `${originalSize.toFixed(2)}MB → ${compressedSize.toFixed(2)}MB ` +
    `(redução de ${(((originalSize - compressedSize) / originalSize) * 100).toFixed(1)}%)`
  )

  return compressed
}
