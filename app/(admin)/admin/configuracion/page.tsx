'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { 
  Settings, Save, Store, Phone, Mail, MapPin, 
  Clock, Palette, Instagram, Facebook, Youtube, 
  DollarSign, Bell, Gift, Globe, X, Check,
  Smartphone, Users, Calendar, Sparkles, Edit3,
  Linkedin, Twitter, Share2, Eye, EyeOff,
  Moon, Sun, Monitor, RefreshCw
} from 'lucide-react'

export default function ConfiguracionPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  // Estado local de la configuración
  const [config, setConfig] = useState({
    // Información del negocio
    business_name: 'Fresh Nails Salon',
    business_phone: '+34 123 456 789',
    business_email: 'info@freshnails.com',
    business_address: 'Calle Principal 123, Madrid',
    // Horarios
    schedule: {
      monday: '09:00 - 21:00',
      tuesday: '09:00 - 21:00',
      wednesday: '09:00 - 21:00',
      thursday: '09:00 - 21:00',
      friday: '09:00 - 21:00',
      saturday: '09:00 - 21:00',
      sunday: 'Cerrado'
    },
    // Colores
    primary_color: '#DB5B9A',
    secondary_color: '#E5A46E',
    // Redes sociales
    social: {
      instagram: '@freshnails',
      facebook: 'freshnails',
      tiktok: '@freshnails'
    },
    // Configuración general
    currency: '€',
    appointment_duration: 60,
    appointment_gap: 15,
    // Notificaciones
    notifications: {
      email: true,
      whatsapp: true
    },
    // Fidelización
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
    // Simular carga
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
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light text-white tracking-tight">
            Configuración
          </h1>
          <p className="text-sm text-stone-400 font-light">Personaliza los ajustes del sistema</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-900 rounded-xl text-sm font-medium transition-all disabled:opacity-50 shadow-lg shadow-amber-500/10"
        >
          {saving ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-emerald-400 text-sm flex items-center gap-2">
          <Check className="w-4 h-4" /> Cambios guardados correctamente
        </div>
      )}

      {/* SIDEBAR DE SECCIONES */}
      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Navegación lateral */}
        <div className="md:w-48 flex-shrink-0">
          <div className="bg-[#0e0c0b] border border-stone-900 rounded-xl p-2 space-y-1">
            {sections.map((section) => {
              const Icon = section.icon
              const isActive = activeSection === section.id
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900/30'
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
        <div className="flex-1 bg-[#0e0c0b] border border-stone-900 rounded-xl p-6">

          {/* GENERAL */}
          {activeSection === 'general' && (
            <div className="space-y-5">
              <h3 className="text-sm font-medium text-white">Información del negocio</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-stone-400 font-medium mb-1.5">Nombre</label>
                  <input
                    type="text"
                    value={config.business_name}
                    onChange={(e) => setConfig({...config, business_name: e.target.value})}
                    className="w-full bg-stone-900/50 border border-stone-900 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/30 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-stone-400 font-medium mb-1.5">Teléfono</label>
                  <input
                    type="text"
                    value={config.business_phone}
                    onChange={(e) => setConfig({...config, business_phone: e.target.value})}
                    className="w-full bg-stone-900/50 border border-stone-900 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/30 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-stone-400 font-medium mb-1.5">Email</label>
                  <input
                    type="email"
                    value={config.business_email}
                    onChange={(e) => setConfig({...config, business_email: e.target.value})}
                    className="w-full bg-stone-900/50 border border-stone-900 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/30 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-stone-400 font-medium mb-1.5">Moneda</label>
                  <select
                    value={config.currency}
                    onChange={(e) => setConfig({...config, currency: e.target.value})}
                    className="w-full bg-stone-900/50 border border-stone-900 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/30 transition-all"
                  >
                    <option value="€">€ Euro</option>
                    <option value="$">$ Dólar</option>
                    <option value="MX$">MX$ Peso Mexicano</option>
                    <option value="COP$">COP$ Peso Colombiano</option>
                    <option value="ARS$">ARS$ Peso Argentino</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-stone-400 font-medium mb-1.5">Dirección</label>
                <input
                  type="text"
                  value={config.business_address}
                  onChange={(e) => setConfig({...config, business_address: e.target.value})}
                  className="w-full bg-stone-900/50 border border-stone-900 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/30 transition-all"
                />
              </div>
            </div>
          )}

          {/* HORARIOS */}
          {activeSection === 'schedule' && (
            <div className="space-y-5">
              <h3 className="text-sm font-medium text-white">Horario de atención</h3>
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
                    <span className="text-sm text-stone-400 w-20">{day.label}</span>
                    <input
                      type="text"
                      value={config.schedule[day.key]}
                      onChange={(e) => setConfig({
                        ...config,
                        schedule: { ...config.schedule, [day.key]: e.target.value }
                      })}
                      className="flex-1 bg-stone-900/50 border border-stone-900 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/30 transition-all"
                      placeholder="09:00 - 21:00"
                    />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-stone-900">
                <div>
                  <label className="block text-[10px] text-stone-400 font-medium mb-1.5">Duración cita (min)</label>
                  <input
                    type="number"
                    value={config.appointment_duration}
                    onChange={(e) => setConfig({...config, appointment_duration: parseInt(e.target.value)})}
                    className="w-full bg-stone-900/50 border border-stone-900 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/30 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-stone-400 font-medium mb-1.5">Tiempo entre citas (min)</label>
                  <input
                    type="number"
                    value={config.appointment_gap}
                    onChange={(e) => setConfig({...config, appointment_gap: parseInt(e.target.value)})}
                    className="w-full bg-stone-900/50 border border-stone-900 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/30 transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {/* APARIENCIA */}
          {activeSection === 'appearance' && (
            <div className="space-y-5">
              <h3 className="text-sm font-medium text-white">Colores del sistema</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] text-stone-400 font-medium mb-1.5">Color principal</label>
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-xl border border-stone-800 flex-shrink-0"
                      style={{ backgroundColor: config.primary_color }}
                    />
                    <input
                      type="text"
                      value={config.primary_color}
                      onChange={(e) => setConfig({...config, primary_color: e.target.value})}
                      className="flex-1 bg-stone-900/50 border border-stone-900 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/30 transition-all"
                    />
                    <input
                      type="color"
                      value={config.primary_color}
                      onChange={(e) => setConfig({...config, primary_color: e.target.value})}
                      className="w-10 h-10 rounded-xl border border-stone-900 cursor-pointer bg-transparent p-0"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-stone-400 font-medium mb-1.5">Color secundario</label>
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-xl border border-stone-800 flex-shrink-0"
                      style={{ backgroundColor: config.secondary_color }}
                    />
                    <input
                      type="text"
                      value={config.secondary_color}
                      onChange={(e) => setConfig({...config, secondary_color: e.target.value})}
                      className="flex-1 bg-stone-900/50 border border-stone-900 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/30 transition-all"
                    />
                    <input
                      type="color"
                      value={config.secondary_color}
                      onChange={(e) => setConfig({...config, secondary_color: e.target.value})}
                      className="w-10 h-10 rounded-xl border border-stone-900 cursor-pointer bg-transparent p-0"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* REDES SOCIALES */}
          {activeSection === 'social' && (
            <div className="space-y-5">
              <h3 className="text-sm font-medium text-white">Redes sociales</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] text-stone-400 font-medium mb-1.5 flex items-center gap-2">
                    <Instagram className="w-4 h-4" /> Instagram
                  </label>
                  <input
                    type="text"
                    value={config.social.instagram}
                    onChange={(e) => setConfig({
                      ...config,
                      social: { ...config.social, instagram: e.target.value }
                    })}
                    className="w-full bg-stone-900/50 border border-stone-900 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/30 transition-all"
                    placeholder="@usuario"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-stone-400 font-medium mb-1.5 flex items-center gap-2">
                    <Facebook className="w-4 h-4" /> Facebook
                  </label>
                  <input
                    type="text"
                    value={config.social.facebook}
                    onChange={(e) => setConfig({
                      ...config,
                      social: { ...config.social, facebook: e.target.value }
                    })}
                    className="w-full bg-stone-900/50 border border-stone-900 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/30 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-stone-400 font-medium mb-1.5 flex items-center gap-2">
                    <Smartphone className="w-4 h-4" /> TikTok
                  </label>
                  <input
                    type="text"
                    value={config.social.tiktok}
                    onChange={(e) => setConfig({
                      ...config,
                      social: { ...config.social, tiktok: e.target.value }
                    })}
                    className="w-full bg-stone-900/50 border border-stone-900 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/30 transition-all"
                    placeholder="@usuario"
                  />
                </div>
              </div>
            </div>
          )}

          {/* NOTIFICACIONES */}
          {activeSection === 'notifications' && (
            <div className="space-y-5">
              <h3 className="text-sm font-medium text-white">Notificaciones</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-stone-900/30 border border-stone-900 rounded-xl">
                  <div>
                    <p className="text-sm text-white">Notificaciones por email</p>
                    <p className="text-[10px] text-stone-400">Recibe alertas por correo electrónico</p>
                  </div>
                  <button
                    onClick={() => setConfig({
                      ...config,
                      notifications: { ...config.notifications, email: !config.notifications.email }
                    })}
                    className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                      config.notifications.email
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-stone-800 text-stone-400 border border-stone-700'
                    }`}
                  >
                    {config.notifications.email ? 'Activado' : 'Desactivado'}
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-stone-900/30 border border-stone-900 rounded-xl">
                  <div>
                    <p className="text-sm text-white">Notificaciones por WhatsApp</p>
                    <p className="text-[10px] text-stone-400">Recibe alertas por WhatsApp</p>
                  </div>
                  <button
                    onClick={() => setConfig({
                      ...config,
                      notifications: { ...config.notifications, whatsapp: !config.notifications.whatsapp }
                    })}
                    className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                      config.notifications.whatsapp
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-stone-800 text-stone-400 border border-stone-700'
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
