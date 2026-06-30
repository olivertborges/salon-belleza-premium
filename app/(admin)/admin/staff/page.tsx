'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { 
  Users, Plus, Search, Edit, Trash2, 
  User, Mail, Phone, Calendar, Clock,
  X, Save, UserPlus, UserCog, Sparkles,
  Star, Award, Heart, Zap, Crown
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
      case 'Master': return 'from-amber-500 to-rose-500'
      case 'Senior': return 'from-blue-500 to-indigo-500'
      case 'Directora': return 'from-purple-500 to-pink-500'
      default: return 'from-indigo-500 to-purple-500'
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
      <div className="flex h-96 items-center justify-center">
        <div className="relative">
          <div className="w-12 h-12 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-12 h-12 border-3 border-indigo-500/20 rounded-full"></div>
          <div className="absolute inset-0 w-12 h-12 border-3 border-indigo-500/10 rounded-full animate-ping"></div>
        </div>
        <span className="ml-4 text-xs font-mono text-indigo-500">Cargando equipo...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* HEADER PREMIUM */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-500/[0.08] via-purple-500/[0.05] to-card border border-indigo-500/20 p-6 shadow-xl animate-fade-up">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-indigo-500 dark:text-indigo-400 font-mono flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              Equipo Fresh Nails
            </p>
            <h2 className="text-3xl font-serif italic text-foreground mt-1">
              Staff <span className="text-shimmer">Premium</span>
            </h2>
            <p className="text-xs text-mutedForeground mt-1">
              {staff.length} profesionales listos para atenderte
            </p>
          </div>
          <button 
            onClick={() => { setEditingId(null); setFormData({ name: '', role: 'Especialista', email: '', phone: '', specialty: '', experience: '', avatar_url: '' }); setShowModal(true) }}
            className="group flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-medium transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40 transform hover:-translate-y-0.5 active:scale-[0.98] self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4 group-hover:rotate-12 transition-transform" />
            Agregar Miembro
          </button>
        </div>
      </div>

      {/* ALERTAS CON ANIMACIÓN */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-600 dark:text-red-400 text-xs animate-fade-up">
          <p className="font-mono flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            ❌ {error}
          </p>
        </div>
      )}
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-emerald-600 dark:text-emerald-400 text-xs animate-fade-up">
          <p className="font-mono flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            ✅ {success}
          </p>
        </div>
      )}

      {/* MÉTRICAS PREMIUM */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-card border border-border p-5 flex items-center justify-between card-glow hover:border-indigo-500/30 transition-all">
          <div>
            <p className="text-mutedForeground text-xs font-medium uppercase tracking-wider">Total Staff</p>
            <span className="text-3xl font-mono font-bold text-foreground block mt-1">{staff.length}</span>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-2xl bg-card border border-border p-5 flex items-center justify-between card-glow hover:border-indigo-500/30 transition-all">
          <div>
            <p className="text-mutedForeground text-xs font-medium uppercase tracking-wider">Especialidades</p>
            <span className="text-3xl font-mono font-bold text-foreground block mt-1">
              {new Set(staff.map(m => m.specialty).filter(Boolean)).size}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/20 to-rose-500/20 border border-amber-500/20 text-amber-600 dark:text-amber-400">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-2xl bg-card border border-border p-5 flex items-center justify-between card-glow hover:border-indigo-500/30 transition-all">
          <div>
            <p className="text-mutedForeground text-xs font-medium uppercase tracking-wider">Roles</p>
            <span className="text-3xl font-mono font-bold text-foreground block mt-1">
              {new Set(staff.map(m => m.role).filter(Boolean)).size}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500/20 to-pink-500/20 border border-violet-500/20 text-violet-600 dark:text-violet-400">
            <UserCog className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* BÚSQUEDA CON EFECTO */}
      <div className="flex items-center bg-muted border border-border rounded-xl px-4 py-3 max-w-md transition-all focus-within:border-indigo-500/50 focus-within:shadow-lg focus-within:shadow-indigo-500/5">
        <Search className="w-4 h-4 text-mutedForeground shrink-0" />
        <input 
          type="text" 
          placeholder="Buscar por nombre, rol o especialidad..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent border-none outline-none text-xs text-foreground placeholder-mutedForeground w-full ml-3"
        />
        {search && (
          <button 
            onClick={() => setSearch('')}
            className="text-mutedForeground hover:text-foreground transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* GRID DE STAFF MEJORADO */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtrados.map((member, index) => (
          <div 
            key={member.id} 
            className={`bg-card border border-border rounded-xl p-5 hover:border-indigo-500/30 transition-all group card-glow animate-fade-up delay-${(index % 5) * 100}`}
            onClick={() => handleViewDetail(member)}
          >
            <div className="flex items-start gap-3">
              <div className="relative">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${getRoleColor(member.role)} p-[2px]`}>
                  <div className="w-full h-full rounded-xl bg-card flex items-center justify-center text-lg font-bold text-indigo-600 dark:text-indigo-400">
                    {member.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                </div>
                <div className="absolute -top-1 -right-1 text-sm">
                  {getRoleEmoji(member.role)}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                  {member.name}
                </h3>
                <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                  {member.role || 'Especialista'}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {member.specialty && (
                    <span className="text-[8px] px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-medium">
                      {member.specialty}
                    </span>
                  )}
                  {member.experience && (
                    <span className="text-[8px] px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 font-medium flex items-center gap-0.5">
                      <Award className="w-2.5 h-2.5" />
                      {member.experience}
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-0.5 mt-2 text-[10px] text-mutedForeground">
                  {member.email && (
                    <span className="flex items-center gap-1 truncate hover:text-foreground transition-colors">
                      <Mail className="w-3 h-3 text-mutedForeground/60" /> {member.email}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-3 pt-3 border-t border-border/60">
              <button 
                onClick={(e) => { e.stopPropagation(); handleEdit(member) }}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-background border border-border text-mutedForeground hover:text-foreground hover:bg-muted text-xs transition-all hover:border-indigo-500/30"
              >
                <Edit className="w-3.5 h-3.5" />
                Editar
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); handleDelete(member.id) }}
                className="px-3 py-1.5 rounded-xl bg-background border border-border text-mutedForeground hover:text-rose-500 hover:border-rose-500/20 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}

        {filtrados.length === 0 && (
          <div className="col-span-full py-16 text-center border border-dashed border-border rounded-xl animate-fade-up">
            <div className="flex flex-col items-center gap-2">
              <Users className="w-8 h-8 text-mutedForeground/40" />
              <p className="font-mono text-mutedForeground text-xs">No se encontraron miembros del equipo</p>
              <button 
                onClick={() => { setEditingId(null); setFormData({ name: '', role: 'Especialista', email: '', phone: '', specialty: '', experience: '', avatar_url: '' }); setShowModal(true) }}
                className="text-xs text-indigo-500 hover:text-indigo-400 transition-colors"
              >
                Agregar el primer miembro →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL PREMIUM */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-up">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-600 dark:text-indigo-400">
                  <UserPlus className="w-4 h-4" />
                </div>
                {editingId ? 'Editar Miembro' : 'Agregar Miembro'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
                <X className="w-4 h-4 text-mutedForeground" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[10px] text-mutedForeground font-medium mb-1.5 uppercase tracking-wider">Nombre *</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all" 
                  required 
                />
              </div>
              <div>
                <label className="block text-[10px] text-mutedForeground font-medium mb-1.5 uppercase tracking-wider">Email *</label>
                <input 
                  type="email" 
                  value={formData.email} 
                  onChange={(e) => setFormData({...formData, email: e.target.value})} 
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all" 
                  required 
                />
              </div>
              <div>
                <label className="block text-[10px] text-mutedForeground font-medium mb-1.5 uppercase tracking-wider">Teléfono</label>
                <input 
                  type="text" 
                  value={formData.phone} 
                  onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all" 
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-mutedForeground font-medium mb-1.5 uppercase tracking-wider">Rol</label>
                  <select 
                    value={formData.role} 
                    onChange={(e) => setFormData({...formData, role: e.target.value})} 
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                  >
                    {roles.map(r => <option key={r} value={r} className="bg-card text-foreground">{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-mutedForeground font-medium mb-1.5 uppercase tracking-wider">Especialidad</label>
                  <input 
                    type="text" 
                    value={formData.specialty} 
                    onChange={(e) => setFormData({...formData, specialty: e.target.value})} 
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all" 
                    placeholder="Ej: Microblading"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-mutedForeground font-medium mb-1.5 uppercase tracking-wider">Experiencia</label>
                <input 
                  type="text" 
                  value={formData.experience} 
                  onChange={(e) => setFormData({...formData, experience: e.target.value})} 
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all" 
                  placeholder="Ej: 5 años"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-border">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="flex-1 px-4 py-2.5 bg-background border border-border text-mutedForeground rounded-xl text-xs font-medium hover:bg-muted transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40"
                >
                  <Save className="w-3.5 h-3.5" />
                  {editingId ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE DETALLE */}
      {showDetail && selectedMember && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-up">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getRoleColor(selectedMember.role)} p-[2px]`}>
                  <div className="w-full h-full rounded-xl bg-card flex items-center justify-center text-lg font-bold text-indigo-600 dark:text-indigo-400">
                    {selectedMember.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">{selectedMember.name}</h3>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">{selectedMember.role}</p>
                </div>
              </div>
              <button onClick={() => setShowDetail(false)} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
                <X className="w-4 h-4 text-mutedForeground" />
              </button>
            </div>

            <div className="space-y-3 border-t border-border pt-4">
              <div className="flex items-center gap-2 text-xs text-mutedForeground">
                <Mail className="w-3.5 h-3.5 text-mutedForeground/60" />
                <span>{selectedMember.email}</span>
              </div>
              {selectedMember.phone && (
                <div className="flex items-center gap-2 text-xs text-mutedForeground">
                  <Phone className="w-3.5 h-3.5 text-mutedForeground/60" />
                  <span>{selectedMember.phone}</span>
                </div>
              )}
              {selectedMember.specialty && (
                <div className="flex items-center gap-2 text-xs text-mutedForeground">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500/60" />
                  <span className="font-medium text-indigo-600 dark:text-indigo-400">{selectedMember.specialty}</span>
                </div>
              )}
              {selectedMember.experience && (
                <div className="flex items-center gap-2 text-xs text-mutedForeground">
                  <Award className="w-3.5 h-3.5 text-amber-500/60" />
                  <span className="font-medium text-amber-600 dark:text-amber-400">{selectedMember.experience}</span>
                </div>
              )}
              {selectedMember.created_at && (
                <div className="flex items-center gap-2 text-[10px] text-mutedForeground border-t border-border pt-2 mt-1">
                  <Clock className="w-3.5 h-3.5 text-mutedForeground/60" />
                  <span>Desde {new Date(selectedMember.created_at).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-5 pt-4 border-t border-border">
              <button 
                onClick={() => { setShowDetail(false); handleEdit(selectedMember) }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-background border border-border text-foreground hover:bg-muted text-xs font-medium transition-all"
              >
                <Edit className="w-3.5 h-3.5" />
                Editar
              </button>
              <button 
                onClick={() => { setShowDetail(false); handleDelete(selectedMember.id) }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 text-xs font-medium transition-all"
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