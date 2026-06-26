'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useAuth } from '@/hooks/useAuth'

export default function AuthMobilDefinitivo() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const { role, user, loading: authLoading } = useAuth()

  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'recover'>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && user && !authLoading && role !== null) {
      if (role === 'admin' || role === 'staff' || role === 'owner') {
        router.replace('/dashboard')
      } else {
        router.replace('/portal')
      }
    }
  }, [user, role, authLoading, router, mounted])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      if (activeTab === 'recover') {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        })
        if (resetError) throw resetError
        setSuccess('Enlace de recuperación enviado con éxito.')
        setLoading(false)
        return
      }

      if (activeTab === 'login') {
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (loginError) {
          throw new Error(loginError.message === 'Invalid login credentials' ? 'Correo o contraseña incorrectos.' : loginError.message)
        }

        setSuccess('¡Ingreso correcto! Sincronizando...')
        router.refresh()
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: { name, phone, role: 'client' },
          },
        })

        if (signUpError) throw signUpError

        setSuccess('Cuenta creada con éxito. Entrando...')
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado.')
      setLoading(false)
    }
  }

  if (!mounted) return null

  return (
    <div className="w-full min-h-screen bg-[#fcfbfa] dark:bg-[#0a0908] flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-amber-500 selection:text-black transition-colors duration-300">
      {/* Glow ambiental adaptativo */}
      <div className="absolute w-[500px] h-[500px] bg-amber-500/[0.04] dark:bg-amber-500/[0.02] blur-[130px] rounded-full pointer-events-none top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      
      {/* Contenedor de la Tarjeta Adaptable */}
      <div className="w-full max-w-md bg-white dark:bg-[#141211] border border-stone-200 dark:border-stone-800/60 rounded-[24px] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.05)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.85)] transition-all duration-300">
        
        {activeTab === 'login' && (
          <div>
            <div className="text-center mb-8">
              <span className="text-[9px] font-mono tracking-[0.3em] text-amber-600 dark:text-amber-500/80 font-bold uppercase">MEMBER PORTAL</span>
              <h2 className="text-3xl font-light text-stone-900 dark:text-white tracking-tight mt-1">Te damos la bienvenida</h2>
            </div>

            {error && <div className="mb-4 p-3 bg-rose-500/5 border border-rose-500/10 text-rose-600 dark:text-rose-400 text-xs rounded-xl font-mono text-center">{error}</div>}
            {success && <div className="mb-4 p-3 bg-emerald-500/5 border border-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs rounded-xl font-mono text-center">{success}</div>}

            <form onSubmit={handleAuth} className="space-y-6">
              <div className="relative border-b border-stone-200 dark:border-stone-800 focus-within:border-amber-500 dark:focus-within:border-amber-500 transition-colors duration-300 py-1">
                <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400 dark:text-stone-500 block">Email de Acceso</span>
                <input
                  type="email"
                  placeholder="ejemplo@salon.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent pt-2 pb-1 text-sm text-stone-900 dark:text-white focus:outline-none placeholder-stone-300 dark:placeholder-stone-700"
                  required
                />
              </div>

              <div className="relative border-b border-stone-200 dark:border-stone-800 focus-within:border-amber-500 dark:focus-within:border-amber-500 transition-colors duration-300 py-1">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400 dark:text-stone-500">Contraseña</span>
                  <button 
                    type="button" 
                    onClick={() => { setActiveTab('recover'); setError(''); setSuccess(''); }}
                    className="text-[10px] font-mono text-amber-600 dark:text-amber-500/60 hover:text-amber-500 dark:hover:text-amber-400 uppercase tracking-wider transition-colors focus:outline-none"
                  >
                    ¿La olvidaste?
                  </button>
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent pt-2 pb-1 text-sm text-stone-900 dark:text-white focus:outline-none placeholder-stone-300 dark:placeholder-stone-700"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full relative bg-stone-900 dark:bg-white text-white dark:text-black text-xs font-mono uppercase tracking-[0.25em] font-bold py-4 rounded-xl transition-all duration-300 shadow-md dark:shadow-xl mt-4 active:scale-[0.98] hover:bg-stone-800 dark:hover:bg-stone-200 disabled:opacity-40"
              >
                {loading ? 'Procesando...' : 'Ingresar al Salón'}
              </button>
            </form>

            <div className="text-center pt-6 border-t border-stone-100 dark:border-stone-900/60 mt-6">
              <p className="text-xs text-stone-400 dark:text-stone-500">
                ¿No tienes cuenta vip? 
                <button
                  type="button"
                  onClick={() => { setActiveTab('register'); setError(''); setSuccess(''); }}
                  className="ml-2 text-xs text-amber-600 dark:text-amber-500 hover:text-amber-500 dark:hover:text-amber-400 font-bold uppercase font-mono tracking-wider transition-colors focus:outline-none"
                >
                  Regístrate
                </button>
              </p>
            </div>
          </div>
        )}

        {activeTab === 'register' && (
          <div>
            <div className="text-center mb-6">
              <span className="text-[9px] font-mono tracking-[0.3em] text-amber-600 dark:text-amber-500/80 font-bold uppercase">JOIN THE CLUB</span>
              <h2 className="text-3xl font-light text-stone-900 dark:text-white tracking-tight mt-1">Crear Cuenta</h2>
            </div>

            {error && <div className="mb-4 p-3 bg-rose-500/5 border border-rose-500/10 text-rose-600 dark:text-rose-400 text-xs rounded-xl font-mono text-center">{error}</div>}
            {success && <div className="mb-4 p-3 bg-emerald-500/5 border border-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs rounded-xl font-mono text-center">{success}</div>}

            <form onSubmit={handleAuth} className="space-y-4">
              <div className="relative border-b border-stone-200 dark:border-stone-800 focus-within:border-amber-500 dark:focus-within:border-amber-500 transition-colors duration-300 py-1">
                <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400 dark:text-stone-500 block">Nombre y Apellido</span>
                <input
                  type="text"
                  placeholder="Ej: Alex Gómez"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-transparent pt-1 pb-1 text-sm text-stone-900 dark:text-white focus:outline-none placeholder-stone-300 dark:placeholder-stone-700"
                  required
                />
              </div>

              <div className="relative border-b border-stone-200 dark:border-stone-800 focus-within:border-amber-500 dark:focus-within:border-amber-500 transition-colors duration-300 py-1">
                <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400 dark:text-stone-500 block">Número de Móvil</span>
                <input
                  type="tel"
                  placeholder="11 2345 6789"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-transparent pt-1 pb-1 text-sm text-stone-900 dark:text-white focus:outline-none placeholder-stone-300 dark:placeholder-stone-700"
                  required
                />
              </div>

              <div className="relative border-b border-stone-200 dark:border-stone-800 focus-within:border-amber-500 dark:focus-within:border-amber-500 transition-colors duration-300 py-1">
                <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400 dark:text-stone-500 block">Correo Electrónico</span>
                <input
                  type="email"
                  placeholder="nombre@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent pt-1 pb-1 text-sm text-stone-900 dark:text-white focus:outline-none placeholder-stone-300 dark:placeholder-stone-700"
                  required
                />
              </div>

              <div className="relative border-b border-stone-200 dark:border-stone-800 focus-within:border-amber-500 dark:focus-within:border-amber-500 transition-colors duration-300 py-1">
                <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400 dark:text-stone-500 block">Contraseña de Acceso</span>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent pt-1 pb-1 text-sm text-stone-900 dark:text-white focus:outline-none placeholder-stone-300 dark:placeholder-stone-700"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full relative bg-amber-650 dark:bg-amber-500 text-white dark:text-black text-xs font-mono uppercase tracking-[0.25em] font-bold py-4 rounded-xl transition-all duration-300 shadow-md dark:shadow-xl mt-4 active:scale-[0.98] hover:bg-amber-600 dark:hover:bg-amber-400 disabled:opacity-40"
              >
                {loading ? 'Registrando...' : 'Confirmar Registro'}
              </button>
            </form>

            <div className="text-center pt-6 border-t border-stone-100 dark:border-stone-900/60 mt-6">
              <p className="text-xs text-stone-400 dark:text-stone-500">
                ¿Ya tienes una cuenta? 
                <button
                  type="button"
                  onClick={() => { setActiveTab('login'); setError(''); setSuccess(''); }}
                  className="ml-2 text-xs text-stone-900 dark:text-white hover:text-stone-700 dark:hover:text-stone-300 font-bold uppercase font-mono tracking-wider transition-colors focus:outline-none"
                >
                  Ingresar
                </button>
              </p>
            </div>
          </div>
        )}

        {activeTab === 'recover' && (
          <div>
            <div className="text-center mb-8">
              <span className="text-[9px] font-mono tracking-[0.3em] text-amber-600 dark:text-amber-500/80 font-bold uppercase">SECURITY ACCOUNT</span>
              <h2 className="text-3xl font-light text-stone-900 dark:text-white tracking-tight mt-1">Recuperar Clave</h2>
              <p className="text-xs text-stone-400 dark:text-stone-500 mt-2">Ingresa tu email para recibir los accesos de seguridad.</p>
            </div>

            {error && <div className="mb-4 p-3 bg-rose-500/5 border border-rose-500/10 text-rose-600 dark:text-rose-400 text-xs rounded-xl font-mono text-center">{error}</div>}
            {success && <div className="mb-4 p-3 bg-emerald-500/5 border border-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs rounded-xl font-mono text-center">{success}</div>}

            <form onSubmit={handleAuth} className="space-y-6">
              <div className="relative border-b border-stone-200 dark:border-stone-800 focus-within:border-amber-500 dark:focus-within:border-amber-500 transition-colors duration-300 py-1">
                <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400 dark:text-stone-500 block">Tu Correo Electrónico</span>
                <input
                  type="email"
                  placeholder="tuemail@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent pt-2 pb-1 text-sm text-stone-900 dark:text-white focus:outline-none placeholder-stone-300 dark:placeholder-stone-700"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full relative bg-amber-600 dark:bg-amber-500 text-white dark:text-black text-xs font-mono uppercase tracking-[0.25em] font-bold py-4 rounded-xl transition-all duration-300 shadow-md dark:shadow-xl mt-4 active:scale-[0.98] disabled:opacity-40"
              >
                {loading ? 'Enviando...' : 'Enviar Enlace'}
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('login'); setError(''); setSuccess(''); }}
                className="w-full text-center text-xs font-mono text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-white uppercase tracking-widest mt-4 transition-colors block focus:outline-none"
              >
                ← Volver Atrás
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  )
}
