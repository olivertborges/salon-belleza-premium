// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/contexts/ThemeContext'
import { supabase } from '@/lib/supabase/client'
import { Menu, Sun, Moon, UserCircle } from 'lucide-react'
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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  const isDark = theme === 'dark'

  useEffect(() => {
    if (!user) return

    // 1. Configurar nombre desde los metadatos de autenticación por defecto
    const name = user.user_metadata?.full_name || 
                 user.user_metadata?.name || 
                 user.user_metadata?.first_name ||
                 user.email?.split('@')[0] || 
                 'Admin'
    setUserName(name)

    // 2. Traer los datos en tiempo real (nombre completo y foto) desde la tabla 'profiles'
    const fetchProfileData = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', user.id)
          .maybeSingle()

        if (error) throw error

        if (data) {
          if (data.full_name) setUserName(data.full_name)
          if (data.avatar_url) setAvatarUrl(data.avatar_url)
        }
      } catch (error) {
        console.error('Error cargando avatar en el Header:', error)
      }
    }

    fetchProfileData()
  }, [user])

  const firstName = userName.split(' ')[0] || userName

  return (
    <>
      {/* Spacer para evitar que el contenido de la página se meta debajo debido al position fixed */}
      <div className="h-20 w-full" />

      <header className={`fixed top-0 right-0 left-0 z-50 backdrop-blur-md border-b px-4 md:px-8 h-20 flex items-center justify-between transition-all duration-300 shadow-sm ${
        isDark
          ? 'bg-[#1E120C]/90 border-[#3D281E] text-[#FFF9F6]'
          : 'bg-[#FFF9F6]/90 border-[#F0E4DA] text-[#1A0E0A]'
      }`}>
        {/* LADO IZQUIERDO */}
        <div className="flex items-center gap-3 md:gap-5">
          <button
            onClick={onMenuClick}
            className={`lg:hidden h-10 w-10 p-2.5 rounded-xl border flex items-center justify-center transition-all shrink-0 ${
              isDark
                ? 'bg-[#2A1B14] border-[#3D281E] text-[#A89588] hover:text-[#FFF9F6] hover:border-[#D4AF37]/60'
                : 'bg-white border-[#F0E4DA] text-[#5C4A3E] hover:text-[#1A0E0A] hover:bg-[#FFF9F6] hover:border-[#D4AF37]/60'
            }`}
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <h1 className={`text-base md:text-xl font-light tracking-tight transition-colors ${
              isDark ? 'text-[#FFF9F6]/90' : 'text-[#1A0E0A]/90'
            }`}>
              Bienvenido,{' '}
              <span className="font-extrabold text-[#D4AF37] drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)] relative inline-block group-hover:scale-105 transition-transform">
                {firstName}
              </span>
            </h1>
            <p className={`text-[10px] md:text-xs font-medium mt-0.5 hidden sm:block transition-colors ${
              isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
            }`}>
              {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}
            </p>
          </div>
        </div>

        {/* LADO DERECHO - SOLO TEMA Y PERFIL */}
        <div className="flex items-center gap-3 md:gap-4 h-10">

          {/* Tema */}
          <button
            onClick={toggleTheme}
            className={`h-10 w-10 p-2.5 rounded-xl border flex items-center justify-center transition-all shrink-0 ${
              isDark
                ? 'bg-[#2A1B14] border-[#3D281E] text-[#A89588] hover:text-[#FFF9F6] hover:border-[#D4AF37]/60'
                : 'bg-white border-[#F0E4DA] text-[#5C4A3E] hover:text-[#1A0E0A] hover:bg-[#FFF9F6] hover:border-[#D4AF37]/60'
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
            className="flex items-center gap-3 shrink-0 group cursor-pointer"
          >
            <div className="text-right hidden md:block">
              <p className={`text-sm font-semibold truncate max-w-[150px] transition-colors group-hover:text-[#D4AF37] ${
                isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'
              }`}>
                {userName}
              </p>
              <span className="text-[9px] font-bold tracking-widest uppercase transition-colors text-[#D4AF37]/80 group-hover:text-[#D4AF37]">
                Admin
              </span>
            </div>
            
            {/* Contenedor de la Foto o Inicial */}
            <div className={`w-10 h-10 rounded-xl border overflow-hidden flex items-center justify-center text-sm font-black shadow-sm transition-all ring-offset-2 ring-0 group-hover:ring-2 group-hover:ring-[#D4AF37] ${
              isDark
                ? 'bg-[#2A1B14] border-[#3D281E] text-[#D4AF37] ring-offset-[#1E120C]'
                : 'bg-[#FFF9F6] border-[#F0E4DA] text-[#D4AF37] ring-offset-[#FFF9F6]'
            }`}>
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt={`Avatar de ${userName}`} 
                  className="w-full h-full object-cover"
                />
              ) : (
                firstName.charAt(0).toUpperCase()
              )}
            </div>
          </Link>

        </div>
      </header>
    </>
  )
}
