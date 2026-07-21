// @ts-nocheck
'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useSettings } from '@/contexts/SettingsContext'
import { 
  Users, Plus, Search, Edit, Trash2, 
  Mail, Phone, X, Save, UserPlus, 
  Sparkles, Award, Tag, RefreshCw,
  Star, Clock, Calendar, CheckCircle
} from 'lucide-react'

interface StaffMember {
  id: string
  name: string
  role: string
  email: string
  phone: string
  avatar_url: string
  specialty: string
  experience: string
  is_active: boolean
  created_at: string
}

export default function StaffPage() {
  const { settings } = useSettings()
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [selectedMember, setSelectedMember] = useState<StaffMember | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    role: 'Especialista',
    email: '',
    phone: '',
    specialty: '',
    experience: '',
    avatar_url: ''
  })

  const roles = ['Especialista', 'Senior', 'Master', 'Directora', 'Asistente']

  const brandGradient = {
    backgroundImage: `linear-gradient(to right, ${settings?.primary_color || '#DB5B9A'}, ${settings?.secondary_color || '#E5A46E'})`
  }

  const fetchStaff = async () => {
    try {
      setLoading(true)
      setError(null)
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (error) throw error
      setStaff(data || [])
    } catch (err: any) {
      setError(err.message || 'Error al cargar el equipo')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { fetchStaff() }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchStaff()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!formData.name || !formData.email) {
      setError('Nombre y email son obligatorios')
      return
    }

    try {
      if (editingId) {
        await supabase.from('staff').update(formData).eq('id', editingId)
        setSuccess('Miembro actualizado correctamente')
      } else {
        await supabase.from('staff').insert([{ ...formData, is_active: true }])
        setSuccess('Miembro agregado correctamente')
      }
      setShowModal(false)
      fetchStaff()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar permanentemente?')) return
    await supabase.from('staff').update({ is_active: false }).eq('id', id)
    fetchStaff()
  }

  const filtrados = staff.filter(m =>
    m.name?.toLowerCase().includes(search.toLowerCase()) ||
    m.role?.toLowerCase().includes(search.toLowerCase()) ||
    m.specialty?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="space-y-6 p-1 max-w-full overflow-x-hidden">
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: settings?.primary_color || '#DB5B9A' }}></div>
          <p className="font-mono text-xs uppercase tracking-widest animate-pulse" style={{ color: settings?.primary_color || '#DB5B9A' }}>
            Cargando equipo...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-1 max-w-full overflow-x-hidden">

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
                Staff Premium
              </h2>
              <p className="text-xs text-stone-500 dark:text-pink-100/60 mt-0.5 truncate">
                Gestión de profesionales de {staff.length} miembros.
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
              onClick={() => setShowModal(true)}
              className="px-3 py-2 rounded-xl text-white hover:scale-105 transition-all flex items-center gap-1.5 text-xs font-semibold shrink-0"
              style={{ backgroundColor: settings?.primary_color || '#DB5B9A' }}
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Agregar</span>
              <span className="sm:hidden">+</span>
            </button>
          </div>
        </div>
      </div>

      {/* SEARCH */}
      <div className="flex items-center gap-3 p-3 rounded-2xl border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 min-w-0">
        <Search className="w-4 h-4 shrink-0" style={{ color: settings?.primary_color || '#DB5B9A' }} />
        <input 
          placeholder="Buscar por nombre, rol o especialidad..." 
          className="w-full bg-transparent outline-none text-sm text-stone-800 dark:text-pink-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 min-w-0"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button 
            onClick={() => setSearch('')}
            className="p-1 hover:bg-pink-100 dark:hover:bg-fuchsia-950/50 rounded-lg transition-colors shrink-0"
          >
            <X className="w-4 h-4 text-stone-400" />
          </button>
        )}
      </div>

      {/* ERROR/SUCCESS MESSAGES */}
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
            <CheckCircle className="w-4 h-4" />
          </div>
          <p className="text-xs text-stone-700 dark:text-emerald-400 font-medium min-w-0">{success}</p>
        </div>
      )}

      {/* GRID DE STAFF */}
      {filtrados.length === 0 ? (
        <div className="rounded-2xl p-12 text-center border border-dashed bg-white dark:bg-[#130f24] border-pink-100 dark:border-fuchsia-950">
          <Users className="w-10 h-10 mx-auto mb-3" style={{ color: settings?.primary_color || '#DB5B9A', opacity: 0.3 }} />
          <p className="text-xs text-stone-400 font-medium">No se encontraron miembros</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtrados.map((member) => (
            <div 
              key={member.id}
              className="rounded-2xl p-4 shadow-sm hover:-translate-y-1 transition-all group relative overflow-hidden border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 min-w-0"
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-pink-500/5 to-transparent rounded-bl-full" />
              
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-stone-800 dark:text-pink-100 truncate">{member.name}</h3>
                  <span className="inline-block mt-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full" 
                    style={{ color: settings?.primary_color || '#DB5B9A', backgroundColor: `${settings?.primary_color || '#DB5B9A'}10` }}>
                    {member.role}
                  </span>
                  {member.specialty && (
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1.5 flex items-center gap-1.5 truncate">
                      <Tag className="w-3 h-3 shrink-0" />
                      {member.specialty}
                    </p>
                  )}
                </div>
                <div className="flex gap-0.5 shrink-0">
                  <button 
                    onClick={() => { setEditingId(member.id); setFormData(member); setShowModal(true) }} 
                    className="p-2 hover:bg-pink-50 dark:hover:bg-fuchsia-950/40 rounded-lg transition-colors text-stone-400 hover:text-stone-700 dark:hover:text-pink-100"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(member.id)} 
                    className="p-2 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors text-stone-400 hover:text-rose-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mt-3 space-y-1.5 text-xs text-stone-500 dark:text-stone-400">
                <p className="flex items-center gap-2 truncate">
                  <Mail className="w-3 h-3 shrink-0" />
                  <span className="truncate">{member.email}</span>
                </p>
                {member.phone && (
                  <p className="flex items-center gap-2 truncate">
                    <Phone className="w-3 h-3 shrink-0" />
                    <span className="truncate">{member.phone}</span>
                  </p>
                )}
                {member.experience && (
                  <p className="flex items-center gap-2">
                    <Award className="w-3 h-3 shrink-0" />
                    {member.experience} años de experiencia
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl shadow-2xl border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 p-6 max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 hover:bg-pink-50 dark:hover:bg-fuchsia-950/40 rounded-xl transition-colors text-stone-400 hover:text-stone-700 dark:hover:text-pink-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl text-white shadow-md" style={{ backgroundColor: settings?.primary_color || '#DB5B9A' }}>
                <UserPlus className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-serif font-extrabold text-stone-800 dark:text-pink-100">
                {editingId ? 'Editar Miembro' : 'Nuevo Miembro'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-stone-500 dark:text-stone-400 mb-1.5">
                  Nombre *
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 focus:outline-none focus:ring-2 transition-all text-sm"
                  style={{ 
                    '--tw-ring-color': settings?.primary_color || '#DB5B9A'
                  } as React.CSSProperties}
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-stone-500 dark:text-stone-400 mb-1.5">
                  Email *
                </label>
                <input
                  type="email"
                  className="w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 focus:outline-none focus:ring-2 transition-all text-sm"
                  style={{ 
                    '--tw-ring-color': settings?.primary_color || '#DB5B9A'
                  } as React.CSSProperties}
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-stone-500 dark:text-stone-400 mb-1.5">
                  Rol
                </label>
                <select
                  className="w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 focus:outline-none focus:ring-2 transition-all text-sm appearance-none"
                  style={{ 
                    '--tw-ring-color': settings?.primary_color || '#DB5B9A'
                  } as React.CSSProperties}
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                >
                  {roles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-stone-500 dark:text-stone-400 mb-1.5">
                  Teléfono
                </label>
                <input
                  type="tel"
                  className="w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 focus:outline-none focus:ring-2 transition-all text-sm"
                  style={{ 
                    '--tw-ring-color': settings?.primary_color || '#DB5B9A'
                  } as React.CSSProperties}
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-stone-500 dark:text-stone-400 mb-1.5">
                  Especialidad
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 focus:outline-none focus:ring-2 transition-all text-sm"
                  style={{ 
                    '--tw-ring-color': settings?.primary_color || '#DB5B9A'
                  } as React.CSSProperties}
                  value={formData.specialty}
                  onChange={(e) => setFormData({...formData, specialty: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-stone-500 dark:text-stone-400 mb-1.5">
                  Años de experiencia
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 focus:outline-none focus:ring-2 transition-all text-sm"
                  style={{ 
                    '--tw-ring-color': settings?.primary_color || '#DB5B9A'
                  } as React.CSSProperties}
                  value={formData.experience}
                  onChange={(e) => setFormData({...formData, experience: e.target.value})}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border hover:bg-pink-50 dark:hover:bg-fuchsia-950/30 transition-all text-xs font-bold uppercase tracking-widest border-pink-100/60 dark:border-fuchsia-950 text-stone-600 dark:text-stone-400"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 rounded-xl text-white hover:scale-105 transition-all text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2"
                  style={{ backgroundColor: settings?.primary_color || '#DB5B9A' }}
                >
                  <Save className="w-4 h-4" />
                  {editingId ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}