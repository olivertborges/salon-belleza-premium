'use client'

import { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter, usePathname } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // ✅ Proteger rutas del cliente
  useEffect(() => {
    // Si no está cargando y no hay usuario, redirigir al login
    if (!loading && !user) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`)
    }
  }, [user, loading, router, pathname])

  // ✅ Mostrar loader mientras carga
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0d0b0a]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-[#C9A96E]/20 border-t-[#C9A96E] rounded-full animate-spin" />
          <p className="text-xs text-stone-400 animate-pulse">Cargando...</p>
        </div>
      </div>
    )
  }

  // ✅ Si no hay usuario, no renderizar nada (la redirección ya se activó)
  if (!user) {
    return null
  }

  return <DashboardLayout>{children}</DashboardLayout>
}