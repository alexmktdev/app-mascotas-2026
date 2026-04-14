/**
 * Utilidades para optimizar imágenes en el cliente antes de la subida.
 * Reduce egress de almacenamiento y mejora tiempos de carga.
 */

interface OptimizeOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  type?: string
}

/**
 * Redimensiona y comprime una imagen usando Canvas.
 * @param file Archivo original (File o Blob)
 * @param options Opciones de optimización
 * @returns Promesa con el nuevo Blob optimizado
 */
export async function optimizeImage(
  file: File | Blob,
  options: OptimizeOptions = {}
): Promise<Blob> {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.8,
    type = 'image/webp'
  } = options

  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      
      let width = img.width
      let height = img.height

      // Calcular nuevas dimensiones manteniendo aspecto
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width)
        width = maxWidth
      }
      if (height > maxHeight) {
        width = Math.round((width * maxHeight) / height)
        height = maxHeight
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('No se pudo obtener el contexto 2D del canvas'))
        return
      }

      // Dibujar imagen redimensionada
      ctx.drawImage(img, 0, 0, width, height)

      // Exportar a Blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Fallo al crear el Blob de la imagen optimizada'))
          }
        },
        type,
        quality
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Error al cargar la imagen para optimización'))
    }

    img.src = url
  })
}
