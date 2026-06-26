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
    // Si la autenticación ya terminó de hacer su carga inicial
    if (!loading) {
      
      // 1. Si NO hay sesión activa bajo ningún concepto, al login directo
      if (!session) {
        router.replace('/login')
        return
      }

      // 2. Si SÍ hay sesión, pero el rol ya cargó y NO es admin ni staff, para afuera.
      // ⚡ Si 'role' es null (mientras Supabase responde en el teléfono), 
      // este bloque se ignora y te deja esperando de forma segura.
      if (role !== null && role !== 'admin' && role !== 'staff') {
        console.warn('Acceso denegado: Rol no administrativo.', role)
        router.replace('/login')
      }
    }
  }, [role, loading, session, router])

  // ⏳ Pantalla de espera tolerante al lag (Crucial para Termux)
  if (loading || (session && role === null)) {
    return (
      <div className="h-screen w-screen bg-[#0a0908] flex items-center justify-center text-white font-mono text-xs">
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Cargando credenciales seguras...</span>
        </div>
      </div>
    )
  }

  // 🔒 Si el rol es el correcto, renderizamos la estructura completa
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
