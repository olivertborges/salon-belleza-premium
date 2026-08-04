// @ts-nocheck
'use client'

import React, { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Sparkles, Scissors, Heart, Crown, Calendar, 
  Menu, X, LogOut, Home, CalendarPlus,
  Camera, Tag, Eye, Hand, RefreshCw
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

  const [userName, setUserName] = useState('Usuario')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [imgError, setImgError] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string>('Cargando diagnóstico...')

  const isDark = theme === 'dark'

  useEffect(() => {
    if (!user) return

    const initialName = user.user_metadata?.full_name || 
                        user.user_metadata?.name || 
                        user.email?.split('@')[0] || 
                        'Usuario'
    setUserName(initialName)

    const fetchAvatar = async () => {
      let log = []
      log.push(`User ID: ${user.id}`)

      // 1. Verificar si hay archivos en el bucket 'staff'
      const { data: files, error: listError } = await supabase.storage
        .from('staff')
        .list()

      if (listError) {
        log.push(`❌ Error leyendo bucket staff: ${listError.message}`)
      } else if (files) {
        log.push(`📁 Archivos en bucket staff: ${files.map(f => f.name).join(', ') || 'Ninguno'}`)
      }

      // 2. Consultar tabla staff
      const { data: staffData, error: staffErr } = await supabase
        .from('staff')
        .select('*')
        .or(`user_id.eq.${user.id},email.eq.${user.email}`)
        .limit(1)

      let finalPath = null

      if (staffErr) {
        log.push(`❌ Error tabla staff: ${staffErr.message}`)
      } else if (staffData && staffData.length > 0) {
        const st = staffData[0]
        log.push(`👤 Staff encontrado: ${st.name || st.nombre || 'Sin nombre'}`)
        finalPath = st.avatar_url || st.photo_url || st.image || st.picture || st.photo
        log.push(`🔑 Path en BD: ${finalPath || 'Vacío / null'}`)
      } else {
        log.push(`⚠️ No se encontró registro en tabla 'staff' para este mail/id`)
      }

      // 3. Probar si el archivo está guardado con el ID de usuario si la tabla estaba vacía
      if (!finalPath && files && files.length > 0) {
        const match = files.find(f => f.name.includes(user.id) || (user.email && f.name.includes(user.email.split('@')[0])))
        if (match) {
          finalPath = match.name
          log.push(`🎯 Coincidencia encontrada por ID/Email: ${finalPath}`)
        }
      }

      // 4. Armar URL
      if (finalPath) {
        if (finalPath.startsWith('http://') || finalPath.startsWith('https://')) {
          setAvatarUrl(finalPath)
          log.push(`🔗 URL completa: ${finalPath}`)
        } else {
          const { data } = supabase.storage.from('staff').getPublicUrl(finalPath)
          setAvatarUrl(data?.publicUrl || null)
          log.push(`🔗 URL Pública generada: ${data?.publicUrl}`)
        }
      } else {
        log.push(`❌ No se pudo determinar ninguna ruta de foto.`)
      }

      setDebugInfo(log.join(' | '))
    }

    fetchAvatar()
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
      window.location.href = '/login'
    }
  }

  return (
    <div className={`h-screen w-full antialiased flex relative transition-colors duration-500 overflow-hidden ${
      isDark ? 'bg-[#1E120C]' : 'bg-[#FFF9F6]'
    }`}>

      <div 
        onClick={() => setSidebarOpen(false)} 
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden transition-all duration-500 ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-76 h-full border-r transition-all duration-500 lg:static lg:translate-x-0 flex flex-col shrink-0 ${
          sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        } ${
          isDark ? 'bg-[#1E120C]/95 border-[#3D281E]' : 'bg-[#FFF9F6]/95 border-[#F0E4DA]'
        }`}
      >
        <div className={`p-6 border-b flex items-center justify-between shrink-0 ${
          isDark ? 'border-[#3D281E]' : 'border-[#F0E4DA]'
        }`}>
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-sm font-light tracking-[0.3em] uppercase">freshNails</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 text-[#A89588]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {menuItems.map((item, index) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link 
                key={index} 
                href={item.href} 
                onClick={() => setSidebarOpen(false)} 
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-semibold ${
                  isActive ? 'bg-[#D4AF37]/10 text-[#D4AF37]' : 'text-[#A89588]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>

        <div className="p-4 border-t border-[#3D281E]">
          <button onClick={handleLogoutClick} className="flex items-center gap-3 px-4 py-3 text-xs text-[#A89588]">
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 h-full relative z-10">

        <header className={`sticky top-0 z-30 border-b px-4 h-20 flex items-center justify-between gap-4 shrink-0 ${
          isDark ? 'bg-[#1E120C]/80 border-[#3D281E]' : 'bg-[#FFF9F6]/80 border-[#F0E4DA]'
        }`}>
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2.5 rounded-xl border border-[#3D281E] text-[#A89588]">
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 ml-auto">
            <ThemeToggle />
            
            <div className="text-right">
              <p className="text-xs font-bold">{userName}</p>
              <span className="text-[8px] font-black uppercase text-[#D4AF37]">STAFF</span>
            </div>
            
            <div className="w-10 h-10 rounded-xl border border-[#3D281E] overflow-hidden flex items-center justify-center text-sm font-black bg-[#2A1B14] text-[#D4AF37]">
              {avatarUrl && !imgError ? (
                <img 
                  src={avatarUrl} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                  onError={() => setImgError(true)}
                />
              ) : (
                <span>{inicialNombre}</span>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 overflow-y-auto">
          {/* CUADRO DE DIAGNÓSTICO EN PANTALLA PARA MÓVIL */}
          <div className="mb-6 p-4 rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/10 text-xs text-[#D4AF37] break-all leading-relaxed">
            <div className="font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Diagnóstico de Foto (Móvil):
            </div>
            {debugInfo}
          </div>

          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
