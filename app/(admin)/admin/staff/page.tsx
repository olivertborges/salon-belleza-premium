'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { 
  Users, 
  UserPlus, 
  Search, 
  Edit, 
  Trash2, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Mail, 
  Phone, 
  Award, 
  Sparkles,
  ShieldCheck,
  RefreshCw
} from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface StaffMember {
  id: string
  user_id: string
  name: string
  role: string
  auth_role: 'admin' | 'staff'
  email: string
  phone: string
  specialty: string
  experience: string
  avatar_url: string
}

export default function StaffManagement() {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  
  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null)

  // Notificaciones
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Formulario
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Especialista',
    auth_role: 'staff' as 'admin' | 'staff',
    phone: '',
    specialty: '',
    experience: '',
    avatar_url: ''
  })

  useEffect(() => {
    fetchStaff()
  }, [])

  const fetchStaff = async () => {
    try {
      setRefreshing(true)
      setError(null)
      const { data, error: fetchError } = await supabase
        .from('staff')
        .select('*')
        .order('name', { ascending: true })

      if (fetchError) throw fetchError
      setStaff(data || [])
    } catch (err: any) {
      console.error('Error fetching staff:', err)
      setError('Error al cargar el personal. Revisa tu conexión.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleOpenModal = (member?: StaffMember) => {
    setError(null)
    setSuccess(null)
    if (member) {
      setEditingStaff(member)
      setFormData({
        name: member.name || '',
        email: member.email || '',
        password: '', // No se solicita clave en modo edición
        role: member.role || 'Especialista',
        auth_role: member.auth_role || 'staff',
        phone: member.phone || '',
        specialty: member.specialty || '',
        experience: member.experience || '',
        avatar_url: member.avatar_url || ''
      })
    } else {
      setEditingStaff(null)
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'Especialista',
        auth_role: 'staff',
        phone: '',
        specialty: '',
        experience: '',
        avatar_url: ''
      })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    try {
      if (editingStaff) {
        // Modo Edición: Actualización en la tabla staff
        const { error: updateError } = await supabase
          .from('staff')
          .update({
            name: formData.name.trim(),
            role: formData.role,
            auth_role: formData.auth_role,
            email: formData.email.trim().toLowerCase(),
            phone: formData.phone.trim(),
            specialty: formData.specialty.trim(),
            experience: formData.experience ? String(formData.experience) : '',
            avatar_url: formData.avatar_url.trim()
          })
          .eq('id', editingStaff.id)

        if (updateError) throw updateError

        // Mantener sincronizado profiles
        if (editingStaff.user_id) {
          await supabase
            .from('profiles')
            .update({
              full_name: formData.name.trim(),
              email: formData.email.trim().toLowerCase(),
              role: formData.auth_role,
              avatar_url: formData.avatar_url.trim(),
              updated_at: new Date().toISOString()
            })
            .eq('id', editingStaff.user_id)
        }

        setSuccess('Miembro actualizado correctamente.')
      } else {
        // Modo Creación: Petición enviada al API Route (/api/staff/create)
        if (!formData.password) {
          throw new Error('La contraseña es obligatoria para nuevos miembros.')
        }

        const response = await fetch('/api/staff/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })

        const resData = await response.json()

        if (!response.ok || !resData.success) {
          throw new Error(resData.error || 'No se pudo crear el miembro del equipo.')
        }

        setSuccess('Miembro creado y registrado con éxito.')
      }

      setIsModalOpen(false)
      fetchStaff()
    } catch (err: any) {
      console.error('Error submitting form:', err)
      setError(err.message || 'Ocurrió un error al procesar la solicitud.')
    }
  }

  // Eliminación mediante el API Route seguro para limpiar Auth y tablas públicas
  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás segura de eliminar permanentemente a este miembro y su cuenta de acceso?')) return

    try {
      setError(null)
      setSuccess(null)
      setRefreshing(true)

      const response = await fetch('/api/staff/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })

      const resData = await response.json()

      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'Ocurrió un error al eliminar el miembro.')
      }

      setSuccess('Miembro y credenciales eliminados con éxito.')
      fetchStaff()
    } catch (err: any) {
      console.error('Error in handleDelete:', err)
      setError(err.message || 'Error al intentar eliminar el registro.')
    } finally {
      setRefreshing(false)
    }
  }

  // Filtrado de búsquedas
  const filteredStaff = staff.filter((member) => {
    const matchesSearch = 
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.specialty.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRole = roleFilter === 'all' || member.auth_role === roleFilter
    return matchesSearch && matchesRole
  })

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      
      {/* ================= HERO SELECTION (Estilo Dashboard) ================= */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 p-8 text-white shadow-2xl">
        {/* Glow & Accents */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> Gestión de Talento
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Equipo & Personal <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Especializado</span>
            </h1>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Administra el acceso, roles, perfiles y especialidades de los profesionales de tu centro desde un solo panel.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => fetchStaff()}
              disabled={refreshing}
              className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700/80 text-slate-300 transition-all border border-slate-700/60 disabled:opacity-50"
              title="Actualizar datos"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => handleOpenModal()}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <UserPlus className="w-5 h-5" />
              Nuevo Miembro
            </button>
          </div>
        </div>

        {/* Métricas Rápidas integradas en el Hero */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-800/40 backdrop-blur border border-slate-700/40 rounded-2xl p-4">
            <div className="text-2xl font-bold text-white">{staff.length}</div>
            <div className="text-xs text-slate-400 font-medium">Total Equipo</div>
          </div>
          <div className="bg-slate-800/40 backdrop-blur border border-slate-700/40 rounded-2xl p-4">
            <div className="text-2xl font-bold text-indigo-400">
              {staff.filter(s => s.auth_role === 'admin').length}
            </div>
            <div className="text-xs text-slate-400 font-medium">Administradores</div>
          </div>
          <div className="bg-slate-800/40 backdrop-blur border border-slate-700/40 rounded-2xl p-4 col-span-2 sm:col-span-1">
            <div className="text-2xl font-bold text-purple-400">
              {staff.filter(s => s.auth_role === 'staff').length}
            </div>
            <div className="text-xs text-slate-400 font-medium">Especialistas / Staff</div>
          </div>
        </div>
      </div>

      {/* ================= BARRA DE ALERTAS ================= */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 text-red-600 rounded-2xl">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-2xl">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{success}</p>
        </div>
      )}

      {/* ================= FILTROS Y BÚSQUEDA ================= */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, email o especialidad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          >
            <option value="all">Todos los roles</option>
            <option value="admin">Administrador</option>
            <option value="staff">Staff / Especialista</option>
          </select>
        </div>
      </div>

      {/* ================= TARJETAS / LISTADO ================= */}
      {loading ? (
        <div className="text-center py-16 text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-indigo-500" />
          Cargando el equipo...
        </div>
      ) : filteredStaff.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 border border-slate-200/80 rounded-3xl">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-slate-700 font-semibold text-lg">No se encontraron miembros</h3>
          <p className="text-slate-400 text-sm max-w-sm mx-auto mt-1">
            Intenta ajustar los parámetros de búsqueda o registra un nuevo profesional.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStaff.map((member) => (
            <div
              key={member.id}
              className="bg-white border border-slate-200/80 rounded-3xl p-6 hover:shadow-xl hover:shadow-slate-100 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    {member.avatar_url ? (
                      <img
                        src={member.avatar_url}
                        alt={member.name}
                        className="w-12 h-12 rounded-2xl object-cover border border-slate-100"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg">
                        {member.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {member.name}
                      </h3>
                      <span className="text-xs text-slate-500 font-medium">
                        {member.role || 'Especialista'}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                      member.auth_role === 'admin'
                        ? 'bg-amber-50 border border-amber-200 text-amber-700'
                        : 'bg-indigo-50 border border-indigo-100 text-indigo-700'
                    }`}
                  >
                    <ShieldCheck className="w-3 h-3" />
                    {member.auth_role === 'admin' ? 'Admin' : 'Staff'}
                  </span>
                </div>

                <div className="space-y-2.5 text-xs text-slate-600 mt-4 border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate">{member.email}</span>
                  </div>
                  {member.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{member.phone}</span>
                    </div>
                  )}
                  {member.specialty && (
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{member.specialty}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-6 mt-6 border-t border-slate-100">
                <button
                  onClick={() => handleOpenModal(member)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-all"
                >
                  <Edit className="w-3.5 h-3.5 text-slate-500" />
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(member.id)}
                  className="inline-flex items-center justify-center p-2 rounded-xl border border-red-100 bg-red-50/50 hover:bg-red-50 text-red-600 transition-all"
                  title="Eliminar registro"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================= MODAL CREAR / EDITAR ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">
                {editingStaff ? 'Editar Miembro' : 'Nuevo Miembro del Equipo'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="Ej: Dra. María López"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    placeholder="maria@ejemplo.com"
                  />
                </div>

                {!editingStaff && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Contraseña *</label>
                    <input
                      type="password"
                      required={!editingStaff}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      placeholder="••••••••"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Puesto / Título</label>
                  <input
                    type="text"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    placeholder="Ej: Odontóloga"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Rol de Acceso *</label>
                  <select
                    value={formData.auth_role}
                    onChange={(e) => setFormData({ ...formData, auth_role: e.target.value as 'admin' | 'staff' })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                  >
                    <option value="staff">Staff (Especialista)</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    placeholder="+54 11 ..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Especialidad</label>
                  <input
                    type="text"
                    value={formData.specialty}
                    onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    placeholder="Ortodoncia, Estética..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">URL Avatar (Opcional)</label>
                <input
                  type="url"
                  value={formData.avatar_url}
                  onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="https://..."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all"
                >
                  {editingStaff ? 'Guardar Cambios' : 'Crear Miembro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
