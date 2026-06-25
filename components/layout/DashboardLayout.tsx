'use client'

import React, { useState } from 'react'
import { 
  Crown, Sparkles, Bell, ShoppingCart, 
  Scissors, Heart, Gift, Calendar, 
  Menu, X, Store, LogOut
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth() 
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notificaciones, setNotificaciones] = useState(3)
  const [carritoItems, setCarritoItems] = useState(1)

  const menuItems = [
    { icon: Crown, label: 'Inicio Premium', href: '/portal', active: true },
    { icon: Calendar, label: 'Mis Citas / Reservar', href: '/reservas', active: false },
    { icon: Sparkles, label: 'Uñas de Autor', href: '#uñas', active: false },
    { icon: Scissors, label: 'Peluquería & Estilo', href: '#peluqueria', active: false },
    { icon: Heart, label: 'Microblading & Cuidado', href: '#estetica', active: false },
    { icon: Store, label: 'Tienda Fresh', href: '#tienda', active: false },
    { icon: Gift, label: 'Club Fresh Puntos', href: '#puntos', active: false },
  ]

  const inicialNombre = user?.name ? user.name.charAt(0).toUpperCase() : 'C'
  const primerNombre = user?.name ? user.name.split(' ')[0] : 'Chérie'

  return (
    <div className="h-screen w-full bg-[#090807] text-stone-200 antialiased font-sans flex relative overflow-hidden m-0 p-0">
      
      {/* 1. SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 h-full bg-[#0e0c0b] border-r border-stone-900/80 backdrop-blur-xl transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 lg:flex lg:flex-col shrink-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Encabezado Sidebar */}
        <div className="p-6 border-b border-stone-900 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center shadow-[0_0_20px_rgba(225,29,72,0.35)]">
              <Crown className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-sm font-bold uppercase tracking-[0.2em] text-stone-100 block">Fresh Nails</span>
              <span className="text-[9px] uppercase tracking-widest text-stone-500 font-mono block">Estética Integral</span>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 text-stone-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Elementos de Navegación */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {menuItems.map((item, index) => {
            const Icon = item.icon
            return (
              <a key={index} href={item.href} onClick={() => setSidebarOpen(false)} className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-medium border transition-all ${item.active ? 'bg-gradient-to-r from-rose-950/40 via-stone-900/40 to-transparent border-rose-500/30 text-white' : 'border-transparent text-stone-400 hover:text-stone-100 hover:bg-stone-900/30'}`}>
                <div className={`p-1.5 rounded-lg border ${item.active ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-stone-950 border-stone-850 text-stone-500'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span>{item.label}</span>
              </a>
            )
          })}
        </nav>

        {/* Botón de Cerrar Sesión */}
        <div className="p-4 border-t border-stone-900/60 bg-[#0c0a09] shrink-0">
          <button onClick={() => console.log('Cerrando sesión...')} className="flex items-center gap-3.5 px-4 py-3 w-full rounded-xl text-xs font-medium text-stone-400 hover:text-rose-400 hover:bg-rose-950/20 border border-transparent hover:border-rose-500/20 transition-all group">
            <div className="p-1.5 rounded-lg border bg-stone-950 border-stone-850 text-stone-500 group-hover:text-rose-400 group-hover:border-rose-500/10 transition-colors">
              <LogOut className="w-4 h-4" />
            </div>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* 2. CONTENEDOR PRINCIPAL */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative z-10 overflow-hidden">
        
        {/* HEADER */}
        <header className="sticky top-0 z-30 backdrop-blur-md bg-[#090807]/80 border-b border-stone-900 px-4 md:px-8 h-20 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-400">
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex flex-col">
              <h1 className="text-xl md:text-2xl font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-rose-200 via-rose-400 to-amber-200 tracking-tight">
                Fresh Nails
              </h1>
              <span className="text-[10px] uppercase tracking-[0.25em] text-stone-500 hidden sm:block font-mono">
                Experiencia VIP
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <button className="relative p-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-100 hover:border-stone-700 transition-all">
              <Bell className="w-4 h-4" />
              {notificaciones > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(225,29,72,0.6)]"></span>
              )}
            </button>

            <button className="relative p-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-100 hover:border-stone-700 transition-all">
              <ShoppingCart className="w-4 h-4" />
              {carritoItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-rose-600 to-amber-500 text-[9px] text-white font-bold h-4 min-w-4 px-1 rounded-full flex items-center justify-center border border-[#090807]">
                  {carritoItems}
                </span>
              )}
            </button>

            <div className="h-6 w-[1px] bg-stone-800 mx-1 hidden xs:block"></div>

            <div className="flex items-center gap-2.5 pr-2">
              <div className="text-right hidden xs:block">
                <p className="text-xs font-medium text-stone-200 leading-none">{primerNombre}</p>
                <span className="text-[9px] font-mono tracking-wider text-amber-400/80 uppercase">Socio</span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-center font-bold text-rose-400 shadow-inner">
                {inicialNombre}
              </div>
            </div>
          </div>
        </header>

        {/* ÁREA DE CONTENIDO */}
        <main className="flex-1 w-full p-4 md:p-8 overflow-y-auto bg-[#090807]">
          {children}
        </main>
      </div>
    </div>
  )
}