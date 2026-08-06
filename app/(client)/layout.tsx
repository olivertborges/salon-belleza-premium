// @ts-nocheck
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
  const { user, role, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (loading) return

    // 1. Si no hay usuario logueado, enviar al login
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`)
      return
    }

    // 2. PREVENIR QUE STAFF/ADMIN ENTREN AL PORTAL DE CLIENTE:
    // Si la cuenta activa es de administración, se redirige a su panel correspondiente
    const rolLimpio = role ? role.toLowerCase().trim() : ''
    if (['admin', 'staff', 'owner'].includes(rolLimpio)) {
      router.push('/dashboard') // O la ruta principal de tu admin (ej. /admin/dashboard)
    }
  }, [user, role, loading, router, pathname])

  // Loader estético durante la verificación
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0d0b0a]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-[#C9A96E]/20 border-t-[#C9A96E] rounded-full animate-spin" />
          <p className="text-xs text-stone-400 animate-pulse">Cargando perfil...</p>
        </div>
      </div>
    )
  }

  // Si no hay usuario o si es un Admin intentando entrar, retenemos el renderizado mientras se procesa la redirección
  const rolLimpio = role ? role.toLowerCase().trim() : ''
  if (!user || ['admin', 'staff', 'owner'].includes(rolLimpio)) {
    return null
  }

  return <DashboardLayout>{children}</DashboardLayout>
}
