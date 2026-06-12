import type { NextConfig } from 'next'

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      ...(process.env.R2_PUBLIC_HOSTNAME
        ? [{ protocol: 'https' as const, hostname: process.env.R2_PUBLIC_HOSTNAME }]
        : []),
    ],
    // Las fotos son inmutables una vez subidas (nombre con UUID) → cache largo.
    minimumCacheTTL: 2678400, // 31 días
    // Menos variantes = menos trabajo de optimización en la primera carga.
    deviceSizes: [640, 750, 1080, 1920],
    imageSizes: [256, 384, 640],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
