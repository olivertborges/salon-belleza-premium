'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { FaEnvelope, FaLock } from 'react-icons/fa'

export default function LoginPage() {
  const { signIn, role } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await signIn(email, password)
      // Redirigir según rol después de un momento
      setTimeout(() => {
        if (role === 'admin') {
          router.push('/admin')
        } else {
          router.push('/')
        }
      }, 500)
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-light text-stone-900 tracking-tight">
            Fresh<span className="font-medium">Nails</span>
          </h1>
          <p className="text-sm text-stone-400 font-light mt-1">Inicia sesión en tu cuenta</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-600 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">Email</label>
            <div className="relative">
              <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300 text-sm" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-400 transition-all"
                placeholder="tu@email.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">Contraseña</label>
            <div className="relative">
              <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300 text-sm" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-400 transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-stone-900 text-white py-3 rounded-xl font-medium text-sm hover:bg-stone-800 transition-all disabled:opacity-50"
          >
            {loading ? 'Cargando...' : 'Iniciar sesión'}
          </button>

          <p className="text-center text-xs text-stone-400">
            ¿No tienes cuenta?{' '}
            <Link href="/register" className="text-stone-600 hover:underline">
              Regístrate
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
