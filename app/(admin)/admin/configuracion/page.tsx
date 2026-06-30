'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useTheme } from '@/contexts/ThemeContext'
import { 
  Settings, Save, Store, Phone, Mail, MapPin, 
  Clock, Palette, Instagram, Facebook, Youtube, 
  DollarSign, Bell, Gift, Globe, X, Check,
  Smartphone, Users, Calendar, Sparkles, Edit3,
  Linkedin, Twitter, Share2, Eye, EyeOff,
  Moon, Sun, Monitor, RefreshCw
} from 'lucide-react'

export default function ConfiguracionPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  const [config, setConfig] = useState({
    business_name: 'Fresh Nails Salon',
    business_phone: '+34 123 456 789',
    business_email: 'info@freshnails.com',
    business_address: 'Calle Principal 123, Madrid',
    schedule: {
      monday: '09:00 - 21:00',
      tuesday: '09:00 - 21:00',
      wednesday: '09:00 - 21:00',
      thursday: '09:00 - 21:00',
      friday: '09:00 - 21:00',
      saturday: '09:00 - 21:00',
      sunday: 'Cerrado'
    },
    primary_color: '#DB5B9A',
    secondary_color: '#E5A46E',
    social: {
      instagram: '@freshnails',
      facebook: 'freshnails',
      tiktok: '@freshnails'
    },
    currency: '€',
    appointment_duration: 60,
    appointment_gap: 15,
    notifications: {
      email: true,
      whatsapp: true
    },
    loyalty_points: 1
  })

  const [activeSection, setActiveSection] = useState('general')

  const sections = [
    { id: 'general', label: 'General', icon: Store },
    { id: 'schedule', label: 'Horarios', icon: Clock },
    { id: 'appearance', label: 'Apariencia', icon: Palette },
    { id: 'social', label: 'Redes', icon: Instagram },
    { id: 'notifications', label: 'Notificaciones', icon: Bell },
  ]

  useEffect(() => {
    setTimeout(() => setLoading(false), 500)
  }, [])

  const handleSave = () => {
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }, 1000)
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="relative">
          <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-8 h-8 border-3 border-amber-500/20 rounded-full animate-ping"></div>
        </div>
        <span className="ml-4 text-xs font-mono text-amber-500 animate-pulse">Cargando configuración...</span>
      </div>
    )
  }

  return (
    <div className={`max-w-4xl mx-auto space-y-6 transition-colors duration-300 ${
      isDark ? 'text-stone-200' : 'text-stone-800'
    }`}>

      {/* HEADER CON CARD-GLOW */}
      <div className={`card-glow relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/[0.08] via-card to-card border border-amber-500/20 p-6 shadow-xl animate-fade-up ${
        isDark 
          ? 'bg-gradient-to-br from-amber-950/20 via-[#161311] to-[#0a0908]' 
          : 'bg-gradient-to-br from-amber-50/50 via-white to-stone-50'
      }`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
        
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-amber-600 dark:text-amber-400 font-mono flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              ⚙️ Panel de Control
            </p>
            <h2 className="text-2xl font-serif italic text-foreground mt-1">
              Configuración <span className="text-shimmer">Premium</span>
            </h2>
            <p className={`text-xs mt-1 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>Personaliza los ajustes del sistema</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="glow-hover flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-50 shadow-lg shadow-amber-600/20"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-2 animate-fade-up">
          <Check className="w-4 h-4" /> Cambios guardados correctamente
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6">

        {/* Navegación lateral */}
        <div className="md:w-48 flex-shrink-0">
          <div className={`border rounded-xl p-2 space-y-1 ${
            isDark ? 'bg-stone-900/40 border-stone-800/80' : 'bg-white border-stone-200'
          }`}>
            {sections.map((section) => {
              const Icon = section.icon
              const isActive = activeSection === section.id
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all hover:scale-105 ${
                    isActive
                      ? isDark
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                      : `text-mutedForeground hover:text-foreground hover:bg-muted ${
                          isDark ? 'hover:bg-stone-800/30' : 'hover:bg-stone-100'
                        }`
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {section.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* CONTENIDO */}
        <div className={`flex-1 border rounded-xl p-6 ${
          isDark ? 'bg-stone-900/40 border-stone-800/80' : 'bg-white border-stone-200'
        }`}>

          {/* GENERAL */}
          {activeSection === 'general' && (
            <div className="space-y-5">
              <h3 className={`text-sm font-medium ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>Información del negocio</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-[10px] font-medium mb-1.5 ${
                    isDark ? 'text-stone-400' : 'text-stone-500'
                  }`}>Nombre</label>
                  <input
                    type="text"
                    value={config.business_name}
                    onChange={(e) => setConfig({...config, business_name: e.target.value})}
                    className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500/30 transition-all ${
                      isDark 
                        ? 'bg-stone-950 border-stone-800 text-stone-200' 
                        : 'bg-stone-50 border-stone-200 text-stone-800'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-[10px] font-medium mb-1.5 ${
                    isDark ? 'text-stone-400' : 'text-stone-500'
                  }`}>Teléfono</label>
                  <input
                    type="text"
                    value={config.business_phone}
                    onChange={(e) => setConfig({...config, business_phone: e.target.value})}
                    className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500/30 transition-all ${
                      isDark 
                        ? 'bg-stone-950 border-stone-800 text-stone-200' 
                        : 'bg-stone-50 border-stone-200 text-stone-800'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-[10px] font-medium mb-1.5 ${
                    isDark ? 'text-stone-400' : 'text-stone-500'
                  }`}>Email</label>
                  <input
                    type="email"
                    value={config.business_email}
                    onChange={(e) => setConfig({...config, business_email: e.target.value})}
                    className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500/30 transition-all ${
                      isDark 
                        ? 'bg-stone-950 border-stone-800 text-stone-200' 
                        : 'bg-stone-50 border-stone-200 text-stone-800'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-[10px] font-medium mb-1.5 ${
                    isDark ? 'text-stone-400' : 'text-stone-500'
                  }`}>Moneda</label>
                  <select
                    value={config.currency}
                    onChange={(e) => setConfig({...config, currency: e.target.value})}
                    className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500/30 transition-all ${
                      isDark 
                        ? 'bg-stone-950 border-stone-800 text-stone-200' 
                        : 'bg-stone-50 border-stone-200 text-stone-800'
                    }`}
                  >
                    <option value="€" className={isDark ? 'bg-stone-950 text-stone-200' : 'bg-white text-stone-800'}>€ Euro</option>
                    <option value="$" className={isDark ? 'bg-stone-950 text-stone-200' : 'bg-white text-stone-800'}>$ Dólar</option>
                    <option value="MX$" className={isDark ? 'bg-stone-950 text-stone-200' : 'bg-white text-stone-800'}>MX$ Peso Mexicano</option>
                    <option value="COP$" className={isDark ? 'bg-stone-950 text-stone-200' : 'bg-white text-stone-800'}>COP$ Peso Colombiano</option>
                    <option value="ARS$" className={isDark ? 'bg-stone-950 text-stone-200' : 'bg-white text-stone-800'}>ARS$ Peso Argentino</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={`block text-[10px] font-medium mb-1.5 ${
                  isDark ? 'text-stone-400' : 'text-stone-500'
                }`}>Dirección</label>
                <input
                  type="text"
                  value={config.business_address}
                  onChange={(e) => setConfig({...config, business_address: e.target.value})}
                  className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500/30 transition-all ${
                    isDark 
                      ? 'bg-stone-950 border-stone-800 text-stone-200' 
                      : 'bg-stone-50 border-stone-200 text-stone-800'
                  }`}
                />
              </div>
            </div>
          )}

          {/* HORARIOS */}
          {activeSection === 'schedule' && (
            <div className="space-y-5">
              <h3 className={`text-sm font-medium ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>Horario de atención</h3>
              <div className="space-y-3">
                {[
                  { key: 'monday', label: 'Lunes' },
                  { key: 'tuesday', label: 'Martes' },
                  { key: 'wednesday', label: 'Miércoles' },
                  { key: 'thursday', label: 'Jueves' },
                  { key: 'friday', label: 'Viernes' },
                  { key: 'saturday', label: 'Sábado' },
                  { key: 'sunday', label: 'Domingo' },
                ].map((day) => (
                  <div key={day.key} className="flex items-center gap-3">
                    <span className={`text-sm w-20 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>{day.label}</span>
                    <input
                      type="text"
                      value={config.schedule[day.key as keyof typeof config.schedule]}
                      onChange={(e) => setConfig({
                        ...config,
                        schedule: { ...config.schedule, [day.key]: e.target.value }
                      })}
                      className={`flex-1 border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500/30 transition-all ${
                        isDark 
                          ? 'bg-stone-950 border-stone-800 text-stone-200' 
                          : 'bg-stone-50 border-stone-200 text-stone-800'
                      }`}
                      placeholder="09:00 - 21:00"
                    />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div>
                  <label className={`block text-[10px] font-medium mb-1.5 ${
                    isDark ? 'text-stone-400' : 'text-stone-500'
                  }`}>Duración cita (min)</label>
                  <input
                    type="number"
                    value={config.appointment_duration}
                    onChange={(e) => setConfig({...config, appointment_duration: parseInt(e.target.value) || 0})}
                    className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500/30 transition-all ${
                      isDark 
                        ? 'bg-stone-950 border-stone-800 text-stone-200' 
                        : 'bg-stone-50 border-stone-200 text-stone-800'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-[10px] font-medium mb-1.5 ${
                    isDark ? 'text-stone-400' : 'text-stone-500'
                  }`}>Tiempo entre citas (min)</label>
                  <input
                    type="number"
                    value={config.appointment_gap}
                    onChange={(e) => setConfig({...config, appointment_gap: parseInt(e.target.value) || 0})}
                    className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500/30 transition-all ${
                      isDark 
                        ? 'bg-stone-950 border-stone-800 text-stone-200' 
                        : 'bg-stone-50 border-stone-200 text-stone-800'
                    }`}
                  />
                </div>
              </div>
            </div>
          )}

          {/* APARIENCIA */}
          {activeSection === 'appearance' && (
            <div className="space-y-5">
              <h3 className={`text-sm font-medium ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>Colores del sistema</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={`block text-[10px] font-medium mb-1.5 ${
                    isDark ? 'text-stone-400' : 'text-stone-500'
                  }`}>Color principal</label>
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-xl border border-border flex-shrink-0"
                      style={{ backgroundColor: config.primary_color }}
                    />
                    <input
                      type="text"
                      value={config.primary_color}
                      onChange={(e) => setConfig({...config, primary_color: e.target.value})}
                      className={`flex-1 border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500/30 transition-all ${
                        isDark 
                          ? 'bg-stone-950 border-stone-800 text-stone-200' 
                          : 'bg-stone-50 border-stone-200 text-stone-800'
                      }`}
                    />
                    <input
                      type="color"
                      value={config.primary_color}
                      onChange={(e) => setConfig({...config, primary_color: e.target.value})}
                      className="w-10 h-10 rounded-xl border border-border cursor-pointer bg-transparent p-0"
                    />
                  </div>
                </div>
                <div>
                  <label className={`block text-[10px] font-medium mb-1.5 ${
                    isDark ? 'text-stone-400' : 'text-stone-500'
                  }`}>Color secundario</label>
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-xl border border-border flex-shrink-0"
                      style={{ backgroundColor: config.secondary_color }}
                    />
                    <input
                      type="text"
                      value={config.secondary_color}
                      onChange={(e) => setConfig({...config, secondary_color: e.target.value})}
                      className={`flex-1 border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500/30 transition-all ${
                        isDark 
                          ? 'bg-stone-950 border-stone-800 text-stone-200' 
                          : 'bg-stone-50 border-stone-200 text-stone-800'
                      }`}
                    />
                    <input
                      type="color"
                      value={config.secondary_color}
                      onChange={(e) => setConfig({...config, secondary_color: e.target.value})}
                      className="w-10 h-10 rounded-xl border border-border cursor-pointer bg-transparent p-0"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* REDES SOCIALES */}
          {activeSection === 'social' && (
            <div className="space-y-5">
              <h3 className={`text-sm font-medium ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>Redes sociales</h3>
              <div className="space-y-4">
                <div>
                  <label className={`block text-[10px] font-medium mb-1.5 flex items-center gap-2 ${
                    isDark ? 'text-stone-400' : 'text-stone-500'
                  }`}>
                    <Instagram className="w-4 h-4 text-mutedForeground/80" /> Instagram
                  </label>
                  <input
                    type="text"
                    value={config.social.instagram}
                    onChange={(e) => setConfig({
                      ...config,
                      social: { ...config.social, instagram: e.target.value }
                    })}
                    className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500/30 transition-all ${
                      isDark 
                        ? 'bg-stone-950 border-stone-800 text-stone-200' 
                        : 'bg-stone-50 border-stone-200 text-stone-800'
                    }`}
                    placeholder="@usuario"
                  />
                </div>
                <div>
                  <label className={`block text-[10px] font-medium mb-1.5 flex items-center gap-2 ${
                    isDark ? 'text-stone-400' : 'text-stone-500'
                  }`}>
                    <Facebook className="w-4 h-4 text-mutedForeground/80" /> Facebook
                  </label>
                  <input
                    type="text"
                    value={config.social.facebook}
                    onChange={(e) => setConfig({
                      ...config,
                      social: { ...config.social, facebook: e.target.value }
                    })}
                    className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500/30 transition-all ${
                      isDark 
                        ? 'bg-stone-950 border-stone-800 text-stone-200' 
                        : 'bg-stone-50 border-stone-200 text-stone-800'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-[10px] font-medium mb-1.5 flex items-center gap-2 ${
                    isDark ? 'text-stone-400' : 'text-stone-500'
                  }`}>
                    <Smartphone className="w-4 h-4 text-mutedForeground/80" /> TikTok
                  </label>
                  <input
                    type="text"
                    value={config.social.tiktok}
                    onChange={(e) => setConfig({
                      ...config,
                      social: { ...config.social, tiktok: e.target.value }
                    })}
                    className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500/30 transition-all ${
                      isDark 
                        ? 'bg-stone-950 border-stone-800 text-stone-200' 
                        : 'bg-stone-50 border-stone-200 text-stone-800'
                    }`}
                    placeholder="@usuario"
                  />
                </div>
              </div>
            </div>
          )}

          {/* NOTIFICACIONES */}
          {activeSection === 'notifications' && (
            <div className="space-y-5">
              <h3 className={`text-sm font-medium ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>Notificaciones</h3>
              <div className="space-y-4">
                <div className={`flex items-center justify-between p-4 border rounded-xl ${
                  isDark ? 'bg-stone-900/30 border-stone-800' : 'bg-stone-50 border-stone-200'
                }`}>
                  <div>
                    <p className={`text-sm ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>Notificaciones por email</p>
                    <p className={`text-[10px] ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>Recibe alertas por correo electrónico</p>
                  </div>
                  <button
                    onClick={() => setConfig({
                      ...config,
                      notifications: { ...config.notifications, email: !config.notifications.email }
                    })}
                    className={`px-4 py-2 rounded-xl text-xs font-medium transition-all hover:scale-105 ${
                      config.notifications.email
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        : `bg-muted text-mutedForeground border border-border ${
                            isDark ? 'bg-stone-800 border-stone-700' : ''
                          }`
                    }`}
                  >
                    {config.notifications.email ? 'Activado' : 'Desactivado'}
                  </button>
                </div>

                <div className={`flex items-center justify-between p-4 border rounded-xl ${
                  isDark ? 'bg-stone-900/30 border-stone-800' : 'bg-stone-50 border-stone-200'
                }`}>
                  <div>
                    <p className={`text-sm ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>Notificaciones por WhatsApp</p>
                    <p className={`text-[10px] ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>Recibe alertas por WhatsApp</p>
                  </div>
                  <button
                    onClick={() => setConfig({
                      ...config,
                      notifications: { ...config.notifications, whatsapp: !config.notifications.whatsapp }
                    })}
                    className={`px-4 py-2 rounded-xl text-xs font-medium transition-all hover:scale-105 ${
                      config.notifications.whatsapp
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        : `bg-muted text-mutedForeground border border-border ${
                            isDark ? 'bg-stone-800 border-stone-700' : ''
                          }`
                    }`}
                  >
                    {config.notifications.whatsapp ? 'Activado' : 'Desactivado'}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}