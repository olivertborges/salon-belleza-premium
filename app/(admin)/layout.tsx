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
    /* 🛠️ CAMBIO AQUÍ: Cambiamos fixed inset-0 por h-screen y eliminamos overflow-hidden general */
    <div className="flex h-screen w-full bg-stone-50 dark:bg-[#0a0908] overflow-hidden">
      <AdminSidebar 
        collapsed={collapsed} 
        setCollapsed={setCollapsed} 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Aseguramos que este contenedor ocupe el 100% de la altura disponible */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden">
        <AdminHeader 
          collapsed={collapsed} 
          onMenuClick={() => setSidebarOpen(true)} 
        />

        {/* 🛠️ CAMBIO AQUÍ: Añadimos pb-20 (padding bottom) para garantizar que al final del scroll 
            haya un espacio de seguridad y ninguna tarjeta quede tapada en el móvil */}
        <main className="flex-1 px-4 pb-20 lg:px-6 lg:pb-24 pt-0 overflow-y-auto w-full">
          
          {/* Tu caja invisible calibrada (usa la altura que te haya quedado bien, ej: h-[45px] o h-[50px]) */}
          <div className="h-[20px] w-full block shrink-0 pointer-events-none" aria-hidden="true" />
          
          {children}
        </main>
      </div>
    </div>
  )
}
