'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import {
  LayoutDashboard,
  Scissors,
  Calendar,
  Users,
  ShoppingBag,
  Star,
  GraduationCap,
  Image as ImageIcon,
  Settings,
  LogOut,
  Menu,
  X,
  UserCircle,
  Home,
  Briefcase,
  Package
} from 'lucide-react'

interface SidebarProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const { user, role, signOut } = useAuth()
  const pathname = usePathname()

  const navItems = [
    { label: 'Inicio', href: '/', icon: Home },
    { label: 'Servicios', href: '/servicios', icon: Scissors },
    { label: 'Citas', href: '/citas', icon: Calendar },
    { label: 'Tienda', href: '/tienda', icon: ShoppingBag },
    { label: 'Fidelización', href: '/fidelidad', icon: Star },
    { label: 'Academia', href: '/academy', icon: GraduationCap },
    { label: 'Galería', href: '/galeria', icon: ImageIcon },
    { label: 'Perfil', href: '/perfil', icon: UserCircle },
  ]

  // Items de admin (solo visibles para admin)
  const adminItems = [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'Clientes', href: '/admin/clientes', icon: Users },
    { label: 'Staff', href: '/admin/staff', icon: Briefcase },
    { label: 'Inventario', href: '/admin/inventario', icon: Package },
    { label: 'Configuración', href: '/admin/configuracion', icon: Settings },
  ]

  const handleLogout = async () => {
    await signOut()
    window.location.href = '/'
  }

  return (
    <>
      {/* Overlay para móvil */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-50 h-full w-72 bg-slate-900 border-r border-slate-800 shadow-2xl transition-transform duration-300 ease-in-out flex flex-col ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
        
        {/* Perfil del usuario */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg ring-4 ring-slate-800">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold truncate">
                {user?.full_name || 'Usuario'}
              </p>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-medium">
                {role === 'admin' ? '⚡ Administrador' : role === 'staff' ? '💼 Staff' : '👤 Cliente'}
              </p>
            </div>
          </div>
        </div>

        {/* Navegación */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                pathname === item.href
                  ? 'bg-gradient-to-r from-rose-500/20 to-amber-500/20 text-rose-400 border border-rose-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}

          {/* Separador para admin */}
          {role === 'admin' && (
            <>
              <div className="my-4 border-t border-slate-800" />
              <p className="text-[9px] uppercase tracking-widest text-slate-500 px-3 py-1 font-bold">
                Administración
              </p>
              {adminItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    pathname === item.href
                      ? 'bg-gradient-to-r from-rose-500/20 to-amber-500/20 text-rose-400 border border-rose-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              ))}
            </>
          )}
        </nav>

        {/* Botón de cerrar sesión */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  )
}
