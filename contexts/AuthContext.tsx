'use client'

import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'

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
  // AÑADIDO: Método para rescate de emergencia del tenant
  getEmergencyTenantId: () => Promise<string | null> 
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [clientId, setClientId] = useState<string | null>(null)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [points, setPoints] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  // Evita llamadas concurrentes idénticas a la base de datos para el mismo userId
  const lastFetchedUserId = useRef<string | null>(null)

  const fetchUserDataAndRole = async (userId: string) => {
    if (!userId) return
    if (lastFetchedUserId.current === userId && role !== null) {
      return
    }

    try {
      lastFetchedUserId.current = userId

      // 1. Obtenemos el rol y el tenant_id directo desde el perfil del usuario
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('role, tenant_id')
        .eq('id', userId)
        .maybeSingle()

      if (profileErr) throw profileErr

      const userRole = profile?.role || 'client'
      setRole(userRole)

      // 2. Si es administrador/staff, asignamos su tenant
      if (profile?.tenant_id) {
        setTenantId(profile.tenant_id)
      }

      // 3. Si es cliente, buscamos sus datos adicionales en la tabla relacional
      if (userRole === 'client') {
        const { data: client, error: clientErr } = await supabase
          .from('clients')
          .select('id, tenant_id')
          .eq('auth_user_id', userId)
          .maybeSingle()

        if (clientErr) throw clientErr

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
      console.error('Error cargando datos de usuario:', error)
    }
  }

  // AÑADIDO: Lógica de rescate de emergencia para evitar nulos en inserciones
  const getEmergencyTenantId = async (): Promise<string | null> => {
    if (tenantId) return tenantId
    if (!user?.id) return null
    const { data } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).maybeSingle()
    if (data?.tenant_id) {
      setTenantId(data.tenant_id)
      return data.tenant_id
    }
    return null
  }

  // Función de limpieza de estado
  const clearAuthState = () => {
    setUser(null)
    setRole(null)
    setClientId(null)
    setTenantId(null)
    setPoints(null)
    lastFetchedUserId.current = null
  }

  useEffect(() => {
    let isMounted = true

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user && isMounted) {
          setUser(session.user)
          await fetchUserDataAndRole(session.user.id)
        }
      } catch (err) {
        console.error('Error en inicialización de autenticación:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return

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
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const refreshUserData = async () => {
    if (user?.id) {
      lastFetchedUserId.current = null
      await fetchUserDataAndRole(user.id)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password.trim()
      })

      if (error) {
        setLoading(false)
        return { error }
      }
      return { error: null }
    } catch (err: any) {
      setLoading(false)
      return { error: err }
    }
  }

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

      return { data, error: null }
    } catch (err: any) {
      setLoading(false)
      return { data: null, error: err }
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      await supabase.auth.signOut()
      if (typeof window !== 'undefined') {
        localStorage.removeItem('freshnails-auth-token')
      }
      clearAuthState()
    } catch (err) {
      console.error('Error cerrando sesión:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider value={{ user, role, clientId, tenantId, points, loading, signIn, signUp, signOut, refreshUserData, getEmergencyTenantId }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return context
}
