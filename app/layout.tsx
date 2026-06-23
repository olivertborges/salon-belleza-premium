import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Salón de Belleza Premium',
  description: 'Plataforma completa para Salón de Belleza',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
