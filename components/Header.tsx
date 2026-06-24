'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { 
  FaWhatsapp, 
  FaCalendarAlt, 
  FaBars, 
  FaTimes, 
  FaArrowRight, 
  FaUserCircle, 
  FaSignOutAlt, 
  FaShieldAlt, 
  FaUserTie,
  FaCrown
} from 'react-icons/fa'

export default function Header() {
  const { user, role, signOut } = useAuth()
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // Efecto de scroll - se activa cuando se baja más de 20px
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true)
      } else {
        setScrolled(false)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Determinar el rol del usuario
  const userRole = role || 'guest'

  const navItems = [
    { label: 'Inicio', href: '/' },
    { label: 'Servicios', href: '/servicios' },
    { label: 'Especialidades', href: '/especialidades' },
    { label: 'Academia', href: '/academy' },
    { label: 'Galería', href: '/galeria' },
    { label: 'Staff', href: '/staff' },
  ]

  // Si es admin, añadir panel de admin
  if (userRole === 'admin') {
    navItems.push({ label: 'Admin', href: '/admin' })
  }

  const handleLogout = async () => {
    await signOut()
    window.location.href = '/'
  }

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'bg-stone-900/95 backdrop-blur-md border-b border-stone-800 py-3 shadow-lg' 
        : 'bg-transparent py-4'
    }`}>
      <div className="w-full max-w-7xl mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 bg-gradient-to-br from-rose-500 to-amber-500 rounded-lg flex items-center justify-center text-white font-bold text-base shadow-sm">
            S
          </div>
          <div>
            <h1 className={`text-base font-light tracking-wider leading-none transition-colors ${
              scrolled ? 'text-slate-100' : 'text-slate-100'
            }`}>
              SALON <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-amber-400 to-rose-400">PREMIUM</span>
            </h1>
            <p className={`text-[8px] tracking-[0.2em] uppercase mt-0.5 transition-colors ${
              scrolled ? 'text-slate-400' : 'text-slate-400'
            }`}>
              Beauty & Aesthetics
            </p>
          </div>
        </Link>

        {/* Navegación Desktop */}
        <nav className="hidden lg:flex items-center gap-6">
          {navItems.map((item) => (
            <Link 
              key={item.label} 
              href={item.href} 
              className={`text-[11px] font-semibold tracking-wider uppercase transition-colors ${
                pathname === item.href 
                  ? 'text-rose-400' 
                  : scrolled ? 'text-slate-300 hover:text-rose-400' : 'text-slate-300 hover:text-rose-400'
              }`}
            >
              {item.label}
            </Link>
          ))}
          {userRole === 'admin' && (
            <span className="text-[9px] bg-red-500/10 border border-red-500/20 text-red-400 px-2 py-0.5 rounded font-extrabold tracking-widest uppercase">
              ⚙️ Admin
            </span>
          )}
          {userRole === 'staff' && (
            <span className="text-[9px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded font-extrabold tracking-widest uppercase">
              🗓️ Staff
            </span>
          )}
        </nav>

        {/* Acciones Desktop */}
        <div className="hidden lg:flex items-center gap-3">
          {userRole === 'guest' ? (
            <Link href="/login">
              <button className={`px-4 py-2 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all ${
                scrolled 
                  ? 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700' 
                  : 'bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-900'
              }`}>
                <FaUserCircle className="text-sm" /> Acceder
              </button>
            </Link>
          ) : (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${
              scrolled ? 'bg-slate-800 border-slate-700' : 'bg-slate-950 border-slate-800'
            }`}>
              <span className="text-[10px] uppercase font-bold text-slate-300 tracking-wider flex items-center gap-1">
                {userRole === 'admin' && <FaShieldAlt className="text-red-400" />}
                {userRole === 'staff' && <FaUserTie className="text-indigo-400" />}
                {userRole === 'client' && <FaUserCircle className="text-rose-400" />}
                {user?.full_name || userRole}
              </span>
              <button 
                onClick={handleLogout}
                className="text-slate-500 hover:text-rose-400 text-xs pl-1 ml-1 border-l border-slate-800 transition-colors"
                title="Cerrar Sesión"
              >
                <FaSignOutAlt />
              </button>
            </div>
          )}

          <Link href="/reservas" className="bg-gradient-to-r from-rose-500 to-amber-500 text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg active:scale-95 transition-all">
            <FaCalendarAlt /> Reservar
          </Link>
        </div>

        {/* Botón menú móvil */}
        <button className={`lg:hidden text-xl w-10 h-10 flex items-center justify-center rounded-xl active:scale-90 transition-transform ${
          scrolled ? 'bg-slate-800 border border-slate-700 text-slate-300' : 'bg-slate-900 border border-slate-800 text-slate-300'
        }`} onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {/* Menú Móvil */}
      {isMenuOpen && (
        <div className="lg:hidden fixed inset-x-4 top-16 bg-slate-900/95 backdrop-blur-lg rounded-2xl shadow-2xl p-5 border border-slate-800 animate-in fade-in slide-in-from-top-4 duration-200 z-50">
          <nav className="flex flex-col gap-1.5">
            {navItems.map((item) => (
              <Link 
                key={item.label} 
                href={item.href} 
                className="text-slate-300 hover:text-rose-400 py-2 px-3 hover:bg-slate-950/50 rounded-xl font-medium text-xs flex items-center justify-between transition-colors" 
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label} <FaArrowRight className="text-[9px] text-slate-600" />
              </Link>
            ))}

            <div className="flex flex-col gap-2 mt-2 pt-3 border-t border-slate-800">
              {userRole === 'guest' ? (
                <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                  <button className="w-full bg-slate-950 border border-slate-800 text-slate-200 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 text-xs">
                    <FaUserCircle /> Iniciar Sesión
                  </button>
                </Link>
              ) : (
                <div className="flex items-center justify-between bg-slate-950 p-2 rounded-xl border border-slate-800 text-xs">
                  <span className="font-bold uppercase text-slate-400 tracking-wider pl-2">
                    {user?.full_name || userRole}
                  </span>
                  <button onClick={handleLogout} className="text-rose-400 font-bold flex items-center gap-1 px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg shadow-inner">
                    Salir <FaSignOutAlt />
                  </button>
                </div>
              )}
              <Link href="/reservas" onClick={() => setIsMenuOpen(false)} className="w-full bg-gradient-to-r from-rose-500 to-amber-500 text-white py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 text-xs text-center shadow-lg">
                <FaCalendarAlt /> Reservar ahora
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
