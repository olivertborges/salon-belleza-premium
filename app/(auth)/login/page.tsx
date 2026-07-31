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
  CheckCircle2, XCircle
} from 'lucide-react'

// ===== ANIMACIONES =====
const containerVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1], staggerChildren: 0.08, delayChildren: 0.15 }
  },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.4, ease: "easeInOut" } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
}

export default function AuthMobilDefinitivo() {
  const router = useRouter()
  const { role } = useAuth() 

  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'recover'>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [redirectPath, setRedirectPath] = useState('/portal')
  const [isRedirecting, setIsRedirecting] = useState(false)

  // LOG VISUAL EN PANTALLA
  const [debugLog, setDebugLog] = useState('Listo para iniciar.')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [referralCode, setReferralCode] = useState('')

  useEffect(() => {
    setMounted(true)
    const searchParams = new URLSearchParams(window.location.search);
    const redirect = searchParams.get('redirect');
    if (redirect) setRedirectPath(redirect)
  }, [])

  // GESTIÓN MANUAL DE LOGIN (Evita redirecciones fantasmas y asegura cookies)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading || isRedirecting) return

    setLoading(true)
    setIsRedirecting(true) 
    setError('')
    setSuccess('')
    setDebugLog('1. Enviando credenciales directamente a Supabase Auth...')

    try {
      // Autenticación usando el cliente del navegador
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      })

      if (authError) throw authError
      
      const loggedUser = authData?.user
      if (!loggedUser) throw new Error("Sesión iniciada pero no se retornó información de usuario.")

      setDebugLog(`2. Login correcto. UUID Auth: ${loggedUser.id}. Buscando en tabla 'staff'...`)

      // Consulta exacta vinculando por user_id físico de la base de datos
      const { data: staffMember, error: staffError } = await supabase
        .from('staff')
        .select('role')
        .eq('user_id', loggedUser.id)
        .maybeSingle()

      if (staffError) {
        setDebugLog(`❌ Error Supabase al leer staff: ${staffError.message}`)
        throw staffError
      }

      // Si no es un miembro de staff
      if (!staffMember) {
        setDebugLog(`ℹ️ El UUID no está en la tabla staff. Redirigiendo a /portal (Área de clientes)`)
        setTimeout(() => {
          router.replace('/portal')
          router.refresh()
        }, 2500)
        return
      }

      // Si es staff, evaluamos el rol administrativo
      const systemRole = staffMember.role ? staffMember.role.toLowerCase().trim() : 'staff'
      setDebugLog(`3. ¡Usuario hallado en staff! Rol detectado: "${systemRole}"`)

      let targetPath = '/portal'
      if (systemRole === 'admin' || systemRole === 'staff' || systemRole === 'owner') {
        targetPath = '/dashboard'
        setDebugLog(`🎯 Rol autorizado para administración. Destino: /dashboard`)
      } else {
        setDebugLog(`⚠️ Rol "${systemRole}" no administrativo. Destino: /portal`)
      }

      const finalPath = redirectPath !== '/portal' && redirectPath !== '/login' 
        ? redirectPath 
        : targetPath

      setDebugLog(`4. Procesando redirección final hacia: ${finalPath}`)
      
      setTimeout(() => {
        router.replace(finalPath)
        router.refresh()
      }, 2000)

    } catch (err: any) {
      setError(err.message || 'Error en el proceso de autenticación.')
      setDebugLog(`❌ Fallo en el proceso: ${err.message || err}`)
      setIsRedirecting(false)
      setLoading(false)
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
      if (!res.ok || !data.success) throw new Error(data.error || 'No se pudo crear la cuenta')

      setSuccess('✅ ¡Registro exitoso!')
      handleLogin(e)
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
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (resetError) throw resetError
      setSuccess('📧 Enlace enviado a tu correo.')
    } catch (err: any) {
      setError(err.message || 'Error al enviar recuperación.')
    } finally {
      setLoading(false)
    }
  }

  // TERMINAL DE DIAGNÓSTICO EN VIVO
  if (isRedirecting) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#1E120C] p-6 text-center">
        <div className="relative mb-6">
          <div className="w-16 h-16 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="absolute inset-0 w-16 h-16 rounded-full animate-ping opacity-20 bg-[#D4AF37]" />
        </div>
        <p className="font-mono text-xs uppercase tracking-widest text-[#D4AF37] font-bold mb-4">
          Sincronizando Seguridad...
        </p>
        
        <div className="w-full max-w-sm bg-black/80 border border-[#D4AF37]/40 rounded-xl p-4 text-left shadow-2xl">
          <p className="text-[10px] font-mono text-[#D4AF37] uppercase tracking-wider mb-2 font-bold">📋 Traza del Sistema:</p>
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
        <div className="w-12 h-12 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-[#FFF9F6] via-white to-[#FFF9F6]/50 flex items-center justify-center p-4 relative overflow-hidden">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="w-full max-w-md bg-white/95 backdrop-blur-2xl border border-[#F0E4DA] rounded-[32px] p-6 shadow-2xl relative overflow-hidden"
      >
        <motion.div variants={itemVariants} className="text-center mb-6 relative">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl text-[#1A0E0A] mb-3 shadow-xl shadow-[#D4AF37]/25" style={{ background: 'linear-gradient(135deg, #D4AF37, #E8D5A0)' }}>
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-serif font-extrabold text-[#1A0E0A] tracking-tight">Fresh Nails</h2>
          <p className="text-[10px] font-mono tracking-[0.3em] text-[#5C4A3E] font-bold uppercase mt-1">
            {activeTab === 'login' && '✨ Acceso Móvil Seguro'}
            {activeTab === 'register' && '🌟 Únete al Club'}
            {activeTab === 'recover' && '🔐 Recupera tu acceso'}
          </p>
        </motion.div>

        {/* Selector de Pestañas */}
        <div className="flex gap-1 p-1 rounded-2xl border mb-6 bg-[#FFF9F6] border-[#F0E4DA]">
          {['login', 'register', 'recover'].map((tabId) => (
            <button
              key={tabId}
              type="button"
              onClick={() => { setActiveTab(tabId as any); setError(''); setSuccess(''); }}
              className={`flex-1 py-2.5 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition-all ${
                activeTab === tabId ? 'bg-[#1A0E0A] text-[#FFF9F6] shadow-md' : 'text-[#5C4A3E]'
              }`}
            >
              {tabId === 'login' ? 'Ingresar' : tabId === 'register' ? 'Registro' : 'Ayuda'}
            </button>
          ))}
        </div>

        {/* Notificaciones */}
        <AnimatePresence mode="wait">
          {error && <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs rounded-xl font-mono text-center">{error}</div>}
          {success && <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs rounded-xl font-mono text-center">{success}</div>}
        </AnimatePresence>

        {/* Formularios */}
        <AnimatePresence mode="wait">
          <motion.div key={`${activeTab}-content`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
            {activeTab === 'login' && (
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="border-b-2 border-[#F0E4DA] py-1">
                  <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-[#5C4A3E]">Email</span>
                  <input type="email" placeholder="tuemail@ejemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-transparent pt-2 pb-1 text-sm text-[#1A0E0A] focus:outline-none" required />
                </div>
                <div className="border-b-2 border-[#F0E4DA] py-1">
                  <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-[#5C4A3E]">Contraseña</span>
                  <div className="flex items-center">
                    <input type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-transparent pt-2 pb-1 text-sm text-[#1A0E0A] focus:outline-none" required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-[#A89588]">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                  </div>
                </div>
                <button type="submit" disabled={loading || isRedirecting} className="w-full py-4 rounded-2xl text-[#1A0E0A] text-xs font-mono uppercase tracking-[0.25em] font-bold shadow-lg shadow-[#D4AF37]/25" style={{ background: 'linear-gradient(135deg, #D4AF37, #E8D5A0)' }}>
                  {loading ? 'Validando...' : 'Iniciar Sesión'}
                </button>
              </form>
            )}

            {activeTab === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="border-b-2 border-[#F0E4DA] py-1">
                  <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-[#5C4A3E]">Nombre Completo</span>
                  <input type="text" placeholder="Ej: María González" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-transparent pt-2 pb-1 text-sm text-[#1A0E0A] focus:outline-none" required />
                </div>
                <div className="border-b-2 border-[#F0E4DA] py-1">
                  <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-[#5C4A3E]">Email</span>
                  <input type="email" placeholder="nombre@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-transparent pt-2 pb-1 text-sm text-[#1A0E0A] focus:outline-none" required />
                </div>
                <div className="border-b-2 border-[#F0E4DA] py-1">
                  <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-[#5C4A3E]">Contraseña</span>
                  <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-transparent pt-2 pb-1 text-sm text-[#1A0E0A] focus:outline-none" required />
                </div>
                <button type="submit" disabled={loading || isRedirecting} className="w-full py-4 rounded-2xl text-[#1A0E0A] text-xs font-mono uppercase tracking-[0.25em] font-bold shadow-lg shadow-[#D4AF37]/25" style={{ background: 'linear-gradient(135deg, #E8D5A0, #D4AF37)' }}>
                  Crear Cuenta VIP
                </button>
              </form>
            )}

            {activeTab === 'recover' && (
              <form onSubmit={handleRecover} className="space-y-5">
                <p className="text-xs text-[#5C4A3E] text-center">Ingresa tu email para recibir un enlace de acceso.</p>
                <input type="email" placeholder="tuemail@ejemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-transparent border-b-2 border-[#F0E4DA] pt-2 pb-1 text-sm text-[#1A0E0A] focus:outline-none" required />
                <button type="submit" disabled={loading} className="w-full py-4 rounded-2xl text-[#1A0E0A] text-xs font-mono uppercase tracking-[0.25em] font-bold" style={{ background: 'linear-gradient(135deg, #D4AF37, #E8D5A0)' }}>
                  Enviar Correo
                </button>
              </form>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
