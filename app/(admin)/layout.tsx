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

  // 🔓 BYPASS TOTAL PARA TERMUX EN DESARROLLO
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

        {/* 🛠️ CALIBRADO: Quitamos pt-4 / pt-6 de las clases del main para que no sume espacio vertical arriba */}
        <main className="flex-1 px-4 pb-4 lg:px-6 lg:pb-6 pt-0 overflow-y-auto h-full w-full">
          
          {/* 🧱 Ajustado a h-[60px] para que coincida con la altura exacta del Header en móviles sin empujar de más */}
          <div className="h-[50px] w-full block shrink-0 pointer-events-none" aria-hidden="true" />
          
          {children}
        </main>
      </div>
    </div>
  )
}
