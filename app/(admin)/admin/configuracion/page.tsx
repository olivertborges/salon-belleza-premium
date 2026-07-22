// @ts-nocheck
'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useSettings } from '@/contexts/SettingsContext'
import { useAuth } from '@/hooks/useAuth'
import { 
  Settings, Save, Store, Clock, Palette, 
  Check, RefreshCw, X, ShieldAlert,
  Sliders, TrendingUp, Users, Calendar,
  PlusCircle, AlertCircle, Sparkles
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

  const primaryColor = settings?.primary_color || '#DB5B9A'
  const secondaryColor = settings?.secondary_color || '#E5A46E'

  const brandGradient = {
    backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor}, ${primaryColor})`
  }

  const primaryBgStyle = { backgroundColor: primaryColor }

  // ✅ CONFIGURACIÓN SIMPLIFICADA
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
    currency: '$U',
    appointment_duration: 60,
    appointment_gap: 15
  })

  // ✅ SECCIONES SIMPLIFICADAS
  const sections = [
    { id: 'general', label: 'General', icon: Store },
    { id: 'schedule', label: 'Horarios', icon: Clock },
    { id: 'appearance', label: 'Apariencia', icon: Palette }
  ]

  // ============================================================
  // CARGAR CONFIGURACIÓN
  // ============================================================
  const loadBusinessSettings = async () => {
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
          currency: data.currency || prev.currency
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

  useEffect(() => {
    if (tenantId) {
      loadBusinessSettings()
    } else if (authLoading === false) {
      setLoading(false)
    }
  }, [tenantId, authLoading])

  const handleRefresh = () => {
    setRefreshing(true)
    loadBusinessSettings()
  }

  // ============================================================
  // GUARDAR CONFIGURACIÓN
  // ============================================================
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
      <div className="flex flex-col items-center justify-center min-h-[70vh] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-transparent to-amber-500/5 animate-pulse" />
        <div className="absolute w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-[pulse_4s_ease-in-out_infinite]" />
        <div className="absolute w-48 h-48 bg-amber-500/5 rounded-full blur-2xl animate-[pulse_6s_ease-in-out_infinite] delay-300" />
        <div className="relative flex flex-col items-center justify-center gap-5 bg-white/5 backdrop-blur-2xl px-12 py-10 rounded-3xl border border-white/10 shadow-2xl">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-2 border-pink-500/20 border-t-pink-500 animate-spin" />
            <Settings className="w-6 h-6 text-pink-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <div className="space-y-1.5 text-center">
            <p className="text-sm font-black tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-400 to-amber-400 animate-pulse">
              CARGANDO
            </p>
            <p className="text-[10px] font-medium tracking-[0.3em] text-zinc-500 dark:text-zinc-400">
              CONFIGURACIÓN FRESH
            </p>
          </div>
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <span 
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-pink-500/60 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!tenantId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-6 max-w-md mx-auto">
        <div className="w-16 h-16 rounded-2xl border flex items-center justify-center mb-4 shadow-sm bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950">
          <ShieldAlert className="w-8 h-8 text-rose-500" />
        </div>
        <p className="text-xs font-mono uppercase tracking-[0.2em] font-bold text-rose-500">Acceso Restringido</p>
        <p className="text-sm text-stone-500 dark:text-pink-100/60 mt-2 leading-relaxed">
          Este perfil de administrador no posee un identificador comercial válido.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-1 max-w-6xl mx-auto">

      {/* ============================================================ */}
      {/* CABECERA PRINCIPAL — IDÉNTICA AL DASHBOARD */}
      {/* ============================================================ */}
      <div 
        className="relative overflow-hidden rounded-3xl p-6 md:p-8 shadow-2xl text-white border border-white/10"
        style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 50%, #EF4444 100%)`
        }}
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-black/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[10px] font-black uppercase tracking-widest text-pink-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Configuración del Sistema
            </div>
            <h1 className="text-3xl md:text-4xl font-serif font-black tracking-tight drop-shadow-sm">
              Configuración Fresh Nails
            </h1>
            <p className="text-xs md:text-sm text-pink-50/80 font-medium max-w-md">
              Define la identidad de la marca y las reglas globales del sistema.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-center shrink-0">
            <button 
              onClick={handleRefresh} 
              disabled={refreshing} 
              className="p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white transition-all active:scale-95 shadow-lg"
              title="Actualizar Configuración"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>

            <button 
              onClick={handleSave} 
              disabled={saving}
              className="flex items-center gap-2.5 px-5 py-3 rounded-xl bg-white text-stone-900 font-black text-xs uppercase tracking-widest shadow-xl hover:bg-pink-50 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
            >
              <div className="p-1 rounded-md bg-stone-900 text-white">
                {saving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3 stroke-[3]" />}
              </div>
              <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MENSAJES */}
      {/* ============================================================ */}
      {error && (
        <div className="rounded-2xl p-4 bg-gradient-to-r from-rose-500/10 to-pink-500/5 border border-rose-500/20 flex items-center gap-3 shadow-xs">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <p className="text-xs text-stone-700 dark:text-rose-400 font-medium">{error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-2xl p-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 flex items-center gap-3 shadow-xs">
          <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
          <p className="text-xs text-stone-700 dark:text-emerald-400 font-medium">
            ¡Los cambios se han guardado correctamente!
          </p>
        </div>
      )}

      {/* ============================================================ */}
      {/* CONTENEDOR — 3 SECCIONES */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* NAVEGACIÓN LATERAL */}
        <div className="rounded-2xl border p-4 space-y-1.5 h-fit bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 shadow-sm">
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
                style={isActive ? primaryBgStyle : {}}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {s.label}
              </button>
            )
          })}
        </div>

        {/* CONTENIDO */}
        <div className="md:col-span-3 rounded-2xl border p-6 shadow-sm bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950">

          {/* ============================================================ */}
          {/* SECCIÓN GENERAL */}
          {/* ============================================================ */}
          {activeSection === 'general' && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 border-b border-pink-100/60 dark:border-fuchsia-950/50 pb-3">
                <Store className="w-4 h-4" style={{ color: primaryColor }} />
                <h3 className="text-sm font-black uppercase tracking-wider text-stone-800 dark:text-pink-100">Información Corporativa</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Nombre del Salón</label>
                  <input 
                    type="text" 
                    value={config.business_name} 
                    onChange={(e) => setConfig({...config, business_name: e.target.value})} 
                    className="w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 focus:outline-none focus:ring-2 transition-all text-sm"
                    style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                    placeholder="Mi Salón de Belleza"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Teléfono Comercial</label>
                  <input 
                    type="text" 
                    value={config.business_phone} 
                    onChange={(e) => setConfig({...config, business_phone: e.target.value})} 
                    className="w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 focus:outline-none focus:ring-2 transition-all text-sm"
                    style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                    placeholder="099 123 456"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Email de Atención</label>
                  <input 
                    type="email" 
                    value={config.business_email} 
                    onChange={(e) => setConfig({...config, business_email: e.target.value})} 
                    className="w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 focus:outline-none focus:ring-2 transition-all text-sm"
                    style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                    placeholder="info@mibelleza.com"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Divisa Base</label>
                  <select 
                    value={config.currency} 
                    onChange={(e) => setConfig({...config, currency: e.target.value})} 
                    className="w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 focus:outline-none focus:ring-2 transition-all text-sm appearance-none"
                    style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                  >
                    <option value="$U">$U Peso Uruguayo</option>
                    <option value="USD">USD Dólar</option>
                    <option value="€">€ Euro</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Dirección Física</label>
                <input 
                  type="text" 
                  value={config.business_address} 
                  onChange={(e) => setConfig({...config, business_address: e.target.value})} 
                  className="w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 focus:outline-none focus:ring-2 transition-all text-sm"
                  style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                  placeholder="Calle Principal 123, Montevideo"
                />
              </div>

              <div className="flex items-center gap-2 border-b border-pink-100/60 dark:border-fuchsia-950/50 pb-3 pt-4">
                <Sliders className="w-4 h-4 text-rose-500" />
                <h3 className="text-sm font-black uppercase tracking-wider text-stone-800 dark:text-pink-100">Reglas de Turnos</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Duración por Cita (min)</label>
                  <input 
                    type="number" 
                    value={config.appointment_duration} 
                    onChange={(e) => setConfig({...config, appointment_duration: parseInt(e.target.value) || 0})} 
                    className="w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 focus:outline-none focus:ring-2 transition-all text-sm font-mono"
                    style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                    min="15"
                    step="5"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Tiempo entre citas (min)</label>
                  <input 
                    type="number" 
                    value={config.appointment_gap} 
                    onChange={(e) => setConfig({...config, appointment_gap: parseInt(e.target.value) || 0})} 
                    className="w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 focus:outline-none focus:ring-2 transition-all text-sm font-mono"
                    style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                    min="0"
                    step="5"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* SECCIÓN HORARIOS */}
          {/* ============================================================ */}
          {activeSection === 'schedule' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-pink-100/60 dark:border-fuchsia-950/50 pb-3">
                <Clock className="w-4 h-4" style={{ color: primaryColor }} />
                <h3 className="text-sm font-black uppercase tracking-wider text-stone-800 dark:text-pink-100">Horarios de Apertura</h3>
              </div>

              <div className="space-y-2.5">
                {[
                  { key: 'monday', label: 'Lunes' },
                  { key: 'tuesday', label: 'Martes' },
                  { key: 'wednesday', label: 'Miércoles' },
                  { key: 'thursday', label: 'Jueves' },
                  { key: 'friday', label: 'Viernes' },
                  { key: 'saturday', label: 'Sábado' },
                  { key: 'sunday', label: 'Domingo' }
                ].map((day) => (
                  <div key={day.key} className="flex items-center justify-between p-3 border rounded-xl bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 transition-all hover:border-pink-300 dark:hover:border-fuchsia-800">
                    <span className="text-xs font-bold text-stone-700 dark:text-pink-200 capitalize">{day.label}</span>
                    <input
                      type="text"
                      value={config.schedule[day.key as keyof typeof config.schedule]}
                      onChange={(e) => setConfig({
                        ...config,
                        schedule: { ...config.schedule, [day.key]: e.target.value }
                      })}
                      className="w-48 px-3 py-1.5 text-xs text-right font-mono rounded-lg border bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 focus:outline-none focus:ring-2 transition-all"
                      style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                      placeholder="09:00 - 21:00"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* SECCIÓN APARIENCIA — SOLO 2 COLORES */}
          {/* ============================================================ */}
          {activeSection === 'appearance' && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 border-b border-pink-100/60 dark:border-fuchsia-950/50 pb-3">
                <Palette className="w-4 h-4" style={{ color: primaryColor }} />
                <h3 className="text-sm font-black uppercase tracking-wider text-stone-800 dark:text-pink-100">Colores de la Marca</h3>
              </div>

              <p className="text-xs text-stone-500 dark:text-stone-400">
                Estos colores se aplican en toda la aplicación (botones, barras, tarjetas destacadas).
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 p-4 rounded-xl border bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Color Primario</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="color" 
                      value={config.primary_color} 
                      onChange={(e) => setConfig({...config, primary_color: e.target.value})} 
                      className="w-12 h-12 rounded-xl cursor-pointer bg-transparent border-0 p-0" 
                    />
                    <input 
                      type="text" 
                      value={config.primary_color} 
                      onChange={(e) => setConfig({...config, primary_color: e.target.value})} 
                      className="flex-1 px-4 py-2.5 rounded-xl border bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 focus:outline-none focus:ring-2 transition-all text-sm font-mono"
                      style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                      placeholder="#DB5B9A"
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: config.primary_color }} />
                    <span className="text-[10px] text-stone-400">Vista previa</span>
                  </div>
                </div>

                <div className="space-y-2 p-4 rounded-xl border bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Color Secundario</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="color" 
                      value={config.secondary_color} 
                      onChange={(e) => setConfig({...config, secondary_color: e.target.value})} 
                      className="w-12 h-12 rounded-xl cursor-pointer bg-transparent border-0 p-0" 
                    />
                    <input 
                      type="text" 
                      value={config.secondary_color} 
                      onChange={(e) => setConfig({...config, secondary_color: e.target.value})} 
                      className="flex-1 px-4 py-2.5 rounded-xl border bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 focus:outline-none focus:ring-2 transition-all text-sm font-mono"
                      style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                      placeholder="#E5A46E"
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: config.secondary_color }} />
                    <span className="text-[10px] text-stone-400">Vista previa</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-4 rounded-xl border bg-stone-50 dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950">
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  💡 <span className="font-bold">Consejo:</span> El color primario se usa en botones principales y elementos destacados. El secundario para acentos y detalles.
                </p>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ============================================================ */}
      {/* STYLES GLOBALES */}
      {/* ============================================================ */}
      <style jsx global>{`
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 8s linear infinite; }
      `}</style>

    </div>
  )
}