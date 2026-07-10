'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useSettings } from '@/contexts/SettingsContext'
import { 
  User, Search, Plus, Phone, Mail, Calendar, 
  UserCheck, Award, Trash2, Edit, Star, XCircle, Sparkles,
  RefreshCw, X, Users, TrendingUp, CheckCircle2
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

  const brandGradient = {
    backgroundImage: `linear-gradient(to right, ${settings?.primary_color || '#DB5B9A'}, ${settings?.secondary_color || '#E5A46E'})`
  }

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: settings?.primary_color || '#DB5B9A' }}></div>
        <p className="font-mono text-xs uppercase tracking-widest animate-pulse" style={{ color: settings?.primary_color || '#DB5B9A' }}>
          Sincronizando Clientela...
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
              <Users className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-widest font-bold font-mono truncate" style={{ color: settings?.primary_color || '#DB5B9A' }}>
                ✨ {settings?.business_name || 'Salón VIP'}
              </p>
              <h2 className="text-xl md:text-2xl font-serif font-extrabold text-stone-900 dark:text-white mt-0.5 truncate">
                Gestión de Clientas
              </h2>
              <p className="text-xs text-stone-500 dark:text-pink-100/60 mt-0.5 truncate">
                Fichas personalizadas y base activa de Fresh Nails.
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
              className="px-3 py-2 rounded-xl text-white hover:scale-105 transition-all flex items-center gap-1.5 text-xs font-semibold shrink-0"
              style={{ backgroundColor: settings?.primary_color || '#DB5B9A' }}
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nueva Clienta</span>
              <span className="sm:hidden">+</span>
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
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="text-xs text-stone-700 dark:text-emerald-400 font-medium min-w-0">{success}</p>
        </div>
      )}

      {/* KPIS MODERNOS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl p-3 shadow-sm border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-xl shrink-0" style={{ backgroundColor: `${settings?.primary_color || '#DB5B9A'}10`, color: settings?.primary_color || '#DB5B9A' }}>
            <UserCheck className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500 font-black truncate">Registradas</p>
            <h3 className="text-sm font-mono font-black text-stone-900 dark:text-pink-100">{totalClientes}</h3>
          </div>
        </div>

        <div className="rounded-2xl p-3 shadow-sm border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
            <Award className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500 font-black truncate">VIP Activas</p>
            <h3 className="text-sm font-mono font-black text-amber-500">{Math.round(totalClientes * 0.4)}</h3>
          </div>
        </div>

        <div className="rounded-2xl p-3 shadow-sm border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500 font-black truncate">Nuevas (30d)</p>
            <h3 className="text-sm font-mono font-black text-emerald-500">+{clientesRecientes}</h3>
          </div>
        </div>
      </div>

      {/* FILTRO DE BÚSQUEDA */}
      <div className="flex items-center gap-3 p-3 rounded-2xl border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 transition-all duration-300">
        <Search className="w-4 h-4 shrink-0" style={{ color: settings?.primary_color || '#DB5B9A' }} />
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

      {/* GRID DE TARJETAS */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 transition-opacity duration-300 ${refreshing ? 'opacity-50' : 'opacity-100'}`}>
        {filtrados.map((cliente: Cliente) => (
          <div 
            key={cliente.id} 
            className="relative overflow-hidden rounded-2xl border p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-pink-500/5 group bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 hover:border-pink-300 dark:hover:border-fuchsia-800"
          >
            {/* Detalle decorativo superior */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-pink-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" style={{ '--tw-gradient-via': settings?.primary_color || '#DB5B9A' } as React.CSSProperties} />

            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                {/* Avatar */}
                {cliente.avatar_url ? (
                  <img src={cliente.avatar_url} alt={cliente.name} className={`w-11 h-11 rounded-xl object-cover border group-hover:scale-105 transition-transform bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950`} />
                ) : (
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center font-serif italic text-sm font-bold shrink-0 text-white border shadow-sm" style={{ backgroundColor: settings?.primary_color || '#DB5B9A', borderColor: settings?.primary_color || '#DB5B9A' }}>
                    {cliente.name?.charAt(0).toUpperCase()}
                  </div>
                )}

                {/* Nombre e ID */}
                <div className="min-w-0">
                  <h3 className="font-bold text-xs text-stone-800 dark:text-pink-100 group-hover:text-pink-500 transition-colors truncate">
                    {cliente.name}
                  </h3>
                  <span className="text-[9px] font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500 block mt-0.5 truncate">
                    ID_{cliente.id.substring(0, 8).toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Botones de Acciones Rápidas */}
              <div className="flex items-center gap-0.5 shrink-0">
                <button className="p-1.5 rounded-xl border transition-colors bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-400 hover:text-pink-500 dark:hover:text-pink-400">
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button className="p-1.5 rounded-xl border transition-colors bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-400 hover:text-rose-500">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Separador sutil */}
            <hr className={`my-3.5 border-pink-100/60 dark:border-fuchsia-950/50`} />

            {/* Información de Contacto e Historial */}
            <div className="space-y-2 font-mono text-[11px] text-stone-500 dark:text-pink-100/60">
              <div className="flex items-center gap-2 min-w-0">
                <Mail className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <span className="truncate hover:text-stone-800 dark:hover:text-pink-200 transition-colors" title={cliente.email}>
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
                <span className={`px-1.5 py-0.5 rounded border text-[10px] bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950`}>
                  Alta: {new Date(cliente.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
        ))}

        {filtrados.length === 0 && (
          <div className={`col-span-full text-center py-12 border border-dashed rounded-2xl font-mono text-stone-400 text-xs bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950`}>
            No se encontraron clientas que coincidan con los criterios.
          </div>
        )}
      </div>

    </div>
  )
}