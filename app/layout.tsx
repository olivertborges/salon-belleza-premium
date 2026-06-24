import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import DevNav from '@/components/DevNav'

export const metadata: Metadata = {
  title: 'Fresh Nails - Estética Avanzada',
  description: 'Plataforma completa para Estética Avanzada y Academia',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
          {children}
          <DevNav />
        </AuthProvider>
      </body>
    </html>
  )
}
