// @ts-nocheck
'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Menu, Globe, Bug } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
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
  const [debugLogs, setDebugLogs] = useState<string[]>([])
  const [showDebug, setShowDebug] = useState(true)

  const isDark = theme === 'dark'

  const addLog = (msg: string) => {
    setDebugLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`])
  }

  const fetchClientData = useCallback(async () => {
    addLog('Iniciando fetchClientData en HeaderTop...')
    
    if (!user) {
      addLog('⚠️ user es undefined o null en AuthContext')
      setLoading(false)
      return
    }

    addLog(`User detectado. ID: ${user.id} | Email: ${user.email}`)

    try {
      setLoading(true)

      // Consulta exacta de Perfil
      addLog('Ejecutando SELECT en "clients" por auth_user_id...')
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('name, full_name, avatar_url')
        .eq('auth_user_id', user.id)
        .maybeSingle()

      if (clientError) {
        addLog(`🔴 Error Supabase: ${clientError.message}`)
        setLoading(false)
        return
      }

      if (clientData) {
        addLog(`🟢 Cliente encontrado: name="${clientData.name}", full_name="${clientData.full_name}", avatar_url="${clientData.avatar_url}"`)
        const displayName = clientData.name || clientData.full_name
        if (displayName) setUserName(displayName)
        if (clientData.avatar_url) {
          setAvatarUrl(clientData.avatar_url)
          addLog(`✅ URL de avatar asignada: ${clientData.avatar_url}`)
        } else {
          addLog('⚠️ El registro de cliente existe, pero avatar_url es nulo/vacío.')
        }
      } else {
        addLog('⚠️ No se encontró registro en "clients" con auth_user_id = user.id')
      }
    } catch (err: any) {
      addLog(`🔴 Error inesperado: ${err?.message || JSON.stringify(err)}`)
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
    <div className="flex flex-col w-full">
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
                onError={() => addLog(`🔴 Error al cargar la etiqueta <img> con la URL: ${avatarUrl}`)}
              />
            ) : (
              <span>{inicialNombre}</span>
            )}
          </Link>
        </div>
      </header>

      {/* RECUADRO DE LOGS VISUALES EN PANTALLA */}
      {showDebug && (
        <div className="bg-black/90 text-green-400 p-4 text-xs font-mono border-b border-amber-500/50 max-h-48 overflow-y-auto">
          <div className="flex justify-between items-center mb-2 pb-1 border-b border-gray-700">
            <span className="font-bold text-amber-400">DEBUG LOGS (HEADER TOP)</span>
            <button onClick={() => setDebugLogs([])} className="text-gray-400 hover:text-white underline">Limpiar</button>
          </div>
          {debugLogs.length === 0 ? (
            <p className="text-gray-500">Esperando eventos...</p>
          ) : (
            debugLogs.map((log, idx) => (
              <div key={idx} className="py-0.5 leading-relaxed">{log}</div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
