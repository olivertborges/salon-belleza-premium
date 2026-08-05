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
  const [loading, setLoading] = useState(true)

  const isDark = theme === 'dark'

  const fetchClientData = useCallback(async () => {
    if (!user?.id && !user?.email) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      // Consultar la tabla clients EXACTAMENTE IGUAL que en Perfil (por auth_user_id)
      let query = supabase.from('clients').select('name, full_name, avatar_url')
      
      if (user.id) {
        query = query.eq('auth_user_id', user.id)
      } else {
        query = query.eq('email', user.email)
      }

      const { data: client, error } = await query.maybeSingle()

      if (error) {
        console.error('Error al consultar cliente en HeaderTop:', error)
      }

      if (client) {
        const displayName = client.name || client.full_name
        if (displayName) setUserName(displayName)
        if (client.avatar_url) setAvatarUrl(client.avatar_url)
      } else {
        // Fallback metadata si no hay cliente registrado aún
        const metaName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0]
        if (metaName) setUserName(metaName)
      }
    } catch (err) {
      console.error('Error imprevisto al cargar avatar en Header:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchClientData()
  }, [fetchClientData])

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

        <div className="text-right flex flex-col items-end">
          <p className="text-xs font-bold">{userName}</p>
        </div>
        
        <Link 
          href="/perfil" 
          className="w-10 h-10 rounded-xl border border-[#D4AF37]/40 overflow-hidden flex items-center justify-center text-sm font-black bg-[#2A1B14] text-[#D4AF37] relative shrink-0 hover:border-[#D4AF37] transition-all"
        >
          {avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt={userName} 
              className="w-full h-full object-cover"
            />
          ) : (
            <span>{inicialNombre}</span>
          )}
        </Link>
      </div>
    </header>
  )
}
