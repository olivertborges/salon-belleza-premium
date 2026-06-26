'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import AdminSidebar from '@/components/layout/AdminSidebar'
import AdminHeader from '@/components/layout/AdminHeader'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { role, loading, session } = useAuth()
  const router = useRouter()
  
  const [collapsed, setCollapsed] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    // 🔒 Control estricto de expulsión sincronizada
    if (!loading && role !== null) {
      if (role !== 'admin' && role !== 'staff') {
        console.warn('Acceso denegado: Rol no administrativo.', role)
        router.replace('/login')
      }
    }
    
    if (!loading && !session) {
      router.replace('/login')
    }
  }, [role, loading, session, router])

  // Espera pacientemente la carga sin rebotarte
  if (loading || (session && role === null)) {
    return (
      <div className="h-screen w-screen bg-[#0a0908] flex items-center justify-center text-white font-mono text-xs">
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Verificando permisos en Dashboard...</span>
        </div>
      </div>
    )
  }

  // Si eres admin o staff, abrimos las puertas del diseño
  if (role === 'admin' || role === 'staff') {
    return (
      <div className="flex min-h-screen bg-stone-50 dark:bg-[#0a0908]">
        <AdminSidebar 
          collapsed={collapsed} 
          setCollapsed={setCollapsed} 
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <AdminHeader 
            collapsed={collapsed} 
            onMenuClick={() => setSidebarOpen(true)} 
          />

          <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    )
  }

  return null
}