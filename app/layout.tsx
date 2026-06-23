import type { Metadata } from 'next'
import './globals.css'
import DevNav from '@/components/DevNav'

export const metadata: Metadata = {
  title: 'Atelier de Estética',
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
        {children}
        {/* Acceso rápido temporal para desarrollo */}
        <DevNav />
      </body>
    </html>
  )
}
