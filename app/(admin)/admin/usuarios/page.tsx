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
  Filter, User, MoreVertical, Gift, Bug
} from 'lucide-react'

type UserProfile = {
  id: string
  tenant_id: string | null
  email: string
  full_name: string | null
  phone: string | null
  avatar_url: string | null
  role: 'admin' | 'owner' | 'staff' | 'client'
  loyalty_points: number
  level: string
  referral_code: string | null
  referred_by: string | null
  preferences: any
  is_active: boolean
  created_at: string
  updated_at: string
}

const ROLES = [
  { value: 'admin', label: 'Administrador', color: 'from-pink-500 to-rose-500', icon: Crown },
  { value: 'owner', label: 'Propietario', color: 'from-amber-500 to-orange-500', icon: Award },
  { value: 'staff', label: 'Staff', color: 'from-violet-500 to-fuchsia-500', icon: UserCog },
  { value: 'client', label: 'Cliente', color: 'from-emerald-500 to-teal-500', icon: User }
]

const LEVELS = [
  { value: 'bronze', label: 'Bronce', color: 'from-amber-600 to-amber-400' },
  { value: 'silver', label: 'Plata', color: 'from-gray-400 to-gray-300' },
  { value: 'gold', label: 'Oro', color: 'from-yellow-500 to-yellow-300' }
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
  const { tenantId, user, role } = useAuth()

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
  const [debugLogs, setDebugLogs] = useState<string[]>([])
  const [showDebug, setShowDebug] = useState(true)

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    role: 'staff',
    level: 'bronze'
  })

  const brandGradient = {
    backgroundImage: `linear-gradient(to right, ${settings?.primary_color || '#DB5B9A'}, ${settings?.secondary_color || '#E5A46E'})`
  }

  // Función para agregar logs
  const addDebugLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    const emoji = type === 'success' ? '✅' : type === 'error' ? '❌' : '🔍'
    setDebugLogs(prev => [`${emoji} [${timestamp}] ${message}`, ...prev].slice(0, 30))
  }

  // ============================================================
  // 1. CARGAR USUARIOS
  // ============================================================
  const fetchUsers = async (showLoading = true) => {
    if (showLoading) setLoading(true)
    else setRefreshing(true)
    setError(null)

    addDebugLog(`🔄 Cargando usuarios... (tenantId: ${tenantId || 'null'})`)

    try {
      let query = supabase.from('profiles').select('*')
      
      if (tenantId) {
        query = query.eq('tenant_id', tenantId)
        addDebugLog(`📦 Filtrando por tenant_id: ${tenantId}`)
      } else {
        addDebugLog(`⚠️ No hay tenant_id, cargando todos los usuarios`)
      }
      
      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) {
        addDebugLog(`❌ Error cargando usuarios: ${error.message}`, 'error')
        if (error.message?.includes('tenant_id')) {
          addDebugLog(`⚠️ Falló con tenant_id, intentando sin filtro...`)
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })
          
          if (fallbackError) throw fallbackError
          setUsers(fallbackData || [])
          addDebugLog(`✅ ${fallbackData?.length || 0} usuarios cargados (sin filtro)`, 'success')
        } else {
          throw error
        }
      } else {
        setUsers(data || [])
        addDebugLog(`✅ ${data?.length || 0} usuarios cargados correctamente`, 'success')
      }
      
      setSuccess('Usuarios cargados correctamente')
      setTimeout(() => setSuccess(null), 2000)
    } catch (err: any) {
      addDebugLog(`❌ Error: ${err.message}`, 'error')
      console.error('Error cargando usuarios:', err)
      setError(err.message || 'Error al cargar los usuarios')
      setTimeout(() => setError(null), 3000)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    addDebugLog(`🚀 Iniciando página de usuarios`)
    addDebugLog(`👤 Rol del usuario: ${role || 'no definido'}`)
    addDebugLog(`📧 Email: ${user?.email || 'no logueado'}`)
    fetchUsers()
  }, [tenantId])

  // ============================================================
  // 2. CREAR USUARIO - CON TOKEN EN HEADER
  // ============================================================
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    addDebugLog(`🚀 Iniciando creación de usuario...`)
    
    setError(null)
    setSuccess(null)

    addDebugLog(`📝 Datos del formulario:`)
    addDebugLog(`  - Email: ${formData.email}`)
    addDebugLog(`  - Nombre: ${formData.full_name}`)
    addDebugLog(`  - Rol: ${formData.role}`)

    // Verificar permisos
    if (role !== 'admin' && role !== 'owner') {
      const msg = `❌ No tienes permisos. Tu rol es: ${role || 'sin rol'}`
      addDebugLog(msg, 'error')
      setError(`❌ No tienes permisos para crear usuarios. Tu rol es: ${role || 'sin rol'}`)
      setTimeout(() => setError(null), 5000)
      return
    }

    try {
      // Obtener la sesión actual para obtener el token
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        addDebugLog(`❌ No hay sesión activa`, 'error')
        setError('❌ No hay sesión activa. Por favor, inicia sesión nuevamente.')
        setTimeout(() => setError(null), 5000)
        return
      }

      addDebugLog(`🔑 Token obtenido: ${session.access_token ? '✅ Sí' : '❌ No'}`)

      addDebugLog(`📤 Enviando petición a /api/auth/create-user...`)

      const response = await fetch('/api/auth/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          phone: formData.phone,
          role: formData.role,
          level: formData.level,
          tenant_id: tenantId || null
        })
      })

      addDebugLog(`📥 Status de respuesta: ${response.status}`)

      const data = await response.json()
      addDebugLog(`📥 Datos de respuesta: ${JSON.stringify(data)}`)

      if (!response.ok) {
        addDebugLog(`❌ Error en la API: ${data.error || 'Error desconocido'}`, 'error')
        throw new Error(data.error || `Error ${response.status}: ${response.statusText}`)
      }

      addDebugLog(`✅ Usuario ${formData.full_name} creado exitosamente como ${formData.role}`, 'success')
      setSuccess(`✅ Usuario ${formData.full_name} creado como ${formData.role}`)
      setTimeout(() => setSuccess(null), 3000)
      
      setShowModal(false)
      setFormData({ email: '', password: '', full_name: '', phone: '', role: 'staff', level: 'bronze' })
      fetchUsers(false)

    } catch (err: any) {
      addDebugLog(`❌ Error: ${err.message}`, 'error')
      console.error('Error creando usuario:', err)
      setError(err.message || 'Error al crear el usuario')
      setTimeout(() => setError(null), 5000)
    }
  }

  // ============================================================
  // 3. EDITAR USUARIO
  // ============================================================
  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return
    setError(null)
    setSuccess(null)

    addDebugLog(`✏️ Editando usuario: ${editingUser.full_name}`)

    try {
      const updateData: any = {
        full_name: formData.full_name || null,
        phone: formData.phone || null,
        role: formData.role,
        level: formData.level || 'bronze',
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', editingUser.id)

      if (error) throw error

      addDebugLog(`✅ Usuario ${formData.full_name} actualizado`, 'success')
      setSuccess(`✅ Usuario ${formData.full_name} actualizado`)
      setTimeout(() => setSuccess(null), 3000)
      
      setShowModal(false)
      setEditingUser(null)
      fetchUsers(false)
    } catch (err: any) {
      addDebugLog(`❌ Error actualizando: ${err.message}`, 'error')
      console.error('Error actualizando usuario:', err)
      setError(err.message || 'Error al actualizar el usuario')
      setTimeout(() => setError(null), 3000)
    }
  }

  // ============================================================
  // 4. ACTIVAR / DESACTIVAR
  // ============================================================
  const toggleUserStatus = async (user: UserProfile) => {
    if (!user.id) return
    setError(null)
    setSuccess(null)

    addDebugLog(`🔄 Cambiando estado de ${user.full_name} a ${!user.is_active ? 'activo' : 'inactivo'}`)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !user.is_active })
        .eq('id', user.id)

      if (error) throw error

      addDebugLog(`✅ Estado cambiado: ${!user.is_active ? 'Activo' : 'Inactivo'}`, 'success')
      setSuccess(user.is_active ? '👤 Usuario desactivado' : '✅ Usuario activado')
      setTimeout(() => setSuccess(null), 2000)
      fetchUsers(false)
    } catch (err: any) {
      addDebugLog(`❌ Error cambiando estado: ${err.message}`, 'error')
      console.error('Error cambiando estado:', err)
      setError(err.message || 'Error al cambiar estado')
      setTimeout(() => setError(null), 3000)
    }
  }

  // ============================================================
  // 5. ELIMINAR USUARIO
  // ============================================================
  const deleteUser = async (user: UserProfile) => {
    if (!user.id) return
    
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (currentUser?.id === user.id) {
      addDebugLog(`❌ No puedes eliminar tu propio usuario`, 'error')
      setError('❌ No puedes eliminar tu propio usuario')
      setTimeout(() => setError(null), 3000)
      return
    }

    if (!confirm(`¿Estás seguro de eliminar a ${user.full_name}?`)) return
    setError(null)
    setSuccess(null)

    addDebugLog(`🗑️ Eliminando usuario: ${user.full_name}`)

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id)

      if (error) throw error

      addDebugLog(`✅ Usuario ${user.full_name} eliminado`, 'success')
      setSuccess(`✅ Usuario ${user.full_name} eliminado`)
      setTimeout(() => setSuccess(null), 2000)
      fetchUsers(false)
    } catch (err: any) {
      addDebugLog(`❌ Error eliminando: ${err.message}`, 'error')
      console.error('Error eliminando usuario:', err)
      setError(err.message || 'Error al eliminar usuario')
      setTimeout(() => setError(null), 3000)
    }
  }

  // ============================================================
  // 6. RESETEAR CONTRASEÑA
  // ============================================================
  const resetPassword = async (email: string) => {
    if (!confirm(`¿Enviar enlace de recuperación a ${email}?`)) return
    setError(null)
    setSuccess(null)

    addDebugLog(`📧 Enviando recuperación a: ${email}`)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (error) throw error

      addDebugLog(`✅ Enlace enviado a ${email}`, 'success')
      setSuccess(`📧 Enlace de recuperación enviado a ${email}`)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      addDebugLog(`❌ Error enviando recuperación: ${err.message}`, 'error')
      console.error('Error enviando recuperación:', err)
      setError(err.message || 'Error al enviar enlace')
      setTimeout(() => setError(null), 3000)
    }
  }

  // ============================================================
  // 7. AGREGAR PUNTOS DE FIDELIDAD
  // ============================================================
  const addLoyaltyPoints = async (user: UserProfile, points: number) => {
    if (!user.id) return
    setError(null)
    setSuccess(null)

    addDebugLog(`⭐ Agregando ${points} puntos a ${user.full_name}`)

    try {
      const newPoints = (user.loyalty_points || 0) + points
      const { error } = await supabase
        .from('profiles')
        .update({ loyalty_points: newPoints })
        .eq('id', user.id)

      if (error) throw error

      addDebugLog(`✅ ${points} puntos agregados a ${user.full_name}`, 'success')
      setSuccess(`⭐ ${points} puntos agregados a ${user.full_name}`)
      setTimeout(() => setSuccess(null), 2000)
      fetchUsers(false)
    } catch (err: any) {
      addDebugLog(`❌ Error agregando puntos: ${err.message}`, 'error')
      console.error('Error agregando puntos:', err)
      setError(err.message || 'Error al agregar puntos')
      setTimeout(() => setError(null), 3000)
    }
  }

  // ============================================================
  // 8. ABRIR MODALES
  // ============================================================
  const openEditModal = (user: UserProfile) => {
    addDebugLog(`✏️ Abriendo edición de: ${user.full_name}`)
    setEditingUser(user)
    setFormData({
      email: user.email,
      password: '',
      full_name: user.full_name || '',
      phone: user.phone || '',
      role: user.role || 'client',
      level: user.level || 'bronze'
    })
    setShowModal(true)
  }

  const openCreateModal = () => {
    addDebugLog(`📝 Abriendo modal de creación de usuario`)
    setEditingUser(null)
    setFormData({
      email: '',
      password: '',
      full_name: '',
      phone: '',
      role: 'staff',
      level: 'bronze'
    })
    setShowModal(true)
  }

  // ============================================================
  // 9. FILTROS
  // ============================================================
  const filteredUsers = users.filter(user => {
    const matchSearch = 
      user.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase())
    const matchRole = filterRole === 'todos' || user.role === filterRole
    const matchStatus = filterStatus === 'todos' || 
      (filterStatus === 'activos' && user.is_active) ||
      (filterStatus === 'inactivos' && !user.is_active)
    return matchSearch && matchRole && matchStatus
  })

  // ============================================================
  // 10. ESTADÍSTICAS
  // ============================================================
  const totalUsuarios = users.length
  const totalAdmins = users.filter(u => u.role === 'admin' || u.role === 'owner').length
  const totalStaff = users.filter(u => u.role === 'staff').length
  const totalClientes = users.filter(u => u.role === 'client').length

  // ============================================================
  // 11. VERIFICAR PERMISOS
  // ============================================================
  if (role !== 'admin' && role !== 'owner') {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4 p-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500">
          <Shield className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-serif font-bold text-stone-900 dark:text-white">
          Acceso Denegado
        </h2>
        <p className="text-sm text-stone-500 dark:text-stone-400 max-w-md">
          No tienes permisos para acceder a esta página. 
          <br />
          Tu rol actual es: <span className="font-bold text-rose-500">{role || 'sin rol'}</span>
          <br />
          Solo los administradores pueden gestionar usuarios.
        </p>
        <button
          onClick={() => window.location.href = '/dashboard'}
          className="px-6 py-3 rounded-xl text-white text-sm font-bold transition-all hover:scale-105"
          style={{ backgroundColor: settings?.primary_color || '#DB5B9A' }}
        >
          Volver al Dashboard
        </button>
      </div>
    )
  }

  // ============================================================
  // 12. LOADING
  // ============================================================
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

  // ============================================================
  // 13. RENDER
  // ============================================================
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 p-1 max-w-4xl mx-auto"
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

      {/* BOTÓN PARA MOSTRAR/OCULTAR DEBUG */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider border bg-white/50 dark:bg-[#1a1430]/40 border-pink-100/60 dark:border-fuchsia-950 text-stone-500 hover:text-pink-500 dark:hover:text-pink-400 transition-colors"
        >
          <Bug className="w-3.5 h-3.5" />
          {showDebug ? 'Ocultar Debug' : 'Mostrar Debug'}
        </button>
      </div>

      {/* PANEL DE DEBUG */}
      {showDebug && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 p-3 max-h-48 overflow-y-auto shadow-inner"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-pink-500 dark:text-pink-400 flex items-center gap-2">
              <Bug className="w-3 h-3" />
              Registro de Depuración
            </p>
            <button
              onClick={() => setDebugLogs([])}
              className="text-[9px] font-mono text-stone-400 hover:text-pink-500 transition-colors"
            >
              Limpiar
            </button>
          </div>
          <div className="space-y-0.5 font-mono text-[9px] leading-relaxed">
            {debugLogs.length === 0 ? (
              <p className="text-stone-400 dark:text-stone-500 italic">Esperando acciones...</p>
            ) : (
              debugLogs.map((log, index) => (
                <div key={index} className={`py-0.5 border-b border-pink-50/10 last:border-0 ${
                  log.includes('❌') ? 'text-rose-500 dark:text-rose-400' :
                  log.includes('✅') ? 'text-emerald-600 dark:text-emerald-400' :
                  'text-stone-600 dark:text-stone-400'
                }`}>
                  {log}
                </div>
              ))
            )}
          </div>
        </motion.div>
      )}

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
        <div className="flex items-center gap-3 p-3 rounded-2xl border flex-1 bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950">
          <Search className="w-4 h-4 shrink-0" style={{ color: settings?.primary_color || '#DB5B9A' }} />
          <input 
            type="text" 
            placeholder="Buscar por nombre o email..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-xs text-stone-800 dark:text-pink-100 placeholder:text-stone-400 w-full min-w-0"
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

        <div className="flex items-center gap-2 shrink-0">
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-3 py-3 rounded-xl border bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 focus:outline-none focus:ring-2 transition-all text-xs appearance-none min-w-[120px]"
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
            className="px-3 py-3 rounded-xl border bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 focus:outline-none focus:ring-2 transition-all text-xs appearance-none min-w-[110px]"
            style={{ '--tw-ring-color': settings?.primary_color || '#DB5B9A' } as React.CSSProperties}
          >
            <option value="todos">Todos</option>
            <option value="activos">Activos</option>
            <option value="inactivos">Inactivos</option>
          </select>
        </div>
      </div>

      {/* GRID DE TARJETAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence>
          {filteredUsers.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full text-center py-12 border border-dashed rounded-2xl bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950"
            >
              <Users className="w-10 h-10 mx-auto mb-3 text-stone-300 dark:text-stone-600" />
              <p className="text-xs text-stone-400 dark:text-stone-500">No se encontraron usuarios</p>
            </motion.div>
          ) : (
            filteredUsers.map((user, index) => {
              const roleConfig = ROLES.find(r => r.value === user.role) || ROLES[3]
              const RoleIcon = roleConfig.icon
              const isActive = user.is_active
              const levelConfig = LEVELS.find(l => l.value === user.level) || LEVELS[0]

              return (
                <motion.div
                  key={user.id}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={{ delay: 0.05 * index }}
                  className="rounded-2xl border bg-white dark:bg-[#130f24] border-pink-100/60 dark:border-fuchsia-950 p-4 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 ${
                        user.role === 'admin' || user.role === 'owner' 
                          ? 'bg-gradient-to-r from-pink-500 to-rose-500' 
                          : user.role === 'staff'
                            ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500'
                            : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                      }`}>
                        {user.full_name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-stone-800 dark:text-pink-100 truncate">
                          {user.full_name || 'Usuario'}
                        </p>
                        <p className="text-xs text-stone-400 dark:text-stone-500 truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 flex flex-col items-end gap-1">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider text-white bg-gradient-to-r ${roleConfig.color}`}>
                        <RoleIcon className="w-3 h-3" />
                        {roleConfig.label}
                      </span>
                      <span className={`text-[8px] font-mono px-2 py-0.5 rounded-full border ${
                        user.level === 'bronze' ? 'border-amber-600/30 text-amber-600 dark:text-amber-400' :
                        user.level === 'silver' ? 'border-gray-400/30 text-gray-600 dark:text-gray-400' :
                        'border-yellow-500/30 text-yellow-600 dark:text-yellow-400'
                      }`}>
                        ⭐ {user.level}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400 col-span-2">
                      <Mail className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{user.email}</span>
                    </div>
                    {user.phone && (
                      <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400 col-span-2">
                        <Phone className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{user.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400 col-span-2">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">
                        Creado: {new Date(user.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 col-span-2">
                      <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold ${
                        isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                        {isActive ? 'Activo' : 'Inactivo'}
                      </span>
                      {user.loyalty_points > 0 && (
                        <span className="text-[10px] font-mono text-amber-500 flex items-center gap-1">
                          <Gift className="w-3 h-3" />
                          {user.loyalty_points} pts
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-pink-100/60 dark:border-fuchsia-950/50 flex items-center justify-end gap-1 flex-wrap">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => addLoyaltyPoints(user, 50)}
                      className="p-2 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-950/20 text-stone-400 hover:text-amber-500 transition-colors"
                      title="Agregar 50 puntos"
                    >
                      <Gift className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => toggleUserStatus(user)}
                      className={`p-2 rounded-xl transition-colors ${
                        isActive 
                          ? 'hover:bg-amber-50 dark:hover:bg-amber-950/20 text-stone-400 hover:text-amber-500' 
                          : 'hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-stone-400 hover:text-emerald-500'
                      }`}
                      title={isActive ? 'Desactivar' : 'Activar'}
                    >
                      {isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => openEditModal(user)}
                      className="p-2 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/20 text-stone-400 hover:text-blue-500 transition-colors"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => resetPassword(user.email)}
                      className="p-2 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-950/20 text-stone-400 hover:text-amber-500 transition-colors"
                      title="Resetear contraseña"
                    >
                      <Key className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => deleteUser(user)}
                      className="p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20 text-stone-400 hover:text-rose-500 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                </motion.div>
              )
            })
          )}
        </AnimatePresence>
      </div>

      {/* MODAL */}
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
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
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
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 focus:outline-none focus:ring-2 transition-all text-sm"
                    style={{ '--tw-ring-color': settings?.primary_color || '#DB5B9A' } as React.CSSProperties}
                    placeholder="11 2345 6789"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
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

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-stone-500 dark:text-stone-400 mb-1.5">
                      Nivel
                    </label>
                    <select
                      value={formData.level}
                      onChange={(e) => setFormData({...formData, level: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-[#0f0c1b] border-pink-100/60 dark:border-fuchsia-950 text-stone-800 dark:text-pink-100 focus:outline-none focus:ring-2 transition-all text-sm appearance-none"
                      style={{ '--tw-ring-color': settings?.primary_color || '#DB5B9A' } as React.CSSProperties}
                    >
                      {LEVELS.map(l => (
                        <option key={l.value} value={l.value}>{l.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* PANEL DE DEBUG EN EL MODAL */}
                <div className="rounded-xl bg-stone-50 dark:bg-[#0f0c1b] border border-stone-200 dark:border-fuchsia-950/50 p-3 max-h-32 overflow-y-auto">
                  <p className="text-[8px] font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-1">🔍 Debug - Últimos pasos</p>
                  <div className="space-y-0.5 font-mono text-[8px] text-stone-500 dark:text-stone-400 break-all">
                    {debugLogs.slice(0, 5).map((log, i) => (
                      <div key={i} className={`${log.includes('❌') ? 'text-rose-500' : log.includes('✅') ? 'text-emerald-500' : ''}`}>
                        {log}
                      </div>
                    ))}
                    {debugLogs.length === 0 && <p className="italic">Esperando acciones...</p>}
                  </div>
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