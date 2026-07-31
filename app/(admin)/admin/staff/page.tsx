// @ts-nocheck
'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useTheme } from '@/contexts/ThemeContext'
import { 
  Users, Plus, Search, Edit, Trash2, 
  Mail, Phone, X, Save, UserPlus, Eye, EyeOff,
  Award, Tag, RefreshCw, CheckCircle, AlertTriangle, ShieldCheck, Terminal
} from 'lucide-react'

interface StaffMember {
  id: string
  user_id?: string
  name: string
  role: string
  auth_role: string
  email: string
  phone: string
  avatar_url: string
  specialty: string
  experience: string
  created_at?: string
}

export default function StaffPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  // ESTADO PARA LOGS VISUALES EN EL TELÉFONO
  const [debugLogs, setDebugLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setDebugLogs(prev => [`[${timestamp}] ${message}`, ...prev])
  }

  const [formData, setFormData] = useState({
    name: '',
    role: 'Especialista',
    auth_role: 'staff', 
    email: '',
    password: '',       
    phone: '',
    specialty: '',
    experience: '',
    avatar_url: ''
  })

  const roles = ['Especialista', 'Senior', 'Master', 'Directora', 'Asistente']
  const systemRoles = [
    { value: 'staff', label: 'Staff (Ingresa a Gestión)' },
    { value: 'admin', label: 'Administrador (Control Total)' }
  ]

  const brandGradient = {
    backgroundImage: 'linear-gradient(to right, #D4AF37, #E8D5A0)'
  }

  const fetchStaff = async () => {
    try {
      setLoading(true)
      setError(null)
      addLog("Iniciando carga de miembros de la base de datos...")
      
      const { data, error: fetchError } = await supabase
        .from('staff')
        .select('*')
        .order('name', { ascending: true })

      if (fetchError) throw fetchError
      
      setStaff(data || [])
      addLog(`Carga exitosa: ${data?.length || 0} miembros encontrados.`)
    } catch (err: any) {
      console.error('Error fetching staff:', err)
      setError(err.message || 'Error al cargar el equipo')
      addLog(`❌ ERROR AL CARGAR BD: ${err.message}`)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { 
    fetchStaff() 
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    setDebugLogs([]) // Limpia logs viejos
    addLog("Refrescando datos manual...")
    fetchStaff()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    addLog(`➡️ INTENTO DE GUARDAR INICIADO. Tipo: ${editingId ? 'EDICIÓN' : 'CREACIÓN'}`)
    addLog(`Datos formulario -> Name: "${formData.name}", Email: "${formData.email}", Phone: "${formData.phone}"`)

    if (!formData.name || !formData.email) {
      setError('El nombre y el email son obligatorios.')
      addLog("❌ VALIDACIÓN FALLIDA: Falta nombre o email.")
      return
    }

    try {
      setRefreshing(true)
      if (editingId) {
        addLog(`Ejecutando UPDATE en Supabase para el registro con id de tabla: "${editingId}"`)
        
        const payload = {
          name: formData.name.trim(),
          role: formData.role,
          auth_role: formData.auth_role,
          email: formData.email.trim(),
          phone: formData.phone.trim(), 
          specialty: formData.specialty.trim(),
          experience: formData.experience ? String(formData.experience) : '',
          avatar_url: formData.avatar_url.trim()
        }
        
        addLog(`Objeto enviado a la BD: ${JSON.stringify(payload)}`)

        const { data, count, error: updateError } = await supabase
          .from('staff')
          .update(payload)
          .eq('id', editingId)
          .select() // Forzamos retorno para ver si Supabase realmente modificó algo

        if (updateError) {
          addLog(`❌ SUPABASE ERROR DETECTADO: ${updateError.message} (Código: ${updateError.code})`)
          throw updateError
        }
        
        addLog(`Respuesta Supabase -> Datos devueltos: ${JSON.stringify(data)}`)
        
        if (!data || data.length === 0) {
          addLog("⚠️ ADVERTENCIA CRÍTICA: Supabase respondió éxito, ¡pero devolvió 0 filas afectadas! Esto suele ser problema de RLS o porque el ID no existe en la BD.")
        } else {
          addLog(`¡Éxito total! Fila actualizada correctamente en la BD: ${data[0].name}`)
        }

        setSuccess('Miembro actualizado correctamente.')
      } else {
        addLog("Enviando petición a la API interna para crear nuevo usuario Auth + Base de datos...")
        const response = await fetch('/app/api/staff/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })

        const resData = await response.json()
        addLog(`Respuesta API /create: ${JSON.stringify(resData)}`)

        if (!response.ok || !resData.success) {
          throw new Error(resData.error || 'No se pudo crear el staff.')
        }

        setSuccess('¡Miembro del Staff creado con éxito!')
      }

      // Dejamos el modal abierto un segundo si hay logs críticos para que dé tiempo a leerlos en el teléfono
      setTimeout(async () => {
        setShowModal(false)
        setEditingId(null)
        await fetchStaff() 
      }, 1500)

    } catch (err: any) {
      console.error('Error in handleSubmit:', err)
      setError(err.message || 'Error al guardar el registro.')
      addLog(`❌ EXCEPCIÓN CAPTURADA: ${err.message}`)
    } finally {
      setRefreshing(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás segura de eliminar permanentemente a este miembro?')) return

    try {
      setError(null)
      setSuccess(null)
      addLog(`Eliminando miembro con ID: ${id}`)

      const { error: deleteError } = await supabase
        .from('staff')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      setSuccess('Miembro eliminado correctamente.')
      addLog("Miembro eliminado con éxito.")
      fetchStaff()
    } catch (err: any) {
      addLog(`❌ ERROR AL ELIMINAR: ${err.message}`)
      setError(err.message || 'No se pudo eliminar el registro.')
    }
  }

  const handleOpenEdit = (member: StaffMember) => {
    setError(null)
    setSuccess(null)
    setDebugLogs([])
    setEditingId(member.id)
    
    addLog(`Cargando formulario de edición para: "${member.name}"`)
    addLog(`Valores recibidos de la lista -> ID Interno: "${member.id}", User_ID Auth: "${member.user_id || 'N/A'}", Email: "${member.email}", Phone: "${member.phone}"`)

    setFormData({
      name: member.name || '',
      role: member.role || 'Especialista',
      auth_role: member.auth_role || 'staff',
      email: member.email || '',
      password: '', 
      phone: member.phone || '',
      specialty: member.specialty || '',
      experience: member.experience ? String(member.experience) : '',
      avatar_url: member.avatar_url || ''
    })
    setShowModal(true)
  }

  const handleOpenCreate = () => {
    setError(null)
    setSuccess(null)
    setDebugLogs([])
    setEditingId(null)
    addLog("Abriendo formulario para NUEVO miembro.")
    setFormData({
      name: '',
      role: 'Especialista',
      auth_role: 'staff',
      email: '',
      password: '',
      phone: '',
      specialty: '',
      experience: '',
      avatar_url: ''
    })
    setShowModal(true)
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
          <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mx-auto border-[#D4AF37]"></div>
          <p className="font-mono text-xs uppercase tracking-widest animate-pulse text-[#D4AF37]">
            Cargando equipo...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-1 max-w-full overflow-x-hidden font-sans">

      {/* HEADER */}
      <div className={`relative overflow-hidden rounded-3xl p-[1px] shadow-xl ${
        isDark ? 'border border-[#3D281E]' : 'border border-[#F0E4DA]'
      }`}>
        <div className="absolute inset-0 opacity-20 animate-pulse" style={brandGradient} />
        <div className={`relative z-10 rounded-[23px] p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          isDark ? 'bg-[#1E120C]' : 'bg-[#FFF9F6]'
        }`}>
          <div className="flex items-center gap-4 min-w-0">
            <div className="p-3.5 rounded-2xl text-[#1A0E0A] shadow-md shrink-0" style={brandGradient}>
              <Users className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-widest font-bold font-mono text-[#D4AF37] truncate">
                ✨ Fresh Nails Studio Center
              </p>
              <h2 className={`text-xl md:text-2xl font-serif font-extrabold mt-0.5 truncate ${
                isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'
              }`}>
                Staff Premium
              </h2>
              <p className={`text-xs mt-0.5 truncate ${
                isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
              }`}>
                Gestión de profesionales de {staff.length} miembros.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto w-full md:w-auto justify-end">
            <button 
              type="button"
              onClick={handleRefresh} 
              disabled={refreshing} 
              className={`px-3 py-2 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-semibold shrink-0 cursor-pointer ${
                isDark 
                  ? 'bg-[#2A1B14] border-[#3D281E] text-[#D4AF37] hover:bg-[#3D281E]' 
                  : 'bg-white border-[#F0E4DA] text-[#D4AF37] hover:bg-[#FFF9F6]'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{refreshing ? 'Cargando...' : 'Actualizar'}</span>
              <span className="sm:hidden">{refreshing ? '...' : 'Act.'}</span>
            </button>
            <button 
              type="button"
              onClick={handleOpenCreate}
              className="px-3 py-2 rounded-xl text-[#1A0E0A] hover:scale-105 transition-all flex items-center gap-1.5 text-xs font-semibold shrink-0 shadow-md shadow-[#D4AF37]/20 cursor-pointer"
              style={brandGradient}
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Agregar</span>
              <span className="sm:hidden">+</span>
            </button>
          </div>
        </div>
      </div>

      {/* SEARCH */}
      <div className={`flex items-center gap-3 p-3 rounded-2xl border min-w-0 ${
        isDark ? 'bg-[#1E120C] border-[#3D281E]' : 'bg-white border-[#F0E4DA]'
      }`}>
        <Search className="w-4 h-4 shrink-0 text-[#D4AF37]" />
        <input 
          placeholder="Buscar por nombre, rol o especialidad..." 
          className={`w-full bg-transparent outline-none text-sm min-w-0 ${
            isDark ? 'text-[#FFF9F6] placeholder:text-[#A89588]/50' : 'text-[#1A0E0A] placeholder:text-[#5C4A3E]/50'
          }`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button 
            type="button"
            onClick={() => setSearch('')}
            className={`p-1 rounded-lg transition-colors shrink-0 cursor-pointer ${
              isDark ? 'hover:bg-[#3D281E] text-[#A89588]' : 'hover:bg-[#F0E4DA] text-[#5C4A3E]'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* MENSAJES DE ERROR / ÉXITO */}
      {error && (
        <div className="rounded-2xl p-4 bg-gradient-to-r from-rose-500/10 to-transparent border border-rose-500/20 flex items-center gap-3 shadow-sm">
          <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <p className="text-xs text-rose-400 font-medium min-w-0">{error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-2xl p-4 bg-gradient-to-r from-emerald-500/10 to-transparent border border-emerald-500/20 flex items-center gap-3 shadow-sm">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <CheckCircle className="w-4 h-4" />
          </div>
          <p className="text-xs text-emerald-400 font-medium min-w-0">{success}</p>
        </div>
      )}

      {/* GRID DE STAFF */}
      {filtrados.length === 0 ? (
        <div className={`rounded-2xl p-12 text-center border border-dashed ${
          isDark ? 'bg-[#1E120C] border-[#3D281E]' : 'bg-white border-[#F0E4DA]'
        }`}>
          <Users className="w-10 h-10 mx-auto mb-3 text-[#D4AF37] opacity-30" />
          <p className={`text-xs font-medium ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>No se encontraron miembros</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtrados.map((member) => (
            <div 
              key={member.id}
              className={`rounded-2xl p-4 shadow-sm hover:-translate-y-1 transition-all group relative overflow-hidden border min-w-0 ${
                isDark ? 'bg-[#1E120C] border-[#3D281E]' : 'bg-white border-[#F0E4DA]'
              }`}
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-[#D4AF37]/5 to-transparent rounded-bl-full" />
              
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className={`font-bold truncate text-sm ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>{member.name}</h3>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    <span className="inline-block text-[9px] uppercase font-bold px-2 py-0.5 rounded-full text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/20">
                      {member.role}
                    </span>
                    <span className={`inline-block text-[9px] uppercase font-bold px-2 py-0.5 rounded-full ${
                      member.auth_role === 'admin' 
                        ? 'text-purple-400 bg-purple-500/10 border border-purple-500/20' 
                        : 'text-blue-400 bg-blue-500/10 border border-blue-500/20'
                    }`}>
                      🔑 {member.auth_role || 'staff'}
                    </span>
                  </div>
                  {member.specialty && (
                    <p className={`text-[11px] mt-2 flex items-center gap-1.5 truncate ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>
                      <Tag className="w-3 h-3 shrink-0 text-[#D4AF37]" />
                      {member.specialty}
                    </p>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button 
                    type="button"
                    onClick={() => handleOpenEdit(member)} 
                    className={`p-2 rounded-lg transition-colors cursor-pointer z-10 ${
                      isDark ? 'text-[#A89588] hover:text-[#FFF9F6] hover:bg-[#3D281E]' : 'text-[#5C4A3E] hover:text-[#1A0E0A] hover:bg-[#F0E4DA]'
                    }`}
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleDelete(member.id)} 
                    className={`p-2 rounded-lg transition-colors cursor-pointer z-10 ${
                      isDark ? 'text-[#A89588] hover:text-rose-400 hover:bg-rose-950/30' : 'text-[#5C4A3E] hover:text-rose-500 hover:bg-rose-50'
                    }`}
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className={`mt-3 space-y-1.5 text-xs ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>
                <p className="flex items-center gap-2 truncate">
                  <Mail className="w-3 h-3 shrink-0 text-[#D4AF37]" />
                  <span className="truncate">{member.email}</span>
                </p>
                {member.phone && (
                  <p className="flex items-center gap-2 truncate">
                    <Phone className="w-3 h-3 shrink-0 text-[#D4AF37]" />
                    <span className="truncate">{member.phone}</span>
                  </p>
                )}
                {member.experience && (
                  <p className="flex items-center gap-2">
                    <Award className="w-3 h-3 shrink-0 text-[#D4AF37]" />
                    {member.experience} años de experiencia
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL CREAR / EDITAR */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`relative w-full max-w-lg rounded-2xl shadow-2xl border p-6 max-h-[90vh] overflow-y-auto ${
            isDark ? 'bg-[#1E120C] border-[#3D281E]' : 'bg-[#FFF9F6] border-[#F0E4DA]'
          }`}>
            <button 
              type="button"
              onClick={() => setShowModal(false)}
              className={`absolute top-4 right-4 p-2 rounded-xl transition-colors cursor-pointer ${
                isDark ? 'text-[#A89588] hover:text-[#FFF9F6] hover:bg-[#3D281E]' : 'text-[#5C4A3E] hover:text-[#1A0E0A] hover:bg-[#F0E4DA]'
              }`}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl text-[#1A0E0A] shadow-md" style={brandGradient}>
                <UserPlus className="w-5 h-5" />
              </div>
              <h3 className={`text-xl font-serif font-extrabold ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>
                {editingId ? 'Editar Miembro' : 'Nuevo Miembro Premium'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={`block text-[10px] uppercase tracking-widest font-bold mb-1.5 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>
                  Nombre *
                </label>
                <input
                  type="text"
                  className={`w-full px-4 py-2.5 rounded-xl border outline-none focus:ring-2 focus:ring-[#D4AF37] transition-all text-sm ${
                    isDark ? 'bg-[#2A1B14] border-[#3D281E] text-[#FFF9F6]' : 'bg-white border-[#F0E4DA] text-[#1A0E0A]'
                  }`}
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>

              <div>
                <label className={`block text-[10px] uppercase tracking-widest font-bold mb-1.5 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>
                  Email *
                </label>
                <input
                  type="email"
                  className={`w-full px-4 py-2.5 rounded-xl border outline-none focus:ring-2 focus:ring-[#D4AF37] transition-all text-sm ${
                    isDark ? 'bg-[#2A1B14] border-[#3D281E] text-[#FFF9F6]' : 'bg-white border-[#F0E4DA] text-[#1A0E0A]'
                  }`}
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>

              {!editingId && (
                <div>
                  <label className={`block text-[10px] uppercase tracking-widest font-bold mb-1.5 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>
                    Contraseña de Acceso *
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type={showPassword ? "text" : "password"}
                      className={`w-full px-4 py-2.5 rounded-xl border outline-none focus:ring-2 focus:ring-[#D4AF37] transition-all text-sm ${
                        isDark ? 'bg-[#2A1B14] border-[#3D281E] text-[#FFF9F6]' : 'bg-white border-[#F0E4DA] text-[#1A0E0A]'
                      }`}
                      placeholder="Mínimo 6 caracteres"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      required={!editingId}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 text-[#A89588] hover:text-[#D4AF37] transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className={`block text-[10px] uppercase tracking-widest font-bold mb-1.5 flex items-center gap-1 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>
                  <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" /> Nivel de Acceso al Sistema
                </label>
                <select
                  className={`w-full px-4 py-2.5 rounded-xl border outline-none focus:ring-2 focus:ring-[#D4AF37] transition-all text-sm appearance-none cursor-pointer ${
                    isDark ? 'bg-[#2A1B14] border-[#3D281E] text-[#FFF9F6]' : 'bg-white border-[#F0E4DA] text-[#1A0E0A]'
                  }`}
                  value={formData.auth_role}
                  onChange={(e) => setFormData({...formData, auth_role: e.target.value})}
                >
                  {systemRoles.map(sr => <option key={sr.value} value={sr.value}>{sr.label}</option>)}
                </select>
              </div>

              <div>
                <label className={`block text-[10px] uppercase tracking-widest font-bold mb-1.5 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>
                  Puesto / Cargo en el Salón
                </label>
                <select
                  className={`w-full px-4 py-2.5 rounded-xl border outline-none focus:ring-2 focus:ring-[#D4AF37] transition-all text-sm appearance-none cursor-pointer ${
                    isDark ? 'bg-[#2A1B14] border-[#3D281E] text-[#FFF9F6]' : 'bg-white border-[#F0E4DA] text-[#1A0E0A]'
                  }`}
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                >
                  {roles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div>
                <label className={`block text-[10px] uppercase tracking-widest font-bold mb-1.5 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>
                  Teléfono
                </label>
                <input
                  type="tel"
                  className={`w-full px-4 py-2.5 rounded-xl border outline-none focus:ring-2 focus:ring-[#D4AF37] transition-all text-sm ${
                    isDark ? 'bg-[#2A1B14] border-[#3D281E] text-[#FFF9F6]' : 'bg-white border-[#F0E4DA] text-[#1A0E0A]'
                  }`}
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>

              <div>
                <label className={`block text-[10px] uppercase tracking-widest font-bold mb-1.5 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>
                  Especialidad
                </label>
                <input
                  type="text"
                  className={`w-full px-4 py-2.5 rounded-xl border outline-none focus:ring-2 focus:ring-[#D4AF37] transition-all text-sm ${
                    isDark ? 'bg-[#2A1B14] border-[#3D281E] text-[#FFF9F6]' : 'bg-white border-[#F0E4DA] text-[#1A0E0A]'
                  }`}
                  value={formData.specialty}
                  onChange={(e) => setFormData({...formData, specialty: e.target.value})}
                />
              </div>

              <div>
                <label className={`block text-[10px] uppercase tracking-widest font-bold mb-1.5 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>
                  Años de experiencia
                </label>
                <input
                  type="number"
                  className={`w-full px-4 py-2.5 rounded-xl border outline-none focus:ring-2 focus:ring-[#D4AF37] transition-all text-sm ${
                    isDark ? 'bg-[#2A1B14] border-[#3D281E] text-[#FFF9F6]' : 'bg-white border-[#F0E4DA] text-[#1A0E0A]'
                  }`}
                  value={formData.experience}
                  onChange={(e) => setFormData({...formData, experience: e.target.value})}
                />
              </div>

              {/* PANTALLA DE CONTROL LOG INTERNA (SÚPER ÚTIL PARA EL TELÉFONO) */}
              <div className="mt-4 rounded-xl border border-zinc-700 bg-black p-3 font-mono text-[10px] text-emerald-400 shadow-inner">
                <div className="flex items-center gap-1.5 border-b border-zinc-800 pb-1.5 mb-2 text-zinc-400 font-bold uppercase tracking-widest">
                  <Terminal className="w-3.5 h-3.5 text-[#D4AF37]" /> Terminal de Depuración Móvil
                </div>
                <div className="max-h-36 overflow-y-auto space-y-1 select-text">
                  {debugLogs.length === 0 ? (
                    <span className="text-zinc-600 animate-pulse">Esperando acciones para analizar...</span>
                  ) : (
                    debugLogs.map((log, index) => (
                      <div key={index} className="leading-relaxed whitespace-pre-wrap break-all border-b border-zinc-900/50 pb-0.5">
                        {log}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className={`flex-1 px-4 py-2.5 rounded-xl border transition-all text-xs font-bold uppercase tracking-widest cursor-pointer ${
                    isDark ? 'border-[#3D281E] text-[#A89588] hover:bg-[#3D281E]' : 'border-[#F0E4DA] text-[#5C4A3E] hover:bg-[#F0E4DA]'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 rounded-xl text-[#1A0E0A] hover:scale-105 transition-all text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 shadow-md shadow-[#D4AF37]/20 cursor-pointer"
                  style={brandGradient}
                >
                  <Save className="w-4 h-4" />
                  {editingId ? 'Actualizar' : 'Guardar y Vincular'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
