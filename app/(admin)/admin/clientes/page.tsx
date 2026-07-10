'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { 
  User, Search, Plus, Phone, Mail, Calendar, 
  UserCheck, Award, Trash2, Edit, Star, XCircle, Sparkles
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
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="w-10 h-10 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-pink-600/80 font-mono text-xs uppercase tracking-widest animate-pulse">Sincronizando Clientela...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-1">

      {/* HEADER CON DEGRADADO CREATIVO Y GLOW */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-400 p-[1px] shadow-xl shadow-pink-500/10">
        <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 via-transparent to-amber-400/20 animate-pulse" />
        <div className="relative z-10 rounded-[23px] bg-[#fffdfd] dark:bg-[#0f0c1b] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-500 text-white shadow-md shadow-pink-500/30">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-pink-500 dark:text-pink-400 font-bold font-mono flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
                CRM & Loyalty System
              </p>
              <h2 className="text-2xl font-serif font-extrabold bg-gradient-to-r from-stone-900 via-pink-900 to-rose-800 bg-clip-text text-transparent dark:from-white dark:to-pink-200 mt-0.5">
                Gestión de Clientas
              </h2>
              <p className="text-xs text-stone-500 dark:text-pink-100/60 mt-0.5">Fichas personalizadas y base activa de Fresh Nails.</p>
            </div>
          </div>
          
          <button className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:opacity-95 text-white text-xs font-semibold transition-all shadow-md shadow-pink-500/20 active:scale-95 w-full sm:w-auto">
            <Plus className="w-4 h-4" />
            Nueva Clienta
          </button>
        </div>
      </div>

      {/* MÉTRICAS RÁPIDAS Y VIVAS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Registradas */}
        <div className="rounded-2xl bg-[#fffdfd] dark:bg-[#130f24] border border-pink-100/60 dark:border-fuchsia-950 p-4 shadow-sm hover:shadow-pink-500/5 transition-all group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-pink-500/[0.03] to-transparent rounded-bl-full" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-stone-400 dark:text-stone-500 text-[9px] font-bold uppercase tracking-wider">Registradas</p>
              <span className="text-3xl font-mono font-bold block bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent mt-1">
                {clientes.length.toString().padStart(2, '0')}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-pink-500/[0.08] dark:bg-pink-500/[0.04] border border-pink-500/10 text-pink-500">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Club VIP */}
        <div className="rounded-2xl bg-[#fffdfd] dark:bg-[#130f24] border border-pink-100/60 dark:border-fuchsia-950 p-4 shadow-sm hover:shadow-rose-500/5 transition-all group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-rose-500/[0.03] to-transparent rounded-bl-full" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-stone-400 dark:text-stone-500 text-[9px] font-bold uppercase tracking-wider">Club VIP</p>
              <span className="text-xs font-mono text-rose-500 block mt-3.5 font-bold uppercase tracking-wide">
                Programa Activo
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-500/[0.08] dark:bg-rose-500/[0.04] border border-rose-500/10 text-rose-500">
              <Award className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Fidelización */}
        <div className="rounded-2xl bg-[#fffdfd] dark:bg-[#130f24] border border-pink-100/60 dark:border-fuchsia-950 p-4 shadow-sm hover:shadow-amber-500/5 transition-all group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-amber-500/[0.03] to-transparent rounded-bl-full" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-stone-400 dark:text-stone-500 text-[9px] font-bold uppercase tracking-wider">Fidelización</p>
              <span className="text-3xl font-mono font-bold block bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent mt-1">
                87%
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-500/[0.08] dark:bg-amber-500/[0.04] border border-amber-500/10 text-amber-500">
              <Star className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* FILTRO DE BÚSQUEDA */}
      <div className="flex items-center bg-[#fffdfd] dark:bg-[#130f24] border border-pink-100/60 dark:border-fuchsia-950 rounded-xl px-3.5 py-2.5 max-w-md focus-within:border-pink-500/30 transition-all duration-300 shadow-sm">
        <Search className="w-4 h-4 text-stone-400 shrink-0" />
        <input 
          type="text" 
          placeholder="Buscar por nombre, correo o teléfono..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent border-none outline-none text-xs text-stone-800 dark:text-pink-100 placeholder-stone-400 w-full ml-3 font-sans"
        />
        {search && (
          <button onClick={() => setSearch('')} className="text-stone-400 hover:text-pink-500 ml-1">
            <XCircle className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* GRID DE TARJETAS REDISEÑADO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtrados.map((cliente: Cliente) => (
          <div 
            key={cliente.id} 
            className="relative overflow-hidden rounded-2xl bg-[#fffdfd] dark:bg-[#130f24] border border-pink-100/40 dark:border-fuchsia-950/70 p-4 shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:shadow-pink-500/[0.03] hover:border-pink-300 group"
          >
            {/* Detalle decorativo superior */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-pink-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                {/* Avatar */}
                {cliente.avatar_url ? (
                  <img src={cliente.avatar_url} alt={cliente.name} className="w-11 h-11 rounded-xl object-cover border border-pink-100 dark:border-fuchsia-950 group-hover:scale-105 transition-transform" />
                ) : (
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center font-serif italic text-sm font-bold shrink-0 bg-pink-500/[0.08] dark:bg-pink-500/[0.04] text-pink-500 border border-pink-500/10">
                    {cliente.name?.charAt(0).toUpperCase()}
                  </div>
                )}

                {/* Nombre e ID */}
                <div>
                  <h3 className="font-bold text-xs text-stone-800 dark:text-pink-100 group-hover:text-pink-500 transition-colors line-clamp-1">
                    {cliente.name}
                  </h3>
                  <span className="text-[9px] font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500 block mt-0.5">
                    ID_ {cliente.id.substring(0, 8).toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Botones de Acciones Rápidas */}
              <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
                <button className="p-1.5 rounded-xl bg-pink-50/50 dark:bg-fuchsia-950/20 border border-pink-100/60 dark:border-fuchsia-950/40 text-stone-400 hover:text-pink-500 hover:border-pink-200 transition-all" title="Editar">
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button className="p-1.5 rounded-xl bg-pink-50/50 dark:bg-fuchsia-950/20 border border-pink-100/60 dark:border-fuchsia-950/40 text-stone-400 hover:text-rose-500 hover:border-rose-200 transition-all" title="Eliminar">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Separador sutil */}
            <hr className="my-3.5 border-pink-50 dark:border-fuchsia-950/40" />

            {/* Información de Contacto e Historial */}
            <div className="space-y-2 font-mono text-[11px] text-stone-500 dark:text-pink-100/60">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <span className="truncate hover:text-stone-800 dark:hover:text-pink-200 transition-colors" title={cliente.email}>
                  {cliente.email || 'sin_correo@nails.com'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <span className="hover:text-stone-800 dark:hover:text-pink-200 transition-colors">
                  {cliente.phone || 'Sin teléfono'}
                </span>
              </div>

              <div className="flex items-center gap-2 pt-0.5">
                <Calendar className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <span className="bg-pink-50/50 dark:bg-fuchsia-950/20 px-1.5 py-0.5 rounded border border-pink-100/30 dark:border-fuchsia-950/40 text-[10px]">
                  Alta: {new Date(cliente.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
        ))}

        {filtrados.length === 0 && (
          <div className="col-span-full text-center py-12 border border-dashed border-pink-100 dark:border-fuchsia-950 rounded-2xl font-mono text-stone-400 text-xs">
            No se encontraron clientas que coincidan con los criterios.
          </div>
        )}
      </div>

    </div>
  )
}
