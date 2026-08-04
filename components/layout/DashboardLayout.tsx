// @ts-nocheck
'use client'

import React, { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Sparkles, Scissors, Heart, Crown, Calendar, 
  Menu, X, LogOut, Home, CalendarPlus,
  Camera, Tag, Eye, Hand
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/contexts/ThemeContext'
import { ThemeToggle } from '@/components/ThemeToggle'
import { supabase } from '@/lib/supabase/client'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOut } = useAuth()
  const { theme } = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [userName, setUserName] = useState('Silvana')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [imgError, setImgError] = useState(false)

  const isDark = theme === 'dark'

  useEffect(() => {
    if (!user) return

    const initialName = user.user_metadata?.full_name || 
                        user.user_metadata?.name || 
                        user.email?.split('@')[0] || 
                        'Silvana'
    setUserName(initialName)

    const fetchStaffAvatarFromBucket = async () => {
      try {
        let avatarPath: string | null = null

        // 1. Buscar el registro en la tabla 'staff' por email o user_id
        const { data: staffData } = await supabase
          .from('staff')
          .select('*')
          .or(`user_id.eq.${user.id},email.eq.${user.email}`)
          .limit(1)

        if (staffData && staffData.length > 0) {
          const staffMember = staffData[0]
          
          if (staffMember.name || staffMember.full_name) {
            setUserName(staffMember.name || staffMember.full_name)
          }

          // Obtener el nombre o ruta del archivo dentro del bucket
          avatarPath = staffMember.avatar_url || staffMember.photo_url || staffMember.image_path || staffMember.photo
        }

        // 2. Si el registro tiene una ruta o nombre de archivo guardado
        if (avatarPath) {
          // Si ya es una URL completa (http/https), usarla directamente
          if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
            setAvatarUrl(avatarPath)
          } else {
            // Si es un path/nombre de archivo, construir la URL pública desde el bucket 'staff'
            const { data } = supabase.storage.from('staff').getPublicUrl(avatarPath)
            if (data?.publicUrl) {
              setAvatarUrl(data.publicUrl)
            }
          }
        } else {
          // 3. Si la columna en la tabla está vacía, probar si el archivo se guardó con el ID o email del usuario
          const candidatePaths = [
            `${user.id}.jpg`,
            `${user.id}.png`,
            `${user.email}.jpg`,
            `${user.email}.png`
          ]

          for (const path of candidatePaths) {
            const { data } = supabase.storage.from('staff').getPublicUrl(path)
            if (data?.publicUrl) {
              setAvatarUrl(data.publicUrl)
              break
            }
          }
        }
      } catch (err) {
        console.error('Error al obtener imagen del bucket staff:', err)
      }
    }

    fetchStaffAvatarFromBucket()
  }, [user])

  const firstName = userName.split(' ')[0] || userName
  const inicialNombre = firstName.charAt(0).toUpperCase()

  const menuItems = [
    { icon: Home, label: 'Inicio', href: '/portal' },
    { icon: CalendarPlus, label: 'Reservar Turno', href: '/agenda' },
    { icon: Calendar, label: 'Mis Citas', href: '/reservas' },
    { icon: Scissors, label: 'Peluquería', href: '/peluqueria' },
    { icon: Eye, label: 'Micropigmentación', href: '/micropigmentacion' },
    { icon: Hand, label: 'Uñas', href: '/unhas' },
    { icon: Heart, label: 'Estética', href: '/estetica' },
    { icon: Camera, label: 'Galería & Looks', href: '/mi-galeria' },
    { icon: Tag, label: 'Ofertas Especiales', href: '/promociones' },
    { icon: Crown, label: 'Club Fresh VIP', href: '/fidelizacion' }
  ]

  const handleLogoutClick = async () => {
    try {
      if (signOut) await signOut()
      await supabase.auth.signOut()
      localStorage.clear()
      sessionStorage.clear()
      setTimeout(() => {
        window.location.href = '/login'
      }, 100)
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
      window.location.href = '/login'
    }
  }

  return (
    <div className={`h-screen w-full antialiased flex relative transition-colors duration-500 overflow-hidden ${
      isDark ? 'bg-[#1E120C]' : 'bg-[#FFF9F6]'
    }`}>

      <div className="absolute inset-0 pointer-events-none z-0 opacity-10 mix-blend-multiply bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:60px_60px]" />

      <div 
        onClick={() => setSidebarOpen(false)} 
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden transition-all duration-500 ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-76 h-full border-r transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] lg:static lg:translate-x-0 flex flex-col shrink-0 ${
          sidebarOpen ? 'translate-x-0 shadow-[25px_0_50px_-15px_rgba(0,0,0,0.3)]' : '-translate-x-full'
        } ${
          isDark ? 'bg-[#1E120C]/95 border-[#3D281E]' : 'bg-[#FFF9F6]/95 border-[#F0E4DA]'
        }`}
      >
        <div className={`p-6 border-b flex items-center justify-between shrink-0 ${
          isDark ? 'border-[#3D281E]' : 'border-[#F0E4DA]'
        }`}>
          <div className="flex items-center gap-2.5 group cursor-default">
            <Sparkles className="w-4 h-4 text-[#D4AF37] opacity-80 group-hover:rotate-12 transition-transform duration-500 shrink-0" />
            <div className="flex flex-col">
              <span className="text-sm font-light tracking-[0.3em] uppercase leading-tight">
                <span className="font-serif italic text-[#D4AF37] text-xl tracking-normal normal-case font-medium mr-1">fresh</span>
                <span className={isDark ? 'text-[#FFF9F6]/90' : 'text-[#1A0E0A]/90'}>Nails</span>
              </span>
              <span className={`text-[8px] uppercase tracking-[0.4em] font-light block mt-0.5 border-t pt-0.5 ${
                isDark ? 'text-[#A89588]/60 border-[#3D281E]' : 'text-[#5C4A3E]/60 border-[#F0E4DA]'
              }`}>
                Studio Center
              </span>
            </div>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)} 
            className={`lg:hidden p-2 rounded-xl transition-all ${
              isDark ? 'text-[#A89588] hover:text-[#FFF9F6] hover:bg-[#3D281E]' : 'text-[#A89588] hover:text-[#1A0E0A] hover:bg-[#F0E4DA]'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-1 scrollbar-thin scrollbar-thumb-[#D4AF37]/20">
          {menuItems.map((item, index) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link 
                key={index} 
                href={item.href} 
                onClick={() => setSidebarOpen(false)} 
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-semibold transition-all duration-300 group relative border ${
                  isActive 
                    ? 'bg-[#D4AF37]/10 border-[#D4AF37]/40 text-[#D4AF37]'
                    : 'border-transparent text-[#A89588] hover:text-[#1A0E0A] dark:hover:text-[#FFF9F6] hover:bg-[#D4AF37]/5'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 w-1 h-6 rounded-r-full bg-[#D4AF37]" />
                )}

                <div className={`p-2 rounded-lg border transition-all duration-300 transform group-hover:scale-105 ${
                  isActive 
                    ? 'bg-[#D4AF37] border-[#D4AF37] text-[#1A0E0A] shadow-md shadow-[#D4AF37]/20'
                    : isDark
                      ? 'bg-[#2A1B14] border-[#3D281E] text-[#A89588] group-hover:border-[#D4AF37]/30 group-hover:text-[#D4AF37]'
                      : 'bg-[#FFF9F6] border-[#F0E4DA] text-[#A89588] group-hover:border-[#D4AF37]/30 group-hover:text-[#D4AF37]'
                }`}>
                  <Icon className={`w-4 h-4 transition-transform duration-500 ${isActive ? '' : 'group-hover:rotate-6'}`} />
                </div>

                <span className="tracking-wide font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>

        <div className={`p-4 border-t shrink-0 ${
          isDark ? 'border-[#3D281E] bg-[#1E120C]/50' : 'border-[#F0E4DA] bg-[#FFF9F6]/50'
        }`}>
          <button 
            onClick={handleLogoutClick}
            className={`flex items-center gap-3.5 px-4 py-3 w-full rounded-xl text-xs font-semibold transition-all border border-transparent group ${
              isDark
                ? 'text-[#A89588] hover:text-[#FFF9F6] hover:bg-[#3D281E] hover:border-[#D4AF37]/20'
                : 'text-[#5C4A3E] hover:text-[#1A0E0A] hover:bg-[#F0E4DA] hover:border-[#D4AF37]/20'
            }`}
          >
            <div className={`p-2 rounded-lg border transition-all duration-300 ${
              isDark
                ? 'bg-[#2A1B14] border-[#3D281E] text-[#A89588] group-hover:text-[#D4AF37] group-hover:border-[#D4AF37]/30 group-hover:rotate-6'
                : 'bg-[#FFF9F6] border-[#F0E4DA] text-[#A89588] group-hover:text-[#D4AF37] group-hover:border-[#D4AF37]/30 group-hover:rotate-6'
            }`}>
              <LogOut className="w-4 h-4" />
            </div>
            <span className="tracking-wide">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 h-full relative z-10">

        <header className={`sticky top-0 z-30 border-b px-4 md:px-8 h-20 flex items-center justify-between gap-4 shrink-0 transition-all duration-300 ${
          isDark ? 'bg-[#1E120C]/80 border-[#3D281E] backdrop-blur-xl' : 'bg-[#FFF9F6]/80 border-[#F0E4DA] backdrop-blur-xl'
        }`}>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)} 
              className={`lg:hidden p-2.5 rounded-xl border transition-all active:scale-95 ${
                isDark 
                  ? 'bg-[#2A1B14] border-[#3D281E] text-[#A89588] hover:bg-[#3D281E]' 
                  : 'bg-white border-[#F0E4DA] text-[#5C4A3E] hover:bg-[#FFF9F6] shadow-sm'
              }`}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex flex-col lg:hidden">
              <h1 className="text-base font-light tracking-[0.2em] uppercase leading-none">
                <span className="font-serif italic text-[#D4AF37] text-lg tracking-normal normal-case font-medium mr-0.5">fresh</span>
                <span className={isDark ? 'text-[#FFF9F6]/90' : 'text-[#1A0E0A]/90'}>Nails</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />

            <div className={`h-5 w-[1px] mx-1 ${isDark ? 'bg-[#3D281E]' : 'bg-[#F0E4DA]'}`} />

            <Link 
              href="/perfil"
              className="flex items-center gap-3 shrink-0 group cursor-pointer"
            >
              <div className="text-right hidden sm:block">
                <p className={`text-xs font-bold leading-none transition-colors group-hover:text-[#D4AF37] ${
                  isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'
                }`}>
                  {userName}
                </p>
                <span className="text-[8px] font-black tracking-[0.2em] uppercase mt-1 block bg-gradient-to-r from-[#D4AF37] to-[#E8D5A0] bg-clip-text text-transparent">
                  STAFF MEMBER
                </span>
              </div>
              
              <div className={`w-10 h-10 rounded-xl border overflow-hidden flex items-center justify-center text-sm font-black shadow-sm transition-all ring-offset-2 ring-0 group-hover:ring-2 group-hover:ring-[#D4AF37] shrink-0 ${
                isDark
                  ? 'bg-[#2A1B14] border-[#3D281E] text-[#D4AF37] ring-offset-[#1E120C]'
                  : 'bg-[#FFF9F6] border-[#F0E4DA] text-[#D4AF37] ring-offset-[#FFF9F6]'
              }`}>
                {avatarUrl && !imgError ? (
                  <img 
                    src={avatarUrl} 
                    alt={`Avatar de ${userName}`} 
                    className="w-full h-full object-cover"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <span>{inicialNombre}</span>
                )}
              </div>
            </Link>
          </div>
        </header>

        <main className="flex-1 w-full p-4 md:p-8 overflow-y-auto bg-transparent transition-all duration-300">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
