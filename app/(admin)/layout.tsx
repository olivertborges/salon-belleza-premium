// @ts-nocheck
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
    console.log('📱 [Termux-Layout-Bypass] Estado actual:', { session: !!session, role, loading });
  }, [role, loading, session])

  return (
    <div className="flex min-h-screen bg-stone-50 dark:bg-[#0a0908] fixed inset-0 overflow-hidden">
      <AdminSidebar 
        collapsed={collapsed} 
        setCollapsed={setCollapsed} 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        <AdminHeader 
          collapsed={collapsed} 
          onMenuClick={() => setSidebarOpen(true)} 
        />

        {/* 🛠️ SOLUCIÓN PARA CONGELAR EL SCROLL */}
        {/* Eliminamos el pt-20 de aquí para evitar que el scroll lo multiplique */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto h-full w-full">
          
          {/* 🧱 ESTA ES LA CAJA INVISIBLE DE CONTROL (Mide exactamente 80px) */}
          {/* Actúa como un escudo rígido. Al hacer scroll, pasa de largo y no altera el layout */}
          <div className="h-20 w-full block shrink-0 pointer-events-none" aria-hidden="true" />
          
          {children}
        </main>
      </div>
    </div>
  )
}
