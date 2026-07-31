// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sparkles, Mail, Lock, Eye, EyeOff, 
  User, LogIn, Shield, Crown, Gem, 
  ArrowRight, CheckCircle2, XCircle,
  Heart, Star, Zap, Fingerprint, 
  Flower2, Waves, Palette, Gift
} from 'lucide-react'

// ===== ANIMACIONES ORIGINALES =====
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

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [referralCode, setReferralCode] = useState('')

  useEffect(() => {
    setMounted(true)

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

  // ===== VERIFICACIÓN AUTOMÁTICA Y REDIRECCIÓN LIMPIA =====
  useEffect(() => {
    if (!mounted || authLoading) return
    if (!user) return
    if (isRedirecting) return

    const verificarRolYRedirigir = async () => {
      setIsRedirecting(true)
      
      try {
        const { data: staffMember, error: staffError } = await supabase
          .from('staff')
          .select('auth_role')
          .eq('user_id', user.id)
          .maybeSingle()

        if (staffError) throw staffError

        let targetPath = '/portal' 

        if (staffMember && staffMember.auth_role) {
          const rol = staffMember.auth_role.toLowerCase().trim()
          if (rol === 'admin' || rol === 'staff' || rol === 'owner') {
            targetPath = '/dashboard'
          }
        } 
        
        if (targetPath !== '/dashboard' && (role === 'admin' || role === 'owner')) {
          targetPath = '/dashboard'
        }

        const finalPath = redirectPath !== '/portal' && redirectPath !== '/login' 
          ? redirectPath 
          : targetPath

        router.replace(finalPath)
        router.refresh() 

      } catch (err) {
        console.error(err)
        router.replace('/portal')
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

    try {
      const { error: signInError } = await signIn(email, password)
      if (signInError) throw signInError

      setSuccess('¡Ingreso correcto!')
      setLoginSuccess(true)

    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado.')
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

  if (!mounted) return null

  // ===== ELEMENTOS DE INTERFAZ Y RENDERIZADO =====
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
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition-all duration-300 ${
              isActive
                ? 'bg-[#1A0E0A] text-[#FFF9F6] shadow-lg shadow-[#1A0E0A]/25'
                : 'text-[#5C4A3E] hover:text-[#1A0E0A]'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        )
      })}
    </div>
  )

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-[#FFF9F6] via-white to-[#FFF9F6]/50 flex items-center justify-center p-4 relative overflow-hidden">
      <BackgroundDecorations />
      
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="w-full max-w-md bg-white/95 backdrop-blur-2xl border border-[#F0E4DA] rounded-[32px] p-6 shadow-2xl relative"
      >
        {/* HEADER */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl text-[#1A0E0A] shadow-xl shadow-[#D4AF37]/25 mb-3" style={{ background: 'linear-gradient(135deg, #D4AF37, #E8D5A0)' }}>
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-serif font-extrabold text-[#1A0E0A] tracking-tight">Fresh Nails</h2>
          <p className="text-[10px] font-mono tracking-[0.3em] text-[#5C4A3E] font-bold uppercase mt-1">
            {activeTab === 'login' && '✨ Bienvenida de vuelta'}
            {activeTab === 'register' && '🌟 Únete al Club'}
            {activeTab === 'recover' && '🔐 Recupera tu acceso'}
          </p>
        </div>

        <Tabs />

        {/* MENSAJES DE ERROR/ÉXITO */}
        <AnimatePresence mode="wait">
          {error && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs rounded-xl font-mono text-center flex items-center justify-center gap-2">
              <XCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs rounded-xl font-mono text-center flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" /> {success}
            </div>
          )}
        </AnimatePresence>

        {/* FORMULARIOS */}
        <AnimatePresence mode="wait">
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="relative group border-b-2 border-[#F0E4DA] py-1">
                <div className="flex items-center gap-2 text-[#5C4A3E] text-[10px] font-mono uppercase tracking-widest font-bold">
                  <Mail className="w-4 h-4" /> <span>Email</span>
                </div>
                <input type="email" placeholder="tuemail@ejemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-transparent pt-2 pb-1 text-sm text-[#1A0E0A] focus:outline-none" required />
              </div>

              <div className="relative group border-b-2 border-[#F0E4DA] py-1">
                <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-widest font-bold text-[#5C4A3E]">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4" /> <span>Contraseña</span>
                  </div>
                </div>
                <div className="flex items-center">
                  <input type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-transparent pt-2 pb-1 text-sm text-[#1A0E0A] focus:outline-none" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-[#A89588]">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full py-4 rounded-2xl text-[#1A0E0A] text-xs font-mono uppercase tracking-[0.25em] font-bold shadow-lg shadow-[#D4AF37]/25" style={{ background: 'linear-gradient(135deg, #D4AF37, #E8D5A0)' }}>
                {loading ? 'Ingresando...' : 'Ingresar al Salón'}
              </button>
            </form>
          )}

          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="relative group border-b-2 border-[#F0E4DA] py-1">
                <div className="flex items-center gap-2 text-[#5C4A3E] text-[10px] font-mono uppercase tracking-widest font-bold">
                  <User className="w-4 h-4" /> <span>Nombre Completo</span>
                </div>
                <input type="text" placeholder="Ej: María González" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-transparent pt-2 pb-1 text-sm text-[#1A0E0A] focus:outline-none" required />
              </div>

              <div className="relative group border-b-2 border-[#F0E4DA] py-1">
                <div className="flex items-center gap-2 text-[#5C4A3E] text-[10px] font-mono uppercase tracking-widest font-bold">
                  <Mail className="w-4 h-4" /> <span>Correo</span>
                </div>
                <input type="email" placeholder="nombre@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-transparent pt-2 pb-1 text-sm text-[#1A0E0A] focus:outline-none" required />
              </div>

              <div className="relative group border-b-2 border-[#F0E4DA] py-1">
                <div className="flex items-center gap-2 text-[#5C4A3E] text-[10px] font-mono uppercase tracking-widest font-bold">
                  <Lock className="w-4 h-4" /> <span>Contraseña</span>
                </div>
                <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-transparent pt-2 pb-1 text-sm text-[#1A0E0A] focus:outline-none" required />
              </div>

              <button type="submit" disabled={loading} className="w-full py-4 rounded-2xl text-[#1A0E0A] text-xs font-mono uppercase tracking-[0.25em] font-bold" style={{ background: 'linear-gradient(135deg, #E8D5A0, #D4AF37)' }}>
                Crear Cuenta VIP
              </button>
            </form>
          )}

          {activeTab === 'recover' && (
            <form onSubmit={handleRecover} className="space-y-5">
              <p className="text-xs text-[#5C4A3E] text-center">Ingresa tu email para recibir un enlace de recuperación.</p>
              <div className="relative group border-b-2 border-[#F0E4DA] py-1">
                <input type="email" placeholder="tuemail@ejemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-transparent pt-2 pb-1 text-sm text-[#1A0E0A] focus:outline-none" required />
              </div>
              <button type="submit" className="w-full py-4 rounded-2xl text-[#1A0E0A] text-xs font-mono uppercase tracking-[0.25em]" style={{ background: 'linear-gradient(135deg, #D4AF37, #E8D5A0)' }}>
                Enviar Enlace
              </button>
            </form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
