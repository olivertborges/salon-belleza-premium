'use client'

import React, { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Calendar, Users, Sparkles, History,
  XCircle, ShoppingBag, Sliders, UsersRound, Crown,
  ChevronLeft, ChevronRight, Power, X,
  Palette, Gift
} from 'lucide-react'

interface AdminSidebarProps {
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
  isOpen: boolean
  onClose: () => void
}

const ALL_MENU_ITEMS = [
  { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { id: 'agenda', name: 'Agenda', icon: Calendar, path: '/admin/agenda' },
  { id: 'galeria', name: 'Galería', icon: Palette, path: '/admin/galeria' },
  { id: 'historial', name: 'Historial', icon: History, path: '/admin/historial' },
  { id: 'clientes', name: 'Clientas', icon: Users, path: '/admin/clientes' },
  { id: 'fidelizacion', name: 'VIP Club', icon: Crown, path: '/admin/fidelizacion' },
  { id: 'servicios', name: 'Servicios', icon: Sparkles, path: '/admin/servicios' },
  { id: 'promociones', name: 'Promociones', icon: Gift, path: '/admin/promociones' },
  { id: 'productos', name: 'Tienda', icon: ShoppingBag, path: '/admin/productos' },
  { id: 'cancelaciones', name: 'Cancelaciones', icon: XCircle, path: '/admin/cancelaciones' },
  { id: 'usuarios', name: 'Usuarios', icon: UsersRound, path: '/admin/usuarios' },
  { id: 'configuracion', name: 'Configuración', icon: Sliders, path: '/admin/configuracion' },
]

const sidebarVariants = {
  open: { 
    width: '256px',
    transition: { type: "spring", stiffness: 300, damping: 30 }
  },
  collapsed: { 
    width: '76px',
    transition: { type: "spring", stiffness: 300, damping: 30 }
  }
}

export default function AdminSidebar({ collapsed, setCollapsed, isOpen, onClose }: AdminSidebarProps) {
  const { user, role, signOut } = useAuth() 
  const { theme } = useTheme()
  const router = useRouter()
  const pathname = usePathname()

  const [mounted, setMounted] = useState(false)
  const isDark = theme === 'dark'

  const brandGradient = {
    backgroundImage: 'linear-gradient(to right, #D4AF37, #E8D5A0)'
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const handleNavigation = (path: string) => {
    router.push(path)
    onClose()
  }

  const isItemActive = (itemPath: string) => {
    if (itemPath === '/dashboard') return pathname === '/dashboard'
    return pathname?.startsWith(itemPath + '/') || pathname === itemPath
  }

  const handleLogoutClick = async () => {
    try {
      if (signOut) await signOut()
      router.push('/login')
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
      router.push('/login')
    }
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <motion.aside 
        variants={sidebarVariants}
        initial="open"
        animate={collapsed ? "collapsed" : "open"}
        className={`
          fixed lg:sticky top-0 left-0 z-50 h-screen flex flex-col shadow-2xl
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isDark 
            ? 'bg-[#1E120C] border-r border-[#3D281E]' 
            : 'bg-[#FFF9F6] border-r border-[#F0E4DA]'
          }
        `}
      >
        {/* EFECTO GLOW DE FONDO */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl opacity-10 bg-[#D4AF37]" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl opacity-10 bg-[#E8D5A0]" />
        </div>

        {/* ============================================================ */}
        {/* CABECERA */}
        {/* ============================================================ */}
        <div className={`h-16 px-4 flex items-center justify-between border-b shrink-0 relative z-10 ${
          isDark ? 'border-[#3D281E]' : 'border-[#F0E4DA]'
        }`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div 
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-[#D4AF37]/20"
              style={brandGradient}
            >
              <Sparkles className="w-4 h-4 text-[#1A0E0A] animate-pulse" />
            </div>

            {!collapsed && (
              <div>
                <span className={`text-sm font-serif tracking-wide block font-extrabold ${
                  isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'
                }`}>
                  Fresh Nails
                </span>
                <span className={`text-[9px] uppercase tracking-widest font-mono block font-bold ${
                  isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
                }`}>
                  {role || 'Studio'}
                </span>
              </div>
            )}
          </div>

          {isOpen && (
            <button 
              onClick={onClose} 
              className={`lg:hidden p-1.5 rounded-xl transition-colors ${
                isDark ? 'text-[#A89588] hover:text-[#FFF9F6] hover:bg-[#3D281E]' : 'text-[#A89588] hover:text-[#1A0E0A] hover:bg-[#F0E4DA]'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* ============================================================ */}
        {/* PERFIL */}
        {/* ============================================================ */}
        {!collapsed && (
          <div className="px-3 pt-4 shrink-0 relative z-10">
            <div className={`p-3 rounded-2xl flex items-center gap-3 border ${
              isDark 
                ? 'bg-[#2A1B14] border-[#3D281E]' 
                : 'bg-white border-[#F0E4DA]'
            }`}>
              <div 
                className="w-8 h-8 rounded-xl flex items-center justify-center font-mono text-xs font-bold text-[#1A0E0A] shadow-sm shrink-0"
                style={brandGradient}
              >
                {user?.email?.charAt(0).toUpperCase() || 'A'}
              </div>

              <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold truncate ${
                  isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'
                }`}>
                  {user?.email || 'Admin'}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full animate-pulse" />
                  <span className={`text-[9px] font-mono tracking-wider font-bold uppercase ${
                    isDark ? 'text-[#D4AF37]' : 'text-[#D4AF37]'
                  }`}>
                    Activa
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* NAVEGACIÓN - CON SCROLL */}
        {/* ============================================================ */}
        <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2 relative z-10">
          <nav className="space-y-1">
            {ALL_MENU_ITEMS.map((item) => {
              const Icon = item.icon
              const isActive = isItemActive(item.path)

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.path)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all relative group
                    ${collapsed ? 'justify-center px-0' : ''}
                    ${isActive 
                      ? 'text-[#1A0E0A] shadow-lg shadow-[#D4AF37]/20' 
                      : isDark
                        ? 'text-[#A89588] hover:text-[#FFF9F6] hover:bg-[#3D281E]/50'
                        : 'text-[#5C4A3E] hover:text-[#1A0E0A] hover:bg-[#F0E4DA]/50'
                    }
                  `}
                  style={isActive ? brandGradient : {}}
                  title={collapsed ? item.name : ''}
                >
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[#1A0E0A]" />
                  )}

                  <Icon className={`w-4 h-4 shrink-0 transition-all duration-300 ${
                    isActive ? 'text-[#1A0E0A]' : ''
                  }`} />

                  {!collapsed && (
                    <span className="truncate tracking-wide">
                      {item.name}
                    </span>
                  )}

                  {isActive && !collapsed && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#1A0E0A]/60 animate-pulse" />
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        {/* ============================================================ */}
        {/* CERRAR SESIÓN - SIEMPRE VISIBLE EN LA PARTE INFERIOR */}
        {/* ============================================================ */}
        <div className={`p-3 border-t shrink-0 relative z-10 ${
          isDark ? 'border-[#3D281E] bg-[#1E120C]' : 'border-[#F0E4DA] bg-[#FFF9F6]'
        }`}>
          <button 
            onClick={handleLogoutClick} 
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-medium transition-all group ${
              collapsed ? 'justify-center' : ''
            } ${isDark ? 'hover:bg-[#3D281E]/50' : 'hover:bg-[#F0E4DA]/50'}`}
          >
            <Power className={`w-4 h-4 transition-colors ${
              isDark ? 'text-[#A89588] group-hover:text-[#D4AF37]' : 'text-[#5C4A3E] group-hover:text-[#D4AF37]'
            }`} />
            {!collapsed && (
              <span className={`transition-colors ${
                isDark ? 'text-[#A89588] group-hover:text-[#D4AF37]' : 'text-[#5C4A3E] group-hover:text-[#D4AF37]'
              }`}>
                Cerrar sesión
              </span>
            )}
          </button>
        </div>
      </motion.aside>

      {/* BOTÓN FLOTANTE PARA COLLAPSE */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden lg:flex fixed top-5 border rounded-full p-1.5 transition-all z-50 shadow-lg backdrop-blur-sm"
        style={{
          left: collapsed ? '60px' : '244px',
          backgroundColor: isDark ? '#2A1B14' : 'white',
          borderColor: isDark ? '#3D281E' : '#F0E4DA',
          color: isDark ? '#D4AF37' : '#D4AF37',
        }}
      >
        {collapsed ? 
          <ChevronRight className="w-3.5 h-3.5" /> : 
          <ChevronLeft className="w-3.5 h-3.5" />
        }
      </button>
    </>
  )
}