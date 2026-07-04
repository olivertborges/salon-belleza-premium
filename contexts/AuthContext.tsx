'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'

interface AuthContextType {
  user: User | null
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
  const [clientId, setClientId] = useState<string | null>(null)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [points, setPoints] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchClientData = async (userId: string) => {
    try {
      console.log('🔍 [Auth] Buscando cliente para userId:', userId)

      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('id, points, tenant_id')
        .eq('auth_user_id', userId)
        .single()

      if (clientError) {
        console.error('❌ [Auth] Error al buscar cliente:', clientError)
        return
      }

      if (client) {
        console.log('✅ [Auth] Cliente encontrado:', client.id)
        console.log('💰 [Auth] Puntos:', client.points)
        setClientId(client.id)
        setPoints(client.points)

        if (client.tenant_id) {
          setTenantId(client.tenant_id)
          console.log('🏢 [Auth] Tenant ID:', client.tenant_id)
        }

        const { data: wallet, error: walletError } = await supabase
          .from('loyalty_wallets')
          .select('glow_points, hair_points')
          .eq('client_id', client.id)
          .maybeSingle()

        if (!walletError && wallet) {
          const totalPuntos = (wallet.glow_points || 0) + (wallet.hair_points || 0)
          setPoints(totalPuntos)
          console.log('💎 [Auth] Puntos wallet:', totalPuntos)
        }
      } else {
        console.log('⚠️ [Auth] No se encontró cliente para este usuario')
      }
    } catch (error) {
      console.error('❌ [Auth] Error en fetchClientData:', error)
    }
  }

  const refreshUserData = async () => {
    if (user?.id) {
      await fetchClientData(user.id)
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user ?? null
      setUser(user)
      if (user) {
        fetchClientData(user.id)
      }
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      const user = session?.user ?? null
      setUser(user)

      if (user) {
        await fetchClientData(user.id)
      } else {
        setClientId(null)
        setTenantId(null)
        setPoints(null)
      }

      setLoading(false)
    })

    return () => listener?.subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password.trim()
      })

      if (error) return { error }

      if (data.user) {
        setUser(data.user)
        await fetchClientData(data.user.id)
      }

      return { error: null }
    } catch (err: any) {
      return { error: err }
    }
  }

  // signUp SOLO PARA CUANDO NO SE USA LA API
  const signUp = async (email: string, password: string, fullName: string, phone?: string, referralCode?: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password.trim(),
        options: {
          data: {
            full_name: fullName,
            phone: phone || '',
            referral_code: referralCode || null,
          },
        },
      })

      if (error) return { data: null, error }

      if (data.user) {
        setUser(data.user)
        await new Promise(resolve => setTimeout(resolve, 2000))
        await fetchClientData(data.user.id)
      }

      return { data, error: null }
    } catch (err: any) {
      return { data: null, error: err }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setClientId(null)
    setTenantId(null)
    setPoints(null)
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      clientId, 
      tenantId,
      points, 
      loading, 
      signIn, 
      signUp, 
      signOut,
      refreshUserData
    }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return context
}
