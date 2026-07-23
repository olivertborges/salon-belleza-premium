// @ts-nocheck
'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter, usePathname } from 'next/navigation'
import AdminSidebar from '@/components/layout/AdminSidebar'
import AdminHeader from '@/components/layout/AdminHeader'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { role, loading, session, user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const [collapsed, setCollapsed] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)

  // ✅ PROTEGER RUTAS DE ADMIN
  useEffect(() => {
    // Si está cargando, esperar
    if (loading) return

    // Si no hay usuario, redirigir al login
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`)
      setIsAuthorized(false)
      return
    }

    // Si el usuario no es admin, staff o owner, redirigir al portal
    if (role !== 'admin' && role !== 'staff' && role !== 'owner') {
      router.push('/portal')
      setIsAuthorized(false)
      return
    }

    // Si todo está bien, autorizar
    setIsAuthorized(true)
  }, [user, role, loading, router, pathname])

  // ✅ Mostrar loader mientras carga o verifica permisos
  if (loading || isAuthorized === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0908]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-[#C9A96E]/20 border-t-[#C9A96E] rounded-full animate-spin" />
          <p className="text-xs text-stone-400 animate-pulse">Verificando acceso...</p>
        </div>
      </div>
    )
  }

  // ✅ Si no está autorizado, no renderizar nada (la redirección ya se activó)
  if (!isAuthorized) {
    return null
  }

  return (
    <div className="flex h-screen w-full bg-stone-50 dark:bg-[#0a0908] overflow-hidden">
      <AdminSidebar 
        collapsed={collapsed} 
        setCollapsed={setCollapsed} 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden">
        <AdminHeader 
          collapsed={collapsed} 
          onMenuClick={() => setSidebarOpen(true)} 
        />

        <main className="flex-1 px-4 pb-20 lg:px-6 lg:pb-24 pt-0 overflow-y-auto w-full">
          <div className="h-[20px] w-full block shrink-0 pointer-events-none" aria-hidden="true" />
          {children}
        </main>
      </div>
    </div>
  )
}