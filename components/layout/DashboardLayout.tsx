// @ts-nocheck
'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Scissors, Heart, Crown, Calendar, 
  Menu, X, LogOut, Home, CalendarPlus,
  Camera, Tag, Eye, Hand, Globe, Bug
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
  const [imgStatus, setImgStatus] = useState<'loading' | 'success' | 'error' | 'empty'>('loading')
  
  // LOGS VISUALES
  const [debugLogs, setDebugLogs] = useState<string[]>([])
  const [showDebug, setShowDebug] = useState(true)

  const isDark = theme === 'dark'

  const addLog = (msg: string) => {
    setDebugLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`])
  }

  const fetchAvatarDirect = useCallback(async () => {
    addLog('Iniciando carga de avatar en Layout...')

    if (!user?.id) {
      addLog('⚠️ user es nulo o no tiene user.id')
      setImgStatus('empty')
      return
    }

    addLog(`User detectado. ID Auth: ${user.id} | Email: ${user.email}`)

    const initialName = user.user_metadata?.full_name || 
                        user.user_metadata?.name || 
                        user.email?.split('@')[0] || 
                        'Usuario'
    setUserName(initialName)

    try {
      setImgStatus('loading')
      let foundAvatar = null

      // 1. Consulta en la tabla clients haciendo MATCH por auth_user_id (Igual que Perfil)
      addLog('Buscando en "clients" por auth_user_id...')
      let { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('auth_user_id', user.id)
        .maybeSingle()

      // Respaldo por email si no lo halla por auth_user_id
      if (!clientData && user.email) {
        addLog('No hallado por auth_user_id. Buscando en "clients" por email...')
        const { data: clientByEmail, error: emailErr } = await supabase
          .from('clients')
          .select('*')
          .eq('email', user.email)
          .maybeSingle()
        if (clientByEmail) clientData = clientByEmail
      }

      if (clientError) {
        addLog(`🔴 Error Supabase en clients: ${clientError.message}`)
      }

      if (clientData) {
        addLog(`🟢 Cliente hallado. Nombre: "${clientData.name || clientData.full_name}", avatar_url: "${clientData.avatar_url}"`)
        const name = clientData.name || clientData.full_name || clientData.nombre
        if (name) setUserName(name)

        foundAvatar = clientData.avatar_url || clientData.foto || clientData.image_url || clientData.photo_url || clientData.avatar
      } else {
        addLog('⚠️ No se encontró el registro en la tabla clients.')
      }

      // 2. Respaldo en Auth Metadata
      if (!foundAvatar && (user.user_metadata?.avatar_url || user.user_metadata?.picture)) {
        addLog('Usando avatar de Auth Metadata...')
        foundAvatar = user.user_metadata.avatar_url || user.user_metadata.picture
      }

      if (foundAvatar && typeof foundAvatar === 'string' && foundAvatar.trim().length > 5) {
        setAvatarUrl(foundAvatar)
        setImgStatus('success')
        addLog(`✅ Foto asignada con éxito: ${foundAvatar}`)
      } else {
        addLog('⚠️ No hay URL de foto válida. Mostrando iniciales.')
        setImgStatus('empty')
      }

    } catch (err: any) {
      addLog(`🔴 Error imprevisto: ${err?.message || JSON.stringify(err)}`)
      setImgStatus('error')
    }
  }, [user])

  useEffect(() => {
    fetchAvatarDirect()
  }, [fetchAvatarDirect])

  const firstName = userName.split(' ')[0] || userName
  const inicialNombre = firstName.charAt(0).toUpperCase()

  // Menú para clientes
  const menuItems = [
    { icon: Home, label: 'Inicio Portal', href: '/portal' },
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
          <span className="text-sm font-light tracking-[0.3em] uppercase">freshNails</span>
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

        <div className="p-4 border-t border-[#3D281E] space-y-1">
          <Link 
            href="/" 
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-[#A89588] hover:text-[#FFF9F6] hover:bg-[#3D281E]/50 transition-colors"
          >
            <Globe className="w-4 h-4" />
            <span>Página Principal (Landing)</span>
          </Link>
          <button onClick={handleLogoutClick} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-[#A89588]">
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
            {/* BOTÓN DE DEBUG LOGS */}
            <button 
              onClick={() => setShowDebug(!showDebug)}
              className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/30 text-xs font-bold flex items-center gap-1"
            >
              <Bug className="w-4 h-4" />
              <span>{showDebug ? 'Ocultar Logs' : 'Ver Logs'}</span>
            </button>

            <Link 
              href="/" 
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#3D281E] text-xs font-semibold text-[#A89588] hover:text-[#FFF9F6] transition-colors"
            >
              <Globe className="w-4 h-4" />
              <span>Ver Web</span>
            </Link>

            <ThemeToggle />

            {/* INDICADOR VISUAL DE ESTADO */}
            <div className="text-right flex flex-col items-end">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${
                  imgStatus === 'success' ? 'bg-green-500' :
                  imgStatus === 'loading' ? 'bg-yellow-500 animate-pulse' :
                  imgStatus === 'error' ? 'bg-red-500' : 'bg-gray-400'
                }`} />
                <p className="text-xs font-bold">{userName}</p>
              </div>
              <span className="text-[8px] font-black uppercase text-[#D4AF37]">
                {imgStatus === 'success' ? 'FOTO OK' : imgStatus === 'loading' ? 'CARGANDO...' : imgStatus === 'error' ? 'ERROR DE RED' : 'SIN FOTO'}
              </span>
            </div>
            
            <Link href="/perfil" className="w-10 h-10 rounded-xl border border-[#3D281E] overflow-hidden flex items-center justify-center text-sm font-black bg-[#2A1B14] text-[#D4AF37] relative shrink-0">
              {imgStatus === 'success' && avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                  onError={() => {
                    addLog(`🔴 Error cargando la imagen <img src="${avatarUrl}"> en el navegador.`)
                    setImgStatus('error')
                  }}
                />
              ) : (
                <span>{inicialNombre}</span>
              )}
            </Link>
          </div>
        </header>

        {/* RECUADRO DE LOGS VISUALES */}
        {showDebug && (
          <div className="bg-black/95 text-green-400 p-4 text-xs font-mono border-b border-amber-500/50 max-h-48 overflow-y-auto shrink-0 z-40">
            <div className="flex justify-between items-center mb-2 pb-1 border-b border-gray-700">
              <span className="font-bold text-amber-400">DEBUG LOGS (DASHBOARD LAYOUT)</span>
              <button onClick={() => setDebugLogs([])} className="text-gray-400 hover:text-white underline">Limpiar</button>
            </div>
            {debugLogs.length === 0 ? (
              <p className="text-gray-500">Cargando eventos...</p>
            ) : (
              debugLogs.map((log, idx) => (
                <div key={idx} className="py-0.5 leading-relaxed">{log}</div>
              ))
            )}
          </div>
        )}

        <main className="flex-1 p-4 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
