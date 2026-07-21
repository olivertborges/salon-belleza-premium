'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sparkles, Mail, Lock, Eye, EyeOff, 
  User, LogIn, Shield, 
  ArrowRight, CheckCircle2, XCircle,
  Heart, Gem, Gift, Bug
} from 'lucide-react'

// ===== ANIMACIONES =====
const containerVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1], staggerChildren: 0.08, delayChildren: 0.15 } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.4, ease: "easeInOut" } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
}

const glowPulse = {
  initial: { opacity: 0.3, scale: 1 },
  animate: { opacity: [0.3, 0.8, 0.3], scale: [1, 1.2, 1], transition: { duration: 4, repeat: Infinity, ease: "easeInOut" } }
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
  const [logs, setLogs] = useState<string[]>([])
  const [showLogs, setShowLogs] = useState(true)
  const [redirecting, setRedirecting] = useState(false)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [referralCode, setReferralCode] = useState('')

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 20))
    console.log(message)
  }

  useEffect(() => {
    setMounted(true)
    addLog('🚀 Componente montado')

    const searchParams = new URLSearchParams(window.location.search);
    const ref = searchParams.get('ref');
    if (ref) {
      setReferralCode(ref)
      addLog(`📎 Código de referido: ${ref}`)
    }
  }, [])

  // ✅ REDIRECCIÓN SEGURA
  useEffect(() => {
    if (redirecting || !mounted || authLoading || !role) {
      addLog(`⏳ Esperando... redirecting=${redirecting}, mounted=${mounted}, authLoading=${authLoading}, role=${!!role}`)
      return
    }

    if (!user) {
      addLog(`👤 Sin usuario activo`)
      return
    }

    const targetPath = ['admin', 'staff', 'owner'].includes(role) ? '/dashboard' : '/portal'

    addLog(`🎯 Usuario ${user.email} con rol ${role} → ${targetPath}`)

    if (window.location.pathname === targetPath) {
      addLog(`✅ Ya en la ruta correcta`)
      return
    }

    if (window.location.pathname !== '/login' && window.location.pathname !== '/auth') {
      addLog(`⚠️ No estamos en login, omitiendo redirección`)
      return
    }

    addLog(`🚀 Redirigiendo a ${targetPath}`)
    setRedirecting(true)
    router.replace(targetPath)

  }, [user, role, authLoading, mounted, router, redirecting])

  // ============================================================
  // INICIO DE SESIÓN
  // ============================================================
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (loading || redirecting) {
      addLog(`⏳ Operación en curso, ignorando...`)
      return
    }

    if (!email || !password) {
      setError('⚠️ Por favor, completa todos los campos')
      return
    }

    addLog(`🔐 Intentando login para: ${email}`)
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const { error: signInError } = await signIn(email, password)

      if (signInError) {
        addLog(`❌ Error en login: ${signInError.message}`)
        setError(signInError.message.includes('Invalid login credentials') 
          ? '❌ Credenciales incorrectas. Verifica tu email y contraseña.' 
          : signInError.message.includes('Email not confirmed') 
            ? '📧 Por favor, confirma tu email antes de iniciar sesión.' 
            : signInError.message || 'Ocurrió un error inesperado.')
        setLoading(false)
        return
      }

      addLog(`✅ Login exitoso para: ${email}`)
      setSuccess('🎉 ¡Ingreso exitoso! Redirigiendo...')
      setTimeout(() => setLoading(false), 500)

    } catch (err: any) {
      addLog(`❌ Error inesperado: ${err.message}`)
      setError(err.message || 'Ocurrió un error inesperado.')
      setLoading(false)
    }
  }

  // ============================================================
  // REGISTRO
  // ============================================================
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading || redirecting) return

    if (!email || !password || !fullName) {
      setError('⚠️ Por favor, completa todos los campos obligatorios')
      return
    }

    addLog(`📝 Intentando registro para: ${email}`)
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(), password, nombre: fullName.trim(),
          telefono: phone.trim(), referralCode: referralCode.trim()
        })
      })

      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'No se pudo crear la cuenta')

      addLog(`✅ Registro exitoso para: ${email}`)
      setSuccess('✅ ¡Registro exitoso! Iniciando sesión...')

      setTimeout(async () => {
        try {
          await signIn(email, password)
          addLog(`🔄 Login automático después del registro`)
        } catch (err: any) {
          addLog(`⚠️ Login automático falló: ${err.message}`)
          setError('Registro exitoso, pero no se pudo iniciar sesión automáticamente.')
        } finally {
          setLoading(false)
        }
      }, 500)

    } catch (err: any) {
      addLog(`❌ Error: ${err.message}`)
      setError(err.message || 'Error inesperado en el registro')
      setLoading(false)
    }
  }

  // ============================================================
  // RECUPERAR CONTRASEÑA
  // ============================================================
  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading || redirecting) return
    if (!email) { setError('⚠️ Por favor, ingresa tu email'); return }

    setLoading(true); setError(''); setSuccess('')
    try {
      addLog(`📧 Enviando recuperación para: ${email}`)
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (resetError) throw resetError
      addLog(`✅ Enlace enviado a: ${email}`)
      setSuccess('📧 ¡Enlace de recuperación enviado! Revisa tu correo.')
    } catch (err: any) {
      setError(err.message || 'Error al enviar el correo de recuperación.')
    } finally { setLoading(false) }
  }

  // ============================================================
  // REDIRECCIÓN MANUAL
  // ============================================================
  const handleManualRedirect = () => {
    if (!user || !role || redirecting) return
    const targetPath = ['admin', 'staff', 'owner'].includes(role) ? '/dashboard' : '/portal'
    addLog(`🔄 Redirección manual a ${targetPath}`)
    setRedirecting(true)
    router.replace(targetPath)
  }

  // ============================================================
  // PANTALLA DE CARGA INICIAL
  // ============================================================
  if (!mounted) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#0a0908]">
        <div className="relative">
          <div className="w-12 h-12 border-3 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: '#DB5B9A' }} />
          <div className="absolute inset-0 w-12 h-12 rounded-full animate-ping opacity-20" style={{ backgroundColor: '#DB5B9A' }} />
        </div>
        <p className="font-mono text-xs uppercase tracking-widest animate-pulse text-pink-500 mt-4">Cargando...</p>
      </div>
    )
  }

  // ============================================================
  // DECORACIONES DE FONDO
  // ============================================================
  const BackgroundDecorations = () => (
    <>
      <motion.div className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl opacity-30" style={{ background: 'linear-gradient(135deg, #f472b6, #f59e0b)' }} animate={glowPulse.animate} initial={glowPulse.initial} />
      <motion.div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl opacity-20" style={{ background: 'linear-gradient(135deg, #a78bfa, #ec4899)' }} animate={{ ...glowPulse.animate, transition: { ...glowPulse.animate.transition, delay: 1.5 } }} initial={glowPulse.initial} />
      <motion.div className="absolute top-10 left-6 text-pink-300/20" animate={{ y: [0, -10, 0], transition: { duration: 6, repeat: Infinity, ease: "easeInOut" } }}><Sparkles className="w-6 h-6" /></motion.div>
      <motion.div className="absolute bottom-20 right-6 text-amber-300/20" animate={{ y: [0, -10, 0], transition: { duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1.2 } }}><Gem className="w-5 h-5" /></motion.div>
      <motion.div className="absolute top-1/2 left-4 text-rose-300/15" animate={{ y: [0, -10, 0], transition: { duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2.5 } }}><Heart className="w-4 h-4" /></motion.div>
    </>
  )

  // ============================================================
  // PESTAÑAS
  // ============================================================
  const Tabs = () => (
    <div className="flex gap-1 p-1 rounded-2xl bg-pink-50/50 dark:bg-[#1a1520] border border-pink-100/30 dark:border-fuchsia-950/30 mb-6">
      {[{ id: 'login', label: 'Ingresar', icon: LogIn }, { id: 'register', label: 'Registro', icon: User }, { id: 'recover', label: 'Ayuda', icon: Shield }].map((tab) => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id
        return (
          <button key={tab.id} type="button" onClick={() => { setActiveTab(tab.id as any); setError(''); setSuccess('') }}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition-all duration-300 hover:scale-[1.02] active:scale-[0.96] ${isActive ? 'text-white shadow-lg shadow-pink-500/25' : 'text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-pink-300'}`}
            style={isActive ? { background: 'linear-gradient(135deg, #ec4899, #f59e0b)' } : {}}>
            <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white/80' : ''}`} />{tab.label}
          </button>
        )
      })}
    </div>
  )

  // ============================================================
  // AVISO DE SESIÓN ACTIVA
  // ============================================================
  const ActiveSessionBanner = () => {
    if (!user || !role || redirecting) return null
    const targetPath = ['admin', 'staff', 'owner'].includes(role) ? '/dashboard' : '/portal'
    return (
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
        <div className="flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">✅ Sesión activa como <span className="font-bold">{role}</span></p>
            <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-1 truncate">{user?.email}</p>
            <button onClick={handleManualRedirect} className="mt-2 text-[10px] font-mono text-emerald-500 hover:text-emerald-600 underline transition-colors">Ir al panel ahora →</button>
          </div>
        </div>
      </motion.div>
    )
  }

  // ============================================================
  // RENDERIZADO PRINCIPAL
  // ============================================================
  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-pink-50/30 via-white to-amber-50/20 dark:from-[#0a0908] dark:via-[#0f0c1b] dark:to-[#0a0908] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <BackgroundDecorations />
      <motion.div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: 'linear-gradient(90deg, #ec4899, #f59e0b, #a78bfa, #ec4899)' }} animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'], transition: { duration: 6, repeat: Infinity, ease: "linear" } }} />
      
      <motion.div variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="w-full max-w-md bg-white/80 dark:bg-[#141211]/90 backdrop-blur-2xl border border-pink-100/40 dark:border-fuchsia-950/40 rounded-[32px] p-6 shadow-2xl shadow-pink-500/5 relative overflow-hidden">
        
        {/* ===== PANEL DE REGISTROS ===== */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <button onClick={() => setShowLogs(!showLogs)} className="flex items-center gap-1.5 text-[8px] font-mono font-bold uppercase tracking-wider text-pink-400 hover:text-pink-300 transition-colors"><Bug className="w-3 h-3" />{showLogs ? 'Ocultar Logs' : 'Mostrar Logs'}</button>
            <button onClick={() => setLogs([])} className="text-[8px] font-mono text-stone-500 hover:text-stone-300 transition-colors">Limpiar</button>
          </div>
          {showLogs && (
            <div className="p-2 rounded-xl bg-stone-950/90 backdrop-blur-sm border border-stone-800 max-h-40 overflow-y-auto">
              <div className="space-y-0.5 font-mono text-[8px] leading-relaxed">
                {logs.length === 0 ? <p className="text-stone-600 italic">Esperando eventos...</p> : logs.map((log, i) => (
                  <div key={i} className={`${log.includes('❌') ? 'text-rose-400' : log.includes('✅') ? 'text-emerald-400' : log.includes('🚀') ? 'text-pink-400' : log.includes('🎯') ? 'text-amber-400' : 'text-stone-400'}`}>{log}</div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ENCABEZADO */}
        <motion.div variants={itemVariants} className="text-center mb-6 relative">
          <motion.div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl text-white shadow-xl shadow-pink-500/25 mb-3" style={{ background: 'linear-gradient(135deg, #ec4899, #f59e0b)' }} whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0], transition: { duration: 0.5 } }}><Sparkles className="w-8 h-8" /></motion.div>
          <motion.h2 className="text-3xl font-serif font-extrabold text-stone-900 dark:text-white tracking-tight" style={{ background: 'linear-gradient(135deg, #ec4899, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Fresh Nails</motion.h2>
          <motion.p className="text-[10px] font-mono tracking-[0.3em] text-stone-400 dark:text-stone-500 font-bold uppercase mt-1">
            {activeTab === 'login' && '✨ Bienvenida de vuelta'}
            {activeTab === 'register' && '🌟 Únete al Club'}
            {activeTab === 'recover' && '🔐 Recupera tu acceso'}
          </motion.p>
        </motion.div>

        <motion.div variants={itemVariants}><Tabs /></motion.div>
        <ActiveSessionBanner />

        {/* MENSAJES DE ESTADO */}
        <AnimatePresence mode="wait">
          {error && (<motion.div initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }} className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs rounded-xl font-mono text-center flex items-center justify-center gap-2"><XCircle className="w-4 h-4 shrink-0" />{error}</motion.div>)}
          {success && (<motion.div initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }} className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs rounded-xl font-mono text-center flex items-center justify-center gap-2"><CheckCircle2 className="w-4 h-4 shrink-0" />{success}</motion.div>)}
        </AnimatePresence>

        {/* CONTENIDO DE PESTAÑAS */}
        <AnimatePresence mode="wait">
          <motion.div key={`${activeTab}-content`} initial={{ opacity: 0, x: activeTab === 'login' ? -20 : 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: activeTab === 'login' ? 20 : -20 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
            
            {/* FORMULARIO DE INICIO DE SESIÓN */}
            {activeTab === 'login' && (
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="relative group">
                  <div className="relative border-b-2 border-stone-200 dark:border-stone-800 group-focus-within:border-pink-500 transition-colors duration-300 py-1">
                    <div className="flex items-center gap-2 text-stone-400 dark:text-stone-500 group-focus-within:text-pink-500 transition-colors duration-300"><Mail className="w-4 h-4" /><span className="text-[10px] font-mono uppercase tracking-widest font-bold">Email</span></div>
                    <input type="email" placeholder="tuemail@ejemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-transparent pt-2 pb-1 text-sm text-stone-900 dark:text-white focus:outline-none placeholder-stone-300 dark:placeholder-stone-700" required disabled={!!(user && role)} />
                    <div className="absolute -bottom-[2px] left-0 right-0 h-[2px] bg-gradient-to-r from-pink-500 to-amber-500 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 origin-left" />
                  </div>
                </div>
                <div className="relative group">
                  <div className="relative border-b-2 border-stone-200 dark:border-stone-800 group-focus-within:border-pink-500 transition-colors duration-300 py-1">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 text-stone-400 dark:text-stone-500 group-focus-within:text-pink-500 transition-colors duration-300"><Lock className="w-4 h-4" /><span className="text-[10px] font-mono uppercase tracking-widest font-bold">Contraseña</span></div>
                      <button type="button" onClick={() => { setActiveTab('recover'); setError(''); setSuccess(''); }} className="text-[10px] font-mono text-pink-400 dark:text-pink-500/60 hover:text-pink-500 uppercase tracking-wider transition-colors focus:outline-none" disabled={!!(user && role)}>¿Olvidaste?</button>
                    </div>
                    <div className="flex items-center">
                      <input type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-transparent pt-2 pb-1 text-sm text-stone-900 dark:text-white focus:outline-none placeholder-stone-300 dark:placeholder-stone-700" required disabled={!!(user && role)} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-stone-400 hover:text-pink-500 transition-colors" disabled={!!(user && role)}>{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                    </div>
                    <div className="absolute -bottom-[2px] left-0 right-0 h-[2px] bg-gradient-to-r from-pink-500 to-amber-500 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 origin-left" />
                  </div>
                </div>
                <button type="submit" disabled={loading || !!(user && role) || redirecting} className="w-full relative overflow-hidden group py-4 rounded-2xl text-white text-xs font-mono uppercase tracking-[0.25em] font-bold transition-all duration-300 shadow-lg shadow-pink-500/25 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed" style={{ background: 'linear-gradient(135deg, #ec4899, #f59e0b)' }}>
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {loading ? <><svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Ingresando...</> : (user && role) ? <><CheckCircle2 className="w-4 h-4" /> Sesión Activa</> : <><LogIn className="w-4 h-4" /> Ingresar al Salón</>}
                  </span>
                </button>
                <div className="text-center pt-4"><p className="text-xs text-stone-400 dark:text-stone-500">¿No tienes cuenta VIP? <button type="button" onClick={() => { setActiveTab('register'); setError(''); setSuccess(''); }} className="ml-2 text-xs font-bold text-pink-500 hover:text-pink-600 uppercase font-mono tracking-wider transition-colors focus:outline-none" disabled={!!(user && role)}>Regístrate</button></p></div>
              </form>
            )}

            {/* FORMULARIO DE REGISTRO */}
            {activeTab === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="relative group"><div className="relative border-b-2 border-stone-200 dark:border-stone-800 group-focus-within:border-pink-500 transition-colors duration-300 py-1"><div className="flex items-center gap-2 text-stone-400 dark:text-stone-500 group-focus-within:text-pink-500 transition-colors"><User className="w-4 h-4" /><span className="text-[10px] font-mono uppercase tracking-widest font-bold">Nombre Completo</span></div><input type="text" placeholder="Ej: María González" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-transparent pt-2 pb-1 text-sm text-stone-900 dark:text-white focus:outline-none placeholder-stone-300 dark:placeholder-stone-700" required disabled={!!(user && role)} /><div className="absolute -bottom-[2px] left-0 right-0 h-[2px] bg-gradient-to-r from-pink-500 to-amber-500 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 origin-left" /></div></div>
                <div className="relative group"><div className="relative border-b-2 border-stone-200 dark:border-stone-800 group-focus-within:border-pink-500 transition-colors duration-300 py-1"><div className="flex items-center gap-2 text-stone-400 dark:text-stone-500 group-focus-within:text-pink-500 transition-colors"><Mail className="w-4 h-4" /><span className="text-[10px] font-mono uppercase tracking-widest font-bold">Correo Electrónico</span></div><input type="email" placeholder="nombre@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-transparent pt-2 pb-1 text-sm text-stone-900 dark:text-white focus:outline-none placeholder-stone-300 dark:placeholder-stone-700" required disabled={!!(user && role)} /><div className="absolute -bottom-[2px] left-0 right-0 h-[2px] bg-gradient-to-r from-pink-500 to-amber-500 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 origin-left" /></div></div>
                <div className="relative group"><div className="relative border-b-2 border-stone-200 dark:border-stone-800 group-focus-within:border-pink-500 transition-colors duration-300 py-1"><div className="flex items-center gap-2 text-stone-400 dark:text-stone-500 group-focus-within:text-pink-500 transition-colors"><Lock className="w-4 h-4" /><span className="text-[10px] font-mono uppercase tracking-widest font-bold">Contraseña</span></div><div className="flex items-center"><input type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-transparent pt-2 pb-1 text-sm text-stone-900 dark:text-white focus:outline-none placeholder-stone-300 dark:placeholder-stone-700" required disabled={!!(user && role)} /><button type="button" onClick={() => setShowPassword(!showPassword)} className="text-stone-400 hover:text-pink-500 transition-colors" disabled={!!(user && role)}>{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div><div className="absolute -bottom-[2px] left-0 right-0 h-[2px] bg-gradient-to-r from-pink-500 to-amber-500 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 origin-left" /></div></div>
                <div className="relative group"><div className="relative border-b-2 border-stone-200 dark:border-stone-800 group-focus-within:border-pink-500 transition-colors duration-300 py-1"><div className="flex items-center gap-2 text-stone-400 dark:text-stone-500 group-focus-within:text-pink-500 transition-colors"><span className="text-[10px] font-mono uppercase tracking-widest font-bold">Teléfono</span></div><input type="tel" placeholder="+598 99 123 456" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-transparent pt-2 pb-1 text-sm text-stone-900 dark:text-white focus:outline-none placeholder-stone-300 dark:placeholder-stone-700" disabled={!!(user && role)} /><div className="absolute -bottom-[2px] left-0 right-0 h-[2px] bg-gradient-to-r from-pink-500 to-amber-500 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 origin-left" /></div></div>
                {referralCode && (<div className="bg-gradient-to-r from-pink-500/10 to-amber-500/10 p-4 rounded-2xl border border-pink-200/30 dark:border-pink-900/30"><div className="flex items-center gap-3"><Gift className="w-5 h-5 text-pink-500" /><div><p className="text-xs font-bold text-stone-800 dark:text-pink-100">🎉 Registro con código: <span className="text-pink-500">{referralCode}</span></p><p className="text-[10px] text-stone-500 dark:text-stone-400 mt-0.5">Recibirás <span className="font-bold text-pink-500">500 puntos</span> adicionales</p></div></div></div>)}
                <button type="submit" disabled={loading || !!(user && role) || redirecting} className="w-full relative overflow-hidden group py-4 rounded-2xl text-white text-xs font-mono uppercase tracking-[0.25em] font-bold transition-all duration-300 shadow-lg shadow-amber-500/25 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed mt-2" style={{ background: 'linear-gradient(135deg, #f59e0b, #ec4899)' }}>
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {loading ? <><svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Creando cuenta...</> : <><User className="w-4 h-4" /> Crear Cuenta VIP</>}
                  </span>
                </button>
                <div className="text-center pt-3"><p className="text-xs text-stone-400 dark:text-stone-500">¿Ya eres miembro? <button type="button" onClick={() => { setActiveTab('login'); setError(''); setSuccess(''); }} className="ml-2 text-xs font-bold text-pink-500 hover:text-pink-600 uppercase font-mono tracking-wider transition-colors focus:outline-none" disabled={!!(user && role)}>Ingresar</button></p></div>
              </form>
            )}

            {/* FORMULARIO DE RECUPERACIÓN */}
            {activeTab === 'recover' && (
              <form onSubmit={handleRecover} className="space-y-5">
                <div className="relative group">
                  <div className="relative border-b-2 border-stone-200 dark:border-stone-800 group-focus-within:border-pink-500 transition-colors duration-300 py-1">
                    <div className="flex items-center gap-2 text-stone-400 dark:text-stone-500 group-focus-within:text-pink-500 transition-colors duration-300"><Mail className="w-4 h-4" /><span className="text-[10px] font-mono uppercase tracking-widest font-bold">Tu Correo</span></div>
                    <input type="email" placeholder="tuemail@ejemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-transparent pt-2 pb-1 text-sm text-stone-900 dark:text-white focus:outline-none placeholder-stone-300 dark:placeholder-stone-700" required disabled={!!(user && role)} />
                    <div className="absolute -bottom-[2px] left-0 right-0 h-[2px] bg-gradient-to-r from-pink-500 to-amber-500 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 origin-left" />
                  </div>
                </div>
                <button type="submit" disabled={loading || !!(user && role) || redirecting} className="w-full relative overflow-hidden group py-4 rounded-2xl text-white text-xs font-mono uppercase tracking-[0.25em] font-bold transition-all duration-300 shadow-lg shadow-pink-500/25 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed" style={{ background: 'linear-gradient(135deg, #ec4899, #a78bfa)' }}>
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {loading ? <><svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Enviando enlace...</> : <><Shield className="w-4 h-4" /> Recuperar Contraseña</>}
                  </span>
                </button>
                <div className="text-center pt-3"><p className="text-xs text-stone-400 dark:text-stone-500">¿Recordaste tu clave? <button type="button" onClick={() => { setActiveTab('login'); setError(''); setSuccess(''); }} className="ml-2 text-xs font-bold text-pink-500 hover:text-pink-600 uppercase font-mono tracking-wider transition-colors focus:outline-none" disabled={!!(user && role)}>Volver a Ingresar</button></p></div>
              </form>
            )}

          </motion.div>
        </AnimatePresence>

      </motion.div>
    </div>
  )
}
