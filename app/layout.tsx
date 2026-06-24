'use client'

import React, { useState } from 'react'
import { 
  Crown, Sparkles, Bell, ShoppingCart, 
  Scissors, Heart, Gift, Calendar, 
  Menu, X, User, Flame, Store, LogOut
} from 'lucide-react'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import './globals.css'

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notificaciones, setNotificaciones] = useState(3)
  const [carritoItems, setCarritoItems] = useState(1)

  const menuItems = [
    { icon: Crown, label: 'Inicio Premium', href: '/dashboard/client', active: true },
    { icon: Calendar, label: 'Mis Citas / Reservar', href: '#reservas', active: false },
    { icon: Sparkles, label: 'Uñas de Autor', href: '#uñas', active: false },
    { icon: Scissors, label: 'Peluquería & Estilo', href: '#peluqueria', active: false },
    { icon: Heart, label: 'Microblading & Cuidado', href: '#estetica', active: false },
    { icon: Store, label: 'Tienda Fresh', href: '#tienda', active: false },
    { icon: Gift, label: 'Club Fresh Puntos', href: '#puntos', active: false },
  ]

  const inicialNombre = user?.name ? user.name.charAt(0).toUpperCase() : 'C'
  const primerNombre = user?.name ? user.name.split(' ')[0] : 'Chérie'

  return (
    <body className="h-full bg-[#090807] text-stone-200 antialiased font-sans flex relative overflow-x-hidden m-0 p-0">
      
      {/* SIDEBAR (Mismo de antes) */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#0e0c0b] border-r border-stone-900/80 backdrop-blur-xl transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 lg:flex lg:flex-col shrink-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-stone-900 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center shadow-[0_0_20px_rgba(225,29,72,0.35)]">
              <Crown className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-sm font-bold uppercase tracking-[0.2em] text-stone-100 block">Fresh Nails</span>
              <span className="text-[9px] uppercase tracking-widest text-stone-500 font-mono block">Estética Integral</span>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 text-stone-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {menuItems.map((item, index) => {
            const Icon = item.icon
            return (
              <a key={index} href={item.href} onClick={() => setSidebarOpen(false)} className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-medium border transition-all ${item.active ? 'bg-gradient-to-r from-rose-950/40 via-stone-900/40 to-transparent border-rose-500/30 text-white' : 'border-transparent text-stone-400 hover:text-stone-100 hover:bg-stone-900/30'}`}>
                <div className={`p-1.5 rounded-lg border ${item.active ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-stone-950 border-stone-850 text-stone-500'}`}><Icon className="w-4 h-4" /></div>
                <span>{item.label}</span>
              </a>
            )
          })}
        </nav>
      </aside>

      {/* 2. CONTENEDOR PRINCIPAL */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen relative z-10">
        
        {/* HEADER CON EL LOGOTIPO PRECIOSO */}
        <header className="sticky top-0 z-30 backdrop-blur-md bg-[#090807]/80 border-b border-stone-900 px-4 md:px-8 h-20 flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)} 
              className="lg:hidden p-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-400"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            {/* NUEVO LOGOTIPO ELEGANTE */}
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

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </body>
  )
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full">
      <AuthProvider>
        <LayoutContent>{children}</LayoutContent>
      </AuthProvider>
    </html>
  )
}
