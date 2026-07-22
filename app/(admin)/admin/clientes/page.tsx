'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useSettings } from '@/contexts/SettingsContext'
import { 
  User, Search, Plus, Phone, Mail, Calendar, 
  UserCheck, Award, Trash2, Edit, Star, XCircle, Sparkles,
  RefreshCw, X, Users, TrendingUp, CheckCircle2,
  AlertCircle, Crown, Gem
} from 'lucide-react'

type Cliente = {
  id: string
  name: string
  email: string
  phone: string
  avatar_url: string
  is_active: boolean
  created_at: string
}

export default function ClientesPage() {
  const { settings } = useSettings()

  const [clientes, setClientes] = useState<Cliente[]>([])
  const [search, setSearch] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const primaryColor = settings?.primary_color || '#DB5B9A'
  const secondaryColor = settings?.secondary_color || '#E5A46E'

  const brandGradient = {
    backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor}, ${primaryColor})`
  }

  const primaryBgStyle = { backgroundColor: primaryColor }

  const fetchClientes = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true)
    } else {
      setRefreshing(true)
    }
    setError(null)

    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (error) throw error
      if (data) setClientes(data as Cliente[])
      setSuccess('Clientes actualizados correctamente')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      console.error('Error al cargar clientes de Supabase:', err)
      setError(err.message || 'Error al cargar los clientes')
      setTimeout(() => setError(null), 3000)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchClientes()
  }, [])

  const handleRefresh = () => {
    fetchClientes(true)
  }

  const filtrados = clientes.filter((c: Cliente) => 
    c.name?.toLowerCase().includes(search.toLowerCase()) || 
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  )

  // Estadísticas para KPIs
  const totalClientes = clientes.length
  const clientesRecientes = clientes.filter(c => {
    const fecha = new Date(c.created_at)
    const hoy = new Date()
    const diff = (hoy.getTime() - fecha.getTime()) / (1000 * 60 * 60 * 24)
    return diff <= 30
  }).length
  const clientesVip = Math.round(totalClientes * 0.4)

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-transparent to-amber-500/5 animate-pulse" />
        <div className="absolute w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-[pulse_4s_ease-in-out_infinite]" />
        <div className="absolute w-48 h-48 bg-amber-500/5 rounded-full blur-2xl animate-[pulse_6s_ease-in-out_infinite] delay-300" />
        <div className="relative flex flex-col items-center justify-center gap-5 bg-white/5 backdrop-blur-2xl px-12 py-10 rounded-3xl border border-white/10 shadow-2xl">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-2 border-pink-500/20 border-t-pink-500 animate-spin" />
            <Users className="w-6 h-6 text-pink-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <div className="space-y-1.5 text-center">
            <p className="text-sm font-black tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-400 to-amber-400 animate-pulse">
              CARGANDO
            </p>
            <p className="text-[10px] font-medium tracking-[0.3em] text-zinc-500 dark:text-zinc-400">
              CLIENTAS FRESH
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
        {/* Efecto de Luces y Brillos de Fondo */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-black/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Textos Principales */}
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[10px] font-black uppercase tracking-widest text-pink-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Base de Datos del Salón
            </div>
            <h1 className="text-3xl md:text-4xl font-serif font-black tracking-tight drop-shadow-sm">
              Clientes Fresh Nails
            </h1>
            <p className="text-xs md:text-sm text-pink-50/80 font-medium max-w-md">
              Gestiona la ficha de tus clientas, acceso y evolución en el salón.
            </p>
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-3 self-start md:self-center shrink-0">
            <button 
              onClick={handleRefresh} 
              disabled={refreshing} 
              className="p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white transition-all active:scale-95 shadow-lg"
              title="Actualizar Clientes"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>

            <button 
              className="flex items-center gap-2.5 px-5 py-3 rounded-xl bg-white text-stone-900 font-black text-xs uppercase tracking-widest shadow-xl hover:bg-pink-50 hover:scale-105 active:scale-95 transition-all"
            >
              <div className="p-1 rounded-md bg-stone-900 text-white">
                <Plus className="w-3 h-3 stroke-[3]" />
              </div>
              <span>Nueva Cliente</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MENSAJES */}
      {/* ============================================================ */}
      {error && (
        <div className="rounded-2xl p-4 bg-gradient-to-r from-rose-500/10 to-pink-500/5 border border-rose-500/20 flex items-center gap-3 shadow-xs">
          <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
            <AlertCircle className="w-4 h-4" />
          </div>
          <p className="text-xs text-stone-700 dark:text-rose-400 font-medium min-w-0">{error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-2xl p-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 flex items-center gap-3 shadow-xs">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="text-xs text-stone-700 dark:text-emerald-400 font-medium min-w-0">{success}</p>
        </div>
      )}

      {/* ============================================================ */}
      {/* KPIS — 3 columnas responsivas */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
        <div className="rounded-2xl p-2.5 sm:p-3 shadow-sm border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="p-1.5 sm:p-2 rounded-xl shrink-0" style={{ backgroundColor: `${primaryColor}10`, color: primaryColor }}>
            <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[7px] sm:text-[9px] font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500 font-black truncate">Registradas</p>
            <h3 className="text-sm sm:text-base font-mono font-black text-stone-900 dark:text-pink-100">{totalClientes}</h3>
          </div>
        </div>

        <div className="rounded-2xl p-2.5 sm:p-3 shadow-sm border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="p-1.5 sm:p-2 rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
            <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[7px] sm:text-[9px] font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500 font-black truncate">VIP Activas</p>
            <h3 className="text-sm sm:text-base font-mono font-black text-amber-500">{clientesVip}</h3>
          </div>
        </div>

        <div className="rounded-2xl p-2.5 sm:p-3 shadow-sm border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
            <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[7px] sm:text-[9px] font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500 font-black truncate">Nuevas (30d)</p>
            <h3 className="text-sm sm:text-base font-mono font-black text-emerald-500">+{clientesRecientes}</h3>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* BUSCADOR */}
      {/* ============================================================ */}
      <div className="flex items-center gap-3 p-3 rounded-2xl border shadow-sm bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950">
        <Search className="w-4 h-4 shrink-0" style={{ color: primaryColor }} />
        <input 
          type="text" 
          placeholder="Buscar por nombre, correo o teléfono..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent border-none outline-none text-xs text-stone-800 dark:text-pink-100 placeholder:text-stone-400 w-full"
        />
        {search && (
          <button 
            onClick={() => setSearch('')}
            className="p-1 hover:bg-pink-100 dark:hover:bg-fuchsia-950/50 rounded-lg transition-colors shrink-0"
          >
            <XCircle className="w-4 h-4 text-stone-400" />
          </button>
        )}
      </div>

      {/* ============================================================ */}
      {/* GRID DE CLIENTES */}
      {/* ============================================================ */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 transition-opacity duration-300 ${refreshing ? 'opacity-50' : 'opacity-100'}`}>
        {filtrados.map((cliente: Cliente) => (
          <div 
            key={cliente.id} 
            className="relative overflow-hidden rounded-2xl border p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 hover:border-pink-300 dark:hover:border-fuchsia-800"
          >
            {/* Línea decorativa superior */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-pink-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                {/* Avatar */}
                {cliente.avatar_url ? (
                  <img src={cliente.avatar_url} alt={cliente.name} className="w-11 h-11 rounded-xl object-cover border group-hover:scale-105 transition-transform bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950" />
                ) : (
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center font-serif italic text-sm font-bold shrink-0 text-white border shadow-sm" style={{ backgroundColor: primaryColor, borderColor: primaryColor }}>
                    {cliente.name?.charAt(0).toUpperCase()}
                  </div>
                )}

                {/* Nombre */}
                <div className="min-w-0">
                  <h3 className="font-bold text-xs text-stone-800 dark:text-pink-100 group-hover:text-pink-500 transition-colors truncate">
                    {cliente.name}
                  </h3>
                  <span className="text-[9px] font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500 block mt-0.5 truncate">
                    ID_{cliente.id.substring(0, 8).toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex items-center gap-0.5 shrink-0">
                <button className="p-1.5 rounded-xl border transition-colors bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-400 hover:text-pink-500 dark:hover:text-pink-400">
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button className="p-1.5 rounded-xl border transition-colors bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-400 hover:text-rose-500">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Separador */}
            <hr className="my-3.5 border-pink-100/60 dark:border-fuchsia-950/50" />

            {/* Contacto */}
            <div className="space-y-2 font-mono text-[11px] text-stone-500 dark:text-pink-100/60">
              <div className="flex items-center gap-2 min-w-0">
                <Mail className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <span className="truncate hover:text-stone-800 dark:hover:text-pink-200 transition-colors">
                  {cliente.email || 'sin_correo@nails.com'}
                </span>
              </div>

              <div className="flex items-center gap-2 min-w-0">
                <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <span className="hover:text-stone-800 dark:hover:text-pink-200 transition-colors truncate">
                  {cliente.phone || 'Sin teléfono'}
                </span>
              </div>

              <div className="flex items-center gap-2 pt-0.5">
                <Calendar className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <span className="px-1.5 py-0.5 rounded border text-[10px] bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950">
                  Alta: {new Date(cliente.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
        ))}

        {filtrados.length === 0 && (
          <div className="col-span-full text-center py-12 border border-dashed rounded-2xl font-mono text-stone-400 text-xs bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950">
            No se encontraron clientas que coincidan con los criterios.
          </div>
        )}
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