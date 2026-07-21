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
  signIn: (email: string, password: string) => Promise<{ error: any }>
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
        return
      }

      const userRole = profile?.role || 'client'
      setRole(userRole)

      if (profile?.tenant_id) {
        setTenantId(profile.tenant_id)
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
          setClientId(client.id)
          if (client.tenant_id) {
            setTenantId(client.tenant_id)
          }

          const { data: wallet } = await supabase
            .from('loyalty_wallets')
            .select('glow_points, hair_points')
            .eq('client_id', client.id)
            .maybeSingle()

          if (wallet) {
            setPoints((wallet.glow_points || 0) + (wallet.hair_points || 0))
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

      if (data?.tenant_id) {
        setTenantId(data.tenant_id)
        return data.tenant_id
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
        }

      } catch (err) {
        console.error('❌ Error en initializeAuth:', err)
      } finally {
        if (isMountedRef.current) {
          console.log('✅ Autenticación inicializada, loading:', false)
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
          console.log('👤 Usuario autenticado:', session.user.email)
          setUser(session.user)
          await fetchUserDataAndRole(session.user.id)
        }
        setLoading(false)
      }

      if (event === 'SIGNED_OUT') {
        console.log('🚪 Usuario cerró sesión')
        clearAuthState()
        setLoading(false)
      }

      if (event === 'INITIAL_SESSION') {
        console.log('🔄 Sesión inicial restaurada')
        if (session?.user) {
          setUser(session.user)
          await fetchUserDataAndRole(session.user.id)
        }
        setLoading(false)
      }
    })

    return () => {
      isMountedRef.current = false
      subscription.unsubscribe()
    }
  }, [])

  // ============================================================
  // 5. REFRESCAR DATOS DEL USUARIO
  // ============================================================
  const refreshUserData = async () => {
    if (user?.id) {
      console.log('🔄 Refrescando datos del usuario...')
      lastFetchedUserId.current = null
      await fetchUserDataAndRole(user.id)
    }
  }

  // ============================================================
  // 6. INICIAR SESIÓN
  // ============================================================
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      console.log('🔐 Iniciando sesión:', email)

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password.trim()
      })

      if (error) {
        console.error('❌ Error en signIn:', error)
        setLoading(false)
        return { error }
      }

      if (data.user) {
        console.log('✅ Usuario logueado:', data.user.email)
        setUser(data.user)
        await fetchUserDataAndRole(data.user.id)
      }

      setLoading(false)
      return { error: null }

    } catch (err: any) {
      console.error('❌ Error en signIn:', err)
      setLoading(false)
      return { error: err }
    }
  }

  // ============================================================
  // 7. REGISTRAR USUARIO
  // ============================================================
  const signUp = async (email: string, password: string, fullName: string, phone?: string, referralCode?: string) => {
    try {
      setLoading(true)
      console.log('📝 Registrando usuario:', email)

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
        console.error('❌ Error en signUp:', error)
        setLoading(false)
        return { data: null, error }
      }

      console.log('✅ Usuario registrado:', data.user?.email)
      setLoading(false)
      return { data, error: null }

    } catch (err: any) {
      console.error('❌ Error en signUp:', err)
      setLoading(false)
      return { data: null, error: err }
    }
  }

  // ============================================================
  // 8. CERRAR SESIÓN
  // ============================================================
  const signOut = async () => {
    try {
      setLoading(true)
      console.log('🚪 Cerrando sesión...')

      await supabase.auth.signOut()

      if (typeof window !== 'undefined') {
        localStorage.removeItem('freshnails-auth-token')
      }

      clearAuthState()
      console.log('✅ Sesión cerrada correctamente')
      router.push('/login')

    } catch (err) {
      console.error('❌ Error en signOut:', err)
    } finally {
      setLoading(false)
    }
  }

  // ============================================================
  // 9. PROVIDER
  // ============================================================
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