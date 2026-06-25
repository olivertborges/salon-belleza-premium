'use client'

import React, { useState } from 'react'
import AdminSidebar from '@/components/layout/AdminSidebar'
import { Bell, Menu, User } from 'lucide-react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  return (
    <div className="h-screen w-full bg-[#090807] text-stone-200 flex overflow-hidden">

      {/* Sidebar */}
      <div className={`fixed lg:relative z-[60] h-full transition-transform duration-300 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <AdminSidebar 
          collapsed={collapsed} 
          setCollapsed={setCollapsed} 
          isOpen={isMobileOpen} 
          onClose={() => setIsMobileOpen(false)} 
        />
      </div>

      {/* Overlay móvil */}
      {isMobileOpen && <div className="lg:hidden fixed inset-0 bg-black/60 z-[55]" onClick={() => setIsMobileOpen(false)} />}

      {/* Columna derecha: Header + Contenido */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">

        {/* HEADER */}
        <header className="h-16 border-b border-stone-900 flex items-center justify-between px-4 lg:px-8 bg-[#090807] shrink-0">
          <button className="lg:hidden p-2 text-stone-400" onClick={() => setIsMobileOpen(true)}>
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-4">
            <button className="p-2 text-stone-400 hover:text-white transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full" />
            </button>
            <div className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center border border-stone-700">
              <User className="w-4 h-4" />
            </div>
          </div>
        </header>

        {/* CONTENIDO */}
        <main className="flex-1 w-full p-4 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
