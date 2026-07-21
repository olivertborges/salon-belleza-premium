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

  // Control de redirección e hilos para evitar bloqueos
  const hasRedirected = useRef(false)
  const lastFetchedUserId = useRef<string | null>(null)
  const isMountedRef = useRef(true)

  // ============================================================
  // 1. OBTENER PERFIL DEL USUARIO
  // ============================================================
  const fetchUserDataAndRole = async (userId: string) => {
    if (!userId) return

    if (lastFetchedUserId.current === userId && role !== null) {
      console.log('ℹ️ [fetchUserDataAndRole] Datos ya cargados previamente para este ID. Saltando.')
      return
    }

    try {
      console.log('📡 [fetchUserDataAndRole] Buscando perfil en la tabla "profiles" para ID:', userId)
      lastFetchedUserId.current = userId

      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('role, tenant_id')
        .eq('id', userId)
        .maybeSingle()

      if (profileErr) {
        console.error('❌ [fetchUserDataAndRole] Error al consultar la tabla profiles:', profileErr)
        return
      }

      if (!profile) {
        console.log('⚠️ [fetchUserDataAndRole] No se encontró fila en profiles. Asignando rol "client" por defecto.')
        setRole('client')
        return
      }

      const profileAny = profile as any
      const userRole = profileAny?.role || 'client'
      console.log('✅ [fetchUserDataAndRole] Rol detectado en base de datos:', userRole)
      setRole(userRole)

      if (profileAny?.tenant_id) {
        setTenantId(profileAny.tenant_id)
      }

      // Si es cliente, buscamos su billetera de puntos y su ID de cliente
      if (userRole === 'client') {
        console.log('📡 [fetchUserDataAndRole] Buscando datos en la tabla "clients"...')
        const { data: client, error: clientErr } = await supabase
          .from('clients')
          .select('id, tenant_id')
          .eq('auth_user_id', userId)
          .maybeSingle()

        if (clientErr) {
          console.error('❌ [fetchUserDataAndRole] Error consultando clients:', clientErr)
        }

        if (client) {
          const clientAny = client as any
          setClientId(clientAny.id)
          if (clientAny.tenant_id) {
            setTenantId(clientAny.tenant_id)
          }

          console.log('📡 [fetchUserDataAndRole] Buscando billetera de lealtad...')
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
      console.error('💥 [fetchUserDataAndRole] Excepción crítica obteniendo datos:', error)
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
    console.log('🧹 [clearAuthState] Limpiando todos los estados locales de autenticación')
    setUser(null)
    setRole(null)
    setClientId(null)
    setTenantId(null)
    setPoints(null)
    lastFetchedUserId.current = null
    hasRedirected.current = false
  }

  // ============================================================
  // 4. INICIALIZAR AUTENTICACIÓN
  // ============================================================
  useEffect(() => {
    isMountedRef.current = true

    const initializeAuth = async () => {
      console.log('🚀 [initializeAuth] Iniciando comprobación de sesión base...')
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('❌ [initializeAuth] Error de sesión inicial:', error)
          setLoading(false)
          return
        }

        if (session?.user) {
          console.log('✅ [initializeAuth] Sesión activa recuperada de cookies/storage:', session.user.email)
          if (isMountedRef.current) {
            setUser(session.user)
            await fetchUserDataAndRole(session.user.id)
          }
        } else {
          console.log('⚠️ [initializeAuth] Sin sesión activa al montar el proveedor.')
          hasRedirected.current = false
        }
      } catch (err) {
        console.error('❌ [initializeAuth] Error fatal:', err)
      } finally {
        if (isMountedRef.current) {
          setLoading(false)
          console.log('🔓 [initializeAuth] Estado de carga desactivado (loading = false)')
        }
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔔 [onAuthStateChange] Evento gatillado:', event)

      if (!isMountedRef.current) return

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          console.log('👤 [onAuthStateChange] Usuario detectado:', session.user.email)
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
        console.log('🔄 [onAuthStateChange] Sesión inicial asentada.')
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
  // 5. REDIRECCIÓN CONTROLADA REACTIVA
  // ============================================================
  useEffect(() => {
    console.log('🔍 [useEffect Redirección] Evaluando cambio de ruta...', { 
      loading, 
      tieneUser: !!user, 
      role, 
      yaRedirigio: hasRedirected.current 
    })

    if (loading) return
    if (!user) return
    if (role === null) {
      console.log('⏳ [useEffect Redirección] El usuario existe pero el rol aún no se procesa. Esperando...')
      return
    }

    if (hasRedirected.current) {
      console.log('⏭️ [useEffect Redirección] Bloqueo preventivo: ya se ejecutó redirección en esta sesión.')
      return
    }

    console.log('🚀 [useEffect Redirección] ¡Ejecutando router.replace! Rol final:', role)
    hasRedirected.current = true

    const destino = (role === 'admin' || role === 'owner' || role === 'staff') 
      ? '/dashboard' 
      : '/portal'

    console.log(`➡️ [useEffect Redirección] Desviando tráfico hacia: ${destino}`)
    router.replace(destino)
  }, [user, role, loading, router])

  // ============================================================
  // 6. REFRESCAR DATOS DEL USUARIO
  // ============================================================
  const refreshUserData = async () => {
    if (user?.id) {
      console.log('🔄 [refreshUserData] Forzando recarga manual de datos.')
      lastFetchedUserId.current = null
      hasRedirected.current = false 
      await fetchUserDataAndRole(user.id)
    }
  }

  // ============================================================
  // 7. INICIAR SESIÓN (CON TRAZABILIDAD COMPLETA)
  // ============================================================
  const signIn = async (email: string, password: string) => {
    console.log('🏁 [signIn] Iniciando función manual...')
    try {
      setLoading(true)
      hasRedirected.current = false // Rompemos el candado para permitir que el useEffect actúe al loguearse de nuevo
      
      const cleanEmail = email.trim().toLowerCase()
      console.log('📧 [signIn] Correo sanitizado:', cleanEmail)
      console.log('🛰️ [signIn] Enviando petición HTTP a Supabase auth.signInWithPassword...')

      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password.trim()
      })

      console.log('📥 [signIn] Respuesta cruda de Supabase recibida:', { 
        dataExistente: !!data, 
        usuarioExistente: !!data?.user, 
        errorExistente: !!error 
      })

      if (error) {
        console.error('❌ [signIn] Error devuelto por Supabase:', error.message)
        setLoading(false)
        return { data: null, error }
      }

      if (data?.user) {
        console.log('✅ [signIn] Autenticación básica exitosa. Guardando usuario:', data.user.email)
        setUser(data.user)
        
        console.log('🔄 [signIn] Extrayendo roles y perfil desde las tablas...')
        await fetchUserDataAndRole(data.user.id)
        console.log('🏁 [signIn] Perfil sincronizado correctamente en el contexto.')
      }

      setLoading(false)
      console.log('🎉 [signIn] Finalización completa de la promesa de inicio de sesión.')
      return { data, error: null }

    } catch (err: any) {
      console.error('💥 [signIn] CRASH TOTAL durante la ejecución de signIn:', err)
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
      console.log('📝 [signUp] Registrando nuevo usuario:', email)
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
        console.error('❌ [signUp] Error:', error.message)
        setLoading(false)
        return { data: null, error }
      }

      setLoading(false)
      return { data, error: null }

    } catch (err: any) {
      console.error('💥 [signUp] Excepción:', err)
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
      console.log('🚪 [signOut] Cerrando sesión de la app...')
      await supabase.auth.signOut()
      if (typeof window !== 'undefined') {
        localStorage.removeItem('freshnails-auth-token')
      }
      clearAuthState()
      console.log('✅ [signOut] Sesión eliminada con éxito. Redirigiendo a /login')
      router.push('/login')
    } catch (err) {
      console.error('❌ [signOut] Error fatal:', err)
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
