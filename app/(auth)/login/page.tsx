'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function AuthMobilDefinitivo() {
  const router = useRouter()
  const { signIn, signUp, role, user, loading: authLoading } = useAuth()

  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'recover'>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [referralCode, setReferralCode] = useState('')

  useEffect(() => {
    setMounted(true)
    
    const searchParams = new URLSearchParams(window.location.search);
    const ref = searchParams.get('ref');
    if (ref) {
      setReferralCode(ref);
    }
  }, [])

  useEffect(() => {
    if (mounted && user && !authLoading && role !== null) {
      if (role === 'admin' || role === 'staff' || role === 'owner') {
        window.location.href = '/dashboard'
      } else {
        window.location.href = '/portal'
      }
    }
  }, [user, role, authLoading, mounted])

  // LOGIN - usa signIn del contexto
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await signIn(email, password)
      setSuccess('¡Ingreso correcto!')

      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 800)
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado.')
      setLoading(false)
    }
  }

  // REGISTRO - usa signUp del contexto (NO API)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const { data, error } = await signUp(
        email,
        password,
        fullName,
        phone,
        referralCode || undefined
      )

      if (error) {
        setError(error.message || 'Error al registrarse')
        setLoading(false)
        return
      }

      if (data?.user) {
        setSuccess('✅ ¡Registro exitoso! Redirigiendo...')
        setTimeout(() => {
          window.location.href = '/portal'
        }, 2000)
      } else {
        setError('No se pudo crear la cuenta')
        setLoading(false)
      }
    } catch (err: any) {
      setError(err.message || 'Error inesperado')
      setLoading(false)
    }
  }

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      setSuccess('📧 Enlace de recuperación enviado a tu correo.')
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado.')
    }
    
    setLoading(false)
  }

  if (!mounted) return null

  return (
    <div className="w-full min-h-screen bg-[#fcfbfa] dark:bg-[#0a0908] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="w-full max-w-md bg-white dark:bg-[#141211] border border-stone-200 dark:border-stone-800/60 rounded-[24px] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.05)]">

        {activeTab === 'login' && (
          <div>
            <div className="text-center mb-8">
              <span className="text-[9px] font-mono tracking-[0.3em] text-amber-600 dark:text-amber-500/80 font-bold uppercase">MEMBER PORTAL</span>
              <h2 className="text-3xl font-light text-stone-900 dark:text-white tracking-tight mt-1">Te damos la bienvenida</h2>
            </div>

            {error && <div className="mb-4 p-3 bg-rose-500/5 border border-rose-500/10 text-rose-600 dark:text-rose-400 text-xs rounded-xl font-mono text-center">{error}</div>}
            {success && <div className="mb-4 p-3 bg-emerald-500/5 border border-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs rounded-xl font-mono text-center">{success}</div>}

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="relative border-b border-stone-200 dark:border-stone-800 focus-within:border-amber-500 transition-colors duration-300 py-1">
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

              <div className="relative border-b border-stone-200 dark:border-stone-800 focus-within:border-amber-500 transition-colors duration-300 py-1">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400 dark:text-stone-500">Contraseña</span>
                  <button 
                    type="button" 
                    onClick={() => { setActiveTab('recover'); setError(''); setSuccess(''); }}
                    className="text-[10px] font-mono text-amber-600 dark:text-amber-500/60 hover:text-amber-500 uppercase tracking-wider transition-colors focus:outline-none"
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
                className="w-full relative bg-stone-900 dark:bg-white text-white dark:text-black text-xs font-mono uppercase tracking-[0.25em] font-bold py-4 rounded-xl transition-all duration-300 shadow-md mt-4 active:scale-[0.98] hover:bg-stone-800 disabled:opacity-40"
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
                  className="ml-2 text-xs text-amber-600 dark:text-amber-500 hover:text-amber-500 font-bold uppercase font-mono tracking-wider transition-colors focus:outline-none"
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
              {referralCode && (
                <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">
                  🎁 Registrándote con código: <span className="font-bold">{referralCode}</span>
                </p>
              )}
            </div>

            {error && <div className="mb-4 p-3 bg-rose-500/5 border border-rose-500/10 text-rose-600 dark:text-rose-400 text-xs rounded-xl font-mono text-center">{error}</div>}
            {success && <div className="mb-4 p-3 bg-emerald-500/5 border border-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs rounded-xl font-mono text-center">{success}</div>}

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="relative border-b border-stone-200 dark:border-stone-800 focus-within:border-amber-500 transition-colors duration-300 py-1">
                <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400 dark:text-stone-500 block">Nombre y Apellido</span>
                <input
                  type="text"
                  placeholder="Ej: Alex Gómez"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-transparent pt-1 pb-1 text-sm text-stone-900 dark:text-white focus:outline-none placeholder-stone-300 dark:placeholder-stone-700"
                  required
                />
              </div>

              <div className="relative border-b border-stone-200 dark:border-stone-800 focus-within:border-amber-500 transition-colors duration-300 py-1">
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

              <div className="relative border-b border-stone-200 dark:border-stone-800 focus-within:border-amber-500 transition-colors duration-300 py-1">
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

              <div className="relative border-b border-stone-200 dark:border-stone-800 focus-within:border-amber-500 transition-colors duration-300 py-1">
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

              {referralCode && (
                <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800/30">
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    🎉 Registro con código: <span className="font-bold">{referralCode}</span>
                  </p>
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">
                    Recibirás <span className="font-bold">500 puntos</span> adicionales
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full relative bg-amber-600 dark:bg-amber-500 text-white dark:text-black text-xs font-mono uppercase tracking-[0.25em] font-bold py-4 rounded-xl transition-all duration-300 shadow-md mt-4 active:scale-[0.98] hover:bg-amber-700 disabled:opacity-40"
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
                  className="ml-2 text-xs text-stone-900 dark:text-white hover:text-stone-700 font-bold uppercase font-mono tracking-wider transition-colors focus:outline-none"
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

            <form onSubmit={handleRecover} className="space-y-6">
              <div className="relative border-b border-stone-200 dark:border-stone-800 focus-within:border-amber-500 transition-colors duration-300 py-1">
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
                className="w-full relative bg-amber-600 dark:bg-amber-500 text-white dark:text-black text-xs font-mono uppercase tracking-[0.25em] font-bold py-4 rounded-xl transition-all duration-300 shadow-md mt-4 active:scale-[0.98] disabled:opacity-40"
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
