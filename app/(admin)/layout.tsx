// @ts-nocheck
'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import AdminSidebar from '@/components/layout/AdminSidebar'
import AdminHeader from '@/components/layout/AdminHeader'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { role, loading, user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const [collapsed, setCollapsed] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)

  useEffect(() => {
    if (loading) return

    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`)
      setIsAuthorized(false)
      return
    }

    const verificarAccesoReal = async () => {
      try {
        if (role === 'admin' || role === 'staff' || role === 'owner') {
          setIsAuthorized(true)
          return
        }

        const { data: staffMember, error: dbError } = await supabase
          .from('staff')
          .select('auth_role')
          .eq('user_id', user.id)
          .maybeSingle()

        if (dbError) throw dbError

        if (staffMember && staffMember.auth_role) {
          const rolLimpio = staffMember.auth_role.toLowerCase().trim()
          if (rolLimpio === 'admin' || rolLimpio === 'staff' || rolLimpio === 'owner') {
            setIsAuthorized(true)
            return
          }
        }

        router.push('/portal')
        setIsAuthorized(false)

      } catch (error) {
        console.error('Error verificando permisos en AdminLayout:', error)
        router.push('/portal')
        setIsAuthorized(false)
      }
    }

    verificarAccesoReal()
  }, [user, role, loading, router, pathname])

  if (loading || isAuthorized === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0908]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-[#C9A96E]/20 border-t-[#C9A96E] rounded-full animate-spin" />
          <p className="text-xs text-stone-400 animate-pulse">Verificando credenciales de Staff...</p>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return null
  }

  return (
    <div className="flex h-screen w-full bg-stone-50 dark:bg-[#0a0908] overflow-hidden">
      <AdminSidebar 
        collapsed={collapsed} 
        setCollapsed={setCollapsed} 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden">
        <AdminHeader 
          collapsed={collapsed} 
          onMenuClick={() => setSidebarOpen(true)} 
        />

        {/* 
          1. Cambiamos pt-0 por pt-16 (64px) en pantallas móviles y pt-20 (80px) en escritorio.
          2. Eliminamos el div hack h-[20px].
        */}
        <main className="flex-1 px-4 pt-16 lg:pt-20 pb-20 lg:pb-24 overflow-y-auto w-full">
          {children}
        </main>
      </div>
    </div>
  )
}
