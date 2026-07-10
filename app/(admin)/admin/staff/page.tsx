'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useTheme } from '@/contexts/ThemeContext'
import { 
  Users, Plus, Search, Edit, Trash2, 
  Mail, Phone, Clock, X, Save, UserPlus, 
  UserCog, Sparkles, Award, Tag
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
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
      setError(err.message || 'Error al cargar el equipo')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchStaff() }, [])

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
    m.role?.toLowerCase().includes(search.toLowerCase())
  )

  // Loading State
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 animate-pulse rounded-2xl bg-muted" />
        <div className="h-12 animate-pulse rounded-xl bg-muted" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6"
    >
      {/* HEADER */}
      <motion.div 
        variants={itemVariants}
        className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-r from-primary/90 to-secondary/90 p-6 shadow-lg shadow-primary/10"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-2xl font-serif italic text-primary-foreground">Staff Premium</h2>
            <p className="text-primary-foreground/80 text-xs mt-1">
              Gestión de profesionales de {staff.length} miembros.
            </p>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="group flex items-center gap-2 px-5 py-2.5 rounded-xl bg-background/20 backdrop-blur-sm hover:bg-background/30 border border-background/20 text-primary-foreground text-xs font-bold uppercase tracking-widest transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            Agregar Miembro
          </button>
        </div>
      </motion.div>

      {/* SEARCH */}
      <motion.div 
        variants={itemVariants}
        className={`flex items-center gap-3 p-3 rounded-xl border border-border bg-card`}
      >
        <Search className="w-4 h-4 text-muted-foreground" />
        <input 
          placeholder="Buscar por nombre o rol..." 
          className="w-full bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button 
            onClick={() => setSearch('')}
            className="p-1 hover:bg-muted rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </motion.div>

      {/* ERROR/SUCCESS MESSAGES */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm"
          >
            {error}
          </motion.div>
        )}
        {success && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-sm"
          >
            {success}
          </motion.div>
        )}
      </AnimatePresence>

      {/* GRID */}
      <motion.div 
        variants={containerVariants}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {filtrados.length === 0 ? (
          <motion.div 
            variants={itemVariants}
            className="col-span-full text-center py-12 text-muted-foreground"
          >
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No se encontraron miembros</p>
          </motion.div>
        ) : (
          filtrados.map((member) => (
            <motion.div 
              key={member.id}
              variants={itemVariants}
              whileHover={{ y: -4 }}
              className={`group relative p-5 rounded-xl border border-border bg-card hover:shadow-lg hover:shadow-primary/5 transition-all duration-300`}
            >
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{member.name}</h3>
                  <span className="inline-block mt-1 text-[10px] uppercase font-bold text-primary">
                    {member.role}
                  </span>
                  {member.specialty && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      {member.specialty}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <button 
                    onClick={() => { setEditingId(member.id); setFormData(member); setShowModal(true) }} 
                    className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(member.id)} 
                    className="p-2 hover:bg-destructive/10 rounded-lg transition-colors text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="relative mt-3 space-y-1 text-xs text-muted-foreground">
                <p className="flex items-center gap-2">
                  <Mail className="w-3 h-3" />
                  {member.email}
                </p>
                {member.phone && (
                  <p className="flex items-center gap-2">
                    <Phone className="w-3 h-3" />
                    {member.phone}
                  </p>
                )}
                {member.experience && (
                  <p className="flex items-center gap-2">
                    <Award className="w-3 h-3" />
                    {member.experience} años de experiencia
                  </p>
                )}
              </div>
            </motion.div>
          ))
        )}
      </motion.div>

      {/* MODAL */}
      <AnimatePresence>
        {showModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-xl font-serif italic text-foreground mb-6">
                {editingId ? 'Editar Miembro' : 'Nuevo Miembro'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Nombre *</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Email *</label>
                  <input
                    type="email"
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Rol</label>
                  <select
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                  >
                    {roles.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Teléfono</label>
                  <input
                    type="tel"
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Especialidad</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    value={formData.specialty}
                    onChange={(e) => setFormData({...formData, specialty: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Años de experiencia</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    value={formData.experience}
                    onChange={(e) => setFormData({...formData, experience: e.target.value})}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-foreground"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {editingId ? 'Actualizar' : 'Guardar'}
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