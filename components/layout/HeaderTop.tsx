// @ts-nocheck
'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Menu, Globe } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/contexts/ThemeContext'
import { ThemeToggle } from '@/components/ThemeToggle'
import { supabase } from '@/lib/supabase/client'

interface HeaderTopProps {
  setIsSidebarOpen?: (open: boolean) => void
}

export default function HeaderTop({ setIsSidebarOpen }: HeaderTopProps) {
  const { user } = useAuth()
  const { theme } = useTheme()
  
  const [userName, setUserName] = useState('Usuario')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [imgStatus, setImgStatus] = useState<'loading' | 'success' | 'error' | 'empty'>('loading')

  const isDark = theme === 'dark'

  const fetchAvatarDirect = useCallback(async () => {
    if (!user?.id) {
      setImgStatus('empty')
      return
    }

    // Nombre inicial desde Metadatos o Email
    const initialName = user.user_metadata?.full_name || 
                        user.user_metadata?.name || 
                        user.email?.split('@')[0] || 
                        'Usuario'
    setUserName(initialName)

    try {
      setImgStatus('loading')
      let foundAvatar = null

      // 1. Auth Metadata
      if (user.user_metadata?.avatar_url || user.user_metadata?.picture) {
        foundAvatar = user.user_metadata.avatar_url || user.user_metadata.picture
      }

      // 2. Tabla clients (Consultamos por Email o por ID)
      if (!foundAvatar) {
        let { data: clientData } = await supabase
          .from('clients')
          .select('full_name, avatar_url')
          .eq('email', user.email)
          .maybeSingle()

        if (!clientData && user.id) {
          const { data: clientById } = await supabase
            .from('clients')
            .select('full_name, avatar_url')
            .eq('id', user.id)
            .maybeSingle()
          if (clientById) clientData = clientById
        }

        if (clientData) {
          if (clientData.full_name) setUserName(clientData.full_name)
          if (clientData.avatar_url && clientData.avatar_url.trim() !== '') {
            foundAvatar = clientData.avatar_url
          }
        }
      }

      // 3. Tabla profiles (Respaldo)
      if (!foundAvatar && user.id) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('avatar_url, full_name, name')
          .eq('id', user.id)
          .maybeSingle()

        if (profileData) {
          if (profileData.full_name || profileData.name) setUserName(profileData.full_name || profileData.name)
          if (profileData.avatar_url && profileData.avatar_url.trim() !== '') {
            foundAvatar = profileData.avatar_url
          }
        }
      }

      // Verificar si se encontró una URL de imagen válida
      if (foundAvatar && typeof foundAvatar === 'string' && foundAvatar.length > 5) {
        setAvatarUrl(foundAvatar)
        setImgStatus('success')
      } else {
        setAvatarUrl(null)
        setImgStatus('empty')
      }

    } catch (err) {
      console.error('Error al obtener el avatar:', err)
      setAvatarUrl(null)
      setImgStatus('empty')
    }
  }, [user])

  useEffect(() => {
    fetchAvatarDirect()
  }, [fetchAvatarDirect])

  const firstName = userName.split(' ')[0] || userName
  const inicialNombre = firstName.charAt(0).toUpperCase()

  return (
    <header className={`sticky top-0 z-30 border-b px-4 h-20 flex items-center justify-between gap-4 shrink-0 transition-colors duration-500 ${
      isDark ? 'bg-[#1E120C]/80 border-[#3D281E]' : 'bg-[#FFF9F6]/80 border-[#F0E4DA]'
    }`}>
      <button 
        onClick={() => setIsSidebarOpen && setIsSidebarOpen(true)} 
        className="lg:hidden p-2.5 rounded-xl border border-[#3D281E] text-[#A89588]"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex items-center gap-3 ml-auto">
        <Link 
          href="/" 
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#3D281E] text-xs font-semibold text-[#A89588] hover:text-[#FFF9F6] transition-colors"
        >
          <Globe className="w-4 h-4" />
          <span>Ver Web</span>
        </Link>

        <ThemeToggle />

        {/* INDICADOR DE ESTADO DE LA FOTO */}
        <div className="text-right flex flex-col items-end">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${
              imgStatus === 'success' ? 'bg-green-500' :
              imgStatus === 'loading' ? 'bg-yellow-500 animate-pulse' :
              'bg-gray-400'
            }`} />
            <p className="text-xs font-bold">{userName}</p>
          </div>
          <span className="text-[8px] font-black uppercase text-[#D4AF37]">
            {imgStatus === 'success' ? 'FOTO OK' : imgStatus === 'loading' ? 'CARGANDO...' : 'SIN FOTO'}
          </span>
        </div>
        
        {/* AVATAR: MUESTRA FOTO SI EXISTE, O LA INICIAL SI ESTÁ VACÍA */}
        <Link 
          href="/perfil" 
          className="w-10 h-10 rounded-xl border border-[#3D281E] overflow-hidden flex items-center justify-center text-sm font-black bg-[#2A1B14] text-[#D4AF37] relative shrink-0"
        >
          {imgStatus === 'success' && avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt={userName} 
              className="w-full h-full object-cover"
              onError={() => {
                setImgStatus('empty')
                setAvatarUrl(null)
              }}
            />
          ) : (
            <span>{inicialNombre}</span>
          )}
        </Link>
      </div>
    </header>
  )
}
