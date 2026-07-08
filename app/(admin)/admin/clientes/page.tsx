'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useTheme } from '@/contexts/ThemeContext'
import { 
  User, Search, Plus, Phone, Mail, Calendar, 
  UserCheck, Award, Trash2, Edit, Star, XCircle, Loader2
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
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [clientes, setClientes] = useState<Cliente[]>([])
  const [search, setSearch] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)

  const fetchClientes = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (error) throw error
      if (data) setClientes(data as Cliente[])
    } catch (err) {
      console.error('Error al cargar clientes de Supabase:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClientes()
  }, [])

  const filtrados = clientes.filter((c: Cliente) => 
    c.name?.toLowerCase().includes(search.toLowerCase()) || 
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  )

  if (loading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center space-y-3">
        <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
        <span className="text-[10px] font-mono tracking-widest uppercase text-amber-500 animate-pulse">Sincronizando clientes...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 transition-colors duration-300 px-2 sm:px-0">

      {/* HEADER PRINCIPAL */}
      <div className={`relative overflow-hidden rounded-2xl border p-5 shadow-md transition-all ${
        isDark 
          ? 'bg-gradient-to-br from-amber-950/20 via-[#161311] to-[#0a0908] border-stone-800' 
          : 'bg-gradient-to-br from-amber-50/40 via-white to-stone-50 border-stone-200'
      }`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl" />
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[9px] uppercase tracking-[0.25em] text-amber-600 dark:text-amber-400 font-mono flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              CRM & Loyalty
            </p>
            <h2 className="text-xl sm:text-2xl font-serif italic text-foreground mt-0.5">
              Gestión de <span className="text-amber-600 dark:text-amber-400">Clientas</span>
            </h2>
            <p className="text-[11px] text-mutedForeground mt-0.5">Fichas personalizadas y base activa de Fresh Nails.</p>
          </div>
          <button className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium transition-all shadow-md active:scale-95 w-full sm:w-auto">
            <Plus className="w-4 h-4" />
            Nueva Clienta
          </button>
        </div>
      </div>

      {/* METRICAS RÁPIDAS (Grid fluido) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className={`rounded-xl border p-4 flex items-center justify-between shadow-sm ${
          isDark ? 'bg-[#141211] border-stone-800' : 'bg-white border-stone-200'
        }`}>
          <div>
            <p className="text-mutedForeground text-[10px] uppercase tracking-wider font-medium">Registradas</p>
            <span className="text-xl font-mono font-bold text-foreground block mt-0.5">{clientes.length}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <UserCheck className="w-4 h-4" />
          </div>
        </div>

        <div className={`rounded-xl border p-4 flex items-center justify-between shadow-sm ${
          isDark ? 'bg-[#141211] border-stone-800' : 'bg-white border-stone-200'
        }`}>
          <div>
            <p className="text-mutedForeground text-[10px] uppercase tracking-wider font-medium">Club VIP</p>
            <span className="text-xs font-mono text-amber-600 dark:text-amber-400 block mt-1 font-semibold">Programa Activo</span>
          </div>
          <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Award className="w-4 h-4" />
          </div>
        </div>

        <div className={`rounded-xl border p-4 flex items-center justify-between shadow-sm ${
          isDark ? 'bg-[#141211] border-stone-800' : 'bg-white border-stone-200'
        }`}>
          <div>
            <p className="text-mutedForeground text-[10px] uppercase tracking-wider font-medium">Fidelización</p>
            <span className="text-xl font-mono font-bold text-emerald-600 dark:text-emerald-400 block mt-0.5">87%</span>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Star className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* FILTRO DE BÚSQUEDA */}
      <div className={`flex items-center border rounded-xl px-3.5 py-2.5 max-w-md shadow-sm transition-all focus-within:border-amber-500/40 ${
        isDark ? 'bg-stone-900/50 border-stone-800' : 'bg-stone-50 border-stone-200'
      }`}>
        <Search className="w-4 h-4 text-mutedForeground shrink-0" />
        <input 
          type="text" 
          placeholder="Buscar por nombre o teléfono..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent border-none outline-none text-xs text-foreground placeholder-mutedForeground w-full ml-2.5"
        />
        {search && (
          <button onClick={() => setSearch('')} className="text-mutedForeground hover:text-foreground">
            <XCircle className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* GRID DE TARJETAS REDISEÑADO (Cero scroll lateral) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtrados.map((cliente: Cliente) => (
          <div 
            key={cliente.id} 
            className={`relative overflow-hidden rounded-xl border p-4 shadow-sm transition-all duration-300 hover:shadow-md hover:border-amber-500/30 group animate-fade-up ${
              isDark ? 'bg-[#141211] border-stone-800/80' : 'bg-white border-stone-200'
            }`}
          >
            {/* Detalle decorativo superior */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                {/* Avatar */}
                {cliente.avatar_url ? (
                  <img src={cliente.avatar_url} alt={cliente.name} className="w-11 h-11 rounded-xl object-cover border border-border group-hover:scale-105 transition-transform" />
                ) : (
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-serif italic text-sm font-bold shrink-0 ${
                    isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-500/10 text-amber-600'
                  }`}>
                    {cliente.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                
                {/* Nombre e ID de la Clienta */}
                <div>
                  <h3 className="font-medium text-sm text-foreground group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors line-clamp-1">
                    {cliente.name}
                  </h3>
                  <span className="text-[9px] font-mono uppercase tracking-wider text-mutedForeground block mt-0.5">
                    ID: {cliente.id.substring(0, 8)}
                  </span>
                </div>
              </div>

              {/* Botones de Acciones Rápidas */}
              <div className="flex items-center gap-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
                <button className={`p-1.5 rounded-lg border transition-colors ${
                  isDark ? 'bg-stone-900 border-stone-800 text-stone-400 hover:text-white' : 'bg-stone-50 border-stone-200 text-stone-500 hover:text-stone-900'
                }`} title="Editar">
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button className={`p-1.5 rounded-lg border transition-colors ${
                  isDark ? 'bg-stone-900 border-stone-800 text-stone-400 hover:text-rose-400' : 'bg-stone-50 border-stone-200 text-stone-500 hover:text-rose-600'
                }`} title="Eliminar">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Separador sutil */}
            <hr className={`my-3 ${isDark ? 'border-stone-800/60' : 'border-stone-100'}`} />

            {/* Información de Contacto e Historial */}
            <div className="space-y-2 font-mono text-[11px] text-mutedForeground">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <span className="truncate hover:text-foreground transition-colors" title={cliente.email}>
                  {cliente.email || 'Sin correo registrado'}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <span className="hover:text-foreground transition-colors">
                  {cliente.phone || 'Sin número'}
                </span>
              </div>

              <div className="flex items-center gap-2 pt-0.5">
                <Calendar className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <span>
                  Alta: {new Date(cliente.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
        ))}

        {filtrados.length === 0 && (
          <div className={`col-span-full text-center py-12 rounded-xl border border-dashed p-6 font-mono text-xs ${
            isDark ? 'border-stone-800 text-stone-500' : 'border-stone-200 text-stone-400'
          }`}>
            No se encontraron clientas que coincidan con la búsqueda.
          </div>
        )}
      </div>

    </div>
  )
}
