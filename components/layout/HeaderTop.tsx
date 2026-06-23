'use client'

import { useAuth } from '@/hooks/useAuth'
import { Menu, Bell, Search } from 'lucide-react'

interface HeaderTopProps {
  setIsSidebarOpen: (open: boolean) => void
}

export default function HeaderTop({ setIsSidebarOpen }: HeaderTopProps) {
  const { user, role } = useAuth()

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-stone-200">
      <div className="flex items-center justify-between px-4 md:px-6 h-16">
        {/* Lado izquierdo */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-2 hover:bg-stone-100 rounded-xl transition-colors text-stone-600"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="hidden lg:block">
            <h1 className="text-lg font-light text-stone-900 tracking-tight">
              Fresh<span className="font-medium">Nails</span>
            </h1>
          </div>
        </div>

        {/* Lado derecho */}
        <div className="flex items-center gap-4">
          {/* Búsqueda (opcional) */}
          <button className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-100 text-stone-400 text-sm hover:bg-stone-200 transition-colors">
            <Search className="w-4 h-4" />
            <span className="text-xs">Buscar...</span>
          </button>

          {/* Notificaciones */}
          <button className="p-2 hover:bg-stone-100 rounded-xl transition-colors text-stone-500 relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
          </button>

          {/* Perfil (solo en desktop) */}
          <div className="hidden lg:flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs font-medium text-stone-900">{user?.full_name || 'Usuario'}</p>
              <p className="text-[9px] uppercase tracking-widest text-stone-400">
                {role === 'admin' ? '⚡ Admin' : role === 'staff' ? '💼 Staff' : '👤 Cliente'}
              </p>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-400 to-amber-400 flex items-center justify-center text-white text-sm font-bold shadow-sm">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
