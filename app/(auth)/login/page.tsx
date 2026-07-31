// @ts-nocheck
'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sparkles, Mail, Lock, Eye, EyeOff, 
  User, LogIn, Shield, Crown, Gem, 
  ArrowRight, CheckCircle2, XCircle,
  Heart, Star, Zap, Fingerprint, 
  Flower2, Waves, Palette, Gift, Bug
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
  const { signIn, signUp, role, user, loading: authLoading } = useAuth()

  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'recover'>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [redirectPath, setRedirectPath] = useState('/portal')
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [loginSuccess, setLoginSuccess] = useState(false)
  
  // ===== ESTADO PARA DEBUG EN PANTALLA =====
  const [debugLogs, setDebugLogs] = useState<string[]>([])
  const [showDebug, setShowDebug] = useState(false)
  const [verificando, setVerificando] = useState(false)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [referralCode, setReferralCode] = useState('')

  // ===== FUNCIÓN PARA AGREGAR LOGS VISIBLES =====
  const addDebugLog = (mensaje: string) => {
    setDebugLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${mensaje}`])
  }

  useEffect(() => {
    setMounted(true)
    addDebugLog('✅ Componente montado')
  }, [])

  // ===== FUNCIÓN DE VERIFICACIÓN DE ROL =====
  const verificarRolYRedirigir = async (usuario: any) => {
    if (verificando) {
      addDebugLog('⏳ Ya está verificando...')
      return
    }
    
    if (!usuario) {
      addDebugLog('👤 No hay usuario para verificar')
      return
    }

    setVerificando(true)
    setIsRedirecting(true)
    
    try {
      addDebugLog(`🔍 Verificando usuario ID: ${usuario.id}`)
      addDebugLog(`📧 Email: ${usuario.email}`)

      // Buscar en la tabla staff
      const { data: staffMember, error: staffError } = await supabase
        .from('staff')
        .select('auth_role, email, user_id')
        .eq('user_id', usuario.id)
        .maybeSingle()

      if (staffError) {
        addDebugLog(`❌ Error en staff: ${staffError.message}`)
        throw staffError
      }

      addDebugLog(`📊 Resultado staff: ${JSON.stringify(staffMember)}`)

      let targetPath = '/portal' // Por defecto: Clientes normales

      // Si existe en la tabla staff, comprobamos su nivel de sistema
      if (staffMember) {
        const systemRole = staffMember.auth_role ? staffMember.auth_role.toLowerCase().trim() : 'staff'
        addDebugLog(`👤 Rol encontrado: ${systemRole}`)
        
        if (systemRole === 'admin' || systemRole === 'staff' || systemRole === 'owner') {
          targetPath = '/dashboard'
          addDebugLog('➡️ Redirigiendo a DASHBOARD')
        } else {
          addDebugLog('➡️ Redirigiendo a PORTAL (rol no válido)')
        }
      } else {
        addDebugLog('⚠️ Usuario NO encontrado en staff, redirigiendo a PORTAL')
      }

      // Si viene con una redirección explícita válida externa
      const finalPath = redirectPath !== '/portal' && redirectPath !== '/login' 
        ? redirectPath 
        : targetPath

      addDebugLog(`🎯 Ruta final: ${finalPath}`)
      
      setShowDebug(true)
      
      // Redirigir después de 1 segundo
      setTimeout(() => {
        router.replace(finalPath)
      }, 1000)

    } catch (err: any) {
      addDebugLog(`❌ Error capturado: ${err.message}`)
      setTimeout(() => {
        router.replace('/portal')
      }, 1000)
    } finally {
      setVerificando(false)
      setIsRedirecting(false)
    }
  }

  // ===== EFECTO PARA MONITOREAR EL USUARIO =====
  useEffect(() => {
    if (!mounted) return
    if (authLoading) {
      addDebugLog('⏳ Auth cargando...')
      return
    }
    
    if (user) {
      addDebugLog(`👤 Usuario detectado: ${user.email}`)
      verificarRolYRedirigir(user)
    } else {
      addDebugLog('👤 No hay usuario logueado')
    }
  }, [user, authLoading, mounted])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading || isRedirecting) return

    setLoading(true)
    setError('')
    setSuccess('')
    addDebugLog('🔐 Intentando login...')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()
      
      if (!response.ok || data.error) {
        addDebugLog(`❌ Error login: ${data.error}`)
        throw new Error(data.error || 'Error al iniciar sesión')
      }

      addDebugLog('✅ Login exitoso!')
      setSuccess('✅ ¡Ingreso correcto!')
      setLoginSuccess(true)

      // OBTENER LA SESIÓN ACTUALIZADA
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        addDebugLog(`❌ Error obteniendo sesión: ${sessionError.message}`)
        throw sessionError
      }

      const usuario = sessionData?.session?.user
      addDebugLog(`🔄 Sesión recargada: ${usuario?.email || 'sin usuario'}`)

      if (usuario) {
        addDebugLog('👤 Usuario obtenido de sesión, verificando...')
        // Esperar un momento para que el estado se actualice
        setTimeout(() => {
          verificarRolYRedirigir(usuario)
        }, 300)
      } else {
        addDebugLog('⚠️ No se pudo obtener usuario de la sesión')
        // Forzar recarga de la página para que el useEffect se ejecute
        setTimeout(() => {
          window.location.reload()
        }, 500)
      }

    } catch (err: any) {
      addDebugLog(`❌ Error: ${err.message}`)
      setError(err.message || '❌ Ocurrió un error inesperado.')
      setLoading(false)
      setLoginSuccess(false)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading || isRedirecting) return

    setLoading(true)
    setError('')
    setSuccess('')
    addDebugLog('📝 Intentando registro...')

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
        addDebugLog(`❌ Error registro: ${data.error}`)
        throw new Error(data.error || 'No se pudo crear la cuenta')
      }

      addDebugLog('✅ Registro exitoso!')
      setSuccess('✅ ¡Registro exitoso!')

      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const loginData = await loginResponse.json()
      if (!loginResponse.ok || loginData.error) {
        addDebugLog(`❌ Error login post-registro: ${loginData.error}`)
        throw new Error(loginData.error || 'Error al iniciar sesión')
      }

      addDebugLog('✅ Login post-registro exitoso!')
      setLoginSuccess(true)

      const { data: sessionData } = await supabase.auth.getSession()
      const usuario = sessionData?.session?.user
      
      if (usuario) {
        setTimeout(() => {
          verificarRolYRedirigir(usuario)
        }, 300)
      }

    } catch (err: any) {
      addDebugLog(`❌ Error: ${err.message}`)
      setError(err.message || '❌ Error inesperado')
      setLoading(false)
      setLoginSuccess(false)
    } finally {
      setLoading(false)
    }
  }

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    setError('')
    setSuccess('')
    addDebugLog('🔐 Intentando recuperación...')

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (resetError) {
        addDebugLog(`❌ Error recuperación: ${resetError.message}`)
        throw resetError
      }
      addDebugLog('✅ Enlace de recuperación enviado')
      setSuccess('📧 Enlace de recuperación enviado a tu correo.')
    } catch (err: any) {
      addDebugLog(`❌ Error: ${err.message}`)
      setError(err.message || 'Error al enviar el correo de recuperación.')
    } finally {
      setLoading(false)
    }
  }

  // ===== ESTADOS DE CARGA =====
  if (isRedirecting || authLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#1E120C] p-4">
        <div className="relative">
          <div className="w-12 h-12 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="absolute inset-0 w-12 h-12 rounded-full animate-ping opacity-20 bg-[#D4AF37]" />
        </div>
        <p className="font-mono text-xs uppercase tracking-widest animate-pulse text-[#D4AF37] mt-4">
          {isRedirecting ? 'Comprobando accesos...' : 'Cargando...'}
        </p>
        
        {showDebug && debugLogs.length > 0 && (
          <div className="mt-6 w-full max-w-md bg-black/80 rounded-xl p-4 border border-[#D4AF37]/30 max-h-60 overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-mono text-[#D4AF37] uppercase tracking-widest">🔍 Debug</p>
              <button 
                onClick={() => setShowDebug(false)}
                className="text-[#A89588] hover:text-white text-xs"
              >
                ✕
              </button>
            </div>
            {debugLogs.map((log, i) => (
              <p key={i} className="text-[10px] font-mono text-white/80 border-b border-white/5 py-1">
                {log}
              </p>
            ))}
          </div>
        )}
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

  // ===== DECORACIONES DE FONDO =====
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
      <motion.div className="absolute top-1/2 left-4 text-[#D4AF37]/15" animate={{
        ...floatingIcons.animate,
        transition: { ...floatingIcons.animate.transition, delay: 2.5 }
      }}>
        <Heart className="w-4 h-4" />
      </motion.div>
    </>
  )

  // ===== TABS =====
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

  const isDark = false

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-[#FFF9F6] via-white to-[#FFF9F6]/50 flex items-center justify-center p-4 relative overflow-hidden font-sans">

      <BackgroundDecorations />

      <motion.div 
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: 'linear-gradient(90deg, #D4AF37, #E8D5A0, #C9A96E, #D4AF37)' }}
        animate={{ 
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
          transition: { duration: 6, repeat: Infinity, ease: "linear" }
        }}
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="w-full max-w-md bg-white/95 backdrop-blur-2xl border border-[#F0E4DA] rounded-[32px] p-6 shadow-2xl shadow-[#D4AF37]/5 relative overflow-hidden"
      >

        {/* BOTÓN DE DEBUG */}
        <button
          type="button"
          onClick={() => setShowDebug(!showDebug)}
          className="absolute top-4 right-4 z-20 p-2 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37] hover:bg-[#D4AF37]/20 transition-colors"
        >
          <Bug className="w-4 h-4" />
        </button>

        {/* HEADER */}
        <motion.div variants={itemVariants} className="text-center mb-6 relative">
          <motion.div 
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl text-[#1A0E0A] shadow-xl shadow-[#D4AF37]/25 mb-3"
            style={{ background: 'linear-gradient(135deg, #D4AF37, #E8D5A0)' }}
            whileHover={{ 
              scale: 1.1, 
              rotate: [0, -5, 5, 0],
              transition: { duration: 0.5 }
            }}
          >
            <Sparkles className="w-8 h-8" />
          </motion.div>

          <motion.h2 
            className="text-3xl font-serif font-extrabold text-[#1A0E0A] tracking-tight"
          >
            Fresh Nails
          </motion.h2>
          <motion.p className="text-[10px] font-mono tracking-[0.3em] text-[#5C4A3E] font-bold uppercase mt-1">
            {activeTab === 'login' && '✨ Bienvenida de vuelta'}
            {activeTab === 'register' && '🌟 Únete al Club'}
            {activeTab === 'recover' && '🔐 Recupera tu acceso'}
          </motion.p>
        </motion.div>

        {/* TABS */}
        <motion.div variants={itemVariants}>
          <Tabs />
        </motion.div>

        {/* MENSAJES */}
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

        {/* PANEL DE DEBUG VISIBLE */}
        {showDebug && debugLogs.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 bg-black/90 rounded-xl p-3 border border-[#D4AF37]/30 max-h-48 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-[9px] font-mono text-[#D4AF37] uppercase tracking-widest">🔍 Debug Logs</p>
              <button 
                onClick={() => setDebugLogs([])}
                className="text-[#A89588] hover:text-white text-[10px]"
              >
                Limpiar
              </button>
            </div>
            {debugLogs.map((log, i) => (
              <p key={i} className="text-[9px] font-mono text-white/70 border-b border-white/5 py-0.5">
                {log}
              </p>
            ))}
          </motion.div>
        )}

        {/* CONTENIDO */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeTab}-content`}
            initial={{ opacity: 0, x: activeTab === 'login' ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: activeTab === 'login' ? 20 : -20 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >

            {/* LOGIN */}
            {activeTab === 'login' && (
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="relative group">
                  <div className="relative border-b-2 border-[#F0E4DA] group-focus-within:border-[#D4AF37] transition-colors duration-300 py-1">
                    <div className="flex items-center gap-2 text-[#5C4A3E] group-focus-within:text-[#D4AF37] transition-colors duration-300">
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
                    <div className="absolute -bottom-[2px] left-0 right-0 h-[2px] bg-gradient-to-r from-[#D4AF37] to-[#E8D5A0] scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 origin-left" />
                  </div>
                </div>

                <div className="relative group">
                  <div className="relative border-b-2 border-[#F0E4DA] group-focus-within:border-[#D4AF37] transition-colors duration-300 py-1">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 text-[#5C4A3E] group-focus-within:text-[#D4AF37] transition-colors duration-300">
                        <Lock className="w-4 h-4" />
                        <span className="text-[10px] font-mono uppercase tracking-widest font-bold">Contraseña</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => { setActiveTab('recover'); setError(''); setSuccess(''); }}
                        className="text-[10px] font-mono text-[#D4AF37] hover:text-[#E8D5A0] uppercase tracking-wider transition-colors focus:outline-none"
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
                        className="text-[#A89588] hover:text-[#D4AF37] transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="absolute -bottom-[2px] left-0 right-0 h-[2px] bg-gradient-to-r from-[#D4AF37] to-[#E8D5A0] scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 origin-left" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || isRedirecting}
                  className="w-full relative overflow-hidden group py-4 rounded-2xl text-[#1A0E0A] text-xs font-mono uppercase tracking-[0.25em] font-bold transition-all duration-300 shadow-lg shadow-[#D4AF37]/25 active:scale-[0.98] disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg, #D4AF37, #E8D5A0)' }}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-[#1A0E0A]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Ingresando...
                      </>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4" />
                        Ingresar al Salón
                      </>
                    )}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                </button>

                <div className="text-center pt-4">
                  <p className="text-xs text-[#5C4A3E]">
                    ¿No tienes cuenta VIP? 
                    <button
                      type="button"
                      onClick={() => { setActiveTab('register'); setError(''); setSuccess(''); }}
                      className="ml-2 text-xs font-bold text-[#D4AF37] hover:text-[#E8D5A0] uppercase font-mono tracking-wider transition-colors focus:outline-none"
                    >
                      Regístrate
                    </button>
                  </p>
                </div>
              </form>
            )}

            {/* REGISTER */}
            {activeTab === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="relative group">
                  <div className="relative border-b-2 border-[#F0E4DA] group-focus-within:border-[#D4AF37] transition-colors duration-300 py-1">
                    <div className="flex items-center gap-2 text-[#5C4A3E] group-focus-within:text-[#D4AF37] transition-colors">
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
                    <div className="absolute -bottom-[2px] left-0 right-0 h-[2px] bg-gradient-to-r from-[#D4AF37] to-[#E8D5A0] scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 origin-left" />
                  </div>
                </div>

                <div className="relative group">
                  <div className="relative border-b-2 border-[#F0E4DA] group-focus-within:border-[#D4AF37] transition-colors duration-300 py-1">
                    <div className="flex items-center gap-2 text-[#5C4A3E] group-focus-within:text-[#D4AF37] transition-colors">
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
                    <div className="absolute -bottom-[2px] left-0 right-0 h-[2px] bg-gradient-to-r from-[#D4AF37] to-[#E8D5A0] scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 origin-left" />
                  </div>
                </div>

                <div className="relative group">
                  <div className="relative border-b-2 border-[#F0E4DA] group-focus-within:border-[#D4AF37] transition-colors duration-300 py-1">
                    <div className="flex items-center gap-2 text-[#5C4A3E] group-focus-within:text-[#D4AF37] transition-colors">
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
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-[#A89588] hover:text-[#D4AF37] transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="absolute -bottom-[2px] left-0 right-0 h-[2px] bg-gradient-to-r from-[#D4AF37] to-[#E8D5A0] scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 origin-left" />
                  </div>
                </div>

                {referralCode && (
                  <div className="bg-gradient-to-r from-[#D4AF37]/10 to-[#E8D5A0]/10 p-4 rounded-2xl border border-[#D4AF37]/20">
                    <div className="flex items-center gap-3">
                      <Gift className="w-5 h-5 text-[#D4AF37]" />
                      <div>
                        <p className="text-xs font-bold text-[#1A0E0A]">
                          🎉 Registro con código: <span className="text-[#D4AF37]">{referralCode}</span>
                        </p>
                        <p className="text-[10px] text-[#5C4A3E] mt-0.5">
                          Recibirás <span className="font-bold text-[#D4AF37]">500 puntos</span> adicionales
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || isRedirecting}
                  className="w-full relative overflow-hidden group py-4 rounded-2xl text-[#1A0E0A] text-xs font-mono uppercase tracking-[0.25em] font-bold transition-all duration-300 shadow-lg shadow-[#D4AF37]/25 active:scale-[0.98] disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg, #E8D5A0, #D4AF37)' }}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-[#1A0E0A]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Registrando...
                      </>
                    ) : (
                      <>
                        <User className="w-4 h-4" />
                        Crear Cuenta VIP
                      </>
                    )}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                </button>

                <div className="text-center pt-4">
                  <p className="text-xs text-[#5C4A3E]">
                    ¿Ya tienes cuenta? 
                    <button
                      type="button"
                      onClick={() => { setActiveTab('login'); setError(''); setSuccess(''); }}
                      className="ml-2 text-xs font-bold text-[#D4AF37] hover:text-[#E8D5A0] uppercase font-mono tracking-wider transition-colors focus:outline-none"
                    >
                      Ingresar
                    </button>
                  </p>
                </div>
              </form>
            )}

            {/* RECOVER */}
            {activeTab === 'recover' && (
              <form onSubmit={handleRecover} className="space-y-5">
                <div className="text-center mb-2">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#D4AF37]/10 text-[#D4AF37] mb-3">
                    <Shield className="w-7 h-7" />
                  </div>
                  <p className="text-xs text-[#5C4A3E] leading-relaxed">
                    Ingresa tu email y te enviaremos un enlace seguro para recuperar tu acceso.
                  </p>
                </div>

                <div className="relative group">
                  <div className="relative border-b-2 border-[#F0E4DA] group-focus-within:border-[#D4AF37] transition-colors duration-300 py-1">
                    <div className="flex items-center gap-2 text-[#5C4A3E] group-focus-within:text-[#D4AF37] transition-colors">
                      <Mail className="w-4 h-4" />
                      <span className="text-[10px] font-mono uppercase tracking-widest font-bold">Tu Email</span>
                    </div>
                    <input
                      type="email"
                      placeholder="tuemail@ejemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-transparent pt-2 pb-1 text-sm text-[#1A0E0A] focus:outline-none"
                      required
                    />
                    <div className="absolute -bottom-[2px] left-0 right-0 h-[2px] bg-gradient-to-r from-[#D4AF37] to-[#E8D5A0] scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 origin-left" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full relative overflow-hidden group py-4 rounded-2xl text-[#1A0E0A] text-xs font-mono uppercase tracking-[0.25em] font-bold transition-all duration-300 shadow-lg shadow-[#D4AF37]/25 active:scale-[0.98] disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg, #D4AF37, #E8D5A0)' }}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-[#1A0E0A]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Enviando...
                      </>
                    ) : (
                      <>
                        <ArrowRight className="w-4 h-4" />
                        Enviar Enlace
                      </>
                    )}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                </button>

                <button
                  type="button"
                  onClick={() => { setActiveTab('login'); setError(''); setSuccess(''); }}
                  className="w-full text-center text-xs font-mono text-[#5C4A3E] hover:text-[#1A0E0A] uppercase tracking-widest transition-colors focus:outline-none flex items-center justify-center gap-2"
                >
                  <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                  Volver al inicio
                </button>
              </form>
            )}

          </motion.div>
        </AnimatePresence>

        {/* FOOTER DECORATIVO */}
        <motion.div 
          variants={itemVariants}
          className="mt-6 pt-4 border-t border-[#F0E4DA] text-center"
        >
          <p className="text-[8px] font-mono uppercase tracking-[0.3em] text-[#A89588]">
            <span className="text-[#D4AF37]">✦</span> Fresh Nails Studio <span className="text-[#D4AF37]">✦</span>
          </p>
          <div className="flex items-center justify-center gap-2 mt-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#E8D5A0] animate-pulse" style={{ animationDelay: '0.5s' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-[#C9A96E] animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
        </motion.div>

      </motion.div>
    </div>
  )
}