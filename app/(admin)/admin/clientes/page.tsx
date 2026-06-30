'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useTheme } from '@/contexts/ThemeContext'
import { 
  User, Search, Plus, Phone, Mail, Calendar, 
  UserCheck, Award, Trash2, Edit, Star 
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
      <div className="flex h-96 items-center justify-center">
        <div className="relative">
          <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-8 h-8 border-3 border-amber-500/20 rounded-full animate-ping"></div>
        </div>
        <span className="ml-4 text-xs font-mono text-amber-500 animate-pulse">Sincronizando base de datos...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 transition-colors duration-300">

      {/* HEADER PRINCIPAL CON CARD-GLOW */}
      <div className={`card-glow relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/[0.08] via-card to-card border border-amber-500/20 p-6 shadow-xl animate-fade-up ${
        isDark 
          ? 'bg-gradient-to-br from-amber-950/20 via-[#161311] to-[#0a0908]' 
          : 'bg-gradient-to-br from-amber-50/50 via-white to-stone-50'
      }`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-amber-600 dark:text-amber-400 font-mono flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              👑 CRM & Loyalty
            </p>
            <h2 className="text-2xl font-serif italic text-foreground mt-1">
              Gestión de <span className="text-shimmer">Clientas</span>
            </h2>
            <p className="text-xs text-mutedForeground mt-1">Fichas de clientes, historial de contacto y base de datos activa de Fresh Nails.</p>
          </div>
          <button className="glow-hover flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white text-xs font-medium transition-all shadow-lg shadow-amber-600/20 self-start sm:self-auto">
            <Plus className="w-4 h-4" />
            Nueva Clienta
          </button>
        </div>
      </div>

      {/* METRICAS RÁPIDAS CON CARD-GLOW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 stagger-children">
        <div className={`card-glow rounded-2xl bg-card border border-border p-5 flex items-center justify-between hover:border-amber-500/30 transition-all hover:scale-105 ${
          isDark ? 'bg-[#141211]' : 'bg-white'
        }`}>
          <div>
            <p className="text-mutedForeground text-xs font-medium uppercase tracking-wider">Clientas Registradas</p>
            <span className="text-2xl font-mono font-bold text-foreground block mt-1">{clientes.length}</span>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className={`card-glow rounded-2xl bg-card border border-border p-5 flex items-center justify-between hover:border-amber-500/30 transition-all hover:scale-105 ${
          isDark ? 'bg-[#141211]' : 'bg-white'
        }`}>
          <div>
            <p className="text-mutedForeground text-xs font-medium uppercase tracking-wider">Club de Puntos Activo</p>
            <span className="text-xs font-mono text-amber-600 dark:text-amber-400 block mt-2 font-bold">Programa VIP On</span>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
            <Award className="w-5 h-5" />
          </div>
        </div>

        <div className={`card-glow rounded-2xl bg-card border border-border p-5 flex items-center justify-between hover:border-amber-500/30 transition-all hover:scale-105 ${
          isDark ? 'bg-[#141211]' : 'bg-white'
        }`}>
          <div>
            <p className="text-mutedForeground text-xs font-medium uppercase tracking-wider">Retención Promedio</p>
            <span className="text-2xl font-mono font-bold text-emerald-600 dark:text-emerald-400 block mt-1">87%</span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
            <Star className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* FILTRO DE BÚSQUEDA CON EFECTO */}
      <div className={`flex items-center border rounded-xl px-4 py-3 max-w-md transition-all focus-within:border-amber-500/50 focus-within:shadow-lg focus-within:shadow-amber-500/5 animate-fade-up delay-200 ${
        isDark ? 'bg-stone-900/40 border-stone-800' : 'bg-stone-100 border-stone-200'
      }`}>
        <Search className="w-4 h-4 text-mutedForeground shrink-0" />
        <input 
          type="text" 
          placeholder="Buscar por nombre, correo o teléfono..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`bg-transparent border-none outline-none text-xs text-foreground placeholder-mutedForeground w-full ml-3 font-sans ${
            isDark ? 'text-stone-200' : 'text-stone-800'
          }`}
        />
        {search && (
          <button 
            onClick={() => setSearch('')}
            className="text-mutedForeground hover:text-foreground transition-colors"
          >
            <XCircle className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* TABLA DE CLIENTAS ESTILO PREMIUM CON CARD-GLOW */}
      <div className={`card-glow rounded-2xl border border-border bg-card overflow-hidden ${
        isDark ? 'bg-[#141211]' : 'bg-white'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`border-b text-[10px] font-mono uppercase tracking-wider ${
                isDark 
                  ? 'border-stone-800 bg-stone-900/30 text-stone-400' 
                  : 'border-stone-200 bg-stone-50/50 text-stone-500'
              }`}>
                <th className="p-4">Clienta</th>
                <th className="p-4">Información de Contacto</th>
                <th className="p-4">Fecha de Alta</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-stone-800/60' : 'divide-stone-200/60'}`}>
              {filtrados.map((cliente: Cliente) => (
                <tr key={cliente.id} className={`transition-all group hover:scale-[1.01] ${
                  isDark ? 'hover:bg-stone-900/40' : 'hover:bg-stone-50'
                }`}>

                  {/* Avatar y Nombre */}
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {cliente.avatar_url ? (
                        <img src={cliente.avatar_url} alt={cliente.name} className="w-9 h-9 rounded-xl object-cover border border-border" />
                      ) : (
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-serif italic text-sm font-bold ${
                          isDark 
                            ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
                            : 'bg-amber-500/10 border-amber-500/20 text-amber-600'
                        }`}>
                          {cliente.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className={`font-medium transition-colors ${
                        isDark 
                          ? 'text-stone-200 group-hover:text-amber-400' 
                          : 'text-stone-800 group-hover:text-amber-600'
                      }`}>
                        {cliente.name}
                      </span>
                    </div>
                  </td>

                  {/* Datos de Contacto */}
                  <td className="p-4 text-mutedForeground">
                    <div className="flex flex-col gap-0.5 font-mono text-[11px]">
                      <span className="flex items-center gap-1.5">
                        <Mail className={`w-3 h-3 ${isDark ? 'text-stone-600' : 'text-stone-400'}`} /> {cliente.email || 'Sin correo'}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Phone className={`w-3 h-3 ${isDark ? 'text-stone-600' : 'text-stone-400'}`} /> {cliente.phone || 'Sin teléfono'}
                      </span>
                    </div>
                  </td>

                  {/* Fecha de registro */}
                  <td className="p-4 text-mutedForeground font-mono text-[11px]">
                    <span className="flex items-center gap-1.5">
                      <Calendar className={`w-3.5 h-3.5 ${isDark ? 'text-stone-600' : 'text-stone-400'}`} />
                      {new Date(cliente.created_at).toLocaleDateString()}
                    </span>
                  </td>

                  {/* Acciones */}
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className={`p-1.5 rounded-lg border transition-all hover:scale-110 ${
                        isDark 
                          ? 'bg-stone-900 border-stone-800 text-stone-400 hover:text-foreground hover:border-amber-500/30' 
                          : 'bg-stone-100 border-stone-200 text-stone-500 hover:text-foreground hover:border-amber-500/30'
                      }`} title="Editar">
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button className={`p-1.5 rounded-lg border transition-all hover:scale-110 ${
                        isDark 
                          ? 'bg-stone-900 border-stone-800 text-stone-400 hover:text-rose-400 hover:border-rose-500/20' 
                          : 'bg-stone-100 border-stone-200 text-stone-500 hover:text-rose-500 hover:border-rose-500/20'
                      }`} title="Eliminar">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={4} className={`text-center py-10 font-mono text-xs ${
                    isDark ? 'text-stone-500' : 'text-stone-400'
                  }`}>
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