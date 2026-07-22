// @ts-nocheck
'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import AdminSidebar from '@/components/layout/AdminSidebar'
// Importamos la barra superior global definitiva
import HeaderTop from '@/components/layout/HeaderTop' 

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { role, loading, session } = useAuth()
  const router = useRouter()

  const [collapsed, setCollapsed] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // 🔓 BYPASS TOTAL PARA TERMUX EN DESARROLLO
  useEffect(() => {
    console.log('📱 [Termux-Layout-Bypass] Estado actual:', { session: !!session, role, loading });
  }, [role, loading, session])

  return (
    <div className="flex min-h-screen bg-stone-50 dark:bg-[#0a0908]">
      <AdminSidebar 
        collapsed={collapsed} 
        setCollapsed={setCollapsed} 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Reemplazamos AdminHeader por HeaderTop y le conectamos el estado del sidebar */}
        <HeaderTop setIsSidebarOpen={setSidebarOpen} />

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
