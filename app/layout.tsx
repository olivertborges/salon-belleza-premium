import React from 'react'
import { AuthProvider } from '@/contexts/AuthContext'
import './globals.css'

export const metadata = {
  title: 'Fresh Nails - Salón de Belleza Premium',
  description: 'Experiencia VIP en Estética Integral',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full">
      <body className="h-full antialiased m-0 p-0 bg-[#090807]">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}