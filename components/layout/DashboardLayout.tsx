// @ts-nocheck
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/contexts/ThemeContext'
import { useSettings } from '@/contexts/SettingsContext'
import HeaderTop from './HeaderTop'
import { 
  User, 
  Calendar, 
  Sparkles, 
  X, 
  LogOut, 
  LayoutDashboard, 
  Users, 
  Settings, 
  Scissors 
} from 'lucide-react'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const pathname = usePathname()
  const { role, signOut } = useAuth()
  const { theme } = useTheme()
  const { settings } = useSettings()

  const isDark = theme === 'dark'
  const primaryColor = settings?.primary_color || '#DB5B9A'
  const secondaryColor = settings?.secondary_color || '#E5A46E'
  const brandGradient = `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`

  // Definición de ítems del menú con restricción explícita por rol
  const menuItems = [
    // 👤 Opciones para Clientes y Todos los Usuarios
    {
      name: 'Mi Perfil',
      href: '/perfil',
      icon: User,
      roles: ['client', 'staff', 'admin'],
    },
    {
      name: 'Mis Citas',
      href: '/citas',
      icon: Calendar,
      roles: ['client', 'staff', 'admin'],
    },
    {
      name: 'Reservar Cita',
      href: '/reservar',
      icon: Scissors,
      roles: ['client', 'staff', 'admin'],
    },

    // ⚡ Opciones EXCLUSIVAS para Admin y Staff (Ocultas para Clientes)
    {
      name: 'Dashboard Admin',
      href: '/admin',
      icon: LayoutDashboard,
      roles: ['admin', 'staff'],
    },
    {
      name: 'Gestión de Clientes',
      href: '/admin/clientes',
      icon: Users,
      roles: ['admin', 'staff'],
    },
    {
      name: 'Configuración',
      href: '/admin/configuracion',
      icon: Settings,
      roles: ['admin'],
    },
  ]

  // Filtrar los ítems del menú según el rol actual del usuario
  const currentRole = role || 'client'
  const visibleMenuItems = menuItems.filter((item) =>
    item.roles.includes(currentRole)
  )

  return (
    <div className={`min-h-screen flex flex-col ${isDark ? 'bg-[#090710] text-white' : 'bg-stone-50 text-stone-900'}`}>
      
      {/* Encabezado Superior */}
      <HeaderTop setIsSidebarOpen={setIsSidebarOpen} />

      <div className="flex flex-1 relative">
        
        {/* Overlay para cerrar el menú en móviles */}
        {isSidebarOpen && (
          <div
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          />
        )}

        {/* Panel Lateral / Sidebar */}
        <aside
          className={`fixed lg:sticky top-0 left-0 z-50 lg:z-20 h-screen lg:h-[calc(100vh-3.5rem)] w-64 transition-transform duration-300 ease-in-out border-r ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          } ${
            isDark
              ? 'bg-[#0f0c1b] border-fuchsia-950/30'
              : 'bg-white border-pink-100/60'
          }`}
        >
          <div className="flex flex-col h-full justify-between p-4">
            
            {/* Header del Sidebar */}
            <div>
              <div className="flex items-center justify-between pb-6 border-b border-stone-200 dark:border-fuchsia-950/30">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center shadow-md"
                    style={{ background: brandGradient }}
                  >
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold leading-tight">
                      Fresh<span style={{ color: primaryColor }}>Nails</span>
                    </h2>
                    <p className="text-[9px] uppercase tracking-widest text-stone-400">
                      Studio
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="lg:hidden p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navegación Filtrada */}
              <nav className="mt-6 space-y-1.5">
                {visibleMenuItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                        isActive
                          ? 'text-white shadow-sm font-semibold'
                          : isDark
                          ? 'text-stone-400 hover:bg-fuchsia-950/20 hover:text-pink-300'
                          : 'text-stone-600 hover:bg-pink-50 hover:text-pink-600'
                      }`}
                      style={{
                        background: isActive ? brandGradient : 'transparent',
                      }}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.name}</span>
                    </Link>
                  )
                })}
              </nav>
            </div>

            {/* Pie del Sidebar - Botón de Cerrar Sesión */}
            <div className="pt-4 border-t border-stone-200 dark:border-fuchsia-950/30">
              <button
                onClick={() => signOut()}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isDark
                    ? 'text-rose-400 hover:bg-rose-950/30'
                    : 'text-rose-600 hover:bg-rose-50'
                }`}
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Contenido Principal de la Vista */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  )
}
