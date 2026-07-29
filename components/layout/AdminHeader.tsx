'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/contexts/ThemeContext'
import { Menu, User, Sun, Moon } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface AdminHeaderProps {
  collapsed: boolean
  onMenuClick: () => void
}

export default function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [userName, setUserName] = useState('Admin')

  const isDark = theme === 'dark'

  useEffect(() => {
    if (user) {
      const name = user.user_metadata?.full_name || 
                   user.user_metadata?.name || 
                   user.user_metadata?.first_name ||
                   user.email?.split('@')[0] || 
                   'Admin'
      setUserName(name)
    }
  }, [user])

  const firstName = userName.split(' ')[0] || userName

  return (
    <header className={`sticky top-0 z-30 backdrop-blur-md border-b px-4 md:px-8 h-20 flex items-center justify-between transition-colors duration-300 ${
      isDark
        ? 'bg-[#1E120C]/95 border-[#3D281E] text-[#FFF9F6]'
        : 'bg-[#FFF9F6]/95 border-[#F0E4DA] text-[#1A0E0A]'
    }`}>
      {/* LADO IZQUIERDO */}
      <div className="flex items-center gap-3 md:gap-4">
        <button
          onClick={onMenuClick}
          className={`lg:hidden h-10 w-10 p-2.5 rounded-xl border flex items-center justify-center transition-all shrink-0 ${
            isDark
              ? 'bg-[#2A1B14] border-[#3D281E] text-[#A89588] hover:text-[#FFF9F6] hover:border-[#D4AF37]/40'
              : 'bg-white border-[#F0E4DA] text-[#5C4A3E] hover:text-[#1A0E0A] hover:bg-[#FFF9F6] hover:border-[#D4AF37]/40'
          }`}
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className={`text-sm md:text-lg font-light tracking-tight transition-colors ${
            isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'
          }`}>
            Bienvenido,{' '}
            <span className="font-bold text-[#D4AF37]">{firstName}</span>
          </h1>
          <p className={`text-[10px] md:text-xs font-light hidden sm:block transition-colors ${
            isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
          }`}>
            {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}
          </p>
        </div>
      </div>

      {/* LADO DERECHO - SOLO TEMA Y PERFIL */}
      <div className="flex items-center gap-2.5 md:gap-4 h-10">

        {/* Tema */}
        <button
          onClick={toggleTheme}
          className={`h-10 w-10 p-2.5 rounded-xl border flex items-center justify-center transition-all shrink-0 ${
            isDark
              ? 'bg-[#2A1B14] border-[#3D281E] text-[#A89588] hover:text-[#FFF9F6] hover:border-[#D4AF37]/40'
              : 'bg-white border-[#F0E4DA] text-[#5C4A3E] hover:text-[#1A0E0A] hover:bg-[#FFF9F6] hover:border-[#D4AF37]/40'
          }`}
          aria-label="Cambiar tema"
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-[#D4AF37] animate-pulse" />
          ) : (
            <Moon className="w-4 h-4 text-[#D4AF37]" />
          )}
        </button>

        {/* Separador */}
        <div className={`h-6 w-[1px] mx-0.5 hidden md:block shrink-0 ${isDark ? 'bg-[#3D281E]' : 'bg-[#F0E4DA]'}`} />

        {/* Perfil - CLICKEABLE */}
        <Link 
          href="/admin/perfil"
          className="flex items-center gap-3 shrink-0 group cursor-pointer transition-all hover:opacity-80"
        >
          <div className="text-right hidden md:block">
            <p className={`text-xs font-medium truncate max-w-[150px] transition-colors group-hover:text-[#D4AF37] ${
              isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'
            }`}>
              {userName}
            </p>
            <span className={`text-[9px] font-mono tracking-wider uppercase transition-colors text-[#D4AF37]`}>
              Admin
            </span>
          </div>
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center text-sm font-bold shadow-sm transition-all group-hover:scale-105 group-hover:border-[#D4AF37] ${
            isDark
              ? 'bg-[#2A1B14] border-[#3D281E] text-[#D4AF37] group-hover:border-[#D4AF37]/60'
              : 'bg-[#FFF9F6] border-[#F0E4DA] text-[#D4AF37] group-hover:border-[#D4AF37]/60'
          }`}>
            {firstName.charAt(0).toUpperCase()}
          </div>
        </Link>

      </div>
    </header>
  )
}