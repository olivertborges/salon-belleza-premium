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

  // 📝 ESTADO DE LOGS VISUALES PARA EL TELÉFONO
  const [screenLogs, setScreenLogs] = useState<string[]>([])

  const hasRedirected = useRef(false)
  const lastFetchedUserId = useRef<string | null>(null)
  const isMountedRef = useRef(true)

  // Función auxiliar para mandar logs a la consola Y a la pantalla
  const logTrace = (message: string) => {
    console.log(message)
    const timestamp = new Date().toLocaleTimeString()
    setScreenLogs((prev) => [...prev, `[${timestamp}] ${message}`].slice(-15)) // Guarda los últimos 15 logs
  }

  // ============================================================
  // 1. OBTENER PERFIL DEL USUARIO
  // ============================================================
  const fetchUserDataAndRole = async (userId: string) => {
    if (!userId) return

    if (lastFetchedUserId.current === userId && role !== null) {
      logTrace('ℹ️ [Perfil] Datos ya cargados en este ciclo. Saltando.')
      return
    }

    try {
      logTrace(`📡 [Perfil] Consultando tabla "profiles" para ID: ${userId.substring(0, 6)}...`)
      lastFetchedUserId.current = userId

      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('role, tenant_id')
        .eq('id', userId)
        .maybeSingle()

      if (profileErr) {
        logTrace(`❌ [Perfil] Error en Supabase profiles: ${profileErr.message}`)
        return
      }

      if (!profile) {
        logTrace('⚠️ [Perfil] Fila vacía. Asignando rol por defecto "client".')
        setRole('client')
        return
      }

      const profileAny = profile as any
      const userRole = profileAny?.role || 'client'
      logTrace(`✅ [Perfil] Rol encontrado: "${userRole}"`)
      setRole(userRole)

      if (profileAny?.tenant_id) {
        setTenantId(profileAny.tenant_id)
      }

      if (userRole === 'client') {
        logTrace('📡 [Perfil] Es cliente. Buscando en tabla "clients"...')
        const { data: client, error: clientErr } = await supabase
          .from('clients')
          .select('id, tenant_id')
          .eq('auth_user_id', userId)
          .maybeSingle()

        if (clientErr) {
          logTrace(`❌ [Perfil] Error en tabla clients: ${clientErr.message}`)
        }

        if (client) {
          const clientAny = client as any
          setClientId(clientAny.id)
          if (clientAny.tenant_id) {
            setTenantId(clientAny.tenant_id)
          }

          logTrace('📡 [Perfil] Consultando billetera "loyalty_wallets"...')
          const { data: wallet } = await supabase
            .from('loyalty_wallets')
            .select('glow_points, hair_points')
            .eq('client_id', clientAny.id)
            .maybeSingle()

          if (wallet) {
            const walletAny = wallet as any
            setPoints((walletAny.glow_points || 0) + (walletAny.hair_points || 0))
            logTrace('✅ [Perfil] Puntos cargados exitosamente.')
          }
        }
      }

    } catch (error: any) {
      logTrace(`💥 [Perfil] Crash en fetchUserDataAndRole: ${error.message || error}`)
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

      if (error) return null
      if (data) {
        const dataAny = data as any
        if (dataAny.tenant_id) {
          setTenantId(dataAny.tenant_id)
          return dataAny.tenant_id
        }
      }
      return null
    } catch (error) {
      return null
    }
  }

  // ============================================================
  // 3. LIMPIAR ESTADO
  // ============================================================
  const clearAuthState = () => {
    logTrace('🧹 [Auth] Limpiando estados locales por cierre de sesión.')
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
      logTrace('🚀 [Init] Comprobando si hay sesión activa en cookies/storage...')
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          logTrace(`❌ [Init] Error obteniendo sesión inicial: ${error.message}`)
          setLoading(false)
          return
        }

        if (session?.user) {
          logTrace(`✅ [Init] Sesión activa detectada para: ${session.user.email}`)
          if (isMountedRef.current) {
            setUser(session.user)
            await fetchUserDataAndRole(session.user.id)
          }
        } else {
          logTrace('⚠️ [Init] Ninguna sesión guardada en el dispositivo.')
          hasRedirected.current = false
        }
      } catch (err: any) {
        logTrace(`❌ [Init] Excepción crítica: ${err.message}`)
      } finally {
        if (isMountedRef.current) {
          setLoading(false)
          logTrace('🔓 [Init] Fin de carga inicial (loading = false)')
        }
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      logTrace(`🔔 [Event] onAuthStateChange gatillado: ${event}`)

      if (!isMountedRef.current) return

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          logTrace(`👤 [Event] Usuario conectado: ${session.user.email}`)
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
        logTrace('🔄 [Event] Sesión inicial asentada.')
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
    logTrace(`🔍 [Redirect Eval] loading: ${loading} | user: ${!!user} | role: ${role} | yaRedirigio: ${hasRedirected.current}`)

    if (loading) return
    if (!user) return
    if (role === null) {
      logTrace('⏳ [Redirect Eval] Esperando que termine de cargar el Rol...')
      return
    }

    if (hasRedirected.current) {
      logTrace('⏭️ [Redirect Eval] Omitido: Ya se procesó una redirección.')
      return
    }

    logTrace(`🚀 [Redirect Act] ¡Llamando a router.replace! Rol: ${role}`)
    hasRedirected.current = true

    const destino = (role === 'admin' || role === 'owner' || role === 'staff') 
      ? '/dashboard' 
      : '/portal'

    logTrace(`➡️ [Redirect Act] Destino seleccionado: ${destino}`)
    router.replace(destino)
  }, [user, role, loading, router])

  // ============================================================
  // 6. REFRESCAR DATOS DEL USUARIO
  // ============================================================
  const refreshUserData = async () => {
    if (user?.id) {
      logTrace('🔄 Manual refresh requested.')
      lastFetchedUserId.current = null
      hasRedirected.current = false 
      await fetchUserDataAndRole(user.id)
    }
  }

  // ============================================================
  // 7. INICIAR SESIÓN (CON TRAZABILIDAD COMPLETA)
  // ============================================================
  const signIn = async (email: string, password: string) => {
    logTrace('🏁 [signIn] Click en el botón recibido!')
    try {
      setLoading(true)
      hasRedirected.current = false 
      
      const cleanEmail = email.trim().toLowerCase()
      logTrace(`📧 [signIn] Procesando login para: ${cleanEmail}`)
      logTrace('🛰️ [signIn] Despachando credenciales a Supabase (auth.signInWithPassword)...')

      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password.trim()
      })

      logTrace(`📥 [signIn] Supabase respondió. ¿Data? ${!!data} | ¿User? ${!!data?.user} | ¿Error? ${!!error}`)

      if (error) {
        logTrace(`❌ [signIn] Supabase rechazó accesos: ${error.message}`)
        setLoading(false)
        return { data: null, error }
      }

      if (data?.user) {
        logTrace(`✅ [signIn] Login correcto en Auth. ID: ${data.user.id.substring(0, 6)}`)
        setUser(data.user)
        
        logTrace('🔄 [signIn] Extrayendo base de perfiles...')
        await fetchUserDataAndRole(data.user.id)
        logTrace('🎉 [signIn] Flujo de datos completado en el Contexto.')
      }

      setLoading(false)
      logTrace('🏁 [signIn] Promesa terminada exitosamente.')
      return { data, error: null }

    } catch (err: any) {
      logTrace(`💥 [signIn] EXCEPCIÓN CRÍTICA: ${err.message || err}`)
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
      logTrace(`📝 [signUp] Registrando: ${email}`)
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password.trim(),
        options: { data: { full_name: fullName, phone, referral_code: referralCode } }
      })

      if (error) {
        logTrace(`❌ [signUp] Error: ${error.message}`)
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
      logTrace('🚪 [signOut] Solicitando cierre de sesión...')
      await supabase.auth.signOut()
      if (typeof window !== 'undefined') {
        localStorage.removeItem('freshnails-auth-token')
      }
      clearAuthState()
      router.push('/login')
    } catch (err) {
      logTrace('❌ [signOut] Error al salir.')
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
      
      {/* 🛠️ PANEL DE LOGS FLOTANTE PARA PANTALLA MÓVIL 🛠️ */}
      <div style={{
        position: 'fixed',
        bottom: '0',
        left: '0',
        right: '0',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        color: '#00ff00',
        fontFamily: 'monospace',
        fontSize: '11px',
        padding: '10px',
        maxHeight: '180px',
        overflowY: 'auto',
        zIndex: 99999,
        borderTop: '2px solid #00ff00',
        pointerEvents: 'none'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#fff', borderBottom: '1px solid #444' }}>
          📱 TERMINAL DE LOGS DE AUTENTICACIÓN (EN VIVO)
        </div>
        {screenLogs.map((log, i) => (
          <div key={i} style={{ marginBottom: '2px', wordBreak: 'break-all' }}>{log}</div>
        ))}
        {screenLogs.length === 0 && <div style={{ color: '#aaa' }}>Esperando interacciones o eventos...</div>}
      </div>
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
