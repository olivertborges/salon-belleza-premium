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

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-pink-600 to-rose-500 p-6 text-white shadow-lg">
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-2xl font-serif italic">Staff Premium</h2>
            <p className="text-pink-100 text-xs mt-1">Gestión de profesionales de {staff.length} miembros.</p>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
          >
            Agregar Miembro
          </button>
        </div>
      </div>

      {/* SEARCH */}
      <div className={`flex items-center gap-3 p-3 rounded-xl border ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-stone-200'}`}>
        <Search className="w-4 h-4 text-stone-400" />
        <input 
          placeholder="Buscar..." 
          className="w-full bg-transparent outline-none text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtrados.map((member) => (
          <div key={member.id} className={`p-5 rounded-xl border ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-stone-200'}`}>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold">{member.name}</h3>
                <span className="text-[10px] uppercase font-bold text-pink-500">{member.role}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setEditingId(member.id); setFormData(member); setShowModal(true) }} className="p-2 hover:bg-stone-100 rounded-lg"><Edit className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(member.id)} className="p-2 hover:bg-red-50 text-red-500 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
