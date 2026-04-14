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

type ResolvedOptimizeOptions = Required<Pick<OptimizeOptions, 'maxWidth' | 'maxHeight' | 'quality' | 'type'>>

function resolveOptions(options: OptimizeOptions): ResolvedOptimizeOptions {
  return {
    maxWidth: options.maxWidth ?? 1200,
    maxHeight: options.maxHeight ?? 1200,
    quality: options.quality ?? 0.8,
    type: options.type ?? 'image/webp',
  }
}

function scaledDimensions(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let w = width
  let h = height
  if (w > maxWidth) {
    h = Math.round((h * maxWidth) / w)
    w = maxWidth
  }
  if (h > maxHeight) {
    w = Math.round((w * maxHeight) / h)
    h = maxHeight
  }
  return { width: w, height: h }
}

function webpFileName(file: File | Blob): string {
  if (file instanceof File) {
    return `${file.name.replace(/\.[^/.]+$/, '')}.webp`
  }
  return 'optimized.webp'
}

async function encodeCanvasToWebp(
  source: CanvasImageSource,
  sourceW: number,
  sourceH: number,
  file: File | Blob,
  opts: ResolvedOptimizeOptions
): Promise<File> {
  const { width, height } = scaledDimensions(sourceW, sourceH, opts.maxWidth, opts.maxHeight)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('No se pudo obtener el contexto 2D del canvas')
  }

  ctx.drawImage(source, 0, 0, width, height)

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((b) => resolve(b), opts.type, opts.quality)
  })

  if (!blob) {
    throw new Error('Fallo al crear el Blob de la imagen optimizada')
  }

  return new File([blob], webpFileName(file), { type: opts.type })
}

/** Decodificación clásica (fallback si createImageBitmap falla). */
async function optimizeWithImageElement(file: File | Blob, opts: ResolvedOptimizeOptions): Promise<File> {
  const img = new Image()
  const url = URL.createObjectURL(file)

  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('Error al cargar la imagen para optimización'))
      img.src = url
    })
    return await encodeCanvasToWebp(img, img.naturalWidth, img.naturalHeight, file, opts)
  } finally {
    URL.revokeObjectURL(url)
  }
}

/**
 * Redimensiona y comprime una imagen usando Canvas.
 * Prefiere `createImageBitmap` para decodificar más rápido en fotos grandes.
 */
export async function optimizeImage(file: File | Blob, options: OptimizeOptions = {}): Promise<File> {
  const opts = resolveOptions(options)

  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file)
      try {
        return await encodeCanvasToWebp(bitmap, bitmap.width, bitmap.height, file, opts)
      } finally {
        bitmap.close()
      }
    } catch {
      // Safari muy antiguo u origen raro: seguir con <img>
    }
  }

  return optimizeWithImageElement(file, opts)
}
