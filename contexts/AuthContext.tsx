'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Session, User } from '@supabase/supabase-js'

interface AuthContextType {
  session: Session | null
  user: User | null
  role: 'client' | 'admin' | 'staff' | null 
  tenantId: string | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClientComponentClient()
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<'client' | 'admin' | 'staff' | null>(null)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role, tenant_id')
        .eq('id', userId)
        .single()

      if (!error && data) {
        setRole(data.role || 'client')
        setTenantId(data.tenant_id || null)
      } else {
        setRole('client')
      }
    } catch (error) {
      console.error('Error fetching role:', error)
      setRole('client')
    }
  }

  useEffect(() => {
    let isMounted = true

    const initializeAuth = async () => {
      try {
        // ✅ OBTENER SESIÓN GUARDADA
        const { data: { session } } = await supabase.auth.getSession()

        if (isMounted) {
          setSession(session)
          setUser(session?.user ?? null)

          if (session?.user) {
            await fetchUserRole(session.user.id)
          } else {
            setRole('client')
          }
        }
      } catch (error) {
        console.error('Error inicializando auth:', error)
        if (isMounted) setRole('client')
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // ✅ ESCUCHAR CAMBIOS DE AUTENTICACIÓN
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!isMounted) return

      console.log('🔄 Auth state changed:', event)

      if (event === 'SIGNED_OUT') {
        setSession(null)
        setUser(null)
        setRole(null)
        setTenantId(null)
        setLoading(false)
        return
      }

      if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN' || event === 'SIGNED_UP') {
        setSession(currentSession)
        setUser(currentSession?.user ?? null)

        if (currentSession?.user) {
          await fetchUserRole(currentSession.user.id)
        } else {
          setRole('client')
        }
        setLoading(false)
      }
    })

    return () => {
      isMounted = false
      listener?.subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ 
      email, 
      password 
    })
    if (error) throw error
    
    if (data.user) {
      await fetchUserRole(data.user.id)
      setUser(data.user)
      setSession(data.session)
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setRole(null)
    setTenantId(null)
    setUser(null)
    setSession(null)
  }

  return (
    <AuthContext.Provider value={{ session, user, role, tenantId, loading, signIn, signOut }}>
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
