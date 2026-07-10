'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useTheme } from '@/contexts/ThemeContext'
import { 
  Users, Plus, Search, Edit, Trash2, 
  Mail, Phone, Clock, X, Save, UserPlus, 
  UserCog, Sparkles, Award, Tag
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
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [selectedMember, setSelectedMember] = useState<StaffMember | null>(null)
  const [showDetail, setShowDetail] = useState(false)

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
      console.error('Error cargando staff:', err)
      setError(err.message || 'Error al cargar el equipo')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStaff()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!formData.name || !formData.email) {
      setError('Nombre y email son obligatorios')
      return
    }

    const payload = {
      name: formData.name,
      role: formData.role || 'Especialista',
      email: formData.email,
      phone: formData.phone || '',
      specialty: formData.specialty || '',
      experience: formData.experience || '',
      avatar_url: formData.avatar_url || '',
      is_active: true
    }

    try {
      if (editingId) {
        const { error } = await supabase
          .from('staff')
          .update(payload)
          .eq('id', editingId)
        if (error) throw error
        setSuccess('✅ Miembro actualizado correctamente')
      } else {
        const { error } = await supabase
          .from('staff')
          .insert([payload])
        if (error) throw error
        setSuccess('✅ Miembro agregado correctamente')
      }

      setShowModal(false)
      setEditingId(null)
      setFormData({ name: '', role: 'Especialista', email: '', phone: '', specialty: '', experience: '', avatar_url: '' })
      fetchStaff()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      console.error('Error al guardar:', err)
      setError(err.message || 'Error al guardar')
    }
  }

  const handleEdit = (member: StaffMember) => {
    setEditingId(member.id)
    setFormData({
      name: member.name,
      role: member.role || 'Especialista',
      email: member.email || '',
      phone: member.phone || '',
      specialty: member.specialty || '',
      experience: member.experience || '',
      avatar_url: member.avatar_url || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este miembro del equipo?')) return
    try {
      const { error } = await supabase
        .from('staff')
        .update({ is_active: false })
        .eq('id', id)
      if (error) throw error
      setSuccess('✅ Miembro eliminado')
      fetchStaff()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      console.error('Error al eliminar:', err)
      setError(err.message || 'Error al eliminar')
    }
  }

  const handleViewDetail = (member: StaffMember) => {
    setSelectedMember(member)
    setShowDetail(true)
  }

  const getRoleEmoji = (role: string) => {
    switch(role) {
      case 'Master': return '👑'
      case 'Senior': return '⭐'
      case 'Directora': return '💎'
      case 'Especialista': return '✨'
      default: return '🌟'
    }
  }

  const getRoleColor = (role: string) => {
    switch(role) {
      case 'Master': return 'from-amber-400 to-rose-500'
      case 'Senior': return 'from-pink-400 to-pink-600'
      case 'Directora': return 'from-pink-500 to-amber-500'
      default: return 'from-rose-400 to-pink-500'
    }
  }

  const filtrados = staff.filter(m =>
    m.name?.toLowerCase().includes(search.toLowerCase()) ||
    m.role?.toLowerCase().includes(search.toLowerCase()) ||
    m.specialty?.toLowerCase().includes(search.toLowerCase()) ||
    m.email?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center space-y-4 flex-col">
        <div className="w-10 h-10 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <span className="text-pink-600/80 font-mono text-xs uppercase tracking-widest animate-pulse">Cargando equipo...</span>
      </div>
    )
  }

  return (
    <div className={`space-y-8 max-w-[1400px] mx-auto px-1 transition-colors duration-300 ${
      isDark ? 'text-pink-100' : 'text-stone-800'
    }`}>

      {/* HEADER PREMIUM */}
      <div className="relative overflow-hidden rounded-3xl p-[1px] shadow-xl shadow-pink-500/5 bg-gradient-to-r from-pink-500 via-rose-500 to-amber-400">
        <div className={`relative z-10 rounded-[23px] p-6 md:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          isDark ? 'bg-[#0f0c1b]' : 'bg-[#fffdfd]'
        }`}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
          
          <div className="space-y-1 relative z-10">
            <p className="text-[10px] uppercase tracking-[0.3em] text-pink-500 dark:text-pink-400 font-mono font-bold flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
              Gestión Interna
            </p>
            <h2 className="text-2xl md:text-3xl font-serif font-extrabold bg-gradient-to-r from-stone-900 via-pink-900 to-rose-800 bg-clip-text text-transparent dark:from-white dark:to-pink-200 mt-0.5">
              Staff Premium
            </h2>
            <p className={`text-xs ${isDark ? 'text-pink-100/60' : 'text-stone-500'}`}>
              {staff.length} profesionales listos para atender en Fresh Nails Studio Center.
            </p>
          </div>
          
          <button 
            onClick={() => { setEditingId(null); setFormData({ name: '', role: 'Especialista', email: '', phone: '', specialty: '', experience: '', avatar_url: '' }); setShowModal(true) }}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-400 hover:opacity-95 text-white text-xs font-mono font-bold tracking-widest uppercase transition-all shadow-md shadow-pink-500/20 self-start sm:self-auto active:scale-[0.99]"
          >
            <UserPlus className="w-4 h-4" />
            Agregar Miembro
          </button>
        </div>
      </div>

      {/* ALERTAS CON ANIMACIÓN */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-600 dark:text-red-400 text-xs font-mono flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-emerald-600 dark:text-emerald-400 text-xs font-mono flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {success}
        </div>
      )}

      {/* MÉTRICAS PREMIUM */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`rounded-2xl border p-5 flex items-center justify-between shadow-xs hover:border-pink-500/40 transition-all ${
          isDark ? 'bg-[#130f24] border-fuchsia-950/70' : 'bg-[#fffdfd] border-pink-100/60'
        }`}>
          <div>
            <p className="text-stone-400 dark:text-stone-500 text-[10px] font-mono uppercase tracking-wider">Total Staff</p>
            <span className="text-3xl font-mono font-extrabold text-stone-800 dark:text-pink-100 block mt-1">{staff.length}</span>
          </div>
          <div className="p-3 rounded-xl bg-pink-500/10 text-pink-500 border border-pink-500/20">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className={`rounded-2xl border p-5 flex items-center justify-between shadow-xs hover:border-pink-500/40 transition-all ${
          isDark ? 'bg-[#130f24] border-fuchsia-950/70' : 'bg-[#fffdfd] border-pink-100/60'
        }`}>
          <div>
            <p className="text-stone-400 dark:text-stone-500 text-[10px] font-mono uppercase tracking-wider">Especialidades</p>
            <span className="text-3xl font-mono font-extrabold text-stone-800 dark:text-pink-100 block mt-1">
              {new Set(staff.map(m => m.specialty).filter(Boolean)).size}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className={`rounded-2xl border p-5 flex items-center justify-between shadow-xs hover:border-pink-500/40 transition-all ${
          isDark ? 'bg-[#130f24] border-fuchsia-950/70' : 'bg-[#fffdfd] border-pink-100/60'
        }`}>
          <div>
            <p className="text-stone-400 dark:text-stone-500 text-[10px] font-mono uppercase tracking-wider">Eleslabón Roles</p>
            <span className="text-3xl font-mono font-extrabold text-stone-800 dark:text-pink-100 block mt-1">
              {new Set(staff.map(m => m.role).filter(Boolean)).size}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-pink-500/10 text-pink-500 border border-pink-500/20">
            <UserCog className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* BÚSQUEDA */}
      <div className="relative flex items-center max-w-xl group">
        <Search className={`absolute left-4 w-4.5 h-4.5 transition-colors group-focus-within:text-pink-500 pointer-events-none ${
          isDark ? 'text-stone-500' : 'text-stone-400'
        }`} />
        <input 
          type="text" 
          placeholder="Buscar por nombre, rol o especialidad..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`w-full border rounded-2xl pl-12 pr-10 py-3 text-sm placeholder-stone-400 focus:outline-none focus:border-pink-500/40 focus:ring-1 focus:ring-pink-500/20 transition-all font-sans shadow-sm ${
            isDark 
              ? 'bg-[#130f24] border-fuchsia-950 text-pink-100' 
              : 'bg-[#fffdfd] border-pink-100/60 text-stone-800'
          }`} 
        />
        {search && (
          <button 
            onClick={() => setSearch('')}
            className="absolute right-4 text-stone-400 hover:text-pink-500 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* GRID DE STAFF */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtrados.map((member) => (
          <div 
            key={member.id} 
            className={`cursor-pointer border rounded-2xl p-5 hover:border-pink-500/40 transition-all group duration-300 flex flex-col justify-between ${
              isDark ? 'bg-[#130f24] border-fuchsia-950/70' : 'bg-[#fffdfd] border-pink-100/40'
            }`}
            onClick={() => handleViewDetail(member)}
          >
            <div className="flex items-start gap-4">
              <div className="relative shrink-0">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${getRoleColor(member.role)} p-[2px]`}>
                  <div className={`w-full h-full rounded-xl flex items-center justify-center text-sm font-mono font-black ${
                    isDark ? 'bg-[#0f0c1b] text-pink-400' : 'bg-pink-50/40 text-stone-800'
                  }`}>
                    {member.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                </div>
                <div className="absolute -top-1.5 -right-1.5 text-sm filter drop-shadow-xs">
                  {getRoleEmoji(member.role)}
                </div>
              </div>
              
              <div className="flex-1 min-w-0 space-y-1">
                <h3 className={`text-sm font-bold truncate group-hover:text-pink-500 dark:group-hover:text-pink-400 transition-colors ${
                  isDark ? 'text-pink-100' : 'text-stone-800'
                }`}>
                  {member.name}
                </h3>
                <p className="text-xs font-mono font-bold text-pink-500 dark:text-pink-400">
                  {member.role || 'Especialista'}
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {member.specialty && (
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-pink-500/5 border border-pink-500/20 text-pink-600 dark:text-pink-300 font-mono">
                      {member.specialty.toUpperCase()}
                    </span>
                  )}
                  {member.experience && (
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/5 border border-amber-500/20 text-amber-600 dark:text-amber-300 font-mono flex items-center gap-0.5">
                      <Award className="w-2.5 h-2.5" />
                      {member.experience.toUpperCase()}
                    </span>
                  )}
                </div>
                {member.email && (
                  <p className="text-[11px] text-stone-400 dark:text-stone-500 flex items-center gap-1.5 pt-2 truncate font-sans">
                    <Mail className="w-3.5 h-3.5 text-stone-400/60" /> {member.email}
                  </p>
                )}
              </div>
            </div>

            <div className={`flex gap-2 mt-5 pt-4 border-t ${
              isDark ? 'border-fuchsia-950/40' : 'border-pink-50'
            }`}>
              <button 
                onClick={(e) => { e.stopPropagation(); handleEdit(member) }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-[10px] font-mono font-bold uppercase tracking-wider transition-all ${
                  isDark 
                    ? 'bg-[#0f0c1b] border-fuchsia-950 text-stone-400 hover:text-pink-400 hover:bg-[#130f24]' 
                    : 'bg-pink-50/30 border-pink-100/40 text-stone-500 hover:text-pink-600 hover:bg-pink-50/70'
                }`}
              >
                <Edit className="w-3.5 h-3.5 stroke-[1.5]" />
                Editar
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); handleDelete(member.id) }}
                className={`px-3 py-2.5 rounded-xl border transition-all ${
                  isDark 
                    ? 'bg-[#0f0c1b] border-fuchsia-950 text-stone-400 hover:text-rose-500 hover:border-rose-500/20' 
                    : 'bg-pink-50/30 border-pink-100/40 text-stone-500 hover:text-rose-500 hover:border-rose-500/20'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5 stroke-[1.5]" />
              </button>
            </div>
          </div>
        ))}

        {filtrados.length === 0 && (
          <div className={`col-span-full py-16 text-center border border-dashed rounded-2xl ${
            isDark ? 'text-stone-500 border-fuchsia-950 bg-[#130f24]/20' : 'text-stone-400 border-pink-100 bg-pink-50/10'
          }`}>
            <div className="flex flex-col items-center gap-2">
              <Users className="w-8 h-8 text-stone-400/40" />
              <p className="font-mono text-xs">No se encontraron miembros del equipo</p>
              <button 
                onClick={() => { setEditingId(null); setFormData({ name: '', role: 'Especialista', email: '', phone: '', specialty: '', experience: '', avatar_url: '' }); setShowModal(true) }}
                className="text-xs text-pink-500 font-bold hover:underline"
              >
                Agregar el primer miembro →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL EDITAR / AGREGAR */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-up">
          <div className={`border rounded-[24px] p-6 max-w-md w-full shadow-2xl max-h-[92vh] overflow-y-auto scrollbar-none ${
            isDark 
              ? 'bg-[#0f0c1b] border-fuchsia-950 text-pink-100' 
              : 'bg-[#fffdfd] border-pink-100 text-stone-800'
          }`}>
            <div className={`flex items-center justify-between mb-5 pb-2 border-b ${
              isDark ? 'border-fuchsia-950/60' : 'border-pink-50'
            }`}>
              <h3 className="text-xs font-mono font-bold uppercase tracking-widest flex items-center gap-2">
                <Tag className="w-4 h-4 text-pink-500" /> 
                {editingId ? 'Modificar Miembro' : 'Registrar Miembro'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-stone-400 hover:text-pink-500 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-1.5">Nombre Completo *</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  className={`w-full border rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-pink-500/50 transition-colors placeholder-stone-400 dark:placeholder-stone-600 ${
                    isDark 
                      ? 'bg-[#130f24] border-fuchsia-950 text-pink-100' 
                      : 'bg-transparent border-pink-100 text-stone-800'
                  }`} 
                  required 
                />
              </div>
              <div>
                <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-1.5">Email de Contacto *</label>
                <input 
                  type="email" 
                  value={formData.email} 
                  onChange={(e) => setFormData({...formData, email: e.target.value})} 
                  className={`w-full border rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-pink-500/50 transition-colors placeholder-stone-400 dark:placeholder-stone-600 ${
                    isDark 
                      ? 'bg-[#130f24] border-fuchsia-950 text-pink-100' 
                      : 'bg-transparent border-pink-100 text-stone-800'
                  }`} 
                  required 
                />
              </div>
              <div>
                <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-1.5">Teléfono Móvil</label>
                <input 
                  type="text" 
                  value={formData.phone} 
                  onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                  className={`w-full border rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-pink-500/50 transition-colors placeholder-stone-400 dark:placeholder-stone-600 ${
                    isDark 
                      ? 'bg-[#130f24] border-fuchsia-950 text-pink-100' 
                      : 'bg-transparent border-pink-100 text-stone-800'
                  }`} 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-1.5">Rango o Rol</label>
                  <select 
                    value={formData.role} 
                    onChange={(e) => setFormData({...formData, role: e.target.value})} 
                    className={`w-full border rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-pink-500/50 transition-colors ${
                      isDark 
                        ? 'bg-[#130f24] border-fuchsia-950 text-pink-100' 
                        : 'bg-transparent border-pink-100 text-stone-800'
                    }`}
                  >
                    {roles.map(r => (
                      <option key={r} value={r} className={isDark ? 'bg-[#0f0c1b] text-pink-100' : 'bg-[#fffdfd] text-stone-800'}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-1.5">Especialidad</label>
                  <input 
                    type="text" 
                    value={formData.specialty} 
                    onChange={(e) => setFormData({...formData, specialty: e.target.value})} 
                    className={`w-full border rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-pink-500/50 transition-colors placeholder-stone-400 dark:placeholder-stone-600 ${
                      isDark 
                        ? 'bg-[#130f24] border-fuchsia-950 text-pink-100' 
                        : 'bg-transparent border-pink-100 text-stone-800'
                  }`} 
                    placeholder="Ej: Nail Art Extremo"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-1.5">Tiempo de Experiencia</label>
                <input 
                  type="text" 
                  value={formData.experience} 
                  onChange={(e) => setFormData({...formData, experience: e.target.value})} 
                  className={`w-full border rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-pink-500/50 transition-colors placeholder-stone-400 dark:placeholder-stone-600 ${
                    isDark 
                      ? 'bg-[#130f24] border-fuchsia-950 text-pink-100' 
                      : 'bg-transparent border-pink-100 text-stone-800'
                  }`} 
                  placeholder="Ej: 3 años"
                />
              </div>

              <div className={`flex gap-3 pt-6 mt-4 border-t ${
                isDark ? 'border-fuchsia-950/60' : 'border-pink-50'
              }`}>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className={`flex-1 px-4 py-3 border rounded-xl text-[10px] font-mono font-bold tracking-widest uppercase transition-colors ${
                    isDark 
                      ? 'border-fuchsia-950 text-stone-400 hover:bg-[#130f24]' 
                      : 'border-pink-100 text-stone-500 hover:bg-pink-50/40'
                  }`}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-pink-500 via-rose-500 to-amber-400 text-white rounded-xl text-[10px] font-mono font-bold tracking-widest uppercase hover:opacity-95 shadow-md shadow-pink-500/10 flex items-center justify-center gap-2 active:scale-[0.99]"
                >
                  <Save className="w-4 h-4" />
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE DETALLE INDIVIDUAL */}
      {showDetail && selectedMember && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-up">
          <div className={`border rounded-[24px] p-6 max-w-sm w-full shadow-2xl ${
            isDark 
              ? 'bg-[#0f0c1b] border-fuchsia-950 text-pink-100' 
              : 'bg-[#fffdfd] border-pink-100 text-stone-800'
          }`}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getRoleColor(selectedMember.role)} p-[2px]`}>
                  <div className={`w-full h-full rounded-xl flex items-center justify-center text-xs font-mono font-black ${
                    isDark ? 'bg-[#130f24] text-pink-400' : 'bg-pink-50/40 text-stone-800'
                  }`}>
                    {selectedMember.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-bold">{selectedMember.name}</h3>
                  <p className="text-xs text-pink-500 dark:text-pink-400 font-mono font-bold">{selectedMember.role}</p>
                </div>
              </div>
              <button onClick={() => setShowDetail(false)} className="p-1.5 hover:bg-pink-50/20 rounded-lg transition-colors text-stone-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className={`space-y-3 border-t pt-4 text-xs font-sans ${
              isDark ? 'border-fuchsia-950/60' : 'border-pink-50'
            }`}>
              <div className="flex items-center gap-2 text-stone-500 dark:text-pink-100/60">
                <Mail className="w-4 h-4 text-pink-500/70" />
                <span>{selectedMember.email}</span>
              </div>
              {selectedMember.phone && (
                <div className="flex items-center gap-2 text-stone-500 dark:text-pink-100/60">
                  <Phone className="w-4 h-4 text-pink-500/70" />
                  <span>{selectedMember.phone}</span>
                </div>
              )}
              {selectedMember.specialty && (
                <div className="flex items-center gap-2 text-stone-500 dark:text-pink-100/60">
                  <Sparkles className="w-4 h-4 text-pink-500/70" />
                  <span>Especialidad: <strong className="text-pink-600 dark:text-pink-300 font-mono text-[11px]">{selectedMember.specialty.toUpperCase()}</strong></span>
                </div>
              )}
              {selectedMember.experience && (
                <div className="flex items-center gap-2 text-stone-500 dark:text-pink-100/60">
                  <Award className="w-4 h-4 text-amber-500/70" />
                  <span>Trayectoria: <strong className="text-amber-600 dark:text-amber-300 font-mono text-[11px]">{selectedMember.experience.toUpperCase()}</strong></span>
                </div>
              )}
              {selectedMember.created_at && (
                <div className={`flex items-center gap-2 text-[10px] text-stone-400 dark:text-stone-500 border-t pt-2.5 mt-2 ${
                  isDark ? 'border-fuchsia-950/40' : 'border-pink-50'
                }`}>
                  <Clock className="w-3.5 h-3.5" />
                  <span>Miembro desde {new Date(selectedMember.created_at).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-6 pt-4 border-t border-pink-50 dark:border-fuchsia-950/60">
              <button 
                onClick={() => { setShowDetail(false); handleEdit(selectedMember) }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-[10px] font-mono font-bold uppercase tracking-wider transition-all ${
                  isDark 
                    ? 'bg-[#130f24] border-fuchsia-950 text-stone-400 hover:text-pink-400' 
                    : 'bg-pink-50/30 border-pink-100/40 text-stone-500 hover:text-pink-600'
                }`}
              >
                <Edit className="w-3.5 h-3.5" />
                Editar
              </button>
              <button 
                onClick={() => { setShowDetail(false); handleDelete(selectedMember.id) }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 text-[10px] font-mono font-bold uppercase tracking-wider transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
