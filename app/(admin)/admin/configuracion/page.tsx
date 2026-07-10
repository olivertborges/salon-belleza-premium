'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useSettings } from '@/contexts/SettingsContext'
import { useAuth } from '@/hooks/useAuth'
import { 
  Settings, Save, Store, Clock, Palette, Instagram, 
  Bell, Check, Loader2, RefreshCw, Facebook, Smartphone, Mail,
  Sparkles, ShieldAlert, Sliders, Globe, AppWindow,
  X, TrendingUp, Users, Calendar
} from 'lucide-react'

export default function ConfiguracionPage() {
  const { settings } = useSettings()
  const { tenantId, loading: authLoading } = useAuth()

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState('general')

  const brandGradient = {
    backgroundImage: `linear-gradient(to right, ${settings?.primary_color || '#DB5B9A'}, ${settings?.secondary_color || '#E5A46E'})`
  }

  // Estado extendido para control total de la personalización de la app
  const [config, setConfig] = useState({
    business_name: '',
    business_phone: '',
    business_email: '',
    business_address: '',
    schedule: {
      monday: '09:00 - 21:00', tuesday: '09:00 - 21:00', wednesday: '09:00 - 21:00',
      thursday: '09:00 - 21:00', friday: '09:00 - 21:00', saturday: '09:00 - 21:00', sunday: 'Cerrado'
    },
    primary_color: '#DB5B9A',
    secondary_color: '#E5A46E',
    bg_light: '#fffdfd',
    bg_dark: '#0f0c1b',
    panel_dark: '#130f24',
    text_title_color: '#1c1917',
    social: { instagram: '', facebook: '', tiktok: '' },
    currency: '€',
    appointment_duration: 60,
    appointment_gap: 15,
    notifications: { email: true, whatsapp: true },
    loyalty_points: 1
  })

  const sections = [
    { id: 'general', label: 'General', icon: Store },
    { id: 'schedule', label: 'Horarios', icon: Clock },
    { id: 'appearance', label: 'Diseño & Temas', icon: Palette },
    { id: 'social', label: 'Redes Sociales', icon: Instagram },
    { id: 'notifications', label: 'Notificaciones', icon: Bell },
  ]

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
          setConfig(prev => ({
            ...prev,
            ...data,
            schedule: data.schedule || prev.schedule,
            social: data.social || prev.social,
            notifications: data.notifications || prev.notifications,
            bg_light: data.bg_light || prev.bg_light,
            bg_dark: data.bg_dark || prev.bg_dark,
            panel_dark: data.panel_dark || prev.panel_dark,
            text_title_color: data.text_title_color || prev.text_title_color
          }))
        }
      } catch (err: any) {
        console.error('Error cargando configuraciones:', err)
        setError(err.message || 'Error al cargar la configuración')
        setTimeout(() => setError(null), 3000)
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    }
    if (tenantId) loadBusinessSettings()
    else if (authLoading === false) setLoading(false)
  }, [tenantId, authLoading])

  const handleRefresh = () => {
    setRefreshing(true)
    loadBusinessSettings()
  }

  const handleSave = async () => {
    if (!tenantId) return
    setError(null)
    setSuccess(false)
    try {
      setSaving(true)
      const { error } = await supabase
        .from('business_settings')
        .upsert({
          tenant_id: tenantId,
          ...config,
          updated_at: new Date().toISOString()
        }, { onConflict: 'tenant_id' })

      if (error) throw error
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Error al guardar la configuración')
      setTimeout(() => setError(null), 3000)
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: settings?.primary_color || '#DB5B9A' }}></div>
        <p className="font-mono text-xs uppercase tracking-widest animate-pulse" style={{ color: settings?.primary_color || '#DB5B9A' }}>
          Sincronizando Sistema...
        </p>
      </div>
    )
  }

  if (!tenantId) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center p-6 max-w-md mx-auto">
        <div className="w-12 h-12 rounded-2xl border flex items-center justify-center mb-4 shadow-sm bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950">
          <ShieldAlert className="w-5 h-5 text-rose-500" />
        </div>
        <p className="text-xs font-mono uppercase tracking-[0.2em] font-bold text-rose-500">Acceso Restringido</p>
        <p className="text-[11px] text-stone-500 dark:text-pink-100/60 mt-2 leading-relaxed">
          Este perfil de administrador no posee un identificador comercial válido.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-1 max-w-6xl mx-auto">

      {/* HEADER CON GRADIENTE CONFIGURABLE */}
      <div className="relative overflow-hidden rounded-3xl p-[1px] shadow-xl" style={brandGradient}>
        <div className="absolute inset-0 opacity-20 animate-pulse" style={brandGradient} />
        <div className="relative z-10 rounded-[23px] p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#0f0c1b]">
          <div className="flex items-center gap-4 min-w-0">
            <div className="p-3.5 rounded-2xl text-white shadow-md shrink-0" style={{ backgroundColor: settings?.primary_color || '#DB5B9A' }}>
              <Settings className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-widest font-bold font-mono truncate" style={{ color: settings?.primary_color || '#DB5B9A' }}>
                ⚙️ {settings?.business_name || 'Salón VIP'}
              </p>
              <h2 className="text-xl md:text-2xl font-serif font-extrabold text-stone-900 dark:text-white mt-0.5 truncate">
                Configuración del Sistema
              </h2>
              <p className="text-xs text-stone-500 dark:text-pink-100/60 mt-0.5 truncate">
                Define la identidad de la marca, colores en tiempo real y reglas globales.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto w-full md:w-auto justify-end">
            <button 
              onClick={handleRefresh} 
              disabled={refreshing} 
              className="px-3 py-2 rounded-xl bg-pink-50 dark:bg-fuchsia-950/40 border border-pink-100/60 dark:border-fuchsia-900/40 hover:scale-105 transition-all flex items-center gap-1.5 text-xs font-semibold shrink-0"
              style={{ color: settings?.primary_color || '#DB5B9A' }}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{refreshing ? 'Cargando...' : 'Actualizar'}</span>
              <span className="sm:hidden">{refreshing ? '...' : 'Act.'}</span>
            </button>
            <button 
              onClick={handleSave} 
              disabled={saving}
              className="px-3 py-2 rounded-xl text-white hover:scale-105 transition-all flex items-center gap-1.5 text-xs font-semibold shrink-0 disabled:opacity-50"
              style={{ backgroundColor: settings?.primary_color || '#DB5B9A' }}
            >
              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{saving ? 'Guardando...' : 'Guardar'}</span>
              <span className="sm:hidden">{saving ? '...' : '💾'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* MENSAJES DE ERROR/SUCCESS */}
      {error && (
        <div className="rounded-2xl p-4 bg-gradient-to-r from-rose-500/10 to-pink-500/5 border border-rose-500/20 flex items-center gap-3 shadow-xs">
          <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
            <X className="w-4 h-4" />
          </div>
          <p className="text-xs text-stone-700 dark:text-rose-400 font-medium min-w-0">{error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-2xl p-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 flex items-center gap-3 shadow-xs">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <Check className="w-4 h-4" />
          </div>
          <p className="text-xs text-stone-700 dark:text-emerald-400 font-medium min-w-0">
            ¡Los cambios se han guardado correctamente!
          </p>
        </div>
      )}

      {/* CONTENEDOR MULTIPESTAÑA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* NAVEGACIÓN LATERAL DE AJUSTES */}
        <div className="rounded-2xl border p-4 space-y-1.5 h-fit bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950">
          <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-stone-400 dark:text-fuchsia-400 px-3 mb-2">Secciones</p>
          {sections.map((s) => {
            const Icon = s.icon
            const isActive = activeSection === s.id
            return (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                  isActive 
                    ? 'text-white shadow-sm' 
                    : 'text-stone-500 dark:text-stone-400 hover:bg-pink-50 dark:hover:bg-fuchsia-950/20'
                }`}
                style={isActive ? { backgroundColor: settings?.primary_color || '#DB5B9A' } : {}}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {s.label}
              </button>
            )
          })}
        </div>

        {/* CONTENEDOR CENTRAL DE FORMULARIOS */}
        <div className="md:col-span-2 rounded-2xl border p-6 shadow-sm bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950">

          {/* GENERAL SECTION */}
          {activeSection === 'general' && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 border-b border-pink-100/60 dark:border-fuchsia-950/50 pb-3">
                <Store className="w-4 h-4" style={{ color: settings?.primary_color || '#DB5B9A' }} />
                <h3 className="text-sm font-black uppercase tracking-wider text-stone-800 dark:text-pink-100">Información Corporativa</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Nombre del Salón</label>
                  <input type="text" value={config.business_name} onChange={(e) => setConfig({...config, business_name: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 focus:outline-none focus:ring-2 transition-all text-sm" style={{ '--tw-ring-color': settings?.primary_color || '#DB5B9A' } as React.CSSProperties} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Teléfono Comercial</label>
                  <input type="text" value={config.business_phone} onChange={(e) => setConfig({...config, business_phone: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 focus:outline-none focus:ring-2 transition-all text-sm" style={{ '--tw-ring-color': settings?.primary_color || '#DB5B9A' } as React.CSSProperties} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Email de Atención</label>
                  <input type="email" value={config.business_email} onChange={(e) => setConfig({...config, business_email: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 focus:outline-none focus:ring-2 transition-all text-sm" style={{ '--tw-ring-color': settings?.primary_color || '#DB5B9A' } as React.CSSProperties} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Divisa Base</label>
                  <select value={config.currency} onChange={(e) => setConfig({...config, currency: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 focus:outline-none focus:ring-2 transition-all text-sm appearance-none" style={{ '--tw-ring-color': settings?.primary_color || '#DB5B9A' } as React.CSSProperties}>
                    <option value="€">€ Euro</option>
                    <option value="$">$ Dólar</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Dirección Física</label>
                <input type="text" value={config.business_address} onChange={(e) => setConfig({...config, business_address: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 focus:outline-none focus:ring-2 transition-all text-sm" style={{ '--tw-ring-color': settings?.primary_color || '#DB5B9A' } as React.CSSProperties} />
              </div>

              <div className="flex items-center gap-2 border-b border-pink-100/60 dark:border-fuchsia-950/50 pb-3 pt-4">
                <Sliders className="w-4 h-4 text-rose-500" />
                <h3 className="text-sm font-black uppercase tracking-wider text-stone-800 dark:text-pink-100">Reglas de Turnos</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Franja por Cita (min)</label>
                  <input type="number" value={config.appointment_duration} onChange={(e) => setConfig({...config, appointment_duration: parseInt(e.target.value) || 0})} className="w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 focus:outline-none focus:ring-2 transition-all text-sm font-mono" style={{ '--tw-ring-color': settings?.primary_color || '#DB5B9A' } as React.CSSProperties} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Tiempo de Descanso (min)</label>
                  <input type="number" value={config.appointment_gap} onChange={(e) => setConfig({...config, appointment_gap: parseInt(e.target.value) || 0})} className="w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 focus:outline-none focus:ring-2 transition-all text-sm font-mono" style={{ '--tw-ring-color': settings?.primary_color || '#DB5B9A' } as React.CSSProperties} />
                </div>
              </div>
            </div>
          )}

          {/* SCHEDULE SECTION */}
          {activeSection === 'schedule' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-pink-100/60 dark:border-fuchsia-950/50 pb-3">
                <Clock className="w-4 h-4" style={{ color: settings?.primary_color || '#DB5B9A' }} />
                <h3 className="text-sm font-black uppercase tracking-wider text-stone-800 dark:text-pink-100">Horarios de Apertura</h3>
              </div>
              <div className="space-y-2.5">
                {[
                  { key: 'monday', label: 'Lunes' }, { key: 'tuesday', label: 'Martes' },
                  { key: 'wednesday', label: 'Miércoles' }, { key: 'thursday', label: 'Jueves' },
                  { key: 'friday', label: 'Viernes' }, { key: 'saturday', label: 'Sábado' },
                  { key: 'sunday', label: 'Domingo' }
                ].map((day) => (
                  <div key={day.key} className="flex items-center justify-between p-3 border rounded-xl bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 transition-all">
                    <span className="text-xs font-bold text-stone-700 dark:text-pink-200 capitalize">{day.label}</span>
                    <input
                      type="text"
                      value={config.schedule[day.key as keyof typeof config.schedule]}
                      onChange={(e) => setConfig({
                        ...config,
                        schedule: { ...config.schedule, [day.key]: e.target.value }
                      })}
                      className="w-48 px-3 py-1.5 text-xs text-right font-mono rounded-lg border bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 focus:outline-none focus:ring-2 transition-all"
                      style={{ '--tw-ring-color': settings?.primary_color || '#DB5B9A' } as React.CSSProperties}
                      placeholder="09:00 - 21:00"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* APPEARANCE & BRANDING SECTION */}
          {activeSection === 'appearance' && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 border-b border-pink-100/60 dark:border-fuchsia-950/50 pb-3">
                <Palette className="w-4 h-4" style={{ color: settings?.primary_color || '#DB5B9A' }} />
                <h3 className="text-sm font-black uppercase tracking-wider text-stone-800 dark:text-pink-100">Identidad Cromática & Temas</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">Color Primario</label>
                    <input type="color" value={config.primary_color} onChange={(e) => setConfig({...config, primary_color: e.target.value})} className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0" />
                  </div>
                  <input type="text" value={config.primary_color} onChange={(e) => setConfig({...config, primary_color: e.target.value})} className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-700 dark:text-pink-200 focus:outline-none focus:ring-2 transition-all" style={{ '--tw-ring-color': settings?.primary_color || '#DB5B9A' } as React.CSSProperties} />
                </div>

                <div className="p-4 rounded-xl border bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">Color Secundario</label>
                    <input type="color" value={config.secondary_color} onChange={(e) => setConfig({...config, secondary_color: e.target.value})} className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0" />
                  </div>
                  <input type="text" value={config.secondary_color} onChange={(e) => setConfig({...config, secondary_color: e.target.value})} className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-700 dark:text-pink-200 focus:outline-none focus:ring-2 transition-all" style={{ '--tw-ring-color': settings?.primary_color || '#DB5B9A' } as React.CSSProperties} />
                </div>
              </div>

              <div className="flex items-center gap-2 border-b border-pink-100/60 dark:border-fuchsia-950/50 pb-3 pt-2">
                <AppWindow className="w-4 h-4 text-rose-500" />
                <h3 className="text-sm font-black uppercase tracking-wider text-stone-800 dark:text-pink-100">Fondos & Tipografías Avanzadas</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Color de Títulos</label>
                  <div className="flex items-center gap-2">
                    <input type="text" value={config.text_title_color} onChange={(e) => setConfig({...config, text_title_color: e.target.value})} className="flex-1 px-4 py-2 rounded-xl border bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 focus:outline-none focus:ring-2 transition-all text-sm font-mono" style={{ '--tw-ring-color': settings?.primary_color || '#DB5B9A' } as React.CSSProperties} />
                    <input type="color" value={config.text_title_color} onChange={(e) => setConfig({...config, text_title_color: e.target.value})} className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 shrink-0" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Fondo Base (Claro)</label>
                  <div className="flex items-center gap-2">
                    <input type="text" value={config.bg_light} onChange={(e) => setConfig({...config, bg_light: e.target.value})} className="flex-1 px-4 py-2 rounded-xl border bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 focus:outline-none focus:ring-2 transition-all text-sm font-mono" style={{ '--tw-ring-color': settings?.primary_color || '#DB5B9A' } as React.CSSProperties} />
                    <input type="color" value={config.bg_light} onChange={(e) => setConfig({...config, bg_light: e.target.value})} className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 shrink-0" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Fondo Base (Oscuro)</label>
                  <div className="flex items-center gap-2">
                    <input type="text" value={config.bg_dark} onChange={(e) => setConfig({...config, bg_dark: e.target.value})} className="flex-1 px-4 py-2 rounded-xl border bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 focus:outline-none focus:ring-2 transition-all text-sm font-mono" style={{ '--tw-ring-color': settings?.primary_color || '#DB5B9A' } as React.CSSProperties} />
                    <input type="color" value={config.bg_dark} onChange={(e) => setConfig({...config, bg_dark: e.target.value})} className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 shrink-0" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Contenedor Tarjetas (Oscuro)</label>
                  <div className="flex items-center gap-2">
                    <input type="text" value={config.panel_dark} onChange={(e) => setConfig({...config, panel_dark: e.target.value})} className="flex-1 px-4 py-2 rounded-xl border bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 focus:outline-none focus:ring-2 transition-all text-sm font-mono" style={{ '--tw-ring-color': settings?.primary_color || '#DB5B9A' } as React.CSSProperties} />
                    <input type="color" value={config.panel_dark} onChange={(e) => setConfig({...config, panel_dark: e.target.value})} className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 shrink-0" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SOCIAL SECTION */}
          {activeSection === 'social' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-pink-100/60 dark:border-fuchsia-950/50 pb-3">
                <Instagram className="w-4 h-4" style={{ color: settings?.primary_color || '#DB5B9A' }} />
                <h3 className="text-sm font-black uppercase tracking-wider text-stone-800 dark:text-pink-100">Enlaces de Redes Sociales</h3>
              </div>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Perfil de Instagram</label>
                  <input type="text" placeholder="@instagram_handle" value={config.social.instagram} onChange={(e) => setConfig({...config, social: {...config.social, instagram: e.target.value}})} className="w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 focus:outline-none focus:ring-2 transition-all text-sm" style={{ '--tw-ring-color': settings?.primary_color || '#DB5B9A' } as React.CSSProperties} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Página de Facebook</label>
                  <input type="text" placeholder="https://facebook.com/..." value={config.social.facebook} onChange={(e) => setConfig({...config, social: {...config.social, facebook: e.target.value}})} className="w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 focus:outline-none focus:ring-2 transition-all text-sm" style={{ '--tw-ring-color': settings?.primary_color || '#DB5B9A' } as React.CSSProperties} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Cuenta de TikTok</label>
                  <input type="text" placeholder="@tiktok_handle" value={config.social.tiktok} onChange={(e) => setConfig({...config, social: {...config.social, tiktok: e.target.value}})} className="w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 focus:outline-none focus:ring-2 transition-all text-sm" style={{ '--tw-ring-color': settings?.primary_color || '#DB5B9A' } as React.CSSProperties} />
                </div>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS SECTION */}
          {activeSection === 'notifications' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-pink-100/60 dark:border-fuchsia-950/50 pb-3">
                <Bell className="w-4 h-4" style={{ color: settings?.primary_color || '#DB5B9A' }} />
                <h3 className="text-sm font-black uppercase tracking-wider text-stone-800 dark:text-pink-100">Automatizaciones de Alerta</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 border rounded-2xl bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950">
                  <div>
                    <p className="text-xs font-bold text-stone-800 dark:text-pink-100">Alertas Automáticas por Email</p>
                    <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-0.5">Notifica confirmaciones y cambios vía correo electrónico.</p>
                  </div>
                  <button
                    onClick={() => setConfig({
                      ...config,
                      notifications: { ...config.notifications, email: !config.notifications.email }
                    })}
                    style={config.notifications.email ? { backgroundColor: settings?.primary_color || '#DB5B9A' } : {}}
                    className={`px-4 py-1.5 rounded-xl text-[10px] font-mono uppercase font-bold tracking-wider transition-all border ${
                      config.notifications.email
                        ? 'text-white border-transparent shadow-sm'
                        : 'text-stone-400 border-pink-100/60 dark:border-fuchsia-950'
                    }`}
                  >
                    {config.notifications.email ? 'On' : 'Off'}
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-2xl bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950">
                  <div>
                    <p className="text-xs font-bold text-stone-800 dark:text-pink-100">Recordatorios vía WhatsApp API</p>
                    <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-0.5">Envía un mensaje dinámico automático a la clienta.</p>
                  </div>
                  <button
                    onClick={() => setConfig({
                      ...config,
                      notifications: { ...config.notifications, whatsapp: !config.notifications.whatsapp }
                    })}
                    style={config.notifications.whatsapp ? { backgroundColor: settings?.primary_color || '#DB5B9A' } : {}}
                    className={`px-4 py-1.5 rounded-xl text-[10px] font-mono uppercase font-bold tracking-wider transition-all border ${
                      config.notifications.whatsapp
                        ? 'text-white border-transparent shadow-sm'
                        : 'text-stone-400 border-pink-100/60 dark:border-fuchsia-950'
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