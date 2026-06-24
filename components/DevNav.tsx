'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Home, 
  Calendar, 
  Scissors, 
  Star, 
  Store, 
  GraduationCap, 
  Image, 
  User, 
  UserCog, 
  Shield, 
  LogOut,
  Menu,
  X,
  Settings,
  LayoutDashboard
} from 'lucide-react'

export default function DevNav() {
  const [isOpen, setIsOpen] = useState(false)
  const [devRole, setDevRole] = useState('client')
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    const role = localStorage.getItem('dev_role') || 'client'
    setDevRole(role)
  }, [])

  if (process.env.NODE_ENV === 'production') {
    return null
  }

  const handleRoleChange = (newRole: 'client' | 'staff' | 'admin') => {
    localStorage.setItem('dev_role', newRole)
    setDevRole(newRole)
    // Recargar para aplicar el cambio
    window.location.reload()
  }

  const handleLogout = () => {
    localStorage.removeItem('dev_role')
    setDevRole('client')
    window.location.href = '/'
  }

  if (!isClient) {
    return null
  }

  // Determinar qué panel mostrar según el rol
  const getDashboardLink = () => {
    if (devRole === 'admin') return '/admin'
    if (devRole === 'staff') return '/dashboard/staff'
    return '/dashboard/client'
  }

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 bg-stone-900 text-white p-3 rounded-full shadow-2xl hover:bg-stone-800 transition-all"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Panel de DevNav */}
      <div className={`fixed bottom-20 right-4 z-50 bg-white border border-stone-200 rounded-2xl shadow-2xl p-4 w-64 transition-all duration-300 ${
        isOpen ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'
      }`}>
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-stone-100">
          <div className="w-8 h-8 bg-gradient-to-br from-rose-500 to-amber-500 rounded-lg flex items-center justify-center text-white text-sm font-bold">
            🛠️
          </div>
          <div>
            <p className="text-xs font-bold text-stone-900">Dev Panel</p>
            <p className="text-[8px] text-stone-400 font-mono uppercase tracking-wider">
              Rol: <span className="font-bold text-stone-700">{devRole}</span>
            </p>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-[8px] font-mono uppercase tracking-widest text-stone-400 px-2 py-1">
            Cambiar rol
          </p>
          
          <button
            onClick={() => handleRoleChange('client')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              devRole === 'client'
                ? 'bg-rose-50 text-rose-600 border border-rose-200'
                : 'text-stone-600 hover:bg-stone-50'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Cliente
            {devRole === 'client' && <span className="ml-auto text-[8px] font-mono text-rose-400">●</span>}
          </button>

          <button
            onClick={() => handleRoleChange('staff')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              devRole === 'staff'
                ? 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                : 'text-stone-600 hover:bg-stone-50'
            }`}
          >
            <UserCog className="w-3.5 h-3.5" />
            Staff
            {devRole === 'staff' && <span className="ml-auto text-[8px] font-mono text-indigo-400">●</span>}
          </button>

          <button
            onClick={() => handleRoleChange('admin')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              devRole === 'admin'
                ? 'bg-red-50 text-red-600 border border-red-200'
                : 'text-stone-600 hover:bg-stone-50'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Admin
            {devRole === 'admin' && <span className="ml-auto text-[8px] font-mono text-red-400">●</span>}
          </button>

          <div className="border-t border-stone-100 my-2 pt-2">
            <p className="text-[8px] font-mono uppercase tracking-widest text-stone-400 px-2 py-1">
              Accesos rápidos
            </p>
            
            <Link href={getDashboardLink()} className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-stone-600 hover:bg-stone-50 transition-all w-full">
              <LayoutDashboard className="w-3.5 h-3.5" />
              Panel {devRole === 'admin' ? 'Admin' : devRole === 'staff' ? 'Staff' : 'Cliente'}
            </Link>

            <Link href="/" className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-stone-600 hover:bg-stone-50 transition-all w-full">
              <Home className="w-3.5 h-3.5" />
              Inicio
            </Link>

            <Link href="/servicios" className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-stone-600 hover:bg-stone-50 transition-all w-full">
              <Scissors className="w-3.5 h-3.5" />
              Servicios
            </Link>

            <Link href="/citas" className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-stone-600 hover:bg-stone-50 transition-all w-full">
              <Calendar className="w-3.5 h-3.5" />
              Citas
            </Link>

            <Link href="/fidelidad" className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-stone-600 hover:bg-stone-50 transition-all w-full">
              <Star className="w-3.5 h-3.5" />
              Fidelización
            </Link>

            <Link href="/tienda" className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-stone-600 hover:bg-stone-50 transition-all w-full">
              <Store className="w-3.5 h-3.5" />
              Tienda
            </Link>

            <Link href="/academy" className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-stone-600 hover:bg-stone-50 transition-all w-full">
              <GraduationCap className="w-3.5 h-3.5" />
              Academia
            </Link>

            <Link href="/galeria" className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-stone-600 hover:bg-stone-50 transition-all w-full">
              <Image className="w-3.5 h-3.5" />
              Galería
            </Link>

            <Link href="/perfil" className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-stone-600 hover:bg-stone-50 transition-all w-full">
              <User className="w-3.5 h-3.5" />
              Perfil
            </Link>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-red-400 hover:bg-red-50 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              Resetear sesión
            </button>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-stone-100">
          <p className="text-[7px] font-mono text-stone-400 text-center tracking-wider">
            ⚡ Panel de desarrollo — Solo en entorno local
          </p>
          <p className="text-[7px] font-mono text-stone-300 text-center">
            Rol actual: <span className="font-bold text-stone-600">{devRole}</span>
          </p>
        </div>
      </div>
    </>
  )
}
