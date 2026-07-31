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
      addLog("Cargando miembros del staff...")
      
      const { data, error: fetchError } = await supabase
        .from('staff')
        .select('*')
        .order('name', { ascending: true })

      if (fetchError) throw fetchError
      
      setStaff(data || [])
      addLog(`Éxito: ${data?.length || 0} profesionales cargados.`)
    } catch (err: any) {
      setError(err.message || 'Error al cargar el equipo')
      addLog(`❌ ERROR BD: ${err.message}`)
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
    setDebugLogs([])
    fetchStaff()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    addLog(`➡️ PROCESANDO: ${editingId ? 'EDICIÓN' : 'CREACIÓN'}`)

    if (!formData.name || !formData.email) {
      setError('Nombre y email requeridos.')
      return
    }

    try {
      setRefreshing(true)
      if (editingId) {
        addLog(`Ejecutando UPDATE en la BD usando ID: "${editingId}"`)
        
        // CORREGIDO: Únicamente mandamos 'name', removiendo por completo la columna 'nombre'
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

        const { data, error: updateError } = await supabase
          .from('staff')
          .update(payload)
          .eq('id', editingId)
          .select()

        if (updateError) {
          addLog(`❌ ERROR DE CONEXIÓN BD: ${updateError.message}`)
          throw updateError
        }
        
        addLog(`Respuesta: Filas devueltas por Supabase -> ${JSON.stringify(data)}`)
        
        if (!data || data.length === 0) {
          addLog("⚠️ ALERTA: 0 filas modificadas. Verifica el ID.")
        } else {
          addLog(`¡LOGRADO! Base de datos actualizada para: ${data[0].name}`)
        }

        setSuccess('¡Miembro actualizado con éxito!')
        await fetchStaff()
      } else {
        const response = await fetch('/app/api/staff/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })

        const resData = await response.json()
        if (!response.ok || !resData.success) throw new Error(resData.error || 'Error al crear.')

        setSuccess('¡Miembro creado con éxito!')
        setShowModal(false)
        await fetchStaff()
      }
    } catch (err: any) {
      setError(err.message || 'Error al guardar.')
      addLog(`❌ FALLO: ${err.message}`)
    } finally {
      setRefreshing(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar miembro?')) return
    try {
      const { error: deleteError } = await supabase.from('staff').delete().eq('id', id)
      if (deleteError) throw deleteError
      fetchStaff()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleOpenEdit = (member: StaffMember) => {
    setError(null)
    setSuccess(null)
    setDebugLogs([])
    setEditingId(member.id)
    
    addLog(`Abriendo formulario para: "${member.name}" (ID: ${member.id})`)

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
    setFormData({
      name: '', role: 'Especialista', auth_role: 'staff', email: '', password: '', phone: '', specialty: '', experience: '', avatar_url: ''
    })
    setShowModal(true)
  }

  const filtrados = staff.filter(m =>
    m.name?.toLowerCase().includes(search.toLowerCase()) || 
    m.role?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin border-[#D4AF37]"></div>
        <p className="font-mono text-xs tracking-widest text-[#D4AF37]">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-1 max-w-full overflow-x-hidden font-sans">
      
      {/* HEADER */}
      <div className={`relative overflow-hidden rounded-3xl p-[1px] shadow-xl ${isDark ? 'border border-[#3D281E]' : 'border border-[#F0E4DA]'}`}>
        <div className="absolute inset-0 opacity-20" style={brandGradient} />
        <div className={`relative z-10 rounded-[23px] p-5 flex flex-col sm:flex-row items-center justify-between gap-4 ${isDark ? 'bg-[#1E120C]' : 'bg-[#FFF9F6]'}`}>
          <div>
            <h2 className={`text-xl font-serif font-extrabold ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>Staff Premium</h2>
            <p className={`text-xs ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>Gestión del equipo ({staff.length})</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleRefresh} className="px-3 py-2 rounded-xl border text-xs font-semibold text-[#D4AF37] cursor-pointer">Act.</button>
            <button onClick={handleOpenCreate} className="px-3 py-2 rounded-xl text-[#1A0E0A] text-xs font-semibold cursor-pointer" style={brandGradient}>+ Agregar</button>
          </div>
        </div>
      </div>

      {/* SEARCH */}
      <div className={`flex items-center gap-3 p-3 rounded-2xl border ${isDark ? 'bg-[#1E120C] border-[#3D281E]' : 'bg-white border-[#F0E4DA]'}`}>
        <Search className="w-4 h-4 text-[#D4AF37]" />
        <input 
          placeholder="Buscar..." 
          className="w-full bg-transparent outline-none text-sm text-[#FFF9F6]"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* ALERTAS */}
      {error && <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 rounded-2xl">{error}</div>}
      {success && <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 rounded-2xl">{success}</div>}

      {/* GRID CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtrados.map((member) => (
          <div key={member.id} className={`rounded-2xl p-4 border relative ${isDark ? 'bg-[#1E120C] border-[#3D281E]' : 'bg-white border-[#F0E4DA]'}`}>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-sm text-[#FFF9F6]">{member.name || 'Sin nombre'}</h3>
                <span className="text-[9px] uppercase font-bold text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded-full">{member.role}</span>
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleOpenEdit(member)} className="p-1.5 text-zinc-400 hover:text-white cursor-pointer"><Edit className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(member.id)} className="p-1.5 text-zinc-400 hover:text-rose-400 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="mt-2 text-xs text-zinc-400 space-y-1">
              <p className="truncate">✉️ {member.email}</p>
              <p>📞 {member.phone || 'Sin Teléfono'}</p>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL EDITAR */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-lg rounded-2xl p-6 max-h-[90vh] overflow-y-auto border ${isDark ? 'bg-[#1E120C] border-[#3D281E]' : 'bg-[#FFF9F6]'}`}>
            
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-serif font-bold text-[#FFF9F6]">
                {editingId ? 'Editar Profesional' : 'Nuevo Profesional'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-zinc-400 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-zinc-400 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 rounded-xl bg-[#2A1B14] border border-[#3D281E] text-white text-sm outline-none focus:border-[#D4AF37]"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-zinc-400 mb-1">Email</label>
                <input
                  type="email"
                  className="w-full px-4 py-2 rounded-xl bg-[#2A1B14] border border-[#3D281E] text-white text-sm outline-none"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-zinc-400 mb-1">Teléfono</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 rounded-xl bg-[#2A1B14] border border-[#3D281E] text-white text-sm outline-none"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>

              {/* TERMINAL DE LOGS VISUALES */}
              <div className="rounded-xl border border-zinc-700 bg-black p-3 font-mono text-[10px] text-emerald-400">
                <div className="flex items-center gap-1.5 border-b border-zinc-800 pb-1.5 mb-2 text-zinc-500 font-bold">
                  <Terminal className="w-3.5 h-3.5 text-[#D4AF37]" /> TERMINAL DE RASTREO MÓVIL
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1 select-text">
                  {debugLogs.map((log, i) => (
                    <div key={i} className="whitespace-pre-wrap break-all border-b border-zinc-900 pb-0.5">{log}</div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 rounded-xl border border-[#3D281E] text-zinc-400 text-xs font-bold uppercase tracking-widest cursor-pointer"
                >
                  Cerrar Ventana
                </button>
                <button
                  type="submit"
                  disabled={refreshing}
                  className="flex-1 px-4 py-2 rounded-xl text-[#1A0E0A] text-xs font-bold uppercase tracking-widest cursor-pointer"
                  style={brandGradient}
                >
                  {refreshing ? 'Guardando...' : 'Aplicar Cambios'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  )
}
