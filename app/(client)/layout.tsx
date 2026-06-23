'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase/client'
import { 
  Home, Calendar, ShoppingBag, Star, User, LogOut, 
  Menu, X, Heart 
} from 'lucide-react'

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, signOut, tenantId } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [puntosCliente, setPuntosCliente] = useState(0)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [tenantName, setTenantName] = useState('Fresh Nails')

  useEffect(() => {
    if (tenantId) {
      loadTenantInfo()
    }
    if (user?.email && tenantId) {
      cargarDatosCliente()
    }
  }, [user, tenantId])

  const loadTenantInfo = async () => {
    try {
      const { data } = await supabase
        .from('tenants')
        .select('name')
        .eq('id', tenantId)
        .single()
      if (data) setTenantName(data.name)
    } catch (error) {
      // Si no hay datos, mantener nombre por defecto
    }
  }

  const cargarDatosCliente = async () => {
    try {
      const { data } = await supabase
        .from('clients')
        .select('points')
        .eq('email', user.email)
        .eq('tenant_id', tenantId)
        .single()
      if (data) setPuntosCliente(data.points || 0)
    } catch (error) {
      // Si no hay datos, mantener puntos en 0
    }
  }

  const handleLogout = async () => {
    await signOut()
    router.push('/login')
  }

  const navItems = [
    { path: '/', icon: Home, label: 'Inicio' },
    { path: '/citas', icon: Calendar, label: 'Citas' },
    { path: '/tienda', icon: ShoppingBag, label: 'Tienda' },
    { path: '/fidelidad', icon: Star, label: 'Club' },
    { path: '/perfil', icon: User, label: 'Perfil' },
  ]

  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-900">
      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-stone-600"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="font-serif text-lg tracking-tight">{tenantName}</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-stone-100 rounded-full text-[10px] font-mono uppercase tracking-widest text-stone-600">
              <Heart className="w-3 h-3" /> {puntosCliente} Pts
            </div>
            <button className="p-2 text-stone-600 hover:text-stone-900 transition-colors">
              <ShoppingBag className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* NAV DESKTOP */}
      <nav className="hidden lg:flex fixed top-16 w-full bg-white border-b border-stone-200 z-30 justify-center gap-8 py-4">
        {navItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={`text-xs font-mono uppercase tracking-widest transition-colors ${
              pathname === item.path
                ? 'text-stone-900 font-bold'
                : 'text-stone-400 hover:text-stone-800'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {/* CONTENIDO */}
      <main className="pt-24 pb-20 px-4 max-w-5xl mx-auto">
        {children}
      </main>

      {/* NAV MOBILE INFERIOR */}
      <nav className="lg:hidden fixed bottom-0 w-full bg-white border-t border-stone-200 px-4 py-3 flex justify-between z-40">
        {navItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className="flex flex-col items-center gap-1"
          >
            <item.icon
              className={`w-5 h-5 ${
                pathname === item.path ? 'text-stone-900' : 'text-stone-300'
              }`}
            />
          </Link>
        ))}
      </nav>

      {/* LOGOUT MODAL */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/20 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-3xl border border-stone-200 text-center max-w-xs w-full">
            <h3 className="font-serif text-lg mb-4">¿Cerrar sesión?</h3>
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
