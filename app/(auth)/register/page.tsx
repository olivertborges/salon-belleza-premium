'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterCliente() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      })
      if (signUpError) throw signUpError

      if (authData?.user) {
        const { data: nuevoCliente, error: clientError } = await supabase
          .from('clients')
          .insert([
            { 
              name, 
              phone, 
              email,
              auth_user_id: authData.user.id
            }
          ])
          .select()

        if (clientError) throw clientError

        if (nuevoCliente && nuevoCliente.length > 0) {
          localStorage.setItem('cliente_id', nuevoCliente[0].id)
          localStorage.setItem('cliente_telefono', nuevoCliente[0].phone)
        }
        
        router.push('/portal')
      }
    } catch (err: any) {
      setError(err.message || 'Error en el registro.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full min-h-[85vh] flex items-center justify-center p-4 relative overflow-hidden selection:bg-amber-500 selection:text-black">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] bg-gradient-to-tr from-amber-600/10 to-transparent blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md bg-[#141211]/40 backdrop-blur-xl border border-stone-800/80 rounded-3xl p-6 md:p-8 shadow-2xl relative transition-all duration-500 hover:border-stone-700/50">
        
        <div className="text-center mb-6">
          <span className="text-[10px] font-mono tracking-widest text-amber-500 uppercase font-bold">Club de Miembros</span>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">Crea tu Cuenta</h1>
          <p className="text-xs text-stone-500 mt-1">Regístrate para agendar turnos y disfrutar beneficios exclusivos.</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl font-mono text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-400 mb-1.5 ml-1">Nombre Completo</label>
            <input
              type="text"
              placeholder="Ej: Valentina Gómez"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#0e0d0c]/80 border border-stone-800 focus:border-amber-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder-stone-600 focus:outline-none transition-all duration-300"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-400 mb-1.5 ml-1">Teléfono Móvil</label>
            <input
              type="tel"
              placeholder="Ej: 1123456789"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-[#0e0d0c]/80 border border-stone-800 focus:border-amber-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder-stone-600 focus:outline-none transition-all duration-300"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-400 mb-1.5 ml-1">Email</label>
            <input
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#0e0d0c]/80 border border-stone-800 focus:border-amber-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder-stone-600 focus:outline-none transition-all duration-300"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-400 mb-1.5 ml-1">Contraseña</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0e0d0c]/80 border border-stone-800 focus:border-amber-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder-stone-600 focus:outline-none transition-all duration-300"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full relative group bg-amber-500 hover:bg-amber-400 text-black text-xs font-mono uppercase tracking-widest font-bold py-3.5 rounded-xl transition-all duration-300 overflow-hidden shadow-lg disabled:opacity-50 mt-2"
          >
            <span className="relative z-10">{loading ? 'Creando cuenta...' : 'Confirmar Registro'}</span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shine_0.8s_ease-in-out]" />
          </button>
        </form>

        <div className="mt-6 text-center border-t border-stone-900 pt-4">
          <p className="text-xs text-stone-500">
            ¿Ya tienes una cuenta?
            <Link href="/login" className="ml-1.5 text-xs text-amber-400 hover:text-amber-300 font-bold transition-colors">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
