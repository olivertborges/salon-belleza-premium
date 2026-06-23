'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { 
  Bell, LogOut, Menu, X, 
  LayoutDashboard, Calendar, Users, Scissors, 
  Package, Briefcase, Image as ImageIcon, Trash2 
} from 'lucide-react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, signOut } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Agenda', path: '/admin/agenda', icon: Calendar },
    { name: 'Clientes', path: '/admin/clientes', icon: Users },
    { name: 'Servicios', path: '/admin/servicios', icon: Scissors },
    { name: 'Tienda', path: '/admin/tienda', icon: Package },
    { name: 'Staff', path: '/admin/staff', icon: Briefcase },
    { name: 'Galería', path: '/admin/galeria', icon: ImageIcon },
    { name: 'Cancelaciones', path: '/admin/cancelaciones', icon: Trash2 },
  ]

  const handleLogout = async () => {
    await signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-stone-50 flex">
      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-stone-900 text-stone-300 p-6 flex flex-col transition-transform duration-300 lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between mb-10">
          <h1 className="font-serif text-white text-lg tracking-tighter">
            Fresh <span className="text-stone-500">Nails</span>
          </h1>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3 px-3 py-2 text-sm font-light rounded-lg transition-colors ${
                pathname === item.path
                  ? 'bg-stone-800 text-white'
                  : 'text-stone-400 hover:text-white hover:bg-stone-800/50'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </Link>
          ))}
        </nav>

        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="flex items-center gap-3 px-3 py-2 text-sm text-stone-500 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Salir
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 lg:pl-64">
        <header className="sticky top-0 z-30 bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden text-stone-600"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4 ml-auto">
            <Bell className="w-4 h-4 text-stone-400" />
            <div className="text-right">
              <p className="text-[10px] uppercase font-mono text-stone-400">Administrador</p>
              <p className="text-xs font-medium text-stone-900">{user?.full_name || 'Admin'}</p>
            </div>
          </div>
        </header>

        <div className="p-8">
          {children}
        </div>
      </main>

      {/* LOGOUT MODAL */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/20 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-3xl border border-stone-200 text-center max-w-xs w-full">
            <h3 className="font-serif text-lg mb-4">Cerrar Sesión</h3>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2 text-xs border border-stone-200 rounded-xl hover:bg-stone-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-2 text-xs bg-stone-900 text-white rounded-xl hover:bg-stone-800 transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
