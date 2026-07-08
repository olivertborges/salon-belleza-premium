'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/hooks/useAuth'
import { 
  Settings, Save, Store, Phone, Mail, MapPin, 
  Clock, Palette, Instagram, Facebook, DollarSign, 
  Bell, X, Check, Smartphone, Loader2, RefreshCw
} from 'lucide-react'

export default function ConfiguracionPage() {
  const { theme } = useTheme()
  const { tenantId, loading: authLoading } = useAuth()
  const isDark = theme === 'dark'

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [activeSection, setActiveSection] = useState('general')

  const [config, setConfig] = useState({
    business_name: '',
    business_phone: '',
    business_email: '',
    business_address: '',
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
      instagram: '',
      facebook: '',
      tiktok: ''
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

  const sections = [
    { id: 'general', label: 'General', icon: Store },
    { id: 'schedule', label: 'Horarios', icon: Clock },
    { id: 'appearance', label: 'Apariencia', icon: Palette },
    { id: 'social', label: 'Redes', icon: Instagram },
    { id: 'notifications', label: 'Notificaciones', icon: Bell },
  ]

  // Cargar configuraciones reales desde Supabase filtradas por tenant_id
  useEffect(() => {
    async function loadBusinessSettings() {
      if (!tenantId) return
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('business_settings')
          .select('*')
          .eq('tenant_id', tenantId)
          .maybeSingle()

        if (error) throw error

        if (data) {
          setConfig({
            business_name: data.business_name || '',
            business_phone: data.business_phone || '',
            business_email: data.business_email || '',
            business_address: data.business_address || '',
            schedule: data.schedule || config.schedule,
            primary_color: data.primary_color || '#DB5B9A',
            secondary_color: data.secondary_color || '#E5A46E',
            social: data.social || config.social,
            currency: data.currency || '€',
            appointment_duration: data.appointment_duration || 60,
            appointment_gap: data.appointment_gap || 15,
            notifications: data.notifications || config.notifications,
            loyalty_points: data.loyalty_points || 1
          })
        }
      } catch (err) {
        console.error('Error cargando configuraciones de Supabase:', err)
      } finally {
        setLoading(false)
      }
    }

    if (tenantId) {
      loadBusinessSettings()
    } else if (authLoading === false) {
      setLoading(false)
    }
  }, [tenantId, authLoading])

  // Guardar (o actualizar) configuraciones reales en Supabase usando un upsert controlado
  const handleSave = async () => {
    if (!tenantId) return
    try {
      setSaving(true)
      const { error } = await supabase
        .from('business_settings')
        .upsert({
          tenant_id: tenantId,
          business_name: config.business_name,
          business_phone: config.business_phone,
          business_email: config.business_email,
          business_address: config.business_address,
          schedule: config.schedule,
          primary_color: config.primary_color,
          secondary_color: config.secondary_color,
          social: config.social,
          currency: config.currency,
          appointment_duration: config.appointment_duration,
          appointment_gap: config.appointment_gap,
          notifications: config.notifications,
          loyalty_points: config.loyalty_points,
          updated_at: new Date().toISOString()
        }, { onConflict: 'tenant_id' })

      if (error) throw error

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      alert('Error al guardar configuraciones: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center space-y-3">
        <Loader2 className="w-5 h-5 animate-spin text-stone-400" />
        <span className="text-[10px] font-mono tracking-widest uppercase text-stone-400">Sincronizando ajustes...</span>
      </div>
    )
  }

  if (!tenantId) {
    return (
      <div className="flex h-96 flex-col items-center justify-center text-center p-4">
        <Settings className="w-6 h-6 text-stone-400 mb-2 stroke-[1.25]" />
        <p className="text-xs font-mono uppercase tracking-widest text-stone-400">Acceso Restringido</p>
        <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-1 max-w-xs leading-relaxed">
          Tu cuenta de administrador no tiene vinculado un identificador de negocio activo (<code className="font-mono text-red-500 bg-stone-100 dark:bg-stone-900 px-1 py-0.5 rounded">tenant_id</code>).
        </p>
      </div>
    )
  }

  return (
    <div className={`max-w-4xl mx-auto space-y-6 transition-colors duration-300 px-1 sm:px-0 ${
      isDark ? 'text-stone-300' : 'text-stone-800'
    }`}>

      {/* CABECERA EDITORIAL */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-stone-200 dark:border-stone-800/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-stone-400 dark:bg-stone-600 animate-pulse" />
            <p className="text-[10px] uppercase tracking-[0.25em] text-stone-400 font-mono font-bold">Ajustes Globales</p>
          </div>
          <h1 className="text-3xl font-serif italic tracking-tight text-stone-900 dark:text-stone-100 mt-2">
            Configuración <span className="text-shimmer">Sistema</span>
          </h1>
          <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-1">Parametrice las reglas de reserva, pasarelas visuales y contacto de su marca.</p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-950 text-[11px] font-mono uppercase tracking-wider font-bold transition-all disabled:opacity-50 shadow-sm"
        >
          {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          {saving ? 'Sincronizando...' : 'Guardar Cambios'}
        </button>
      </div>

      {success && (
        <div className="bg-emerald-500/[0.03] border border-emerald-500/20 rounded-xl p-3 text-emerald-600 dark:text-emerald-400 text-[11px] font-mono uppercase tracking-wider font-bold flex items-center gap-2">
          <Check className="w-3.5 h-3.5" /> Ajustes actualizados de forma persistente
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* NAVEGACIÓN LATERAL */}
        <div className="w-full md:w-48 flex-shrink-0">
          <div className="border border-stone-200 dark:border-stone-800 rounded-xl p-1.5 space-y-1 bg-stone-50/50 dark:bg-[#110f0e]/50">
            {sections.map((section) => {
              const Icon = section.icon
              const isActive = activeSection === section.id
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 shadow-sm font-bold'
                      : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'
                  }`}
                >
                  <Icon className="w-4 h-4 stroke-[1.5]" />
                  {section.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* CONTENEDOR CENTRAL SECCIONAL */}
        <div className="flex-1 w-full border border-stone-200 dark:border-stone-800 rounded-xl p-5 bg-white dark:bg-[#110f0e]/30">
          
          {/* SECCIÓN GENERAL */}
          {activeSection === 'general' && (
            <div className="space-y-4">
              <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-stone-400 pb-1 border-b border-stone-100 dark:border-stone-900">Información Corporativa</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-mono uppercase tracking-wider text-stone-400 font-bold block">Nombre Comercial</label>
                  <input
                    type="text"
                    value={config.business_name}
                    onChange={(e) => setConfig({...config, business_name: e.target.value})}
                    className="w-full bg-stone-50/50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-mono uppercase tracking-wider text-stone-400 font-bold block">Teléfono de Atención</label>
                  <input
                    type="text"
                    value={config.business_phone}
                    onChange={(e) => setConfig({...config, business_phone: e.target.value})}
                    className="w-full bg-stone-50/50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-mono uppercase tracking-wider text-stone-400 font-bold block">Email Corporativo</label>
                  <input
                    type="email"
                    value={config.business_email}
                    onChange={(e) => setConfig({...config, business_email: e.target.value})}
                    className="w-full bg-stone-50/50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-mono uppercase tracking-wider text-stone-400 font-bold block">Divisa Base</label>
                  <select
                    value={config.currency}
                    onChange={(e) => setConfig({...config, currency: e.target.value})}
                    className="w-full bg-stone-50/50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl px-3 py-2 text-xs focus:outline-none text-stone-700 dark:text-stone-300"
                  >
                    <option value="€">€ Euro</option>
                    <option value="$">$ Dólar</option>
                    <option value="MX$">MX$ Peso Mexicano</option>
                    <option value="UYU$">UYU$ Peso Uruguayo</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-mono uppercase tracking-wider text-stone-400 font-bold block">Dirección Física</label>
                <input
                  type="text"
                  value={config.business_address}
                  onChange={(e) => setConfig({...config, business_address: e.target.value})}
                  className="w-full bg-stone-50/50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl px-3 py-2 text-xs focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* SECCIÓN HORARIOS */}
          {activeSection === 'schedule' && (
            <div className="space-y-4">
              <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-stone-400 pb-1 border-b border-stone-100 dark:border-stone-900">Horarios de Apertura</h3>
              <div className="space-y-2">
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
                    <span className="text-xs font-medium w-20 text-stone-400">{day.label}</span>
                    <input
                      type="text"
                      value={config.schedule[day.key as keyof typeof config.schedule]}
                      onChange={(e) => setConfig({
                        ...config,
                        schedule: { ...config.schedule, [day.key]: e.target.value }
                      })}
                      className="flex-1 bg-stone-50/50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl px-3 py-2 text-xs focus:outline-none font-mono"
                      placeholder="09:00 - 21:00"
                    />
                  </div>
                ))}
              </div>
              
              <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-stone-400 pt-3 pb-1 border-b border-stone-100 dark:border-stone-900">Márgenes de Turno</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-mono uppercase tracking-wider text-stone-400 font-bold block">Franja por Cita (min)</label>
                  <input
                    type="number"
                    value={config.appointment_duration}
                    onChange={(e) => setConfig({...config, appointment_duration: parseInt(e.target.value) || 0})}
                    className="w-full bg-stone-50/50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl px-3 py-2 text-xs focus:outline-none font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-mono uppercase tracking-wider text-stone-400 font-bold block">Tiempo entre citas (min)</label>
                  <input
                    type="number"
                    value={config.appointment_gap}
                    onChange={(e) => setConfig({...config, appointment_gap: parseInt(e.target.value) || 0})}
                    className="w-full bg-stone-50/50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl px-3 py-2 text-xs focus:outline-none font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECCIÓN APARIENCIA */}
          {activeSection === 'appearance' && (
            <div className="space-y-4">
              <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-stone-400 pb-1 border-b border-stone-100 dark:border-stone-900">Pasarela de Identidad</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-mono uppercase tracking-wider text-stone-400 font-bold block">Tonalidad Primaria</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={config.primary_color}
                      onChange={(e) => setConfig({...config, primary_color: e.target.value})}
                      className="flex-1 bg-stone-50/50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl px-3 py-2 text-xs focus:outline-none font-mono"
                    />
                    <input
                      type="color"
                      value={config.primary_color}
                      onChange={(e) => setConfig({...config, primary_color: e.target.value})}
                      className="w-8 h-8 rounded-xl border border-stone-200 dark:border-stone-800 cursor-pointer bg-transparent p-0 shrink-0"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-mono uppercase tracking-wider text-stone-400 font-bold block">Tonalidad Secundaria</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={config.secondary_color}
                      onChange={(e) => setConfig({...config, secondary_color: e.target.value})}
                      className="flex-1 bg-stone-50/50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl px-3 py-2 text-xs focus:outline-none font-mono"
                    />
                    <input
                      type="color"
                      value={config.secondary_color}
                      onChange={(e) => setConfig({...config, secondary_color: e.target.value})}
                      className="w-8 h-8 rounded-xl border border-stone-200 dark:border-stone-800 cursor-pointer bg-transparent p-0 shrink-0"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECCIÓN REDES */}
          {activeSection === 'social' && (
            <div className="space-y-4">
              <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-stone-400 pb-1 border-b border-stone-100 dark:border-stone-900">Canales de Difusión</h3>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-mono uppercase tracking-wider text-stone-400 font-bold block">Instagram Handle</label>
                  <input
                    type="text"
                    value={config.social.instagram}
                    onChange={(e) => setConfig({
                      ...config,
                      social: { ...config.social, instagram: e.target.value }
                    })}
                    className="w-full bg-stone-50/50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl px-3 py-2 text-xs focus:outline-none"
                    placeholder="@usuario"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-mono uppercase tracking-wider text-stone-400 font-bold block">Facebook Page</label>
                  <input
                    type="text"
                    value={config.social.facebook}
                    onChange={(e) => setConfig({
                      ...config,
                      social: { ...config.social, facebook: e.target.value }
                    })}
                    className="w-full bg-stone-50/50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-mono uppercase tracking-wider text-stone-400 font-bold block">TikTok Profile</label>
                  <input
                    type="text"
                    value={config.social.tiktok}
                    onChange={(e) => setConfig({
                      ...config,
                      social: { ...config.social, tiktok: e.target.value }
                    })}
                    className="w-full bg-stone-50/50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl px-3 py-2 text-xs focus:outline-none"
                    placeholder="@usuario"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECCIÓN NOTIFICACIONES */}
          {activeSection === 'notifications' && (
            <div className="space-y-4">
              <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-stone-400 pb-1 border-b border-stone-100 dark:border-stone-900">Automatizaciones de Alerta</h3>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between p-3 border border-stone-100 dark:border-stone-900 rounded-xl bg-stone-50/30">
                  <div>
                    <p className="text-xs font-bold text-stone-900 dark:text-stone-200">Alertas por Correo Electrónico</p>
                    <p className="text-[10px] text-stone-400">Envia confirmaciones automáticas vía SMTP.</p>
                  </div>
                  <button
                    onClick={() => setConfig({
                      ...config,
                      notifications: { ...config.notifications, email: !config.notifications.email }
                    })}
                    className={`px-3 py-1 rounded-lg text-[10px] font-mono uppercase font-bold tracking-wider border ${
                      config.notifications.email
                        ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-950 border-transparent'
                        : 'text-stone-400 border-stone-200 dark:border-stone-800 hover:bg-stone-50'
                    }`}
                  >
                    {config.notifications.email ? 'On' : 'Off'}
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 border border-stone-100 dark:border-stone-900 rounded-xl bg-stone-50/30">
                  <div>
                    <p className="text-xs font-bold text-stone-900 dark:text-stone-200">Recordatorios vía WhatsApp</p>
                    <p className="text-[10px] text-stone-400">Despacha notificaciones usando la API de mensajería.</p>
                  </div>
                  <button
                    onClick={() => setConfig({
                      ...config,
                      notifications: { ...config.notifications, whatsapp: !config.notifications.whatsapp }
                    })}
                    className={`px-3 py-1 rounded-lg text-[10px] font-mono uppercase font-bold tracking-wider border ${
                      config.notifications.whatsapp
                        ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-950 border-transparent'
                        : 'text-stone-400 border-stone-200 dark:border-stone-800 hover:bg-stone-50'
                    }`}
                  >
                    {config.notifications.whatsapp ? 'On' : 'Off'}
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
