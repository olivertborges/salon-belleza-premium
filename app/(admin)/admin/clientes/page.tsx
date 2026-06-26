'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase/client'
import { 
  User, Search, Plus, Phone, Mail, Calendar, 
  UserCheck, Award, Trash2, Edit, Star 
} from 'lucide-react'

// Estructura exacta basada en tu tabla 'clients' de Supabase
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

  // 📡 FETCH: Obtener los clientes desde Supabase
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

  // Filtrado reactivo por nombre, email o teléfono
  const filtrados = clientes.filter((c: Cliente) => 
    c.name?.toLowerCase().includes(search.toLowerCase()) || 
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  )

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center font-mono text-xs text-amber-400">
        Sincronizando base de datos de clientas...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      
      {/* HEADER PRINCIPAL */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-950/40 via-stone-900/40 to-[#0e0c0b] border border-amber-500/20 p-6 shadow-xl">
        <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/5 rounded-full blur-3xl"></div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-amber-400 font-mono">👑 CRM & Loyalty</p>
            <h2 className="text-2xl font-serif italic text-white mt-1">Gestión de Clientas</h2>
            <p className="text-xs text-stone-400 mt-1">Fichas de clientes, historial de contacto y base de datos activa de Fresh Nails.</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium transition-all shadow-lg shadow-amber-600/10 self-start sm:self-auto">
            <Plus className="w-4 h-4" />
            Nueva Clienta
          </button>
        </div>
      </div>

      {/* METRICAS RÁPIDAS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="rounded-2xl bg-stone-900/30 border border-stone-900 p-5 flex items-center justify-between">
          <div>
            <p className="text-stone-400 text-xs font-medium">Clientas Registradas</p>
            <span className="text-2xl font-mono font-bold text-stone-100 block mt-1">{clientes.length}</span>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-2xl bg-stone-900/30 border border-stone-900 p-5 flex items-center justify-between">
          <div>
            <p className="text-stone-400 text-xs font-medium">Club de Puntos Activo</p>
            <span className="text-xs font-mono text-amber-400 block mt-2 font-bold">Programa VIP On</span>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Award className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-2xl bg-stone-900/30 border border-stone-900 p-5 flex items-center justify-between">
          <div>
            <p className="text-stone-400 text-xs font-medium">Retención Promedio</p>
            <span className="text-2xl font-mono font-bold text-emerald-400 block mt-1">87%</span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Star className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* FILTRO DE BÚSQUEDA */}
      <div className="flex items-center bg-stone-900/40 border border-stone-900 rounded-xl px-4 py-3 max-w-md">
        <Search className="w-4 h-4 text-stone-500 shrink-0" />
        <input 
          type="text" 
          placeholder="Buscar por nombre, correo o teléfono..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent border-none outline-none text-xs text-stone-200 placeholder-stone-500 w-full ml-3 font-sans"
        />
      </div>

      {/* TABLA DE CLIENTAS ESTILO PREMIUM */}
      <div className="rounded-2xl border border-stone-900 bg-[#0e0c0b] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-900 bg-stone-900/20 text-[10px] font-mono uppercase tracking-wider text-stone-400">
                <th className="p-4">Clienta</th>
                <th className="p-4">Información de Contacto</th>
                <th className="p-4">Fecha de Alta</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-900/60 text-xs">
              {filtrados.map((cliente: Cliente) => (
                <tr key={cliente.id} className="hover:bg-stone-900/10 transition-all group">
                  
                  {/* Avatar y Nombre */}
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {cliente.avatar_url ? (
                        <img src={cliente.avatar_url} alt={cliente.name} className="w-9 h-9 rounded-xl object-cover border border-stone-800" />
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center font-serif italic text-sm text-amber-400 font-bold">
                          {cliente.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="font-medium text-stone-200 group-hover:text-amber-400 transition-colors">
                        {cliente.name}
                      </span>
                    </div>
                  </td>
                  
                  {/* Datos de Contacto */}
                  <td className="p-4 text-stone-400">
                    <div className="flex flex-col gap-0.5 font-mono text-[11px]">
                      <span className="flex items-center gap-1.5"><Mail className="w-3 h-3 text-stone-600" /> {cliente.email || 'Sin correo'}</span>
                      <span className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-stone-600" /> {cliente.phone || 'Sin teléfono'}</span>
                    </div>
                  </td>

                  {/* Fecha de registro */}
                  <td className="p-4 text-stone-500 font-mono text-[11px]">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-stone-700" />
                      {new Date(cliente.created_at).toLocaleDateString()}
                    </span>
                  </td>

                  {/* Acciones */}
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1.5 rounded-lg bg-stone-900 border border-stone-800 text-stone-400 hover:text-white transition-all" title="Editar">
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-1.5 rounded-lg bg-stone-900 border border-stone-800 text-stone-400 hover:text-red-400 hover:border-red-500/20 transition-all" title="Eliminar">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-10 font-mono text-stone-500 text-xs">
                    No se encontraron clientas con esos criterios de búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}