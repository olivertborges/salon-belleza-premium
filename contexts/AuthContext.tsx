'use client'

import { createContext, useContext, useEffect, useState } from 'react'
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [clientId, setClientId] = useState<string | null>(null)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [points, setPoints] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUserDataAndRole = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle()

      const userRole = profile?.role || 'client'
      setRole(userRole)

      if (userRole === 'client') {
        const { data: client } = await supabase
          .from('clients')
          .select('id, tenant_id')
          .eq('auth_user_id', userId)
          .maybeSingle()

        if (client) {
          setClientId(client.id)
          if (client.tenant_id) setTenantId(client.tenant_id)

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

  useEffect(() => {
    const checkPersistedSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          setUser(session.user)
          await fetchUserDataAndRole(session.user.id)
        }
      } catch (err) {
        console.error('Error verificando sesión inicial:', err)
      } finally {
        setLoading(false)
      }
    }

    checkPersistedSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user)
        await fetchUserDataAndRole(session.user.id)
      } else {
        setUser(null)
        setRole(null)
        setClientId(null)
        setTenantId(null)
        setPoints(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const refreshUserData = async () => {
    if (user?.id) await fetchUserDataAndRole(user.id)
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password.trim()
      })

      if (error) return { error }

      // FORZADO DE ESCRITURA: Si la autenticación fue correcta, obligamos al SDK 
      // a escribir manualmente la sesión en el almacenamiento para asegurar persistencia instantánea.
      if (data?.session && typeof window !== 'undefined') {
        localStorage.setItem('freshnails-auth-token', JSON.stringify(data.session))
        setUser(data.user)
        await fetchUserDataAndRole(data.user.id)
      }

      return { error: null }
    } catch (err: any) {
      return { error: err }
    }
  }

  const signUp = async (email: string, password: string, fullName: string, phone?: string, referralCode?: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password.trim(),
        options: { data: { full_name: fullName, phone, referral_code: referralCode } }
      })

      if (error) return { data: null, error }

      if (data?.session && typeof window !== 'undefined') {
        localStorage.setItem('freshnails-auth-token', JSON.stringify(data.session))
        setUser(data.user)
        await fetchUserDataAndRole(data.user.id)
      }

      return { data, error: null }
    } catch (err: any) {
      return { data: null, error: err }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    if (typeof window !== 'undefined') {
      localStorage.removeItem('freshnails-auth-token')
    }
    setUser(null)
    setRole(null)
    setClientId(null)
    setTenantId(null)
    setPoints(null)
  }

  return (
    <AuthContext.Provider value={{ user, role, clientId, tenantId, points, loading, signIn, signUp, signOut, refreshUserData }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return context
}
