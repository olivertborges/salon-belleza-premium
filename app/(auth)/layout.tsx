'use client'

import { AuthProvider } from '@/contexts/AuthContext'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <main className="min-h-screen bg-stone-50">
        {children}
      </main>
    </AuthProvider>
  )
}
