'use client'

import React, { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useSettings } from '@/contexts/SettingsContext'
import { useTheme } from '@/contexts/ThemeContext'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Calendar, Users, Sparkles, History,
  XCircle, ShoppingBag, Sliders, UsersRound, Crown,
  Sun, Moon, ChevronLeft, ChevronRight, Power, X,
  Menu, Gem, Heart, Star, Zap, Award, Palette, Gift
} from 'lucide-react'

interface AdminSidebarProps {
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
  isOpen: boolean
  onClose: () => void
}

const ALL_MENU_ITEMS = [
  { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', color: 'from-[#D4AF37] to-[#E8D5A0]' },
  { id: 'agenda', name: 'Agenda', icon: Calendar, path: '/admin/agenda', color: 'from-[#D4AF37] to-[#E8D5A0]' },
  { id: 'galeria', name: 'Galería', icon: Palette, path: '/admin/galeria', color: 'from-[#D4AF37] to-[#E8D5A0]' },
  { id: 'historial', name: 'Historial', icon: History, path: '/admin/historial', color: 'from-[#D4AF37] to-[#E8D5A0]' },
  { id: 'clientes', name: 'Clientas', icon: Users, path: '/admin/clientes', color: 'from-[#D4AF37] to-[#E8D5A0]' },
  { id: 'fidelizacion', name: 'VIP Club', icon: Crown, path: '/admin/fidelizacion', color: 'from-[#D4AF37] to-[#E8D5A0]' },
  { id: 'servicios', name: 'Servicios', icon: Sparkles, path: '/admin/servicios', color: 'from-[#D4AF37] to-[#E8D5A0]' },
  { id: 'promociones', name: 'Promociones', icon: Gift, path: '/admin/promociones', color: 'from-[#D4AF37] to-[#E8D5A0]' },
  { id: 'productos', name: 'Tienda', icon: ShoppingBag, path: '/admin/productos', color: 'from-[#D4AF37] to-[#E8D5A0]' },
  { id: 'cancelaciones', name: 'Cancelaciones', icon: XCircle, path: '/admin/cancelaciones', color: 'from-[#D4AF37] to-[#E8D5A0]' },
  { id: 'usuarios', name: 'Usuarios', icon: UsersRound, path: '/admin/usuarios', color: 'from-[#D4AF37] to-[#E8D5A0]' },
  { id: 'configuracion', name: 'Configuración', icon: Sliders, path: '/admin/configuracion', color: 'from-[#D4AF37] to-[#E8D5A0]' },
]

// Animaciones
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

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { 
      delay: 0.05 * i,
      type: "spring",
      stiffness: 400,
      damping: 25
    }
  })
}

