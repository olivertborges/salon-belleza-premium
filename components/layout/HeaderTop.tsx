// @ts-nocheck
'use client'

import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/contexts/ThemeContext'
import { useSettings } from '@/contexts/SettingsContext'
import { supabase } from '@/lib/supabase/client'
import { Menu, Bell, Search, Sparkles, Sun, Moon, AlertTriangle } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'

interface HeaderTopProps {
  setIsSidebarOpen: (open: boolean) => void
}

export default function HeaderTop({ setIsSidebarOpen }: HeaderTopProps) {
  const { user, role } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { settings } = useSettings()
  
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState<string>('Usuario')
  
  // Estado para mostrar los logs de error en pantalla móvil
  const [visualLog, setVisualLog] = useState<string | null>('Iniciando carga...')

  const isDark = theme === 'dark'
  const primaryColor = settings?.primary_color || '#DB5B9A'
  const secondaryColor = settings?.secondary_color || '#E5A46E'
  const brandGradient = `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`

  const fetchClientProfile = useCallback(async () => {
    if (!user) {
      setVisualLog('ERROR: No hay usuario autenticado (user es null)')
      return
    }

    try {
      setVisualLog(`Buscando ID: ${user.id.slice(0, 6)}...`)

      // 1. Consulta flexible en la tabla 'clients'
      const { data: client, error } = await supabase
        .from('clients')
        .select('*')
        .or(`id.eq.${user.id},user_id.eq.${user.id},auth_id.eq.${user.id},email.eq.${user.email}`)
        .maybeSingle()

      if (error) {
        setVisualLog(`DB Error: ${error.message}`)
        return
      }

      if (client) {
        const name = client.full_name || client.name || client.nombre
        if (name) setDisplayName(name)

        const rawUrl = client.avatar_url || client.foto || client.image_url || client.photo_url || client.avatar
        
        if (rawUrl) {
          const cleanUrl = rawUrl.includes('?') ? `${rawUrl}&t=${Date.now()}` : `${rawUrl}?t=${Date.now()}`
          setAvatarUrl(cleanUrl)
          setVisualLog(null) // Todo OK, sin errores visuales
          return
        } else {
          setVisualLog('AVISO: Cliente encontrado pero sin campo de foto (avatar_url/foto vacío)')
        }
      } else {
        setVisualLog(`AVISO: No existe registro en 'clients' para este usuario/email`)
      }

      // Fallback metadatos
      const metaName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0]
      if (metaName) setDisplayName(metaName)

      const metaAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture
      if (metaAvatar) {
        setAvatarUrl(metaAvatar)
        setVisualLog(null)
      }

    } catch (err: any) {
      setVisualLog(`Catch Error: ${err.message || JSON.stringify(err)}`)
    }
  }, [user])

  useEffect(() => {
    fetchClientProfile()

    if (!user?.id) return

    const channel = supabase
      .channel('header_clients_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'clients' },
        () => { fetchClientProfile() }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, fetchClientProfile])

  const getInitials = () => {
    if (displayName) {
      return displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    return 'U'
  }

  return (
    <>
      {/* 🔴 LOG VISUAL EN PANTALLA (Toca el cuadro rojo para cerrarlo) */}
      {visualLog && (
        <div 
          onClick={() => setVisualLog(null)}
          className="bg-red-600 text-white text-[10px] p-2 px-3 font-mono flex items-center justify-between gap-2 shadow-lg z-50 relative border-b border-red-700 cursor-pointer animate-pulse"
          title="Toca para ocultar"
        >
          <div className="flex items-center gap-1.5 overflow-hidden">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="truncate"><strong>Debug Móvil:</strong> {visualLog}</span>
          </div>
          <span className="text-[9px] underline shrink-0 opacity-80">[Ocultar]</span>
        </div>
      )}

      <header className={`sticky top-0 z-30 transition-all duration-300 ${
        isDark 
          ? 'bg-[#0f0c1b]/90 backdrop-blur-md border-b border-fuchsia-950/30' 
          : 'bg-white/80 backdrop-blur-md border-b border-pink-100/60'
      }`}>
        <div className="flex items-center justify-between px-4 md:px-6 h-14 md:h-16">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className={`lg:hidden p-2 rounded-xl transition-all ${
                isDark ? 'hover:bg-fuchsia-950/30 text-stone-400' : 'hover:bg-pink-50 text-stone-500'
              }`}
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="hidden lg:flex items-center gap-2">
              <div 
                className="w-7 h-7 rounded-lg flex items-center justify-center shadow-sm"
                style={{ background: brandGradient }}
              >
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <h1 className={`text-sm font-bold tracking-tight ${isDark ? 'text-white' : 'text-stone-900'}`}>
                Fresh<span className="font-light" style={{ color: primaryColor }}>Nails</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-xl text-stone-400 hover:text-amber-400"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button className="p-2 rounded-xl text-stone-400">
              <Bell className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 pl-2">
              <div className="text-right leading-tight">
                <p className={`text-[11px] font-semibold truncate max-w-[100px] sm:max-w-none ${
                  isDark ? 'text-white' : 'text-stone-800'
                }`}>
                  {displayName}
                </p>
              </div>
              
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shadow-sm overflow-hidden shrink-0 border border-amber-500/20"
                style={{ background: avatarUrl ? 'transparent' : brandGradient }}
              >
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt="Avatar" 
                    className="w-full h-full object-cover rounded-lg"
                    onError={() => {
                      setVisualLog(`ERROR IMG LOAD: No se pudo renderizar la URL de imagen`)
                      setAvatarUrl(null)
                    }}
                  />
                ) : (
                  <span>{getInitials()}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  )
}
