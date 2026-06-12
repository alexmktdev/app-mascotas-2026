import type { Metadata } from 'next'
import '@fontsource-variable/inter/index.css'
import './globals.css'
import { QueryProvider } from '@/components/providers/QueryProvider'

export const metadata: Metadata = {
  title: 'App Mascotas - Adopta tu compañero ideal',
  description:
    'Plataforma de adopción de mascotas. Encuentra tu compañero perfecto entre perros y gatos que buscan un hogar.',
  icons: {
    icon: '/favicon-paw.svg',
    shortcut: '/favicon-paw.svg',
    apple: '/favicon-paw.svg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  )
}
