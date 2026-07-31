// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sparkles, Mail, Lock, Eye, EyeOff, 
  User, LogIn, Shield, Gem, 
  ArrowRight, CheckCircle2, XCircle,
  Heart, Gift
} from 'lucide-react'

// ===== ANIMACIONES =====
const containerVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1],
      staggerChildren: 0.08,
      delayChildren: 0.15
    }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.4, ease: "easeInOut" }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { 
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1]
    }
  }
}

const glowPulse = {
  initial: { opacity: 0.3, scale: 1 },
  animate: {
    opacity: [0.3, 0.8, 0.3],
    scale: [1, 1.2, 1],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
}

const floatingIcons = {
  animate: {
    y: [0, -10, 0],
    rotate: [0, 5, -5, 0],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
}

export default function AuthMobilDefinitivo() {
  const router = useRouter()
  const { signIn, role, user, loading: authLoading } = useAuth()

  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'recover'>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [redirectPath, setRedirectPath] = useState('/portal')
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [loginSuccess, setLoginSuccess] = useState(false)

  // LOG VISUAL EN PANTALLA PARA EL TELÉFONO
  const [debugLog, setDebugLog] = useState('Iniciando componente...')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [referralCode, setReferralCode] = useState('')

  useEffect(() => {
    setMounted(true)
    setDebugLog('Montado en el cliente. Leyendo URL...')

    const searchParams = new URLSearchParams(window.location.search);
    const redirect = searchParams.get('redirect');
    if (redirect) {
      setRedirectPath(redirect)
    }

    const ref = searchParams.get('ref');
    if (ref) {
      setReferralCode(ref)
    }
  }, [])

  // ===== VERIFICACIÓN DE ACCESO CON LOGS VISUALES =====
  useEffect(() => {
    if (!mounted) return

    setDebugLog(`Estado Auth -> authLoading: ${authLoading}, user: ${user ? user.email : 'No hay user'}`)

    if (authLoading) return
    if (!user) return
    if (isRedirecting) return

    const verificarRolYRedirigir = async () => {
      setIsRedirecting(true)
      setDebugLog(`Usuario detectado: ${user.id}. Buscando en tabla staff...`)
      
      try {
        // Consulta directa a la tabla staff usando user_id
        const { data: staffMember, error: staffError } = await supabase
          .from('staff')
          .select('auth_role')
          .eq('user_id', user.id)
          .maybeSingle()

        if (staffError) {
          setDebugLog(`Error en Supabase staff: ${staffError.message}`)
          throw staffError
        }

        if (!staffMember) {
          setDebugLog(`Aviso: No se encontró registro en 'staff' para este user_id. Redirigiendo a /portal (Cliente).`)
          setTimeout(() => {
            router.replace('/portal')
          }, 2500) // Pausa de 2.5s para que puedas leer el mensaje en el teléfono
          return
        }

        setDebugLog(`¡Encontrado en staff! auth_role: "${staffMember.auth_role}"`)

        let targetPath = '/portal'
        const systemRole = staffMember.auth_role ? staffMember.auth_role.toLowerCase().trim() : 'staff'
        
        if (systemRole === 'admin' || systemRole === 'staff' || systemRole === 'owner') {
          targetPath = '/dashboard'
          setDebugLog(`Rol válido (${systemRole}). Destino: /dashboard`)
        } else {
          setDebugLog(`Rol no reconocido como admin/staff (${systemRole}). Destino: /portal`)
        }

        const finalPath = redirectPath !== '/portal' && redirectPath !== '/login' 
          ? redirectPath 
          : targetPath

        setDebugLog(`Redirigiendo a: ${finalPath}`)

        setTimeout(() => {
          router.replace(finalPath)
          router.refresh()
        }, 2000) // Pausa de 2s para leer el log visual

      } catch (err: any) {
        setDebugLog(`Excepción atrapada: ${err.message || err}`)
        setTimeout(() => {
          router.replace('/portal')
        }, 3000)
      }
    }

    verificarRolYRedirigir()
  }, [user, role, authLoading, mounted, redirectPath, router, isRedirecting])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading || isRedirecting) return

    setLoading(true)
    setError('')
    setSuccess('')
    setDebugLog('Intentando iniciar sesión...')

    try {
      const { error: signInError } = await signIn(email, password)
      if (signInError) throw signInError

      setSuccess('¡Ingreso correcto!')
      setLoginSuccess(true)
      setDebugLog('Login exitoso. Esperando sincronización...')

    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado.')
      setDebugLog(`Error en login: ${err.message}`)
      setLoading(false)
      setLoginSuccess(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading || isRedirecting) return

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          nombre: fullName.trim(),
          telefono: phone.trim(),
          referralCode: referralCode.trim()
        })
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'No se pudo crear la cuenta')
      }

      setSuccess('✅ ¡Registro exitoso!')

      const { error: signInError } = await signIn(email, password)
      if (signInError) throw signInError

      setLoginSuccess(true)

    } catch (err: any) {
      setError(err.message || 'Error inesperado')
      setLoading(false)
      setLoginSuccess(false)
    }
  }

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (resetError) throw resetError
      setSuccess('📧 Enlace de recuperación enviado a tu correo.')
    } catch (err: any) {
      setError(err.message || 'Error al enviar el correo de recuperación.')
    } finally {
      setLoading(false)
    }
  }

  // PANTALLA DE CARGA / REDIRECCIÓN CON PANEL DE LOGS VISUALES
  if (isRedirecting || (user && !error)) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#1E120C] p-6 text-center">
        <div className="relative mb-6">
          <div className="w-16 h-16 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="absolute inset-0 w-16 h-16 rounded-full animate-ping opacity-20 bg-[#D4AF37]" />
        </div>
        <p className="font-mono text-sm uppercase tracking-widest text-[#D4AF37] font-bold mb-4">
          Verificando credenciales...
        </p>
        
        {/* PANEL DE DEPURACIÓN EN VIVO (PARA QUE LO VEAS EN EL MÓVIL) */}
        <div className="w-full max-w-sm bg-black/60 border border-[#D4AF37]/30 rounded-xl p-4 text-left shadow-2xl">
          <p className="text-[10px] font-mono text-[#D4AF37] uppercase tracking-wider mb-1 font-bold">📋 Registro en vivo:</p>
          <p className="font-mono text-xs text-white/95 break-words leading-relaxed">
            {debugLog}
          </p>
        </div>
      </div>
    )
  }

  if (!mounted) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#1E120C]">
        <div className="relative">
          <div className="w-12 h-12 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="absolute inset-0 w-12 h-12 rounded-full animate-ping opacity-20 bg-[#D4AF37]" />
        </div>
        <p className="font-mono text-xs uppercase tracking-widest animate-pulse text-[#D4AF37] mt-4">
          Cargando...
        </p>
      </div>
    )
  }

  const BackgroundDecorations = () => (
    <>
      <motion.div 
        className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl opacity-20"
        style={{ background: 'linear-gradient(135deg, #D4AF37, #E8D5A0)' }}
        animate={glowPulse.animate}
        initial={glowPulse.initial}
      />
      <motion.div 
        className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl opacity-15"
        style={{ background: 'linear-gradient(135deg, #C9A96E, #D4AF37)' }}
        animate={{
          ...glowPulse.animate,
          transition: { ...glowPulse.animate.transition, delay: 1.5 }
        }}
        initial={glowPulse.initial}
      />

      <motion.div className="absolute top-10 left-6 text-[#D4AF37]/20" animate={floatingIcons.animate}>
        <Sparkles className="w-6 h-6" />
      </motion.div>
      <motion.div className="absolute bottom-20 right-6 text-[#D4AF37]/20" animate={{
        ...floatingIcons.animate,
        transition: { ...floatingIcons.animate.transition, delay: 1.2 }
      }}>
        <Gem className="w-5 h-5" />
      </motion.div>
    </>
  )

  const Tabs = () => (
    <div className="flex gap-1 p-1 rounded-2xl border mb-6 bg-[#FFF9F6] border-[#F0E4DA]">
      {[
        { id: 'login', label: 'Ingresar', icon: LogIn },
        { id: 'register', label: 'Registro', icon: User },
        { id: 'recover', label: 'Ayuda', icon: Shield }
      ].map((tab) => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => { 
              setActiveTab(tab.id as any)
              setError('')
              setSuccess('')
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition-all duration-300 hover:scale-[1.02] active:scale-[0.96] ${
              isActive
                ? 'bg-[#1A0E0A] text-[#FFF9F6] shadow-lg shadow-[#1A0E0A]/25'
                : 'text-[#5C4A3E] hover:text-[#1A0E0A]'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${isActive ? 'opacity-80' : ''}`} />
            {tab.label}
          </button>
        )
      })}
    </div>
  )

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-[#FFF9F6] via-white to-[#FFF9F6]/50 flex items-center justify-center p-4 relative overflow-hidden font-sans">

      <BackgroundDecorations />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="w-full max-w-md bg-white/95 backdrop-blur-2xl border border-[#F0E4DA] rounded-[32px] p-6 shadow-2xl shadow-[#D4AF37]/5 relative overflow-hidden"
      >
        <motion.div variants={itemVariants} className="text-center mb-6 relative">
          <motion.div 
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl text-[#1A0E0A] shadow-xl shadow-[#D4AF37]/25 mb-3"
            style={{ background: 'linear-gradient(135deg, #D4AF37, #E8D5A0)' }}
          >
            <Sparkles className="w-8 h-8" />
          </motion.div>

          <motion.h2 className="text-3xl font-serif font-extrabold text-[#1A0E0A] tracking-tight">
            Fresh Nails
          </motion.h2>
          <motion.p className="text-[10px] font-mono tracking-[0.3em] text-[#5C4A3E] font-bold uppercase mt-1">
            {activeTab === 'login' && '✨ Bienvenida de vuelta'}
            {activeTab === 'register' && '🌟 Únete al Club'}
            {activeTab === 'recover' && '🔐 Recupera tu acceso'}
          </motion.p>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Tabs />
        </motion.div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs rounded-xl font-mono text-center flex items-center justify-center gap-2"
            >
              <XCircle className="w-4 h-4 shrink-0" />
              {error}
            </motion.div>
          )}
          {success && (
            <motion.div 
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs rounded-xl font-mono text-center flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {success}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeTab}-content`}
            initial={{ opacity: 0, x: activeTab === 'login' ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: activeTab === 'login' ? 20 : -20 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            {activeTab === 'login' && (
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="relative group">
                  <div className="relative border-b-2 border-[#F0E4DA] group-focus-within:border-[#D4AF37] transition-colors duration-300 py-1">
                    <div className="flex items-center gap-2 text-[#5C4A3E]">
                      <Mail className="w-4 h-4" />
                      <span className="text-[10px] font-mono uppercase tracking-widest font-bold">Email</span>
                    </div>
                    <input
                      type="email"
                      placeholder="tuemail@ejemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-transparent pt-2 pb-1 text-sm text-[#1A0E0A] focus:outline-none placeholder-[#A89588]"
                      required
                    />
                  </div>
                </div>

                <div className="relative group">
                  <div className="relative border-b-2 border-[#F0E4DA] group-focus-within:border-[#D4AF37] transition-colors duration-300 py-1">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 text-[#5C4A3E]">
                        <Lock className="w-4 h-4" />
                        <span className="text-[10px] font-mono uppercase tracking-widest font-bold">Contraseña</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => { setActiveTab('recover'); setError(''); setSuccess(''); }}
                        className="text-[10px] font-mono text-[#D4AF37] uppercase tracking-wider"
                      >
                        ¿Olvidaste?
                      </button>
                    </div>
                    <div className="flex items-center">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-transparent pt-2 pb-1 text-sm text-[#1A0E0A] focus:outline-none placeholder-[#A89588]"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-[#A89588] hover:text-[#D4AF37]"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || isRedirecting}
                  className="w-full relative overflow-hidden group py-4 rounded-2xl text-[#1A0E0A] text-xs font-mono uppercase tracking-[0.25em] font-bold shadow-lg shadow-[#D4AF37]/25 active:scale-[0.98] disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg, #D4AF37, #E8D5A0)' }}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {loading ? 'Ingresando...' : <> <LogIn className="w-4 h-4" /> Ingresar al Salón </>}
                  </span>
                </button>
              </form>
            )}

            {activeTab === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="relative group">
                  <div className="relative border-b-2 border-[#F0E4DA] group-focus-within:border-[#D4AF37] transition-colors py-1">
                    <div className="flex items-center gap-2 text-[#5C4A3E]">
                      <User className="w-4 h-4" />
                      <span className="text-[10px] font-mono uppercase tracking-widest font-bold">Nombre Completo</span>
                    </div>
                    <input
                      type="text"
                      placeholder="Ej: María González"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-transparent pt-2 pb-1 text-sm text-[#1A0E0A] focus:outline-none placeholder-[#A89588]"
                      required
                    />
                  </div>
                </div>

                <div className="relative group">
                  <div className="relative border-b-2 border-[#F0E4DA] group-focus-within:border-[#D4AF37] transition-colors py-1">
                    <div className="flex items-center gap-2 text-[#5C4A3E]">
                      <Mail className="w-4 h-4" />
                      <span className="text-[10px] font-mono uppercase tracking-widest font-bold">Correo Electrónico</span>
                    </div>
                    <input
                      type="email"
                      placeholder="nombre@correo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-transparent pt-2 pb-1 text-sm text-[#1A0E0A] focus:outline-none placeholder-[#A89588]"
                      required
                    />
                  </div>
                </div>

                <div className="relative group">
                  <div className="relative border-b-2 border-[#F0E4DA] group-focus-within:border-[#D4AF37] transition-colors py-1">
                    <div className="flex items-center gap-2 text-[#5C4A3E]">
                      <Lock className="w-4 h-4" />
                      <span className="text-[10px] font-mono uppercase tracking-widest font-bold">Contraseña</span>
                    </div>
                    <div className="flex items-center">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-transparent pt-2 pb-1 text-sm text-[#1A0E0A] focus:outline-none placeholder-[#A89588]"
                        required
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || isRedirecting}
                  className="w-full py-4 rounded-2xl text-[#1A0E0A] text-xs font-mono uppercase tracking-[0.25em] font-bold shadow-lg shadow-[#D4AF37]/25"
                  style={{ background: 'linear-gradient(135deg, #E8D5A0, #D4AF37)' }}
                >
                  Crear Cuenta VIP
                </button>
              </form>
            )}

            {activeTab === 'recover' && (
              <form onSubmit={handleRecover} className="space-y-5">
                <div className="text-center mb-2">
                  <p className="text-xs text-[#5C4A3E]">Ingresa tu email para recuperar tu acceso.</p>
                </div>
                <input
                  type="email"
                  placeholder="tuemail@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent border-b-2 border-[#F0E4DA] pt-2 pb-1 text-sm text-[#1A0E0A] focus:outline-none"
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-2xl text-[#1A0E0A] text-xs font-mono uppercase tracking-[0.25em] font-bold"
                  style={{ background: 'linear-gradient(135deg, #D4AF37, #E8D5A0)' }}
                >
                  Enviar Enlace
                </button>
              </form>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
