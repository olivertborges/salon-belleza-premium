'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useSettings } from '@/contexts/SettingsContext'
import { useAuth } from '@/hooks/useAuth'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, UserPlus, Search, Edit, Trash2, 
  Shield, UserCog, UserCheck, UserX,
  Mail, Phone, Lock, Key, RefreshCw,
  X, Check, Eye, EyeOff, Crown,
  Sparkles, Award, Star, Clock, Calendar,
  MoreVertical, Filter, ChevronDown, User
} from 'lucide-react'

type UserProfile = {
  id: string
  email: string
  nombre: string
  role: 'admin' | 'owner' | 'staff' | 'client'
  telefono: string | null
  is_active: boolean
  created_at: string
  last_sign_in_at: string | null
}

const ROLES = [
  { value: 'admin', label: 'Administrador', color: 'from-pink-500 to-rose-500', icon: Crown },
  { value: 'owner', label: 'Propietario', color: 'from-amber-500 to-orange-500', icon: Award },
  { value: 'staff', label: 'Staff', color: 'from-violet-500 to-fuchsia-500', icon: UserCog },
  { value: 'client', label: 'Cliente', color: 'from-emerald-500 to-teal-500', icon: User }
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.2 }
  }
}

export default function AdminUsuariosPage() {
  const { settings } = useSettings()
  const { tenantId } = useAuth()

  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('todos')
  const [filterStatus, setFilterStatus] = useState('todos')
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  // Formulario
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nombre: '',
    telefono: '',
    role: 'staff'
  })

  const brandGradient = {
    backgroundImage: `linear-gradient(to right, ${settings?.primary_color || '#DB5B9A'}, ${settings?.secondary_color || '#E5A46E'})`
  }

  // Cargar usuarios
  const fetchUsers = async (showLoading = true) => {
    if (!tenantId) return
    
    if (showLoading) {
      setLoading(true)
    } else {
      setRefreshing(true)
    }
    setError(null)

    try {
      // Obtener usuarios de la tabla profiles
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
      setSuccess('Usuarios cargados correctamente')
      setTimeout(() => setSuccess(null), 2000)
    } catch (err: any) {
      console.error('Error cargando usuarios:', err)
      setError(err.message || 'Error al cargar los usuarios')
      setTimeout(() => setError(null), 3000)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (tenantId) fetchUsers()
  }, [tenantId])

  // Crear usuario
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenantId) return
    setError(null)
    setSuccess(null)

    try {
      // 1. Crear usuario en Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            nombre: formData.nombre,
            telefono: formData.telefono,
            role: formData.role,
            tenant_id: tenantId
          }
        }
      })

      if (authError) throw authError

      if (authData.user) {
        // 2. Crear perfil en profiles
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: formData.email,
            nombre: formData.nombre,
            telefono: formData.telefono,
            role: formData.role,
            tenant_id: tenantId,
            is_active: true
          })

        if (profileError) throw profileError

        setSuccess(`✅ Usuario ${formData.nombre} creado como ${formData.role}`)
        setTimeout(() => setSuccess(null), 3000)
        
        setShowModal(false)
        setFormData({ email: '', password: '', nombre: '', telefono: '', role: 'staff' })
        fetchUsers(false)
      }
    } catch (err: any) {
      console.error('Error creando usuario:', err)
      setError(err.message || 'Error al crear el usuario')
      setTimeout(() => setError(null), 3000)
    }
  }

  // Editar usuario
  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return
    setError(null)
    setSuccess(null)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          nombre: formData.nombre,
          telefono: formData.telefono,
          role: formData.role
        })
        .eq('id', editingUser.id)

      if (error) throw error

      setSuccess(`✅ Usuario ${formData.nombre} actualizado`)
      setTimeout(() => setSuccess(null), 3000)
      
      setShowModal(false)
      setEditingUser(null)
      fetchUsers(false)
    } catch (err: any) {
      console.error('Error actualizando usuario:', err)
      setError(err.message || 'Error al actualizar el usuario')
      setTimeout(() => setError(null), 3000)
    }
  }

  // Cambiar estado (Activar/Desactivar)
  const toggleUserStatus = async (user: UserProfile) => {
    if (!user.id) return
    setError(null)
    setSuccess(null)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !user.is_active })
        .eq('id', user.id)

      if (error) throw error

      setSuccess(user.is_active ? '👤 Usuario desactivado' : '✅ Usuario activado')
      setTimeout(() => setSuccess(null), 2000)
      fetchUsers(false)
    } catch (err: any) {
      console.error('Error cambiando estado:', err)
      setError(err.message || 'Error al cambiar estado')
      setTimeout(() => setError(null), 3000)
    }
  }

  // Eliminar usuario (solo si es admin/owner)
  const deleteUser = async (user: UserProfile) => {
    if (!user.id) return
    
    // Prevenir eliminación de uno mismo
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (currentUser?.id === user.id) {
      setError('❌ No puedes eliminar tu propio usuario')
      setTimeout(() => setError(null), 3000)
      return
    }

    if (!confirm(`¿Estás seguro de eliminar a ${user.nombre}?`)) return
    setError(null)
    setSuccess(null)

    try {
      // Opción: Eliminar perfil (el usuario queda sin acceso)
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id)

      if (error) throw error

      setSuccess(`✅ Usuario ${user.nombre} eliminado`)
      setTimeout(() => setSuccess(null), 2000)
      fetchUsers(false)
    } catch (err: any) {
      console.error('Error eliminando usuario:', err)
      setError(err.message || 'Error al eliminar usuario')
      setTimeout(() => setError(null), 3000)
    }
  }

  // Resetear contraseña
  const resetPassword = async (email: string) => {
    if (!confirm(`¿Enviar enlace de recuperación a ${email}?`)) return
    setError(null)
    setSuccess(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (error) throw error

      setSuccess(`📧 Enlace de recuperación enviado a ${email}`)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      console.error('Error enviando recuperación:', err)
      setError(err.message || 'Error al enviar enlace')
      setTimeout(() => setError(null), 3000)
    }
  }

  // Abrir modal de edición
  const openEditModal = (user: UserProfile) => {
    setEditingUser(user)
    setFormData({
      email: user.email,
      password: '',
      nombre: user.nombre || '',
      telefono: user.telefono || '',
      role: user.role || 'client'
    })
    setShowModal(true)
  }

  // Abrir modal de creación
  const openCreateModal = () => {
    setEditingUser(null)
    setFormData({
      email: '',
      password: '',
      nombre: '',
      telefono: '',
      role: 'staff'
    })
    setShowModal(true)
  }

  // Filtros
  const filteredUsers = users.filter(user => {
    const matchSearch = 
      user.nombre?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase())
    const matchRole = filterRole === 'todos' || user.role === filterRole
    const matchStatus = filterStatus === 'todos' || 
      (filterStatus === 'activos' && user.is_active) ||
      (filterStatus === 'inactivos' && !user.is_active)
    return matchSearch && matchRole && matchStatus
  })

  // Estadísticas
  const totalUsuarios = users.length
  const totalAdmins = users.filter(u => u.role === 'admin' || u.role === 'owner').length
  const totalStaff = users.filter(u => u.role === 'staff').length
  const totalClientes = users.filter(u => u.role === 'client').length

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="relative">
          <div className="w-12 h-12 border-3 border-t-transparent rounded-full animate-spin" style={{ borderColor: settings?.primary_color || '#DB5B9A' }} />
          <div className="absolute inset-0 w-12 h-12 rounded-full animate-ping opacity-20" style={{ backgroundColor: settings?.primary_color || '#DB5B9A' }} />
        </div>
        <p className="font-mono text-xs uppercase tracking-widest animate-pulse" style={{ color: settings?.primary_color || '#DB5B9A' }}>
          Cargando usuarios...
        </p>
      </div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 p-1 max-w-7xl mx-auto"
    >

      {/* HEADER */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 200 }}
        className="relative overflow-hidden rounded-3xl p-[2px] shadow-2xl" 
        style={brandGradient}
      >
        <div className="absolute inset-0 opacity-30 animate-pulse" style={brandGradient} />
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl opacity-20" style={{ backgroundColor: settings?.primary_color || '#DB5B9A' }} />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full blur-3xl opacity-20" style={{ backgroundColor: settings?.secondary_color || '#E5A46E' }} />
        
        <div className="relative z-10 rounded-[23px] p-6 md:p-8 bg-white/95 dark:bg-[#0f0c1b]/95 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <motion.div 
                whileHover={{ rotate: -10, scale: 1.1 }}
                className="p-4 rounded-2xl text-white shadow-xl shrink-0" 
                style={{ backgroundColor: settings?.primary_color || '#DB5B9A' }}
              >
                <Shield className="w-6 h-6 md:w-7 md:h-7" />
              </motion.div>
              <div>
                <motion.p 
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-[10px] uppercase tracking-[0.3em] font-bold font-mono" 
                  style={{ color: settings?.primary_color || '#DB5B9A' }}
                >
                  👑 Control de Acceso
                </motion.p>
                <motion.h2 
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl md:text-4xl font-serif font-extrabold text-stone-900 dark:text-white mt-1"
                >
                  <span className="bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">Usuarios</span> del Sistema
                </motion.h2>
                <motion.p 
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-xs text-stone-500 dark:text-pink-100/60 mt-1"
                >
                  {totalUsuarios} usuarios • Gestiona roles y permisos
                </motion.p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-start md:self-auto">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { setRefreshing(true); fetchUsers(true) }}
                disabled={refreshing}
                className="p-2.5 rounded-xl border bg-white/50 dark:bg-[#1a1430]/40 border-pink-100/60 dark:border-fuchsia-950 text-stone-500 hover:text-pink-500 dark:hover:text-pink-400 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={openCreateModal}
                className="px-5 py-2.5 rounded-xl text-white text-xs font-bold uppercase tracking-wider shadow-lg flex items-center gap-2 transition-all"
                style={{ backgroundColor: settings?.primary_color || '#DB5B9A' }}
              >
                <UserPlus className="w-4 h-4" />
                <span className="hidden sm:inline">Nuevo Usuario</span>
                <span className="sm:hidden">+</span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* MENSAJES */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-2xl p-4 bg-gradient-to-r from-rose-500/10 to-pink-500/5 border border-rose-500/20 flex items-center gap-3 shadow-xs"
          >
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
              <X className="w-4 h-4" />
            </div>
            <p className="text-xs text-stone-700 dark:text-rose-400 font-medium min-w-0">{error}</p>
          </motion.div>
        )}

        {success && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-2xl p-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 flex items-center gap-3 shadow-xs"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <p className="text-xs text-stone-700 dark:text-emerald-400 font-medium min-w-0">{success}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* KPIS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl p-3 shadow-sm border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 flex items-center gap-3">
          <div className="p-2 rounded-xl shrink-0" style={{ backgroundColor: `${settings?.primary_color || '#DB5B9A'}10`, color: settings?.primary_color || '#DB5B9A' }}>
            <Users className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500 font-black truncate">Total</p>
            <h3 className="text-sm font-mono font-black text-stone-900 dark:text-pink-100">{totalUsuarios}</h3>
          </div>
        </div>

        <div className="rounded-2xl p-3 shadow-sm border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500 shrink-0">
            <Crown className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500 font-black truncate">Admins</p>
            <h3 className="text-sm font-mono font-black text-rose-500">{totalAdmins}</h3>
          </div>
        </div>

        <div className="rounded-2xl p-3 shadow-sm border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-violet-500/10 text-violet-500 shrink-0">
            <UserCog className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500 font-black truncate">Staff</p>
            <h3 className="text-sm font-mono font-black text-violet-500">{totalStaff}</h3>
          </div>
        </div>

        <div className="rounded-2xl p-3 shadow-sm border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
            <User className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500 font-black truncate">Clientes</p>
            <h3 className="text-sm font-mono font-black text-emerald-500">{totalClientes}</h3>
          </div>
        </div>
      </div>

      {/* FILTROS */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-3 p-3 rounded-2xl border flex-1 bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 transition-all duration-300">
          <Search className="w-4 h-4 shrink-0" style={{ color: settings?.primary_color || '#DB5B9A' }} />
          <input 
            type="text" 
            placeholder="Buscar por nombre o email..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-xs text-stone-800 dark:text-pink-100 placeholder:text-stone-400 w-full"
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

        <div className="flex items-center gap-2">
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-3 rounded-xl border bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 focus:outline-none focus:ring-2 transition-all text-xs appearance-none"
            style={{ '--tw-ring-color': settings?.primary_color || '#DB5B9A' } as React.CSSProperties}
          >
            <option value="todos">Todos los roles</option>
            {ROLES.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 rounded-xl border bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 focus:outline-none focus:ring-2 transition-all text-xs appearance-none"
            style={{ '--tw-ring-color': settings?.primary_color || '#DB5B9A' } as React.CSSProperties}
          >
            <option value="todos">Todos los estados</option>
            <option value="activos">Activos</option>
            <option value="inactivos">Inactivos</option>
          </select>
        </div>
      </div>

      {/* TABLA DE USUARIOS */}
      <div className="rounded-2xl border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-pink-100/60 dark:border-fuchsia-950/50">
              <tr className="text-left">
                <th className="px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500 font-bold">Usuario</th>
                <th className="px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500 font-bold hidden md:table-cell">Email</th>
                <th className="px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500 font-bold">Rol</th>
                <th className="px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500 font-bold hidden lg:table-cell">Estado</th>
                <th className="px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500 font-bold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-stone-400 dark:text-stone-500 text-xs">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    No se encontraron usuarios
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, index) => {
                  const roleConfig = ROLES.find(r => r.value === user.role) || ROLES[3]
                  const RoleIcon = roleConfig.icon
                  const isActive = user.is_active

                  return (
                    <motion.tr 
                      key={user.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * index }}
                      className="border-b border-pink-50/60 dark:border-fuchsia-950/30 hover:bg-pink-50/30 dark:hover:bg-fuchsia-950/10 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0 ${
                            user.role === 'admin' || user.role === 'owner' 
                              ? 'bg-gradient-to-r from-pink-500 to-rose-500' 
                              : user.role === 'staff'
                                ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500'
                                : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                          }`}>
                            {user.nombre?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-stone-800 dark:text-pink-100 truncate">
                              {user.nombre || 'Usuario'}
                            </p>
                            <p className="text-[10px] text-stone-400 dark:text-stone-500 truncate md:hidden">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs text-stone-600 dark:text-stone-400">{user.email}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider text-white bg-gradient-to-r ${roleConfig.color}`}>
                          <RoleIcon className="w-3 h-3" />
                          {roleConfig.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold ${
                          isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                          {isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => toggleUserStatus(user)}
                            className="p-1.5 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-950/20 text-stone-400 hover:text-amber-500 transition-colors"
                            title={isActive ? 'Desactivar' : 'Activar'}
                          >
                            {isActive ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => openEditModal(user)}
                            className="p-1.5 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/20 text-stone-400 hover:text-blue-500 transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => resetPassword(user.email)}
                            className="p-1.5 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-950/20 text-stone-400 hover:text-amber-500 transition-colors"
                            title="Resetear contraseña"
                          >
                            <Key className="w-3.5 h-3.5" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => deleteUser(user)}
                            className="p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20 text-stone-400 hover:text-rose-500 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE CREACIÓN/EDICIÓN */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg rounded-3xl border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 p-2 rounded-xl hover:bg-pink-50 dark:hover:bg-fuchsia-950/40 transition-colors text-stone-400 hover:text-stone-700 dark:hover:text-pink-100"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl text-white shadow-md" style={{ backgroundColor: settings?.primary_color || '#DB5B9A' }}>
                  {editingUser ? <UserCog className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                </div>
                <h3 className="text-xl font-serif font-extrabold text-stone-800 dark:text-pink-100">
                  {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                </h3>
              </div>

              <form onSubmit={editingUser ? handleEditUser : handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-stone-500 dark:text-stone-400 mb-1.5">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 focus:outline-none focus:ring-2 transition-all text-sm"
                    style={{ '--tw-ring-color': settings?.primary_color || '#DB5B9A' } as React.CSSProperties}
                    placeholder="Ej: María González"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-stone-500 dark:text-stone-400 mb-1.5">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 focus:outline-none focus:ring-2 transition-all text-sm"
                    style={{ '--tw-ring-color': settings?.primary_color || '#DB5B9A' } as React.CSSProperties}
                    placeholder="nombre@ejemplo.com"
                    required
                    disabled={!!editingUser}
                  />
                </div>

                {!editingUser && (
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-stone-500 dark:text-stone-400 mb-1.5">
                      Contraseña *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        className="w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 focus:outline-none focus:ring-2 transition-all text-sm"
                        style={{ '--tw-ring-color': settings?.primary_color || '#DB5B9A' } as React.CSSProperties}
                        placeholder="••••••••"
                        required={!editingUser}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-pink-500 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-stone-500 dark:text-stone-400 mb-1.5">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 focus:outline-none focus:ring-2 transition-all text-sm"
                    style={{ '--tw-ring-color': settings?.primary_color || '#DB5B9A' } as React.CSSProperties}
                    placeholder="11 2345 6789"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-stone-500 dark:text-stone-400 mb-1.5">
                    Rol *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 focus:outline-none focus:ring-2 transition-all text-sm appearance-none"
                    style={{ '--tw-ring-color': settings?.primary_color || '#DB5B9A' } as React.CSSProperties}
                    required
                  >
                    {ROLES.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
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
                    <Check className="w-4 h-4" />
                    {editingUser ? 'Actualizar' : 'Crear Usuario'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  )
}