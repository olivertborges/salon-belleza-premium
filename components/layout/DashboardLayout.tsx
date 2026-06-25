'use client'

import React, { useState } from 'react'
import { 
  Crown, Sparkles, Bell, ShoppingCart, 
  Scissors, Heart, Gift, Calendar, 
  Menu, X, Store, LogOut
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import ThemeToggle from '@/components/ThemeToggle'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notificaciones, setNotificaciones] = useState(3)
  const [carritoItems, setCarritoItems] = useState(1)

  const isDark = theme === 'dark'

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
    <div className={`h-screen w-full antialiased font-sans flex relative overflow-hidden m-0 p-0 transition-colors duration-300 ${
      isDark ? 'bg-[#090807] text-stone-200' : 'bg-[#faf8f6] text-stone-900'
    }`}>

      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 h-full border-r backdrop-blur-xl transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 lg:flex lg:flex-col shrink-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} ${
        isDark ? 'bg-[#0e0c0b] border-stone-900/80' : 'bg-white border-stone-200'
      }`}>

        <div className={`p-6 border-b flex items-center justify-between shrink-0 ${
          isDark ? 'border-stone-900' : 'border-stone-200'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center shadow-[0_0_20px_rgba(225,29,72,0.35)]">
              <Crown className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className={`text-sm font-bold uppercase tracking-[0.2em] block ${
                isDark ? 'text-stone-100' : 'text-stone-900'
              }`}>
                Fresh Nails
              </span>
              <span className={`text-[9px] uppercase tracking-widest font-mono block ${
                isDark ? 'text-stone-500' : 'text-stone-400'
              }`}>
                Estética Integral
              </span>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className={`lg:hidden p-2 transition-colors ${
            isDark ? 'text-stone-400 hover:text-white' : 'text-stone-500 hover:text-stone-900'
          }`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {menuItems.map((item, index) => {
            const Icon = item.icon
            return (
              <a key={index} href={item.href} onClick={() => setSidebarOpen(false)} className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-medium border transition-all ${
                item.active 
                  ? isDark 
                    ? 'bg-gradient-to-r from-rose-950/40 via-stone-900/40 to-transparent border-rose-500/30 text-white'
                    : 'bg-gradient-to-r from-rose-100/40 via-stone-100/40 to-transparent border-rose-300 text-stone-900'
                  : isDark
                    ? 'border-transparent text-stone-400 hover:text-stone-100 hover:bg-stone-900/30'
                    : 'border-transparent text-stone-500 hover:text-stone-900 hover:bg-stone-100'
              }`}>
                <div className={`p-1.5 rounded-lg border ${
                  item.active 
                    ? isDark
                      ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                      : 'bg-rose-100 border-rose-300 text-rose-600'
                    : isDark
                      ? 'bg-stone-950 border-stone-800 text-stone-500'
                      : 'bg-stone-100 border-stone-200 text-stone-400'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span>{item.label}</span>
              </a>
            )
          })}
        </nav>

        <div className={`p-4 border-t shrink-0 ${
          isDark ? 'border-stone-900/60 bg-[#0c0a09]' : 'border-stone-200/60 bg-stone-50'
        }`}>
          <button className={`flex items-center gap-3.5 px-4 py-3 w-full rounded-xl text-xs font-medium transition-all group ${
            isDark
              ? 'text-stone-400 hover:text-rose-400 hover:bg-rose-950/20 border border-transparent hover:border-rose-500/20'
              : 'text-stone-500 hover:text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-200'
          }`}>
            <div className={`p-1.5 rounded-lg border transition-colors ${
              isDark
                ? 'bg-stone-950 border-stone-800 text-stone-500 group-hover:text-rose-400 group-hover:border-rose-500/10'
                : 'bg-stone-100 border-stone-200 text-stone-400 group-hover:text-rose-500 group-hover:border-rose-300'
            }`}>
              <LogOut className="w-4 h-4" />
            </div>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative z-10 overflow-hidden">

        {/* HEADER */}
        <header className={`sticky top-0 z-30 backdrop-blur-md border-b px-4 md:px-8 h-20 flex items-center justify-between gap-4 shrink-0 transition-colors duration-300 ${
          isDark
            ? 'bg-[#090807]/80 border-stone-900'
            : 'bg-white/80 border-stone-200'
        }`}>
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className={`lg:hidden p-2.5 rounded-xl border transition-colors ${
              isDark
                ? 'bg-stone-900 border-stone-800 text-stone-400'
                : 'bg-stone-100 border-stone-200 text-stone-500'
            }`}>
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex flex-col">
              <h1 className={`text-xl md:text-2xl font-serif italic tracking-tight ${
                isDark
                  ? 'text-transparent bg-clip-text bg-gradient-to-r from-rose-200 via-rose-400 to-amber-200'
                  : 'text-transparent bg-clip-text bg-gradient-to-r from-rose-600 via-rose-700 to-amber-600'
              }`}>
                Fresh Nails
              </h1>
              <span className={`text-[10px] uppercase tracking-[0.25em] hidden sm:block font-mono ${
                isDark ? 'text-stone-500' : 'text-stone-400'
              }`}>
                Experiencia VIP
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <ThemeToggle />

            <button className={`relative p-2.5 rounded-xl border transition-all ${
              isDark
                ? 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-100 hover:border-stone-700'
                : 'bg-stone-100 border-stone-200 text-stone-500 hover:text-stone-900 hover:border-stone-300'
            }`}>
              <Bell className="w-4 h-4" />
              {notificaciones > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(225,29,72,0.6)]"></span>
              )}
            </button>

            <button className={`relative p-2.5 rounded-xl border transition-all ${
              isDark
                ? 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-100 hover:border-stone-700'
                : 'bg-stone-100 border-stone-200 text-stone-500 hover:text-stone-900 hover:border-stone-300'
            }`}>
              <ShoppingCart className="w-4 h-4" />
              {carritoItems > 0 && (
                <span className={`absolute -top-1 -right-1 bg-gradient-to-r from-rose-600 to-amber-500 text-[9px] text-white font-bold h-4 min-w-4 px-1 rounded-full flex items-center justify-center border ${
                  isDark ? 'border-[#090807]' : 'border-white'
                }`}>
                  {carritoItems}
                </span>
              )}
            </button>

            <div className={`h-6 w-[1px] mx-1 hidden xs:block ${isDark ? 'bg-stone-800' : 'bg-stone-200'}`}></div>

            <div className="flex items-center gap-2.5 pr-2">
              <div className="text-right hidden xs:block">
                <p className={`text-xs font-medium leading-none transition-colors ${
                  isDark ? 'text-stone-200' : 'text-stone-800'
                }`}>
                  {primerNombre}
                </p>
                <span className={`text-[9px] font-mono tracking-wider uppercase transition-colors ${
                  isDark ? 'text-amber-400/80' : 'text-amber-600'
                }`}>
                  Socio
                </span>
              </div>
              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center font-bold shadow-inner transition-colors ${
                isDark
                  ? 'bg-stone-900 border-stone-800 text-rose-400'
                  : 'bg-stone-200 border-stone-300 text-rose-600'
              }`}>
                {inicialNombre}
              </div>
            </div>
          </div>
        </header>

        {/* CONTENIDO */}
        <main className={`flex-1 w-full p-4 md:p-8 overflow-y-auto transition-colors duration-300 ${
          isDark ? 'bg-[#090807]' : 'bg-[#faf8f6]'
        }`}>
          {children}
        </main>
      </div>
    </div>
  )
}
