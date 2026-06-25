'use client'

import React, { useState } from 'react'
import AdminSidebar from '@/components/layout/AdminSidebar'
import AdminHeader from '@/components/layout/AdminHeader'
import { useTheme } from '@/contexts/ThemeContext'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme()
  const [collapsed, setCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const isDark = theme === 'dark'

  return (
    <div className={`h-screen w-full flex overflow-hidden transition-colors duration-300 ${
      isDark ? 'bg-[#090807] text-stone-200' : 'bg-[#faf8f6] text-stone-900'
    }`}>

      <div className={`fixed lg:relative z-[60] h-full transition-transform duration-300 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <AdminSidebar 
          collapsed={collapsed} 
          setCollapsed={setCollapsed} 
          isOpen={isMobileOpen} 
          onClose={() => setIsMobileOpen(false)} 
        />
      </div>

      {isMobileOpen && <div className="lg:hidden fixed inset-0 bg-black/60 z-[55]" onClick={() => setIsMobileOpen(false)} />}

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <AdminHeader onMenuClick={() => setIsMobileOpen(true)} />
        <main className={`flex-1 w-full p-4 lg:p-8 overflow-y-auto transition-colors duration-300 ${
          isDark ? 'bg-[#090807]' : 'bg-[#faf8f6]'
        }`}>
          {children}
        </main>
      </div>
    </div>
  )
}
