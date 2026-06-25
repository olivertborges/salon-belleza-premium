'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { 
  Users, Plus, Search, Edit, Trash2, 
  User, Mail, Phone, Calendar, Clock,
  X, Save, UserPlus, UserCog, Sparkles
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

  const filtrados = staff.filter(m =>
    m.name?.toLowerCase().includes(search.toLowerCase()) ||
    m.role?.toLowerCase().includes(search.toLowerCase()) ||
    m.specialty?.toLowerCase().includes(search.toLowerCase()) ||
    m.email?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center font-mono text-xs text-indigo-400">
        Cargando equipo...
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-950/40 via-stone-900/40 to-[#0e0c0b] border border-indigo-500/20 p-6 shadow-xl">
        <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/5 rounded-full blur-3xl"></div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-indigo-400 font-mono">👥 Equipo</p>
            <h2 className="text-2xl font-serif italic text-white mt-1">Staff Fresh Nails</h2>
            <p className="text-xs text-stone-400 mt-1">Gestiona los profesionales del salón.</p>
          </div>
          <button 
            onClick={() => { setEditingId(null); setFormData({ name: '', role: 'Especialista', email: '', phone: '', specialty: '', experience: '', avatar_url: '' }); setShowModal(true) }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all shadow-lg shadow-indigo-600/10 self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            Agregar Miembro
          </button>
        </div>
      </div>

      {/* ERROR Y SUCCESS */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-xs">
          <p className="font-mono">❌ {error}</p>
        </div>
      )}
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-emerald-400 text-xs">
          <p className="font-mono">✅ {success}</p>
        </div>
      )}

      {/* MÉTRICAS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="rounded-2xl bg-stone-900/30 border border-stone-900 p-5 flex items-center justify-between">
          <div>
            <p className="text-stone-400 text-xs font-medium">Total Staff</p>
            <span className="text-2xl font-mono font-bold text-stone-100 block mt-1">{staff.length}</span>
          </div>
          <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-2xl bg-stone-900/30 border border-stone-900 p-5 flex items-center justify-between">
          <div>
            <p className="text-stone-400 text-xs font-medium">Especialidades</p>
            <span className="text-2xl font-mono font-bold text-stone-200 block mt-1">
              {new Set(staff.map(m => m.specialty).filter(Boolean)).size}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-stone-500/10 border border-stone-500/20 text-stone-400">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-2xl bg-stone-900/30 border border-stone-900 p-5 flex items-center justify-between">
          <div>
            <p className="text-stone-400 text-xs font-medium">Roles</p>
            <span className="text-2xl font-mono font-bold text-stone-200 block mt-1">
              {new Set(staff.map(m => m.role).filter(Boolean)).size}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-stone-500/10 border border-stone-500/20 text-stone-400">
            <UserCog className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* BÚSQUEDA */}
      <div className="flex items-center bg-stone-900/40 border border-stone-900 rounded-xl px-4 py-3 max-w-md">
        <Search className="w-4 h-4 text-stone-500 shrink-0" />
        <input 
          type="text" 
          placeholder="Buscar por nombre, rol o especialidad..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent border-none outline-none text-xs text-stone-200 placeholder-stone-500 w-full ml-3"
        />
      </div>

      {/* GRID DE STAFF */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtrados.map((member) => (
          <div key={member.id} className="bg-[#0e0c0b] border border-stone-900 rounded-xl p-4 hover:border-indigo-500/20 transition-all group">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-amber-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-lg font-bold flex-shrink-0">
                {member.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-stone-200 group-hover:text-indigo-400 transition-colors truncate">
                  {member.name}
                </h3>
                <p className="text-xs text-indigo-400">{member.role || 'Especialista'}</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {member.specialty && (
                    <span className="text-[8px] px-2 py-0.5 rounded-full bg-stone-900 border border-stone-800 text-stone-400">
                      {member.specialty}
                    </span>
                  )}
                  {member.experience && (
                    <span className="text-[8px] px-2 py-0.5 rounded-full bg-stone-900 border border-stone-800 text-stone-400">
                      {member.experience}
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-0.5 mt-1 text-[10px] text-stone-500">
                  {member.email && (
                    <span className="flex items-center gap-1 truncate">
                      <Mail className="w-3 h-3" /> {member.email}
                    </span>
                  )}
                  {member.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {member.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-3 pt-3 border-t border-stone-900/60">
              <button 
                onClick={() => handleEdit(member)}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 hover:text-white hover:bg-stone-800 text-xs transition-all"
              >
                <Edit className="w-3.5 h-3.5" />
                Editar
              </button>
              <button 
                onClick={() => handleDelete(member.id)}
                className="px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-500 hover:text-red-400 hover:border-red-500/20 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}

        {filtrados.length === 0 && (
          <div className="col-span-full py-12 text-center font-mono text-stone-500 text-xs border border-dashed border-stone-900 rounded-xl">
            No se encontraron miembros del equipo
          </div>
        )}
      </div>

      {/* MODAL PARA AGREGAR/EDITAR STAFF */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0e0c0b] border border-stone-900 rounded-2xl p-5 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-indigo-400" />
                {editingId ? 'Editar Miembro' : 'Agregar Miembro'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-stone-900 rounded-lg transition-colors">
                <X className="w-4 h-4 text-stone-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[10px] text-stone-400 font-medium mb-1">Nombre *</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  className="w-full bg-stone-900/50 border border-stone-900 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/30" 
                  required 
                />
              </div>
              <div>
                <label className="block text-[10px] text-stone-400 font-medium mb-1">Email *</label>
                <input 
                  type="email" 
                  value={formData.email} 
                  onChange={(e) => setFormData({...formData, email: e.target.value})} 
                  className="w-full bg-stone-900/50 border border-stone-900 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/30" 
                  required 
                />
              </div>
              <div>
                <label className="block text-[10px] text-stone-400 font-medium mb-1">Teléfono</label>
                <input 
                  type="text" 
                  value={formData.phone} 
                  onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                  className="w-full bg-stone-900/50 border border-stone-900 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/30" 
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-stone-400 font-medium mb-1">Rol</label>
                  <select 
                    value={formData.role} 
                    onChange={(e) => setFormData({...formData, role: e.target.value})} 
                    className="w-full bg-stone-900/50 border border-stone-900 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/30"
                  >
                    {roles.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-stone-400 font-medium mb-1">Especialidad</label>
                  <input 
                    type="text" 
                    value={formData.specialty} 
                    onChange={(e) => setFormData({...formData, specialty: e.target.value})} 
                    className="w-full bg-stone-900/50 border border-stone-900 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/30" 
                    placeholder="Ej: Microblading"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-stone-400 font-medium mb-1">Experiencia</label>
                <input 
                  type="text" 
                  value={formData.experience} 
                  onChange={(e) => setFormData({...formData, experience: e.target.value})} 
                  className="w-full bg-stone-900/50 border border-stone-900 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/30" 
                  placeholder="Ej: 5 años"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-stone-900">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="flex-1 px-3 py-2 bg-stone-900/50 border border-stone-900 text-stone-400 rounded-xl text-xs font-medium hover:bg-stone-900 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-3 py-2 bg-gradient-to-r from-indigo-600 to-purple-500 text-white rounded-xl text-xs font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Save className="w-3.5 h-3.5" />
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
