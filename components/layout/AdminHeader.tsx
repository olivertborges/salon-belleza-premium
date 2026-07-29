'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/contexts/ThemeContext'
import { Bell, Menu, User, Sun, Moon, Sparkles } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface AdminHeaderProps {
  collapsed: boolean
  onMenuClick: () => void
}

export default function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [showNotifications, setShowNotifications] = useState(false)
  const [userName, setUserName] = useState('Admin')

  const isDark = theme === 'dark'

  // Obtener el nombre del usuario
  useEffect(() => {
    if (user) {
      const name = user.user_metadata?.full_name || 
                   user.user_metadata?.name || 
                   user.user_metadata?.first_name ||
                   user.email?.split('@')[0] || 
                   'Admin'
      setUserName(name)
    }
  }, [user])

  const notifications = [
    { id: 1, message: 'María González ha agendado una cita', time: 'Hace 5 min', read: false },
    { id: 2, message: 'Carlos Ruiz confirmó su cita de mañana', time: 'Hace 2h', read: false },
    { id: 3, message: 'Nueva clienta: Sofía Martínez', time: 'Hace 4h', read: true },
  ]

  const unreadCount = notifications.filter(n => !n.read).length
  const firstName = userName.split(' ')[0] || userName

  return (
    <header className={`sticky top-0 z-30 backdrop-blur-md border-b px-4 md:px-8 h-20 flex items-center justify-between transition-colors duration-300 ${
      isDark
        ? 'bg-[#1E120C]/95 border-[#3D281E] text-[#FFF9F6]'
        : 'bg-[#FFF9F6]/95 border-[#F0E4DA] text-[#1A0E0A]'
    }`}>
      {/* ============================================================ */}
      {/* LADO IZQUIERDO */}
      {/* ============================================================ */}
      <div className="flex items-center gap-3 md:gap-4">
        {/* Botón hamburguesa (móvil) */}
        <button
          onClick={onMenuClick}
          className={`lg:hidden h-10 w-10 p-2.5 rounded-xl border flex items-center justify-center transition-all shrink-0 ${
            isDark
              ? 'bg-[#2A1B14] border-[#3D281E] text-[#A89588] hover:text-[#FFF9F6] hover:border-[#D4AF37]/40'
              : 'bg-white border-[#F0E4DA] text-[#5C4A3E] hover:text-[#1A0E0A] hover:bg-[#FFF9F6] hover:border-[#D4AF37]/40'
          }`}
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className={`text-sm md:text-lg font-light tracking-tight transition-colors ${
            isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'
          }`}>
            Bienvenido,{' '}
            <span className="font-bold text-[#D4AF37]">{firstName}</span>
          </h1>
          <p className={`text-[10px] md:text-xs font-light hidden sm:block transition-colors ${
            isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
          }`}>
            {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}
          </p>
        </div>
      </div>

      {/* ============================================================ */}
      {/* LADO DERECHO */}
      {/* ============================================================ */}
      <div className="flex items-center gap-2.5 md:gap-4 h-10">

        {/* 1. Icono Cambiar Tema */}
        <button
          onClick={toggleTheme}
          className={`h-10 w-10 p-2.5 rounded-xl border flex items-center justify-center transition-all shrink-0 ${
            isDark
              ? 'bg-[#2A1B14] border-[#3D281E] text-[#A89588] hover:text-[#FFF9F6] hover:border-[#D4AF37]/40'
              : 'bg-white border-[#F0E4DA] text-[#5C4A3E] hover:text-[#1A0E0A] hover:bg-[#FFF9F6] hover:border-[#D4AF37]/40'
          }`}
          aria-label="Cambiar tema"
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-[#D4AF37] animate-pulse" />
          ) : (
            <Moon className="w-4 h-4 text-[#D4AF37]" />
          )}
        </button>

        {/* 2. Icono Notificaciones */}
        <div className="relative h-10 w-10 shrink-0 flex items-center justify-center">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`h-10 w-10 p-2.5 rounded-xl border flex items-center justify-center transition-all relative ${
              isDark
                ? 'bg-[#2A1B14] border-[#3D281E] text-[#A89588] hover:text-[#FFF9F6] hover:border-[#D4AF37]/40'
                : 'bg-white border-[#F0E4DA] text-[#5C4A3E] hover:text-[#1A0E0A] hover:bg-[#FFF9F6] hover:border-[#D4AF37]/40'
            }`}
          >
            <Bell className="w-4 h-4 md:w-5 md:h-5" />
            {unreadCount > 0 && (
              <span className={`absolute top-1.5 right-1.5 w-4 h-4 text-[8px] font-bold text-[#1A0E0A] rounded-full flex items-center justify-center border animate-pulse shadow-[0_0_10px_rgba(212,175,55,0.4)] ${
                isDark ? 'border-[#1E120C]' : 'border-[#FFF9F6]'
              } bg-[#D4AF37]`}>
                {unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown notificaciones */}
          {showNotifications && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
              <div className={`absolute right-0 top-full mt-2 w-72 sm:w-80 rounded-2xl shadow-2xl overflow-hidden z-50 border backdrop-blur-xl ${
                isDark
                  ? 'bg-[#1E120C]/95 border-[#3D281E] text-[#FFF9F6]'
                  : 'bg-[#FFF9F6]/95 border-[#F0E4DA] text-[#1A0E0A]'
              }`}>
                <div className={`p-3 border-b flex items-center justify-between ${
                  isDark ? 'border-[#3D281E]' : 'border-[#F0E4DA]'
                }`}>
                  <span className={`text-xs font-semibold ${
                    isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'
                  }`}>
                    Notificaciones
                  </span>
                  <button className={`text-[10px] font-medium transition-colors ${
                    isDark ? 'text-[#A89588] hover:text-[#D4AF37]' : 'text-[#5C4A3E] hover:text-[#D4AF37]'
                  }`}>
                    Marcar todas como leídas
                  </button>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.map((n) => (
                    <div key={n.id} className={`p-3 border-b transition-colors ${!n.read ? (isDark ? 'bg-[#D4AF37]/5' : 'bg-[#D4AF37]/5') : ''} ${
                      isDark ? 'border-[#3D281E] hover:bg-[#2A1B14]' : 'border-[#F0E4DA] hover:bg-[#FFF9F6]'
                    }`}>
                      <p className={`text-xs ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'} ${!n.read ? 'font-medium' : ''}`}>
                        {n.message}
                      </p>
                      <p className={`text-[10px] mt-1 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>
                        {n.time}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* 3. Icono Perfil móvil */}
        <button className={`md:hidden h-10 w-10 p-2.5 rounded-xl border flex items-center justify-center transition-all shrink-0 ${
          isDark
            ? 'bg-[#2A1B14] border-[#3D281E] text-[#A89588] hover:text-[#FFF9F6] hover:border-[#D4AF37]/40'
            : 'bg-white border-[#F0E4DA] text-[#5C4A3E] hover:text-[#1A0E0A] hover:bg-[#FFF9F6] hover:border-[#D4AF37]/40'
        }`}>
          <User className="w-4 h-4" />
        </button>

        {/* Separador Visual y Perfil (Desktop) */}
        <div className={`h-6 w-[1px] mx-0.5 hidden md:block shrink-0 ${isDark ? 'bg-[#3D281E]' : 'bg-[#F0E4DA]'}`} />

        <div className="hidden md:flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className={`text-xs font-medium truncate max-w-[150px] transition-colors ${
              isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'
            }`}>
              {userName}
            </p>
            <span className={`text-[9px] font-mono tracking-wider uppercase transition-colors text-[#D4AF37]`}>
              Admin
            </span>
          </div>
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center text-sm font-bold shadow-sm transition-colors ${
            isDark
              ? 'bg-[#2A1B14] border-[#D4AF37]/40 text-[#D4AF37]'
              : 'bg-[#FFF9F6] border-[#D4AF37]/40 text-[#D4AF37]'
          }`}>
            {firstName.charAt(0).toUpperCase()}
          </div>
        </div>

      </div>
    </header>
  )
}