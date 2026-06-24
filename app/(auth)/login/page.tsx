'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FaEye, FaEyeSlash, FaGem, FaArrowRight, FaLock, FaEnvelope, FaUser } from 'react-icons/fa'

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState('client') // Para simular en el registro
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // SIMULACIÓN DE ENRUTAMIENTO POR ROL
    // Si el correo contiene palabras clave, te manda a su respectivo panel
    if (email.includes('admin')) {
      router.push('/dashboard/admin')
    } else if (email.includes('staff')) {
      router.push('/dashboard/staff')
    } else {
      router.push('/dashboard/client')
    }
  }

  return (
    <main className="min-h-screen bg-[#0d0b0a] text-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Glow Efectos */}
      <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-rose-900/10 rounded-full filter blur-[100px]" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[500px] h-[500px] bg-amber-950/10 rounded-full filter blur-[100px]" />

      <div className="w-full max-w-md bg-[#141211] border border-stone-850 rounded-3xl p-8 shadow-2xl relative z-10">
        <div className="text-center mb-8 space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 text-xl font-serif italic text-amber-200">
            <FaGem className="text-rose-500 text-sm animate-pulse" /> Atelier
          </Link>
          <h2 className="text-3xl font-extralight tracking-tight text-stone-100">
            {isLogin ? 'Bienvenida de nuevo' : 'Crea tu Cuenta VIP'}
          </h2>
          <p className="text-xs text-stone-400 font-light">
            {isLogin ? 'Ingresa tus credenciales de acceso de lujo.' : 'Únete al club y gestiona tus citas al instante.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-widest text-stone-400 font-medium">Nombre Completo</label>
              <div className="relative">
                <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-600 text-xs" />
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre y apellido" 
                  className="w-full bg-stone-900 border border-stone-800 focus:border-rose-500 focus:outline-none text-sm rounded-xl pl-10 pr-4 py-3.5 text-stone-200 transition-colors"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-widest text-stone-400 font-medium">Correo Electrónico</label>
            <div className="relative">
              <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-600 text-xs" />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@atelier.com" 
                className="w-full bg-stone-900 border border-stone-800 focus:border-rose-500 focus:outline-none text-sm rounded-xl pl-10 pr-4 py-3.5 text-stone-200 transition-colors"
              />
            </div>
            {isLogin && (
              <p className="text-[10px] text-stone-500 font-mono mt-1">
                💡 Tip: Usa "admin@test.com" o "staff@test.com" para probar los roles.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-widest text-stone-400 font-medium">Contraseña</label>
            <div className="relative">
              <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-600 text-xs" />
              <input 
                type={showPassword ? 'text' : 'password'} 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                className="w-full bg-stone-900 border border-stone-800 focus:border-rose-500 focus:outline-none text-sm rounded-xl pl-10 pr-12 py-3.5 text-stone-200 transition-colors"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 transition-colors"
              >
                {showPassword ? <FaEyeSlash className="text-xs" /> : <FaEye className="text-xs" />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-widest text-stone-400 font-medium">Tipo de Perfil (Simulación)</label>
              <select 
                value={role} 
                onChange={(e) => {
                  setRole(e.target.value)
                  if(e.target.value === 'admin') setEmail('admin@atelier.com')
                  else if(e.target.value === 'staff') setEmail('staff@atelier.com')
                  else setEmail('')
                }}
                className="w-full bg-stone-900 border border-stone-800 focus:border-rose-500 focus:outline-none text-sm rounded-xl px-4 py-3.5 text-stone-200 transition-colors"
              >
                <option value="client">Cliente VIP</option>
                <option value="staff">Especialista (Staff)</option>
                <option value="admin">Administrador General</option>
              </select>
            </div>
          )}

          <button type="submit" className="w-full bg-gradient-to-r from-rose-600 to-amber-600 hover:opacity-90 text-white font-medium text-sm tracking-wider py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2">
            {isLogin ? 'ENTRAR AL ATELIER' : 'REGISTRARME AHORA'}
            <FaArrowRight className="text-xs" />
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)} 
            className="text-xs text-stone-400 hover:text-rose-400 border-b border-stone-800 pb-0.5 transition-colors"
          >
            {isLogin ? '¿No tienes cuenta? Regístrate aquí' : '¿Ya eres miembro? Inicia sesión'}
          </button>
        </div>
      </div>
    </main>
  )
}
