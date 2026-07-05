'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'

interface AuthContextType {
  user: User | null
  role: string | null         // 👈 Agregado: para controlar accesos en Front
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
  const [role, setRole] = useState<string | null>(null) // 👈 Estado del rol
  const [clientId, setClientId] = useState<string | null>(null)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [points, setPoints] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUserDataAndRole = async (userId: string) => {
    try {
      console.log('🔍 [Auth] Buscando perfil en la DB para:', userId)

      // 1. Primero averiguamos el rol real desde la tabla profiles (igual que el middleware)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle()

      if (profileError) {
        console.error('❌ [Auth] Error al buscar perfil/rol:', profileError)
      }

      const userRole = profile?.role || 'client'
      setRole(userRole)
      console.log('🎭 [Auth] Rol asignado en Frontend:', userRole)

      // 2. Si es cliente, procedemos a buscar sus puntos y billeteras de lealtad
      // Si es admin, omitimos este paso para evitar errores en las consultas
      if (userRole === 'client' || !['admin', 'staff', 'owner'].includes(userRole)) {
        const { data: client, error: clientError } = await supabase
          .from('clients')
          .select('id, points, tenant_id')
          .eq('auth_user_id', userId)
          .maybeSingle()

        if (clientError) {
          console.error('❌ [Auth] Error al buscar cliente:', clientError)
          return
        }

        if (client) {
          console.log('✅ [Auth] Datos de cliente cargados:', client.id)
          setClientId(client.id)
          setPoints(client.points)

          if (client.tenant_id) setTenantId(client.tenant_id)

          // Cargar wallet
          const { data: wallet, error: walletError } = await supabase
            .from('loyalty_wallets')
            .select('glow_points, hair_points')
            .eq('client_id', client.id)
            .maybeSingle()

          if (!walletError && wallet) {
            const totalPuntos = (wallet.glow_points || 0) + (wallet.hair_points || 0)
            setPoints(totalPuntos)
          }
        }
      } else {
        // Es Admin / Staff -> No tiene tabla de cliente, limpiamos estados de cliente
        setClientId(null)
        setPoints(null)
      }

    } catch (error) {
      console.error('❌ [Auth] Error crítico en fetchUserDataAndRole:', error)
    }
  }

  const refreshUserData = async () => {
    if (user?.id) {
      await fetchUserDataAndRole(user.id)
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      if (currentUser) {
        await fetchUserDataAndRole(currentUser.id)
      }
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)

      if (currentUser) {
        await fetchUserDataAndRole(currentUser.id)
      } else {
        setRole(null)
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
        await fetchUserDataAndRole(data.user.id)
      }

      return { data, error: null }
    } catch (err: any) {
      return { data: null, error: err }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setRole(null)
    setClientId(null)
    setTenantId(null)
    setPoints(null)
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      role, // 👈 Expuesto para que tus layouts puedan leerlo
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
