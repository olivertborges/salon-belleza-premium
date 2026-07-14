'use client'

import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/contexts/ThemeContext'
import { useSettings } from '@/contexts/SettingsContext'
import { Menu, Bell, Search, Sparkles, Sun, Moon } from 'lucide-react'
import { useState } from 'react'

interface HeaderTopProps {
  setIsSidebarOpen: (open: boolean) => void
}

export default function HeaderTop({ setIsSidebarOpen }: HeaderTopProps) {
  const { user, role } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { settings } = useSettings()
  const [showSearch, setShowSearch] = useState(false)

  const isDark = theme === 'dark'
  const primaryColor = settings?.primary_color || '#DB5B9A'
  const secondaryColor = settings?.secondary_color || '#E5A46E'

  const brandGradient = `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`

  const getInitials = () => {
    if (user?.full_name) {
      return user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    return 'U'
  }

  const getRoleDisplay = () => {
    switch (role) {
      case 'admin': return '⚡ Admin'
      case 'staff': return '💼 Staff'
      default: return '👤 Cliente'
    }
  }

  return (
    <header className={`sticky top-0 z-30 transition-all duration-300 ${
      isDark 
        ? 'bg-[#0f0c1b]/90 backdrop-blur-md border-b border-fuchsia-950/30' 
        : 'bg-white/80 backdrop-blur-md border-b border-pink-100/60'
    }`}>
      <div className="flex items-center justify-between px-4 md:px-6 h-14 md:h-16">
        {/* Lado izquierdo - Logo y menú */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className={`lg:hidden p-2 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 ${
              isDark 
                ? 'hover:bg-fuchsia-950/30 text-stone-400 hover:text-pink-400' 
                : 'hover:bg-pink-50 text-stone-500 hover:text-pink-500'
            }`}
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo unificado y más pequeño */}
          <div className="hidden lg:flex items-center gap-2">
            <div 
              className="w-7 h-7 rounded-lg flex items-center justify-center shadow-sm"
              style={{ background: brandGradient }}
            >
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="leading-none">
              <h1 className={`text-sm font-bold tracking-tight ${
                isDark ? 'text-white' : 'text-stone-900'
              }`}>
                Fresh<span className="font-light" style={{ color: primaryColor }}>Nails</span>
              </h1>
              <p className={`text-[6px] uppercase tracking-[0.3em] font-medium ${
                isDark ? 'text-stone-500' : 'text-stone-400'
              }`}>
                Studio Center
              </p>
            </div>
          </div>
        </div>

        {/* Lado derecho - Acciones */}
        <div className="flex items-center gap-1 md:gap-2">
          {/* Búsqueda */}
          <button 
            onClick={() => setShowSearch(!showSearch)}
            className={`hidden md:flex p-2 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 ${
              isDark 
                ? 'hover:bg-fuchsia-950/30 text-stone-400 hover:text-pink-400' 
                : 'hover:bg-pink-50 text-stone-500 hover:text-pink-500'
            }`}
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Toggle Dark/Light */}
          <button 
            onClick={toggleTheme}
            className={`p-2 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 ${
              isDark 
                ? 'hover:bg-fuchsia-950/30 text-amber-400 hover:text-amber-300' 
                : 'hover:bg-pink-50 text-stone-500 hover:text-pink-500'
            }`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Notificaciones */}
          <button className={`relative p-2 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 ${
            isDark 
              ? 'hover:bg-fuchsia-950/30 text-stone-400 hover:text-pink-400' 
              : 'hover:bg-pink-50 text-stone-500 hover:text-pink-500'
          }`}>
            <Bell className="w-4 h-4" />
            <span className={`absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full animate-pulse ${
              isDark ? 'bg-pink-500' : 'bg-rose-500'
            }`} />
          </button>

          {/* Perfil - Desktop */}
          <div className="hidden lg:flex items-center gap-2.5 pl-3 border-l border-stone-200 dark:border-fuchsia-950/30">
            <div className="text-right leading-tight">
              <p className={`text-[11px] font-medium ${
                isDark ? 'text-white' : 'text-stone-800'
              }`}>
                {user?.full_name || 'Usuario'}
              </p>
              <p className={`text-[7px] uppercase tracking-[0.15em] font-medium ${
                isDark ? 'text-stone-500' : 'text-stone-400'
              }`}>
                {getRoleDisplay()}
              </p>
            </div>
            
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shadow-sm transition-all duration-300 hover:scale-105 cursor-pointer"
              style={{ background: brandGradient }}
            >
              {getInitials()}
            </div>
          </div>

          {/* Perfil - Mobile */}
          <div className="lg:hidden">
            <div 
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[9px] font-bold shadow-sm transition-all duration-300 hover:scale-105 cursor-pointer"
              style={{ background: brandGradient }}
            >
              {getInitials()}
            </div>
          </div>
        </div>
      </div>

      {/* Barra de búsqueda expandible */}
      {showSearch && (
        <div className={`px-4 md:px-6 pb-3 transition-all duration-300 ${
          isDark ? 'border-t border-fuchsia-950/30' : 'border-t border-pink-100/60'
        }`}>
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
              isDark ? 'text-stone-500' : 'text-stone-400'
            }`} />
            <input
              type="text"
              placeholder="Buscar..."
              className={`w-full pl-10 pr-4 py-2 rounded-xl text-sm transition-all duration-300 focus:outline-none focus:ring-2 ${
                isDark 
                  ? 'bg-[#130f24] border-fuchsia-950 text-white placeholder-stone-500' 
                  : 'bg-stone-50 border-pink-100/60 text-stone-900 placeholder-stone-400'
              }`}
              style={{ 
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)'}`,
                '--tw-ring-color': primaryColor
              } as React.CSSProperties}
              autoFocus
            />
            <kbd className={`absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded text-[7px] font-mono ${
              isDark ? 'bg-stone-800 text-stone-500' : 'bg-stone-100 text-stone-400'
            }`}>
              ⌘K
            </kbd>
          </div>
        </div>
      )}
    </header>
  )
}