'use client'
import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Sparkles, Eye, EyeOff, LogIn, User, Shield, CheckCircle2, XCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const { signIn, role, user, loading: authLoading } = useAuth()
  const router = useRouter()

  const [mounted, setMounted] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<string>('login')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [panelEstado, setPanelEstado] = useState<Array<{hora:string; texto:string; color:string}>>([])

  const agregarEstado = function(texto: string, color: string = 'blanco') {
    const hora = new Date().toLocaleTimeString()
    const nuevo = [{hora: hora, texto: texto, color: color}]
    setPanelEstado(nuevo.concat(panelEstado).slice(0,12))
  }

  // ✅ SOLO nos movemos cuando TODO esté confirmado
  useEffect(() => {
    if (!mounted || authLoading) return

    if (user && role) {
      agregarEstado(`✅ USUARIO: ${user.email}`, 'verde')
      agregarEstado(`✅ ROL DEFINIDO: ${role}`, 'verde')
      
      const destino = ['admin','staff','owner'].includes(role) ? '/dashboard' : '/portal'
      agregarEstado(`🚀 REDIRIGIENDO A: ${destino}`, 'verde')
      
      // Usamos replace para no poder volver atrás con el botón
      setTimeout(() => router.replace(destino), 500)
    } else {
      if (!user) agregarEstado(`⚠️ ESPERANDO USUARIO...`, 'amarillo')
      if (!role) agregarEstado(`⚠️ ESPERANDO ROL...`, 'amarillo')
    }
  }, [user, role, authLoading, mounted, router])

  useEffect(function() {
    setMounted(true)
    agregarEstado('COMPONENTE LISTO', 'verde')
  }, [])

  const handleLogin = async function(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    if (!email || !password) {
      setError('Escribe correo y contraseña')
      agregarEstado('Faltan datos', 'rojo')
      return
    }
    agregarEstado('Intentando ingresar...', 'azul')
    setLoading(true)
    setError('')
    try {
      const res = await signIn(email, password)
      if (res.error) throw res.error
      agregarEstado('✓ INGRESO PROCESADO', 'verde')
      setSuccess('Confirmando datos...')
    } catch (err: any) {
      setError(err.message)
      agregarEstado(`ERROR: ${err.message}`, 'rojo')
    } finally {
      setLoading(false)
    }
  }

  const irManual = function() {
    if (!user) return agregarEstado('❌ NO HAY USUARIO', 'rojo')
    if (!role) return agregarEstado('❌ NO HAY ROL', 'rojo')
    
    const destino = ['admin','staff','owner'].includes(role) ? '/dashboard' : '/portal'
    agregarEstado(`👉 YENDO MANUALMENTE A: ${destino}`, 'verde')
    router.replace(destino)
  }

  if (!mounted) {
    return React.createElement('div', {
      className: 'flex items-center justify-center h-screen bg-black text-pink-400'
    }, 'Cargando...')
  }

  const colorClase = function(color: string) {
    if (color === 'verde') return 'text-green-400'
    if (color === 'rojo') return 'text-red-400'
    if (color === 'amarillo') return 'text-yellow-400'
    if (color === 'naranja') return 'text-orange-400'
    if (color === 'azul') return 'text-blue-400'
    return 'text-gray-300'
  }

  return React.createElement('div', {
    className: 'w-full min-h-screen bg-gradient-to-br from-pink-50 to-amber-50 dark:from-black dark:to-gray-900 flex items-center justify-center p-3'
  },
    React.createElement('div', {className: 'w-full max-w-md bg-white/90 dark:bg-gray-900/95 rounded-3xl p-4'},
      React.createElement('div', {className: 'mb-4 p-3 bg-gray-800 rounded-xl'},
        React.createElement('p', {className: 'text-xs font-bold text-gray-300 mb-2'}, 'ESTADO DEL SISTEMA:'),
        React.createElement('div', {className: 'space-y-1 text-[10px] font-mono'},
          panelEstado.map(function(item, idx) {
            return React.createElement('p', {key: idx, className: colorClase(item.color)}, '[' + item.hora + '] ' + item.texto)
          })
        ),
        React.createElement('button', {
          onClick: irManual,
          disabled: !user || !role,
          className: 'mt-3 w-full py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 text-white text-xs font-bold rounded-lg'
        }, user && role ? '✅ IR AL PANEL AHORA' : '⏳ ESPERANDO SESIÓN...')
      ),
      React.createElement('div', {className: 'text-center mb-4'},
        React.createElement('div', {
          className: 'inline-flex items-center justify-center w-14 h-14 rounded-2xl text-white mb-2',
          style: {background: 'linear-gradient(135deg, #ec4899, #f59e0b)'}
        }, React.createElement(Sparkles, {className: 'w-7 h-7'})),
        React.createElement('h2', {
          className: 'text-xl font-bold',
          style: {background: 'linear-gradient(135deg, #ec4899, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}
        }, 'Fresh Nails')
      ),
      React.createElement('div', {className: 'flex gap-1 p-1 rounded-xl bg-pink-100 dark:bg-gray-800 mb-4'},
        [
          {id: 'login', label: 'Ingresar', icon: LogIn},
          {id: 'reg', label: 'Registro', icon: User},
          {id: 'rec', label: 'Ayuda', icon: Shield}
        ].map(function(tab) {
          const activo = activeTab === tab.id
          return React.createElement('button', {
            key: tab.id,
            onClick: function() { setActiveTab(tab.id); setError('') },
            className: 'flex-1 flex items-center justify-center gap-1 p-2 rounded-lg text-[10px] font-bold ' + (activo ? 'text-white' : 'text-gray-400'),
            style: activo ? {background: 'linear-gradient(135deg, #ec4899, #f59e0b)'} : {}
          }, React.createElement(tab.icon, {className: 'w-4 h-4'}), tab.label)
        })
      ),
      error ? React.createElement('div', {className: 'mb-3 p-2 bg-red-900/30 text-red-400 text-xs rounded-lg flex items-center gap-1'}, React.createElement(XCircle, {className: 'w-3 h-3'}), error) : null,
      success ? React.createElement('div', {className: 'mb-3 p-2 bg-green-900/30 text-green-400 text-xs rounded-lg flex items-center gap-1'}, React.createElement(CheckCircle2, {className: 'w-3 h-3'}), success) : null,
      activeTab === 'login' ? React.createElement('form', {onSubmit: handleLogin, className: 'space-y-4'},
        React.createElement('div', null,
          React.createElement('label', {className: 'text-xs text-gray-500'}, 'Correo'),
          React.createElement('input', {
            type: 'email',
            value: email,
            onChange: function(e) { setEmail(e.target.value) },
            className: 'w-full p-2 border-b border-gray-300 dark:border-gray-700 bg-transparent text-sm focus:border-pink-500 outline-none',
            required: true
          })
        ),
        React.createElement('div', null,
          React.createElement('label', {className: 'text-xs text-gray-500'}, 'Contraseña'),
          React.createElement('div', {className: 'flex items-center'},
            React.createElement('input', {
              type: showPassword ? 'text' : 'password',
              value: password,
              onChange: function(e) { setPassword(e.target.value) },
              className: 'flex-1 p-2 border-b border-gray-300 dark:border-gray-700 bg-transparent text-sm focus:border-pink-500 outline-none',
              required: true
            }),
            React.createElement('button', {
              type: 'button',
              onClick: function() { setShowPassword(!showPassword) },
              className: 'p-2 text-gray-500'
            }, showPassword ? React.createElement(EyeOff, {size: 16}) : React.createElement(Eye, {size: 16}))
          )
        ),
        React.createElement('button', {
          type: 'submit',
          disabled: loading,
          className: 'w-full py-3 rounded-xl text-white text-xs font-bold',
          style: {background: 'linear-gradient(135deg, #ec4899, #f59e0b)'}
        }, loading ? '...' : 'Ingresar')
      ) : null
    )
  )
}
