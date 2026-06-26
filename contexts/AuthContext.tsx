'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
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
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  // ⚡ CORRECCIÓN: Permitir 'staff' en el estado inicial del State
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

    const safetyTimeout = setTimeout(() => {
      if (isMounted && loading) {
        console.warn('AuthContext: Supabase tardó demasiado. Forzando desbloqueo.')
        setLoading(false)
      }
    }, 2500)

    const initializeAuth = async () => {
      try {
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
          clearTimeout(safetyTimeout)
        }
      }
    }

    initializeAuth()

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!isMounted) return

      // Pone el cargando en true para congelar layouts mientras cambiamos de sesión
      setLoading(true)

      if (event === 'SIGNED_OUT') {
        setSession(null)
        setUser(null)
        setRole(null)
        setTenantId(null)
        setLoading(false)
        return
      }

      setSession(currentSession)
      setUser(currentSession?.user ?? null)

      if (currentSession?.user) {
        // ⚡ ASINCRONÍA REPARADA: Esperamos a que la base de datos traiga el rol
        await fetchUserRole(currentSession.user.id)
      } else {
        setRole('client')
      }
      
      // Apagamos el loading solo cuando el rol ya esté inyectado en el estado
      setLoading(false)
    })

    return () => {
      isMounted = false
      clearTimeout(safetyTimeout)
      listener?.subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setRole(null)
    setTenantId(null)
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
