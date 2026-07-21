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
  const [authInitialized, setAuthInitialized] = useState(false)

  const lastFetchedUserId = useRef<string | null>(null)
  const isMountedRef = useRef(true)
  const authCheckDone = useRef(false)

  // ============================================================
  // 1. OBTENER PERFIL DEL USUARIO (MEJORADO)
  // ============================================================
  const fetchUserDataAndRole = async (userId: string) => {
    if (!userId) return

    // Si ya tenemos el rol y es el mismo usuario, no hacer nada
    if (lastFetchedUserId.current === userId && role !== null) {
      console.log('ℹ️ [Perfil] Datos ya cargados, saltando.')
      return
    }

    try {
      console.log(`📡 [Perfil] Consultando perfil para: ${userId.substring(0, 6)}...`)
      lastFetchedUserId.current = userId

      // 🔥 OBTENER ROL DIRECTO DE LA DB
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('role, tenant_id')
        .eq('id', userId)
        .maybeSingle()

      if (profileErr) {
        console.error(`❌ [Perfil] Error: ${profileErr.message}`)
        // Si hay error, asignar rol por defecto
        setRole('client')
        return
      }

      if (!profile) {
        console.log('⚠️ [Perfil] Sin perfil, asignando "client"')
        setRole('client')
        return
      }

      const userRole = profile?.role || 'client'
      console.log(`✅ [Perfil] Rol encontrado: "${userRole}"`)
      setRole(userRole)

      if (profile?.tenant_id) {
        setTenantId(profile.tenant_id)
      }

      // Si es cliente, obtener datos adicionales
      if (userRole === 'client') {
        console.log('📡 [Perfil] Obteniendo datos de cliente...')
        
        const { data: client, error: clientErr } = await supabase
          .from('clients')
          .select('id, tenant_id')
          .eq('auth_user_id', userId)
          .maybeSingle()

        if (clientErr) {
          console.error(`❌ [Perfil] Error en clients: ${clientErr.message}`)
        }

        if (client) {
          setClientId(client.id)
          if (client.tenant_id) {
            setTenantId(client.tenant_id)
          }

          // Obtener puntos
          const { data: wallet } = await supabase
            .from('loyalty_wallets')
            .select('glow_points, hair_points')
            .eq('client_id', client.id)
            .maybeSingle()

          if (wallet) {
            setPoints((wallet.glow_points || 0) + (wallet.hair_points || 0))
            console.log('✅ [Perfil] Puntos cargados')
          }
        }
      }

      // Marcar que la autenticación está inicializada
      setAuthInitialized(true)

    } catch (error: any) {
      console.error(`💥 [Perfil] Error: ${error.message || error}`)
      // En caso de error, asignar rol por defecto
      setRole('client')
      setAuthInitialized(true)
    }
  }

  // ============================================================
  // 2. LIMPIAR ESTADO
  // ============================================================
  const clearAuthState = () => {
    console.log('🧹 [Auth] Limpiando estado')
    setUser(null)
    setRole(null)
    setClientId(null)
    setTenantId(null)
    setPoints(null)
    setAuthInitialized(false)
    lastFetchedUserId.current = null
    authCheckDone.current = false
  }

  // ============================================================
  // 3. INICIALIZAR AUTENTICACIÓN (MEJORADO)
  // ============================================================
  useEffect(() => {
    isMountedRef.current = true

    const initializeAuth = async () => {
      // Si ya se hizo la verificación, no repetir
      if (authCheckDone.current) {
        console.log('⏭️ Auth ya verificado, saltando...')
        return
      }

      console.log('🚀 [Init] Inicializando autenticación...')
      
      try {
        // Obtener sesión
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error(`❌ [Init] Error: ${error.message}`)
          setLoading(false)
          setAuthInitialized(true)
          authCheckDone.current = true
          return
        }

        if (session?.user) {
          console.log(`✅ [Init] Sesión activa: ${session.user.email}`)
          setUser(session.user)
          
          // 🔥 IMPORTANTE: Cargar el rol INMEDIATAMENTE
          await fetchUserDataAndRole(session.user.id)
        } else {
          console.log('⚠️ [Init] Sin sesión activa')
        }
      } catch (err: any) {
        console.error(`❌ [Init] Error: ${err.message}`)
      } finally {
        if (isMountedRef.current) {
          setLoading(false)
          setAuthInitialized(true)
          authCheckDone.current = true
          console.log('🔓 [Init] Inicialización completada')
        }
      }
    }

    initializeAuth()

    // Suscripción a cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`🔔 [Event] ${event}`)

      if (!isMountedRef.current) return

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          console.log(`👤 [Event] Usuario: ${session.user.email}`)
          setUser(session.user)
          await fetchUserDataAndRole(session.user.id)
        }
        setLoading(false)
        setAuthInitialized(true)
      }

      if (event === 'SIGNED_OUT') {
        clearAuthState()
        setLoading(false)
      }

      if (event === 'INITIAL_SESSION' && session?.user) {
        console.log('🔄 [Event] Sesión inicial')
        setUser(session.user)
        await fetchUserDataAndRole(session.user.id)
        setLoading(false)
        setAuthInitialized(true)
      }
    })

    return () => {
      isMountedRef.current = false
      subscription.unsubscribe()
    }
  }, [])

  // ============================================================
  // 4. REFRESCAR DATOS
  // ============================================================
  const refreshUserData = async () => {
    if (user?.id) {
      console.log('🔄 Refresh manual')
      lastFetchedUserId.current = null
      await fetchUserDataAndRole(user.id)
    }
  }

  // ============================================================
  // 5. INICIAR SESIÓN
  // ============================================================
  const signIn = async (email: string, password: string) => {
    console.log('🏁 [signIn] Iniciando login...')
    
    try {
      setLoading(true)
      authCheckDone.current = false

      const cleanEmail = email.trim().toLowerCase()
      console.log(`📧 [signIn] Email: ${cleanEmail}`)

      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password.trim()
      })

      if (error) {
        console.error(`❌ [signIn] Error: ${error.message}`)
        setLoading(false)
        return { data: null, error }
      }

      if (data?.user) {
        console.log(`✅ [signIn] Login exitoso: ${data.user.email}`)
        setUser(data.user)
        await fetchUserDataAndRole(data.user.id)
        console.log('🎉 [signIn] Datos cargados correctamente')
      }

      setLoading(false)
      return { data, error: null }

    } catch (err: any) {
      console.error(`💥 [signIn] Error: ${err.message}`)
      setLoading(false)
      return { data: null, error: err }
    }
  }

  // ============================================================
  // 6. REGISTRAR USUARIO
  // ============================================================
  const signUp = async (email: string, password: string, fullName: string, phone?: string, referralCode?: string) => {
    try {
      setLoading(true)
      console.log(`📝 [signUp] Registrando: ${email}`)
      
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
        console.error(`❌ [signUp] Error: ${error.message}`)
        setLoading(false)
        return { data: null, error }
      }

      console.log(`✅ [signUp] Registro exitoso`)
      setLoading(false)
      return { data, error: null }

    } catch (err: any) {
      console.error(`💥 [signUp] Error: ${err.message}`)
      setLoading(false)
      return { data: null, error: err }
    }
  }

  // ============================================================
  // 7. CERRAR SESIÓN
  // ============================================================
  const signOut = async () => {
    try {
      setLoading(true)
      console.log('🚪 [signOut] Cerrando sesión...')
      
      await supabase.auth.signOut()
      
      if (typeof window !== 'undefined') {
        localStorage.removeItem('freshnails-auth-token')
      }
      
      clearAuthState()
      router.push('/login')
      
    } catch (err) {
      console.error('❌ [signOut] Error:', err)
    } finally {
      setLoading(false)
    }
  }

  // ============================================================
  // 8. OBTENER TENANT
  // ============================================================
  const getEmergencyTenantId = async (): Promise<string | null> => {
    if (tenantId) return tenantId
    if (!user?.id) return null

    try {
      const { data } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .maybeSingle()

      if (data?.tenant_id) {
        setTenantId(data.tenant_id)
        return data.tenant_id
      }
      return null
    } catch (error) {
      return null
    }
  }

  const value = {
    user,
    role,
    clientId,
    tenantId,
    points,
    loading: loading || !authInitialized, // 🔥 IMPORTANTE: No terminar loading hasta que auth esté inicializado
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