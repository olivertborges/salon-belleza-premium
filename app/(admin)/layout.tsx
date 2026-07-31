// @ts-nocheck
'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase/client' // Hacemos la importación de Supabase
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

  // ✅ PROTEGER RUTAS DE ADMIN CON CONSULTA A BASE DE DATOS
  useEffect(() => {
    // Si está cargando la autenticación inicial, esperamos
    if (loading) return

    // Si ni siquiera hay un usuario logueado, directo al login
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`)
      setIsAuthorized(false)
      return
    }

    const verificarAccesoReal = async () => {
      try {
        // 1. Verificación rápida: Si el contexto ya dice que es apto, autorizamos
        if (role === 'admin' || role === 'staff' || role === 'owner') {
          setIsAuthorized(true)
          return
        }

        // 2. Si el contexto no lo tiene (tu caso actual), buscamos en la verdad absoluta: la tabla 'staff'
        const { data: staffMember, error: dbError } = await supabase
          .from('staff')
          .select('auth_role')
          .eq('user_id', user.id)
          .maybeSingle()

        if (dbError) throw dbError

        // Si existe en la tabla y tiene un rol permitido, le damos acceso
        if (staffMember && staffMember.auth_role) {
          const rolLimpio = staffMember.auth_role.toLowerCase().trim()
          if (rolLimpio === 'admin' || rolLimpio === 'staff' || rolLimpio === 'owner') {
            setIsAuthorized(true)
            return
          }
        }

        // 3. Si no cumple ninguna condición, se va redirigido al portal
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

  // ✅ Mostrar loader estético mientras verifica los permisos en la BD
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

  // Si no está autorizado, no renderizamos nada mientras se ejecuta el redireccionamiento
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

        <main className="flex-1 px-4 pb-20 lg:px-6 lg:pb-24 pt-0 overflow-y-auto w-full">
          <div className="h-[20px] w-full block shrink-0 pointer-events-none" aria-hidden="true" />
          {children}
        </main>
      </div>
    </div>
  )
}
