'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Mail, Lock, Eye, EyeOff, User, LogIn, Shield, CheckCircle2, XCircle } from 'lucide-react'

export default function AuthMobilDefinitivo() {
  const { signIn, role, user, loading: authLoading } = useAuth

  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'recover'>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // 🟦 PANEL DE ESTADO VISIBLE EN PANTALLA
  const [panelEstado, setPanelEstado] = useState<Array<{hora:string; texto:string; color:string}>>([])
  const agregarEstado = (texto:string, color:string='blanco') => {
    const hora = new Date().toLocaleTimeString()
    setPanelEstado(antiguo => [{hora, texto, color}, ...antiguo].slice(0,8))
  }

  // 🔄 ACTUALIZA ESTADO EN TIEMPO REAL
  useEffect(() => {
    if (!mounted) return
    agregarEstado(`Usuario: ${user?.email || 'NO DETECTADO'}`, user ? 'verde' : 'rojo')
    agregarEstado(`Rol: ${role || 'NO CARGADO'}`, role ? 'verde' : 'amarillo')
    agregarEstado(`Cargando: ${authLoading ? 'SÍ' : 'NO'}`, authLoading ? 'naranja' : 'verde')
    agregarEstado(`Ruta: ${window.location.pathname}`, 'azul')
  }, [user, role, authLoading, mounted])

  useEffect(() => {
    setMounted(true)
    agregarEstado('✅ Componente listo', 'verde')
  }, [])

  // ============================================================
  // INICIO DE SESIÓN
  // ============================================================
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    if (!email || !password) {
      setError('⚠️ Escribe correo y contraseña')
      agregarEstado('Faltan datos', 'rojo')
      return
    }

    agregarEstado(`Intentando: ${email}`, 'azul')
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const { error: errorIngreso } = await signIn(email, password)
      if (errorIngreso) throw errorIngreso

      agregarEstado('✅ INGRESO EXITOSO', 'verde')
      setSuccess('¡Bien! Redirigiendo...')
      
      setTimeout(() => {
        agregarEstado('🔄 Activando...', 'naranja')
        window.location.reload()
      }, 1200)

    } catch (err:any) {
      agregarEstado(`❌ Error: ${err.message}`, 'rojo')
      setError(err.message || 'No se pudo ingresar')
    } finally {
      setLoading(false)
    }
  }

  // ============================================================
  // BOTÓN MANUAL
  // ============================================================
  const irYoMismo = () => {
    if (!user || !role) {
      agregarEstado('❌ Falta usuario o rol', 'rojo')
      return
    }
    const destino = ['admin','staff','owner'].includes(role) ? '/dashboard' : '/portal'
    agregarEstado(`👉 Yendo a: ${destino}`, 'verde')
    window.location.replace(destino)
  }

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0908] text-pink-400 text-sm">
        Iniciando...
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-pink-50/30 via-white to-amber-50/20 dark:from-[#0a0908] dark:via-[#0f0c1b] dark:to-[#0a0908] flex items-center justify-center p-3">
      <div className="w-full max-w-md bg-white/90 dark:bg-[#141211]/95 rounded-3xl p-4 shadow-xl">

        {/* 🟦 RECUADRO DE ESTADO */}
        <div className="mb-4 p-3 bg-gray-900/90 rounded-xl border border-gray-700">
          <p className="text-xs font-bold text-gray-300 mb-2">📋 LO QUE PASA:</p>
          <div className="space-y-1 text-[10px] font-mono">
            {panelEstado.map((e, i) => (
              <p key={i} className={`
                ${e.color==='verde'?'text-green-400'}
                ${e.color==='rojo'?'text-red-400'}
                ${e.color==='amarillo'?'text-yellow-400'}
                ${e.color==='naranja'?'text-orange-400'}
                ${e.color==='azul'?'text-blue-400'}
              `}>[{e.hora}] {e.texto}</p>
            ))}
          </div>

          {user && role && (
            <button onClick={irYoMismo} className="mt-3 w-full py-2 bg-green-600 hover:bg-green-500 text-white text-[11px] font-bold rounded-lg">
              🛠️ IR AL PANEL AHORA
            </button>
          )}
        </div>

        {/* ENCABEZADO */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl text-white mb-2" style={{background:'linear-gradient(135deg,#ec4899,#f59e0b)'}}>
            <Sparkles className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold" style={{background:'linear-gradient(135deg,#ec4899,#f59e0b)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Fresh Nails</h2>
        </div>

        {/* PESTAÑAS */}
        <div className="flex gap-1 p-1 rounded-xl bg-pink-50/50 dark:bg-[#1a1520] mb-4">
          {[
            {id:'login',label:'Ingresar',icon:LogIn},
            {id:'register',label:'Registro',icon:User},
            {id:'recover',label:'Ayuda',icon:Shield}
          ].map(tab=>{
            const Icon = tab.icon
            const activo = activeTab===tab.id
            return (
              <button key={tab.id} onClick={()=>{setActiveTab(tab.id as any);setError('');setSuccess('')}}
                className={`flex-1 flex items-center justify-center gap-1 p-2 rounded-lg text-[10px] font-bold ${activo?'text-white':'text-gray-400'}`}
                style={activo?{background:'linear-gradient(135deg,#ec4899,#f59e0b)'}:{}}>
                <Icon className="w-3.5 h-3.5"/>
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* MENSAJES */}
        <AnimatePresence>
          {error && (
            <div className="mb-3 p-2 bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] rounded-lg flex items-center gap-1">
              <XCircle className="w-3 h-3"/>{error}
            </div>
          )}
          {success && (
            <div className="mb-3 p-2 bg-green-500/10 border border-green-500/30 text-green-400 text-[10px] rounded-lg flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3"/>{success}
            </div>
          )}
        </AnimatePresence>

        {/* FORMULARIO */}
        {activeTab==='login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-[10px] font-mono text-gray-500">Correo</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                className="w-full p-2 border-b border-gray-300 dark:border-gray-700 bg-transparent text-sm focus:border-pink-500 outline-none"
                placeholder="tu@correo.com" required/>
            </div>
            <div>
              <label className="text-[10px] font-mono text-gray-500">Contraseña</label>
              <div className="flex items-center">
                <input type={showPassword?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)}
                  className="flex-1 p-2 border-b border-gray-300 dark:border-gray-700 bg-transparent text-sm focus:border-pink-500 outline-none"
                  placeholder="••••••••" required/>
                <button type="button" onClick={()=>setShowPassword(!showPassword)} className="p-2 text-gray-500">
                  {showPassword?<EyeOff size={16}/>:<Eye size={16}/>}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl text-white text-xs font-bold uppercase tracking-wider disabled:opacity-50"
              style={{background:'linear-gradient(135deg,#ec4899,#f59e0b)'}}>
              {loading?'Ingresando...':'Ingresar'}
            </button>
          </form>
        )}

        {activeTab==='register' && <div className="text-center text-[11px] text-gray-400 p-4">Prueba primero ingresar</div>}
        {activeTab==='recover' && <div className="text-center text-[11px] text-gray-400 p-4">Prueba primero ingresar</div>}
      </div>
    </div>
  )
}
