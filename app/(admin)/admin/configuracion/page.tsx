'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/hooks/useAuth'
import { 
  Settings, Save, Store, Clock, Palette, Instagram, 
  Bell, Check, Loader2, RefreshCw, Facebook, Smartphone, Mail,
  Sparkles, ShieldAlert, Sliders, Globe, AppWindow
} from 'lucide-react'

export default function ConfiguracionPage() {
  const { theme } = useTheme()
  const { tenantId, loading: authLoading } = useAuth()
  const isDark = theme === 'dark'

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [activeSection, setActiveSection] = useState('general')

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
      } catch (err) {
        console.error('Error cargando configuraciones:', err)
      } finally {
        setLoading(false)
      }
    }
    if (tenantId) loadBusinessSettings()
    else if (authLoading === false) setLoading(false)
  }, [tenantId, authLoading])

  const handleSave = async () => {
    if (!tenantId) return
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
      alert('Error al guardar: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="w-10 h-10 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-pink-600/80 font-mono text-xs uppercase tracking-widest animate-pulse">Sincronizando Sistema...</p>
      </div>
    )
  }

  if (!tenantId) {
    return (
      <div className="flex h-96 flex-col items-center justify-center text-center p-4">
        <ShieldAlert className="w-8 h-8 text-rose-500 mb-2 animate-bounce" />
        <p className="text-xs font-mono uppercase tracking-widest text-stone-400">Acceso Restringido</p>
        <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 max-w-xs leading-relaxed">
          Este perfil de administrador no posee un identificador comercial válido.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-1">
      {/* HEADER DE BIENVENIDA CON EL MISMO GLOW DEL DASHBOARD */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-400 p-[1px] shadow-xl shadow-pink-500/10">
        <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 via-transparent to-amber-400/20 animate-pulse" />
        <div className="relative z-10 rounded-[23px] bg-[#fffdfd] dark:bg-[#0f0c1b] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-500 text-white shadow-md shadow-pink-500/30">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-pink-500 dark:text-pink-400 font-bold font-mono">⚙️ Panel de Control</p>
              <h2 className="text-2xl font-serif font-extrabold bg-gradient-to-r from-stone-900 via-pink-900 to-rose-800 bg-clip-text text-transparent dark:from-white dark:to-pink-200 mt-0.5">
                Configuración del Sistema
              </h2>
              <p className="text-xs text-stone-500 dark:text-pink-100/60 mt-0.5">Define la identidad de la marca, colores en tiempo real y reglas globales.</p>
            </div>
          </div>

          <button 
            onClick={handleSave} 
            disabled={saving}
            style={{ backgroundColor: config.primary_color }}
            className="px-5 py-2.5 rounded-xl text-white text-xs font-bold uppercase tracking-wider shadow-md hover:scale-105 transition-all flex items-center gap-2 self-start sm:self-auto disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {saving ? 'Guardando...' : 'Guardar Ajustes'}
          </button>
        </div>
      </div>

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3 animate-fade-in">
          <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center"><Check className="w-4 h-4" /></div>
          <p className="text-xs text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider">
            ¡Los cambios se han inyectado de forma persistente e inmediata!
          </p>
        </div>
      )}

      {/* CONTENEDOR MULTIPESTAÑA IGUAL AL DASHBOARD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* NAVEGACIÓN LATERAL DE AJUSTES */}
        <div className="rounded-2xl bg-[#fffdfd] dark:bg-[#130f24] border border-pink-100/60 dark:border-fuchsia-950/50 p-4 space-y-1.5 h-fit">
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
                    ? 'text-white' 
                    : 'text-stone-500 dark:text-stone-400 hover:bg-pink-50/50 dark:hover:bg-fuchsia-950/20'
                }`}
                style={isActive ? { backgroundColor: config.primary_color, boxShadow: `0 4px 12px ${config.primary_color}30` } : {}}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {s.label}
              </button>
            )
          })}
        </div>

        {/* CONTENEDOR CENTRAL DE FORMULARIOS */}
        <div className="md:col-span-2 rounded-2xl bg-[#fffdfd] dark:bg-[#130f24] border border-pink-100/60 dark:border-fuchsia-950/50 p-6 shadow-xs">
          
          {/* GENERAL SECTION */}
          {activeSection === 'general' && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 border-b border-pink-100/40 pb-3">
                <Store className="w-4 h-4 text-pink-500" />
                <h3 className="text-sm font-black uppercase tracking-wider text-stone-800 dark:text-pink-100">Información Corporativa</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Nombre del Salón</label>
                  <input type="text" value={config.business_name} onChange={(e) => setConfig({...config, business_name: e.target.value})} className="w-full bg-[#fff8fb] dark:bg-[#1a1430]/40 border border-pink-50/60 dark:border-fuchsia-950 rounded-xl px-3 py-2.5 text-xs font-medium focus:outline-none focus:border-pink-400 transition-all text-stone-800 dark:text-pink-100" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Teléfono Comercial</label>
                  <input type="text" value={config.business_phone} onChange={(e) => setConfig({...config, business_phone: e.target.value})} className="w-full bg-[#fff8fb] dark:bg-[#1a1430]/40 border border-pink-50/60 dark:border-fuchsia-950 rounded-xl px-3 py-2.5 text-xs font-medium focus:outline-none focus:border-pink-400 transition-all text-stone-800 dark:text-pink-100" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Email de Atención</label>
                  <input type="email" value={config.business_email} onChange={(e) => setConfig({...config, business_email: e.target.value})} className="w-full bg-[#fff8fb] dark:bg-[#1a1430]/40 border border-pink-50/60 dark:border-fuchsia-950 rounded-xl px-3 py-2.5 text-xs font-medium focus:outline-none focus:border-pink-400 transition-all text-stone-800 dark:text-pink-100" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Divisa Base</label>
                  <select value={config.currency} onChange={(e) => setConfig({...config, currency: e.target.value})} className="w-full bg-[#fff8fb] dark:bg-[#1a1430]/40 border border-pink-50/60 dark:border-fuchsia-950 rounded-xl px-3 py-2.5 text-xs font-medium focus:outline-none focus:border-pink-400 transition-all text-stone-800 dark:text-pink-100">
                    <option value="€">€ Euro</option>
                    <option value="$">$ Dólar</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Dirección Física</label>
                <input type="text" value={config.business_address} onChange={(e) => setConfig({...config, business_address: e.target.value})} className="w-full bg-[#fff8fb] dark:bg-[#1a1430]/40 border border-pink-50/60 dark:border-fuchsia-950 rounded-xl px-3 py-2.5 text-xs font-medium focus:outline-none focus:border-pink-400 transition-all text-stone-800 dark:text-pink-100" />
              </div>

              <div className="flex items-center gap-2 border-b border-pink-100/40 pb-3 pt-4">
                <Sliders className="w-4 h-4 text-rose-500" />
                <h3 className="text-sm font-black uppercase tracking-wider text-stone-800 dark:text-pink-100">Reglas de Turnos</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Franja por Cita (min)</label>
                  <input type="number" value={config.appointment_duration} onChange={(e) => setConfig({...config, appointment_duration: parseInt(e.target.value) || 0})} className="w-full bg-[#fff8fb] dark:bg-[#1a1430]/40 border border-pink-50/60 dark:border-fuchsia-950 rounded-xl px-3 py-2.5 text-xs font-mono focus:outline-none text-stone-800 dark:text-pink-100" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Tiempo de Descanso (min)</label>
                  <input type="number" value={config.appointment_gap} onChange={(e) => setConfig({...config, appointment_gap: parseInt(e.target.value) || 0})} className="w-full bg-[#fff8fb] dark:bg-[#1a1430]/40 border border-pink-50/60 dark:border-fuchsia-950 rounded-xl px-3 py-2.5 text-xs font-mono focus:outline-none text-stone-800 dark:text-pink-100" />
                </div>
              </div>
            </div>
          )}

          {/* SCHEDULE SECTION */}
          {activeSection === 'schedule' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-pink-100/40 pb-3">
                <Clock className="w-4 h-4 text-pink-500" />
                <h3 className="text-sm font-black uppercase tracking-wider text-stone-800 dark:text-pink-100">Horarios de Apertura</h3>
              </div>
              <div className="space-y-2.5">
                {[
                  { key: 'monday', label: 'Lunes' }, { key: 'tuesday', label: 'Martes' },
                  { key: 'wednesday', label: 'Miércoles' }, { key: 'thursday', label: 'Jueves' },
                  { key: 'friday', label: 'Viernes' }, { key: 'saturday', label: 'Sábado' },
                  { key: 'sunday', label: 'Domingo' }
                ].map((day) => (
                  <div key={day.key} className="flex items-center justify-between p-3 bg-[#fff8fb] dark:bg-[#1a1430]/40 border border-pink-50/60 dark:border-fuchsia-950 rounded-xl group transition-all">
                    <span className="text-xs font-bold text-stone-700 dark:text-pink-200 capitalize">{day.label}</span>
                    <input
                      type="text"
                      value={config.schedule[day.key as keyof typeof config.schedule]}
                      onChange={(e) => setConfig({
                        ...config,
                        schedule: { ...config.schedule, [day.key]: e.target.value }
                      })}
                      className="w-48 bg-white dark:bg-[#0f0c1b] border border-pink-100 dark:border-fuchsia-950/60 rounded-lg px-3 py-1.5 text-xs text-right font-mono focus:outline-none focus:border-pink-400 text-stone-800 dark:text-pink-100"
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
              <div className="flex items-center gap-2 border-b border-pink-100/40 pb-3">
                <Palette className="w-4 h-4 text-pink-500" />
                <h3 className="text-sm font-black uppercase tracking-wider text-stone-800 dark:text-pink-100">Identidad Cromática & Temas</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-pink-50 dark:border-fuchsia-950 bg-[#fff8fb] dark:bg-[#1a1430]/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">Color Primario</label>
                    <input type="color" value={config.primary_color} onChange={(e) => setConfig({...config, primary_color: e.target.value})} className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0" />
                  </div>
                  <input type="text" value={config.primary_color} onChange={(e) => setConfig({...config, primary_color: e.target.value})} className="w-full bg-white dark:bg-[#0f0c1b] border border-pink-100 dark:border-fuchsia-950 rounded-lg px-3 py-1.5 text-xs font-mono text-stone-700 dark:text-pink-200" />
                </div>

                <div className="p-4 rounded-xl border border-pink-50 dark:border-fuchsia-950 bg-[#fff8fb] dark:bg-[#1a1430]/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">Color Secundario</label>
                    <input type="color" value={config.secondary_color} onChange={(e) => setConfig({...config, secondary_color: e.target.value})} className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0" />
                  </div>
                  <input type="text" value={config.secondary_color} onChange={(e) => setConfig({...config, secondary_color: e.target.value})} className="w-full bg-white dark:bg-[#0f0c1b] border border-pink-100 dark:border-fuchsia-950 rounded-lg px-3 py-1.5 text-xs font-mono text-stone-700 dark:text-pink-200" />
                </div>
              </div>

              <div className="flex items-center gap-2 border-b border-pink-100/40 pb-3 pt-2">
                <AppWindow className="w-4 h-4 text-rose-500" />
                <h3 className="text-sm font-black uppercase tracking-wider text-stone-800 dark:text-pink-100">Fondos & Tipografías Avanzadas</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Color de Títulos</label>
                  <div className="flex items-center gap-2">
                    <input type="text" value={config.text_title_color} onChange={(e) => setConfig({...config, text_title_color: e.target.value})} className="w-full bg-[#fff8fb] dark:bg-[#1a1430]/40 border border-pink-50/60 dark:border-fuchsia-950 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none text-stone-800 dark:text-pink-100" />
                    <input type="color" value={config.text_title_color} onChange={(e) => setConfig({...config, text_title_color: e.target.value})} className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 shrink-0" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Fondo Base (Claro)</label>
                  <div className="flex items-center gap-2">
                    <input type="text" value={config.bg_light} onChange={(e) => setConfig({...config, bg_light: e.target.value})} className="w-full bg-[#fff8fb] dark:bg-[#1a1430]/40 border border-pink-50/60 dark:border-fuchsia-950 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none text-stone-800 dark:text-pink-100" />
                    <input type="color" value={config.bg_light} onChange={(e) => setConfig({...config, bg_light: e.target.value})} className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 shrink-0" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Fondo Base (Oscuro)</label>
                  <div className="flex items-center gap-2">
                    <input type="text" value={config.bg_dark} onChange={(e) => setConfig({...config, bg_dark: e.target.value})} className="w-full bg-[#fff8fb] dark:bg-[#1a1430]/40 border border-pink-50/60 dark:border-fuchsia-950 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none text-stone-800 dark:text-pink-100" />
                    <input type="color" value={config.bg_dark} onChange={(e) => setConfig({...config, bg_dark: e.target.value})} className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 shrink-0" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Contenedor Tarjetas (Oscuro)</label>
                  <div className="flex items-center gap-2">
                    <input type="text" value={config.panel_dark} onChange={(e) => setConfig({...config, panel_dark: e.target.value})} className="w-full bg-[#fff8fb] dark:bg-[#1a1430]/40 border border-pink-50/60 dark:border-fuchsia-950 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none text-stone-800 dark:text-pink-100" />
                    <input type="color" value={config.panel_dark} onChange={(e) => setConfig({...config, panel_dark: e.target.value})} className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 shrink-0" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SOCIAL SECTION */}
          {activeSection === 'social' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-pink-100/40 pb-3">
                <Instagram className="w-4 h-4 text-pink-500" />
                <h3 className="text-sm font-black uppercase tracking-wider text-stone-800 dark:text-pink-100">Enlaces de Redes Sociales</h3>
              </div>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Perfil de Instagram</label>
                  <input type="text" placeholder="@instagram_handle" value={config.social.instagram} onChange={(e) => setConfig({...config, social: {...config.social, instagram: e.target.value}})} className="w-full bg-[#fff8fb] dark:bg-[#1a1430]/40 border border-pink-50/60 dark:border-fuchsia-950 rounded-xl px-3 py-2.5 text-xs font-medium focus:outline-none focus:border-pink-400 text-stone-800 dark:text-pink-100" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Página de Facebook</label>
                  <input type="text" placeholder="https://facebook.com/..." value={config.social.facebook} onChange={(e) => setConfig({...config, social: {...config.social, facebook: e.target.value}})} className="w-full bg-[#fff8fb] dark:bg-[#1a1430]/40 border border-pink-50/60 dark:border-fuchsia-950 rounded-xl px-3 py-2.5 text-xs font-medium focus:outline-none focus:border-pink-400 text-stone-800 dark:text-pink-100" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Cuenta de TikTok</label>
                  <input type="text" placeholder="@tiktok_handle" value={config.social.tiktok} onChange={(e) => setConfig({...config, social: {...config.social, tiktok: e.target.value}})} className="w-full bg-[#fff8fb] dark:bg-[#1a1430]/40 border border-pink-50/60 dark:border-fuchsia-950 rounded-xl px-3 py-2.5 text-xs font-medium focus:outline-none focus:border-pink-400 text-stone-800 dark:text-pink-100" />
                </div>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS SECTION */}
          {activeSection === 'notifications' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-pink-100/40 pb-3">
                <Bell className="w-4 h-4 text-pink-500" />
                <h3 className="text-sm font-black uppercase tracking-wider text-stone-800 dark:text-pink-100">Automatizaciones de Alerta</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-[#fff8fb] dark:bg-[#1a1430]/40 border border-pink-50/60 dark:border-fuchsia-950 rounded-2xl">
                  <div>
                    <p className="text-xs font-bold text-stone-800 dark:text-pink-100">Alertas Automáticas por Email</p>
                    <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-0.5">Notifica confirmaciones y cambios vía correo electrónico.</p>
                  </div>
                  <button
                    onClick={() => setConfig({
                      ...config,
                      notifications: { ...config.notifications, email: !config.notifications.email }
                    })}
                    style={config.notifications.email ? { backgroundColor: config.primary_color } : {}}
                    className={`px-4 py-1.5 rounded-xl text-[10px] font-mono uppercase font-bold tracking-wider transition-all border ${
                      config.notifications.email
                        ? 'text-white border-transparent shadow-sm'
                        : 'text-stone-400 border-pink-100 dark:border-fuchsia-950'
                    }`}
                  >
                    {config.notifications.email ? 'On' : 'Off'}
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-[#fff8fb] dark:bg-[#1a1430]/40 border border-pink-50/60 dark:border-fuchsia-950 rounded-2xl">
                  <div>
                    <p className="text-xs font-bold text-stone-800 dark:text-pink-100">Recordatorios vía WhatsApp API</p>
                    <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-0.5">Envía un mensaje dinámico automático a la clienta.</p>
                  </div>
                  <button
                    onClick={() => setConfig({
                      ...config,
                      notifications: { ...config.notifications, whatsapp: !config.notifications.whatsapp }
                    })}
                    style={config.notifications.whatsapp ? { backgroundColor: config.primary_color } : {}}
                    className={`px-4 py-1.5 rounded-xl text-[10px] font-mono uppercase font-bold tracking-wider transition-all border ${
                      config.notifications.whatsapp
                        ? 'text-white border-transparent shadow-sm'
                        : 'text-stone-400 border-pink-100 dark:border-fuchsia-950'
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