export default function AdminSidebar({ collapsed, setCollapsed, isOpen, onClose }: AdminSidebarProps) {
  const { settings } = useSettings()
  const { user, role, signOut } = useAuth() 
  const { theme, toggleTheme } = useTheme()
  const router = useRouter()
  const pathname = usePathname()

  const [mounted, setMounted] = useState(false)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const isDark = theme === 'dark'

  // Gradiente dorado fijo
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
      {/* OVERLAY MÓVIL */}
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
        {/* EFECTO GLOW DE FONDO - DORADO */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div 
            className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl opacity-10"
            style={{ backgroundColor: '#D4AF37' }}
            animate={{
              x: [0, 20, -10, 0],
              y: [0, -10, 20, 0]
            }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <motion.div 
            className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl opacity-10"
            style={{ backgroundColor: '#E8D5A0' }}
            animate={{
              x: [0, -20, 10, 0],
              y: [0, 10, -20, 0]
            }}
            transition={{ duration: 10, repeat: Infinity }}
          />
        </div>

        {/* CABECERA */}
        <motion.div 
          className={`h-16 px-4 flex items-center justify-between border-b relative z-10 ${
            isDark ? 'border-[#3D281E]' : 'border-[#F0E4DA]'
          }`}
        >
          <motion.div 
            className="flex items-center gap-3 overflow-hidden"
            whileHover={{ scale: 1.02 }}
          >
            <motion.div 
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-[#D4AF37]/20"
              style={brandGradient}
              whileHover={{ rotate: -10, scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Sparkles className="w-4 h-4 text-[#1A0E0A] animate-pulse" />
            </motion.div>

            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.3 }}
                  className="animate-fade-in"
                >
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
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {isOpen && (
            <motion.button 
              onClick={onClose} 
              className={`lg:hidden p-1.5 rounded-xl transition-colors ${
                isDark ? 'text-[#A89588] hover:text-[#FFF9F6] hover:bg-[#3D281E]' : 'text-[#A89588] hover:text-[#1A0E0A] hover:bg-[#F0E4DA]'
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-4 h-4" />
            </motion.button>
          )}
        </motion.div>

        {/* PERFIL */}
        <AnimatePresence>
          {!collapsed && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="px-3 pt-4 shrink-0 relative z-10"
            >
              <motion.div 
                className={`p-3 rounded-2xl flex items-center gap-3 transition-all border relative overflow-hidden ${
                  isDark 
                    ? 'bg-[#2A1B14] border-[#3D281E]' 
                    : 'bg-white border-[#F0E4DA]'
                }`}
                whileHover={{ scale: 1.02, y: -2 }}
              >
                <motion.div 
                  className="w-8 h-8 rounded-xl flex items-center justify-center font-mono text-xs font-bold text-[#1A0E0A] shadow-sm shrink-0"
                  style={brandGradient}
                  whileHover={{ scale: 1.1, rotate: -5 }}
                >
                  {user?.email?.charAt(0).toUpperCase() || 'A'}
                </motion.div>

                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold truncate ${
                    isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'
                  }`}>
                    {user?.email || 'Admin'}
                  </p>
                  <motion.div 
                    className="flex items-center gap-1.5 mt-0.5"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <span className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full" />
                    <span className={`text-[9px] font-mono tracking-wider font-bold uppercase ${
                      isDark ? 'text-[#D4AF37]' : 'text-[#D4AF37]'
                    }`}>
                      Activa
                    </span>
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* NAVEGACIÓN */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-none relative z-10">
          {ALL_MENU_ITEMS.map((item, index) => {
            const Icon = item.icon
            const isActive = isItemActive(item.path)
            const isHovered = hoveredItem === item.id

            return (
              <motion.button
                key={item.id}
                custom={index}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.95 }}
                onHoverStart={() => setHoveredItem(item.id)}
                onHoverEnd={() => setHoveredItem(null)}
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
                  <motion.span 
                    className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[#1A0E0A]"
                    layoutId="activeIndicator"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}

                {isHovered && !isActive && (
                  <motion.span 
                    className="absolute inset-0 rounded-xl pointer-events-none"
                    animate={{
                      boxShadow: `inset 0 0 20px rgba(212, 175, 55, 0.1)`
                    }}
                  />
                )}

                <motion.div
                  animate={{
                    scale: isActive ? 1.1 : (isHovered ? 1.1 : 1),
                    rotate: isHovered ? [0, -5, 5, 0] : 0
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <Icon className={`w-4 h-4 shrink-0 transition-all duration-300 ${
                    isActive ? 'text-[#1A0E0A]' : ''
                  }`} />
                </motion.div>

                <AnimatePresence>
                  {!collapsed && (
                    <motion.span 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="truncate tracking-wide"
                    >
                      {item.name}
                    </motion.span>
                  )}
                </AnimatePresence>

                {isActive && !collapsed && (
                  <motion.span 
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-[#1A0E0A]/60"
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </motion.button>
            )
          })}
        </nav>

        {/* CONTROLES */}
        <motion.div 
          className={`p-3 border-t space-y-1 shrink-0 relative z-10 ${
            isDark ? 'border-[#3D281E] bg-[#1E120C]/50' : 'border-[#F0E4DA] bg-[#FFF9F6]/50'
          }`}
        >
          <motion.button 
            onClick={toggleTheme} 
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
              collapsed ? 'justify-center' : ''
            } ${isDark ? 'hover:bg-[#3D281E]/50' : 'hover:bg-[#F0E4DA]/50'}`}
            whileHover={{ scale: 1.02, x: 4 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              animate={{ rotate: isDark ? [0, 360] : [0, -360] }}
              transition={{ duration: 0.5 }}
            >
              {isDark ? 
                <Sun className="w-4 h-4 text-[#D4AF37]" /> : 
                <Moon className="w-4 h-4 text-[#D4AF37]" />
              }
            </motion.div>
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className={isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}
                >
                  {isDark ? 'Modo Claro' : 'Modo Oscuro'}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          <motion.button 
            onClick={handleLogoutClick} 
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
              collapsed ? 'justify-center' : ''
            } ${isDark ? 'hover:bg-[#3D281E]/50' : 'hover:bg-[#F0E4DA]/50'}`}
            whileHover={{ scale: 1.02, x: 4 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              whileHover={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 0.5 }}
            >
              <Power className={`w-4 h-4 transition-colors ${
                isDark ? 'text-[#A89588] group-hover:text-[#D4AF37]' : 'text-[#5C4A3E] group-hover:text-[#D4AF37]'
              }`} />
            </motion.div>
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className={`transition-colors ${
                    isDark ? 'text-[#A89588] group-hover:text-[#D4AF37]' : 'text-[#5C4A3E] group-hover:text-[#D4AF37]'
                  }`}
                >
                  Cerrar sesión
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </motion.div>

        {/* BORDE DECORATIVO INFERIOR */}
        <motion.div 
          className="absolute bottom-0 left-0 right-0 h-[2px]"
          style={brandGradient}
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      </motion.aside>

      {/* BOTÓN FLOTANTE PARA COLLAPSE */}
      <motion.button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden lg:flex fixed top-5 border rounded-full p-1.5 transition-all z-50 shadow-lg backdrop-blur-sm"
        style={{
          left: collapsed ? '60px' : '244px',
          backgroundColor: isDark ? '#2A1B14' : 'white',
          borderColor: isDark ? '#3D281E' : '#F0E4DA',
          color: isDark ? '#D4AF37' : '#D4AF37',
        }}
        whileHover={{ scale: 1.1, rotate: collapsed ? 10 : -10 }}
        whileTap={{ scale: 0.9 }}
        animate={{ 
          left: collapsed ? '60px' : '244px',
          transition: { type: "spring", stiffness: 300, damping: 30 }
        }}
      >
        {collapsed ? 
          <ChevronRight className="w-3.5 h-3.5" /> : 
          <ChevronLeft className="w-3.5 h-3.5" />
        }
      </motion.button>
    </>
  )
}