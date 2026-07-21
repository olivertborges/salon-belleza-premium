// @ts-nocheck
'use client'

import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface AuthContextType {
  user: User | null
  role: string | null
  clientId: string | null
  tenantId: string | null
  points: number | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>
  signUp: (email: string, password: string, fullName: string, phone?: string, referralCode?: string) => Promise<{ data: any; error: any }>
  signOut: () => Promise<void>
  refreshUserData: () => Promise<void>
  getEmergencyTenantId: () => Promise<string | null>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [clientId, setClientId] = useState<string | null>(null)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [points, setPoints] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  // ✅ Control de redirección
  const hasRedirected = useRef(false)
  const lastFetchedUserId = useRef<string | null>(null)
  const isMountedRef = useRef(true)

  // ============================================================
  // 1. OBTENER PERFIL DEL USUARIO
  // ============================================================
  const fetchUserDataAndRole = async (userId: string) => {
    if (!userId) return

    if (lastFetchedUserId.current === userId && role !== null) {
      return
    }

    try {
      lastFetchedUserId.current = userId

      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('role, tenant_id')
        .eq('id', userId)
        .maybeSingle()

      if (profileErr) {
        console.error('❌ Error obteniendo perfil:', profileErr)
        return
      }

      if (!profile) {
        console.log('⚠️ No se encontró perfil para:', userId)
        // Si no hay perfil, asignamos rol por defecto para no romper el flujo
        setRole('client')
        return
      }

      const profileAny = profile as any
      const userRole = profileAny?.role || 'client'
      setRole(userRole)

      if (profileAny?.tenant_id) {
        setTenantId(profileAny.tenant_id)
      }

      if (userRole === 'client') {
        const { data: client, error: clientErr } = await supabase
          .from('clients')
          .select('id, tenant_id')
          .eq('auth_user_id', userId)
          .maybeSingle()

        if (clientErr) {
          console.error('❌ Error obteniendo cliente:', clientErr)
        }

        if (client) {
          const clientAny = client as any
          setClientId(clientAny.id)
          if (clientAny.tenant_id) {
            setTenantId(clientAny.tenant_id)
          }

          const { data: wallet } = await supabase
            .from('loyalty_wallets')
            .select('glow_points, hair_points')
            .eq('client_id', clientAny.id)
            .maybeSingle()

          if (wallet) {
            const walletAny = wallet as any
            setPoints((walletAny.glow_points || 0) + (walletAny.hair_points || 0))
          }
        }
      }

    } catch (error) {
      console.error('❌ Error en fetchUserDataAndRole:', error)
    }
  }

  // ============================================================
  // 2. OBTENER TENANT DE EMERGENCIA
  // ============================================================
  const getEmergencyTenantId = async (): Promise<string | null> => {
    if (tenantId) return tenantId
    if (!user?.id) return null

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .maybeSingle()

      if (error) {
        console.error('❌ Error obteniendo tenant de emergencia:', error)
        return null
      }

      if (data) {
        const dataAny = data as any
        if (dataAny.tenant_id) {
          setTenantId(dataAny.tenant_id)
          return dataAny.tenant_id
        }
      }

      return null
    } catch (error) {
      console.error('❌ Error en getEmergencyTenantId:', error)
      return null
    }
  }

  // ============================================================
  // 3. LIMPIAR ESTADO
  // ============================================================
  const clearAuthState = () => {
    console.log('🧹 Limpiando estado de autenticación')
    setUser(null)
    setRole(null)
    setClientId(null)
    setTenantId(null)
    setPoints(null)
    lastFetchedUserId.current = null
    hasRedirected.current = false // Liberamos el candado de redirección
  }

  // ============================================================
  // 4. INICIALIZAR AUTENTICACIÓN
  // ============================================================
  useEffect(() => {
    isMountedRef.current = true

    const initializeAuth = async () => {
      console.log('🚀 Inicializando autenticación...')

      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('❌ Error obteniendo sesión:', error)
          setLoading(false)
          return
        }

        if (session?.user) {
          console.log('✅ Sesión restaurada para:', session.user.email)
          if (isMountedRef.current) {
            setUser(session.user)
            await fetchUserDataAndRole(session.user.id)
          }
        } else {
          console.log('⚠️ No hay sesión activa al iniciar')
          hasRedirected.current = false
        }

      } catch (err) {
        console.error('❌ Error en initializeAuth:', err)
      } center: {
        if (isMountedRef.current) {
          setLoading(false)
        }
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔔 Evento de autenticación:', event)

      if (!isMountedRef.current) return

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          setUser(session.user)
          await fetchUserDataAndRole(session.user.id)
        }
        setLoading(false)
      }

      if (event === 'SIGNED_OUT') {
        clearAuthState()
        setLoading(false)
      }

      if (event === 'INITIAL_SESSION' && session?.user) {
        setUser(session.user)
        await fetchUserDataAndRole(session.user.id)
        setLoading(false)
      }
    })

    return () => {
      isMountedRef.current = false
      subscription.unsubscribe()
    }
  }, [])

  // ============================================================
  // 5. REDIRECCIÓN CONTROLADA
  // ============================================================
  useEffect(() => {
    if (loading || !user || role === null) return

    if (hasRedirected.current) {
      console.log('⏭️ Redirección omitida (ya se ejecutó una en este ciclo)')
      return
    }

    console.log('🚀 Redirigiendo de forma reactiva con rol:', role)
    hasRedirected.current = true

    const targetPath = (role === 'admin' || role === 'owner' || role === 'staff') 
      ? '/dashboard' 
      : '/portal'

    router.replace(targetPath)
  }, [user, role, loading, router])

  // ============================================================
  // 6. REFRESCAR DATOS DEL USUARIO
  // ============================================================
  const refreshUserData = async () => {
    if (user?.id) {
      lastFetchedUserId.current = null
      hasRedirected.current = false 
      await fetchUserDataAndRole(user.id)
    }
  }

  // ============================================================
  // 7. INICIAR SESIÓN (Retorna datos completos para la vista)
  // ============================================================
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      hasRedirected.current = false // Resetear candado ante un nuevo intento manual
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password.trim()
      })

      if (error) {
        setLoading(false)
        return { data: null, error }
      }

      if (data.user) {
        setUser(data.user)
        await fetchUserDataAndRole(data.user.id)
      }

      setLoading(false)
      return { data, error: null }

    } catch (err: any) {
      setLoading(false)
      return { data: null, error: err }
    }
  }

  // ============================================================
  // 8. REGISTRAR USUARIO
  // ============================================================
  const signUp = async (email: string, password: string, fullName: string, phone?: string, referralCode?: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password.trim(),
        options: {
          data: {
            full_name: fullName,
            phone,
            referral_code: referralCode
          }
        }
      })

      if (error) {
        setLoading(false)
        return { data: null, error }
      }

      setLoading(false)
      return { data, error: null }

    } catch (err: any) {
      setLoading(false)
      return { data: null, error: err }
    }
  }

  // ============================================================
  // 9. CERRAR SESIÓN
  // ============================================================
  const signOut = async () => {
    try {
      setLoading(true)
      await supabase.auth.signOut()
      if (typeof window !== 'undefined') {
        localStorage.removeItem('freshnails-auth-token')
      }
      clearAuthState()
      router.push('/login')
    } catch (err) {
      console.error('❌ Error en signOut:', err)
    } finally {
      setLoading(false)
    }
  }

  const value = {
    user,
    role,
    clientId,
    tenantId,
    points,
    loading,
    signIn,
    signUp,
    signOut,
    refreshUserData,
    getEmergencyTenantId
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return context
}
