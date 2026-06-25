'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '../../../../lib/supabase/client'
import { 
  Users, UserPlus, Search, Clock, Award, 
  Trash2, Edit, Mail, Phone 
} from 'lucide-react'

// Usamos la estructura exacta que definiste en tu archivo de Supabase
type StaffMember = {
  id: string
  name: string
  role: string
  email: string
  phone: string
  avatar_url: string
  is_active: boolean
  created_at: string
}

export default function StaffPage() {
  const [staffList, setStaffList] = useState<StaffMember[]>([])
  const [search, setSearch] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)

  // 📡 Traer los miembros del equipo desde Supabase
  const fetchStaff = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (error) throw error
      if (data) setStaffList(data as StaffMember[])
    } catch (err) {
      console.error('Error al cargar el staff de Supabase:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStaff()
  }, [])

  // Filtrado en tiempo real por búsqueda
  const filtrados = staffList.filter((member: StaffMember) => 
    member.name?.toLowerCase().includes(search.toLowerCase()) || 
    member.role?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center font-mono text-xs text-indigo-400">
        Cargando equipo de especialistas desde Supabase...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      
      {/* HEADER PRINCIPAL */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-950/40 via-stone-900/40 to-[#0e0c0b] border border-indigo-500/20 p-6 shadow-xl">
        <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/5 rounded-full blur-3xl"></div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-indigo-400 font-mono">👥 Team Management</p>
            <h2 className="text-2xl font-serif italic text-white mt-1">Equipo Profesional</h2>
            <p className="text-xs text-stone-400 mt-1">Control de especialistas, asignación de turnos y roles activos en el salón.</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all shadow-lg shadow-indigo-600/10 self-start sm:self-auto">
            <UserPlus className="w-4 h-4" />
            Agregar Especialista
          </button>
        </div>
      </div>

      {/* METRICAS DEL EQUIPO */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="rounded-2xl bg-stone-900/30 border border-stone-900 p-5 flex items-center justify-between">
          <div>
            <p className="text-stone-400 text-xs font-medium">Total Staff Activo</p>
            <span className="text-2xl font-mono font-bold text-stone-100 block mt-1">{staffList.length}</span>
          </div>
          <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-2xl bg-stone-900/30 border border-stone-900 p-5 flex items-center justify-between">
          <div>
            <p className="text-stone-400 text-xs font-medium">Sede Actual</p>
            <span className="text-sm font-mono text-amber-400 block mt-2 font-bold">Premium HQ</span>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-2xl bg-stone-900/30 border border-stone-900 p-5 flex items-center justify-between">
          <div>
            <p className="text-stone-400 text-xs font-medium">Calificación Promedio</p>
            <span className="text-2xl font-mono font-bold text-emerald-400 block mt-1">4.9 ★</span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Award className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* BUSCADOR */}
      <div className="flex items-center bg-stone-900/40 border border-stone-900 rounded-xl px-4 py-3 max-w-md">
        <Search className="w-4 h-4 text-stone-500 shrink-0" />
        <input 
          type="text" 
          placeholder="Buscar especialista por nombre o rol..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent border-none outline-none text-xs text-stone-200 placeholder-stone-500 w-full ml-3 font-sans"
        />
      </div>

      {/* GRILLA DE MIEMBROS DE STAFF */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtrados.map((member: StaffMember) => (
          <div key={member.id} className="rounded-2xl bg-[#0e0c0b] border border-stone-900 p-5 space-y-5 flex flex-col justify-between hover:border-indigo-500/20 transition-all group">
            
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                {member.avatar_url ? (
                  <img src={member.avatar_url} alt={member.name} className="w-12 h-12 rounded-xl object-cover border border-stone-800" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center font-serif italic text-lg text-indigo-400 font-bold">
                    {member.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-bold text-stone-200 group-hover:text-indigo-400 transition-colors">{member.name}</h3>
                  <p className="text-[11px] text-stone-400 mt-0.5">{member.role}</p>
                </div>
              </div>
            </div>

            {/* INFORMACIÓN DE CONTACTO */}
            <div className="space-y-1.5 pt-2 border-t border-stone-900/60 text-[11px] text-stone-400 font-mono">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-stone-600 shrink-0" />
                <span className="truncate">{member.email || 'Sin correo registrado'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-stone-600 shrink-0" />
                <span>{member.phone || 'Sin teléfono'}</span>
              </div>
            </div>

            {/* ACCIONES */}
            <div className="flex gap-2 pt-2 border-t border-stone-900/60">
              <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 hover:text-white hover:bg-stone-800 text-xs transition-all">
                <Edit className="w-3.5 h-3.5" />
                Editar Perfil
              </button>
              <button className="px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-500 hover:text-red-400 hover:border-red-500/20 transition-all">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        ))}
      </div>

    </div>
  )
}