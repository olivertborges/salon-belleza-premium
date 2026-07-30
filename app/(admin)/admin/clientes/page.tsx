// @ts-nocheck
'use client'

import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useSettings } from '@/contexts/SettingsContext'
import { useTheme } from '@/contexts/ThemeContext'
import { 
  User, Search, Plus, Phone, Mail, Calendar, 
  UserCheck, Award, Trash2, Edit, Star, XCircle, Sparkles,
  RefreshCw, X, Users, TrendingUp, CheckCircle2,
  AlertCircle, Crown, Gem, Loader2, Save, Camera, Upload
} from 'lucide-react'

type Cliente = {
  id: string
  name: string
  email: string
  phone: string
  avatar_url: string
  is_active: boolean
  created_at: string
}

export default function ClientesPage() {
  const { settings } = useSettings()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [clientes, setClientes] = useState<Cliente[]>([])
  const [search, setSearch] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Modal states
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    avatar_url: ''
  })
  const [formError, setFormError] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ============================================================
  // PALETA DE COLORES - DORADO PROTAGONISTA
  // ============================================================
  const gold = '#D4AF37'
  const goldLight = '#E8D5A0'
  const goldDark = '#C9A96E'

  const headerGradient = {
    backgroundImage: `linear-gradient(135deg, ${gold} 0%, ${goldDark} 50%, ${goldLight} 100%)`
  }

  // ============================================================
  // 🔥 COMPRIMIR IMAGEN (500x500, calidad 80%)
  // ============================================================
  const compressImage = (file: File, maxWidth = 500, maxHeight = 500, quality = 0.8): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (event) => {
        const img = new Image()
        img.src = event.target?.result as string
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width)
              width = maxWidth
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height)
              height = maxHeight
            }
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx?.drawImage(img, 0, 0, width, height)

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('No se pudo comprimir la imagen'))
                return
              }
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              })
              resolve(compressedFile)
            },
            'image/jpeg',
            quality
          )
        }
        img.onerror = () => reject(new Error('Error al cargar la imagen'))
      }
      reader.onerror = () => reject(new Error('Error al leer el archivo'))
    })
  }

  const fetchClientes = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true)
    } else {
      setRefreshing(true)
    }
    setError(null)

    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (error) throw error
      if (data) setClientes(data as Cliente[])
      setSuccess('Clientes actualizados correctamente')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      console.error('Error al cargar clientes de Supabase:', err)
      setError(err.message || 'Error al cargar los clientes')
      setTimeout(() => setError(null), 3000)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchClientes()
  }, [])

  const handleRefresh = () => {
    fetchClientes(true)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      avatar_url: ''
    })
    setAvatarFile(null)
    setAvatarPreview(null)
    setFormError(null)
    setUploadingAvatar(false)
  }

  // ============================================================
  // 🔥 MANEJAR AVATAR CON COMPRESIÓN AUTOMÁTICA
  // ============================================================
  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setFormError('⚠️ Selecciona un formato de imagen válido (JPG, PNG, etc.)')
      setTimeout(() => setFormError(null), 3000)
      return
    }

    try {
      setUploadingAvatar(true)
      // ✅ COMPRIME AUTOMÁTICAMENTE A 500x500, calidad 80%
      const compressedFile = await compressImage(file, 500, 500, 0.8)
      setAvatarFile(compressedFile)
      setUploadingAvatar(false)

      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(compressedFile)

      setFormError(null)
    } catch (err) {
      setFormError('⚠️ Error al procesar la imagen. Intenta con otra.')
      setUploadingAvatar(false)
      setTimeout(() => setFormError(null), 3000)
    }
  }

  const uploadAvatar = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop()
    const fileName = `avatar-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`
    const filePath = `avatars/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('clients')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    const { data: urlData } = supabase.storage.from('clients').getPublicUrl(filePath)
    return urlData.publicUrl
  }

  // ============================================================
  // 🔥 GUARDAR CLIENTE CON TENANT_ID (SOLUCIONA RLS)
  // ============================================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setSaving(true)

    if (!formData.name.trim()) {
      setFormError('El nombre es obligatorio')
      setSaving(false)
      return
    }

    if (!formData.email.trim() && !formData.phone.trim()) {
      setFormError('Debes proporcionar al menos un email o teléfono')
      setSaving(false)
      return
    }

    try {
      // ✅ OBTENER TENANT_ID DEL USUARIO AUTENTICADO
      const { data: { session } } = await supabase.auth.getSession()
      const userId = session?.user?.id

      if (!userId) {
        setFormError('No hay sesión activa. Inicia sesión nuevamente.')
        setSaving(false)
        return
      }

      // ✅ OBTENER TENANT_ID DEL PERFIL DEL USUARIO
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', userId)
        .maybeSingle()

      if (profileError || !profile?.tenant_id) {
        setFormError('No se pudo obtener el tenant. Contacta al administrador.')
        setSaving(false)
        return
      }

      const tenantId = profile.tenant_id

      let avatarUrl = formData.avatar_url.trim() || null

      if (avatarFile) {
        setUploadingAvatar(true)
        avatarUrl = await uploadAvatar(avatarFile)
        setUploadingAvatar(false)
      }

      // ✅ INCLUIR tenant_id EN LA INSERCIÓN (SOLUCIONA RLS)
      const newCliente = {
        name: formData.name.trim(),
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        avatar_url: avatarUrl,
        tenant_id: tenantId,
        is_active: true,
        created_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('clients')
        .insert([newCliente])
        .select()

      if (error) {
        if (error.code === '23505') {
          setFormError('Ya existe un cliente con ese email o teléfono')
        } else {
          console.error('Error Supabase:', error)
          setFormError(error.message || 'Error al guardar el cliente')
        }
        setSaving(false)
        return
      }

      if (data) {
        setClientes(prev => [data[0] as Cliente, ...prev])
        setSuccess('✅ Cliente agregado correctamente')
        setTimeout(() => setSuccess(null), 3000)
        setShowModal(false)
        resetForm()
      }
    } catch (err: any) {
      console.error('Error inesperado:', err)
      setFormError(err.message || 'Error inesperado')
    } finally {
      setSaving(false)
      setUploadingAvatar(false)
    }
  }

  const filtrados = clientes.filter((c: Cliente) => 
    c.name?.toLowerCase().includes(search.toLowerCase()) || 
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  )

  const totalClientes = clientes.length
  const clientesRecientes = clientes.filter(c => {
    const fecha = new Date(c.created_at)
    const hoy = new Date()
    const diff = (hoy.getTime() - fecha.getTime()) / (1000 * 60 * 60 * 24)
    return diff <= 30
  }).length
  const clientesVip = Math.round(totalClientes * 0.4)

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-[70vh] transition-colors duration-500 ${isDark ? 'bg-[#1E120C]' : 'bg-[#FFF9F6]'}`}>
        <div className="flex flex-col items-center gap-6">
          <div className="relative w-16 h-16">
            <div className={`absolute inset-0 rounded-full border ${isDark ? 'border-[#D4AF37]/10' : 'border-[#D4AF37]/20'}`} />
            <div className="absolute inset-0 rounded-full border-t-2 border-[#D4AF37] animate-spin" />
          </div>
          <p className={`text-[10px] tracking-[0.4em] uppercase font-light animate-pulse ${isDark ? 'text-[#FFF9F6]/60' : 'text-[#1A0E0A]/60'}`}>
            Cargando clientas...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen transition-colors duration-500 antialiased pb-8 relative overflow-x-hidden ${isDark ? 'bg-[#1E120C] text-[#FFF9F6]' : 'bg-[#FFF9F6] text-[#1A0E0A]'}`}>
      <div className="absolute inset-0 pointer-events-none z-0 opacity-10 mix-blend-multiply bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:60px_60px]" />

      <div className="max-w-6xl mx-auto px-4 space-y-6 relative z-10">

        {/* ============================================================ */}
        {/* CABECERA — DORADO PROTAGONISTA */}
        {/* ============================================================ */}
        <div 
          className="relative overflow-hidden rounded-2xl p-6 md:p-8 shadow-2xl text-white border border-white/10"
          style={headerGradient}
        >
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-black/20 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[10px] font-black uppercase tracking-widest text-white/80">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
                Base de Datos del Salón
              </div>
              <h1 className="text-3xl md:text-4xl font-serif font-black tracking-tight drop-shadow-sm">
                Clientes Fresh Nails
              </h1>
              <p className="text-xs md:text-sm text-white/80 font-medium max-w-md">
                Gestiona la ficha de tus clientas, acceso y evolución en el salón.
              </p>
            </div>

            <div className="flex items-center gap-3 self-start md:self-center shrink-0">
              <button 
                onClick={handleRefresh} 
                disabled={refreshing} 
                className="p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white transition-all active:scale-95 shadow-lg"
                title="Actualizar Clientes"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>

              <button 
                onClick={() => { resetForm(); setShowModal(true); }}
                className="flex items-center gap-2.5 px-5 py-3 rounded-xl bg-white text-stone-900 font-black text-xs uppercase tracking-widest shadow-xl hover:bg-[#F0E4DA] hover:scale-105 active:scale-95 transition-all"
              >
                <div className="p-1 rounded-md bg-[#D4AF37] text-white">
                  <Plus className="w-3 h-3 stroke-[3]" />
                </div>
                <span>Nueva Cliente</span>
              </button>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* MENSAJES */}
        {/* ============================================================ */}
        {error && (
          <div className={`flex items-start gap-4 border p-4 rounded-2xl transition-all duration-300 ${isDark ? 'bg-[#3D281E]/40 border-[#D4AF37]/30 text-[#FFF9F6]' : 'bg-[#FFF9F6] border-[#D4AF37]/30 text-[#1A0E0A]'}`}>
            <div className={`p-2 rounded-xl shrink-0 ${isDark ? 'bg-[#3D281E]' : 'bg-[#FFF9F6]'}`}>
              <AlertCircle className="w-4 h-4 text-[#D4AF37]" />
            </div>
            <p className="text-sm font-light">{error}</p>
          </div>
        )}

        {success && (
          <div className={`flex items-start gap-4 border p-4 rounded-2xl transition-all duration-300 ${isDark ? 'bg-[#3D281E]/40 border-[#D4AF37]/30 text-[#FFF9F6]' : 'bg-[#FFF9F6] border-[#D4AF37]/30 text-[#1A0E0A]'}`}>
            <div className={`p-2 rounded-xl shrink-0 ${isDark ? 'bg-[#3D281E]' : 'bg-[#FFF9F6]'}`}>
              <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
            </div>
            <p className="text-sm font-light">{success}</p>
          </div>
        )}

        {/* ============================================================ */}
        {/* KPIS */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className={`rounded-2xl p-3 shadow-sm border transition-all duration-300 ${isDark ? 'bg-[#2A1B14] border-[#3D281E]' : 'bg-white border-[#F0E4DA]'}`}>
            <div className="flex items-center gap-3 min-w-0">
              <div className={`p-2 rounded-xl shrink-0 ${isDark ? 'bg-[#3D281E]' : 'bg-[#FFF9F6]'}`}>
                <UserCheck className="w-4 h-4 text-[#D4AF37]" />
              </div>
              <div className="min-w-0">
                <p className={`text-[8px] font-mono uppercase tracking-wider font-black ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>Registradas</p>
                <p className={`text-lg font-black ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>{totalClientes}</p>
              </div>
            </div>
          </div>

          <div className={`rounded-2xl p-3 shadow-sm border transition-all duration-300 ${isDark ? 'bg-[#2A1B14] border-[#3D281E]' : 'bg-white border-[#F0E4DA]'}`}>
            <div className="flex items-center gap-3 min-w-0">
              <div className={`p-2 rounded-xl shrink-0 ${isDark ? 'bg-[#3D281E]' : 'bg-[#FFF9F6]'}`}>
                <Crown className="w-4 h-4 text-[#D4AF37]" />
              </div>
              <div className="min-w-0">
                <p className={`text-[8px] font-mono uppercase tracking-wider font-black ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>VIP Activas</p>
                <p className="text-lg font-black text-[#D4AF37]">{clientesVip}</p>
              </div>
            </div>
          </div>

          <div className={`rounded-2xl p-3 shadow-sm border transition-all duration-300 ${isDark ? 'bg-[#2A1B14] border-[#3D281E]' : 'bg-white border-[#F0E4DA]'}`}>
            <div className="flex items-center gap-3 min-w-0">
              <div className={`p-2 rounded-xl shrink-0 ${isDark ? 'bg-[#3D281E]' : 'bg-[#FFF9F6]'}`}>
                <TrendingUp className="w-4 h-4 text-[#D4AF37]" />
              </div>
              <div className="min-w-0">
                <p className={`text-[8px] font-mono uppercase tracking-wider font-black ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>Nuevas (30d)</p>
                <p className="text-lg font-black text-[#D4AF37]">+{clientesRecientes}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* BUSCADOR */}
        {/* ============================================================ */}
        <div className={`flex items-center gap-3 p-3 rounded-2xl border shadow-sm transition-all duration-300 ${isDark ? 'bg-[#2A1B14] border-[#3D281E]' : 'bg-white border-[#F0E4DA]'}`}>
          <Search className={`w-4 h-4 shrink-0 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`} />
          <input 
            type="text" 
            placeholder="Buscar por nombre, correo o teléfono..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`bg-transparent border-none outline-none text-xs w-full font-medium ${isDark ? 'text-[#FFF9F6] placeholder:text-[#A89588]' : 'text-[#1A0E0A] placeholder:text-[#A89588]'}`}
          />
          {search && (
            <button 
              onClick={() => setSearch('')}
              className={`p-1 rounded-lg transition-colors ${isDark ? 'hover:bg-[#3D281E]' : 'hover:bg-[#F0E4DA]'}`}
            >
              <XCircle className={`w-4 h-4 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`} />
            </button>
          )}
        </div>

        {/* ============================================================ */}
        {/* GRID DE CLIENTES */}
        {/* ============================================================ */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 transition-opacity duration-300 ${refreshing ? 'opacity-50' : 'opacity-100'}`}>
          {filtrados.map((cliente: Cliente) => (
            <div 
              key={cliente.id} 
              className={`relative overflow-hidden rounded-2xl border p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group ${
                isDark ? 'bg-[#2A1B14] border-[#3D281E] hover:border-[#D4AF37]/40' : 'bg-white border-[#F0E4DA] hover:border-[#D4AF37]/40'
              }`}
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#D4AF37] opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  {cliente.avatar_url ? (
                    <img src={cliente.avatar_url} alt={cliente.name} className={`w-11 h-11 rounded-xl object-cover border transition-transform group-hover:scale-105 ${
                      isDark ? 'bg-[#1E120C] border-[#3D281E]' : 'bg-[#FFF9F6] border-[#F0E4DA]'
                    }`} />
                  ) : (
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center font-serif italic text-sm font-bold text-white shrink-0 bg-[#D4AF37]">
                      {cliente.name?.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0">
                    <h3 className={`font-medium text-sm truncate transition-colors ${isDark ? 'text-[#FFF9F6] group-hover:text-[#D4AF37]' : 'text-[#1A0E0A] group-hover:text-[#D4AF37]'}`}>
                      {cliente.name}
                    </h3>
                    <span className={`text-[8px] font-mono uppercase tracking-wider block mt-0.5 truncate ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>
                      ID_{cliente.id.substring(0, 8).toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-0.5 shrink-0">
                  <button className={`p-1.5 rounded-xl border transition-colors ${
                    isDark ? 'bg-[#1E120C] border-[#3D281E] text-[#A89588] hover:text-[#D4AF37]' : 'bg-[#FFF9F6] border-[#F0E4DA] text-[#5C4A3E] hover:text-[#D4AF37]'
                  }`}>
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button className={`p-1.5 rounded-xl border transition-colors ${
                    isDark ? 'bg-[#1E120C] border-[#3D281E] text-[#A89588] hover:text-rose-500' : 'bg-[#FFF9F6] border-[#F0E4DA] text-[#5C4A3E] hover:text-rose-500'
                  }`}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <hr className={`my-3.5 ${isDark ? 'border-[#3D281E]' : 'border-[#F0E4DA]'}`} />

              <div className={`space-y-2 font-mono text-[11px] ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>
                <div className="flex items-center gap-2 min-w-0">
                  <Mail className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`} />
                  <span className={`truncate transition-colors ${isDark ? 'hover:text-[#FFF9F6]' : 'hover:text-[#1A0E0A]'}`}>
                    {cliente.email || 'sin_correo@nails.com'}
                  </span>
                </div>

                <div className="flex items-center gap-2 min-w-0">
                  <Phone className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`} />
                  <span className={`truncate transition-colors ${isDark ? 'hover:text-[#FFF9F6]' : 'hover:text-[#1A0E0A]'}`}>
                    {cliente.phone || 'Sin teléfono'}
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-0.5">
                  <Calendar className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`} />
                  <span className={`px-1.5 py-0.5 rounded border text-[10px] ${
                    isDark ? 'bg-[#1E120C] border-[#3D281E] text-[#A89588]' : 'bg-[#FFF9F6] border-[#F0E4DA] text-[#5C4A3E]'
                  }`}>
                    Alta: {new Date(cliente.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {filtrados.length === 0 && (
            <div className={`col-span-full text-center py-12 border border-dashed rounded-2xl font-mono text-xs ${
              isDark ? 'bg-[#2A1B14]/40 border-[#3D281E] text-[#A89588]' : 'bg-white border-[#F0E4DA] text-[#5C4A3E]'
            }`}>
              No se encontraron clientas que coincidan con los criterios.
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* MODAL: NUEVA CLIENTE CON COMPRESIÓN AUTOMÁTICA + TENANT_ID */}
        {/* ============================================================ */}
        {showModal && (
          <div className="fixed inset-0 z-[9999] bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4" onClick={() => { setShowModal(false); resetForm(); }}>
            <div 
              className={`relative w-full max-w-md rounded-2xl border p-6 shadow-2xl max-h-[90vh] overflow-y-auto transition-all duration-300 ${
                isDark ? 'bg-[#2A1B14] border-[#3D281E]' : 'bg-white border-[#F0E4DA]'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => { setShowModal(false); resetForm(); }} 
                className={`absolute top-4 right-4 p-2 rounded-xl transition-colors ${
                  isDark ? 'text-[#A89588] hover:text-[#FFF9F6] hover:bg-[#3D281E]' : 'text-[#5C4A3E] hover:text-[#1A0E0A] hover:bg-[#F0E4DA]'
                }`}
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="p-2.5 rounded-xl text-white shadow-md bg-[#D4AF37]">
                  <User className="w-5 h-5" />
                </div>
                <h3 className={`text-xl font-serif font-extrabold ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>
                  Nueva Cliente
                </h3>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* AVATAR */}
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <div className={`w-24 h-24 rounded-full overflow-hidden border-2 flex items-center justify-center ${
                      isDark ? 'bg-[#1E120C] border-[#3D281E]' : 'bg-[#FFF9F6] border-[#F0E4DA]'
                    }`}>
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <User className={`w-10 h-10 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`} />
                      )}
                    </div>

                    <div className="absolute -bottom-1 -right-1 flex gap-1">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className={`p-1.5 rounded-full shadow-md border transition-all hover:scale-110 ${
                          isDark ? 'bg-[#3D281E] border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#4A3227]' : 'bg-white border-[#F0E4DA] text-[#D4AF37] hover:bg-[#FFF9F6]'
                        }`}
                        title="Subir foto desde dispositivo"
                      >
                        <Upload className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const input = document.createElement('input')
                          input.type = 'file'
                          input.accept = 'image/*'
                          input.capture = 'environment'
                          input.onchange = (e) => {
                            const target = e.target as HTMLInputElement
                            if (target.files && target.files.length > 0) {
                              const fakeEvent = { target: { files: target.files } } as React.ChangeEvent<HTMLInputElement>
                              handleAvatarFileSelect(fakeEvent)
                            }
                          }
                          input.click()
                        }}
                        className={`p-1.5 rounded-full shadow-md border transition-all hover:scale-110 ${
                          isDark ? 'bg-[#3D281E] border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#4A3227]' : 'bg-white border-[#F0E4DA] text-[#D4AF37] hover:bg-[#FFF9F6]'
                        }`}
                        title="Tomar foto con cámara"
                      >
                        <Camera className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarFileSelect}
                      className="hidden"
                    />
                  </div>

                  {uploadingAvatar && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-[#D4AF37]">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Procesando imagen...
                    </div>
                  )}

                  {avatarPreview && (
                    <button
                      type="button"
                      onClick={() => { setAvatarFile(null); setAvatarPreview(null); }}
                      className={`mt-1 text-[8px] font-black uppercase tracking-wider transition-colors ${
                        isDark ? 'text-[#A89588] hover:text-rose-400' : 'text-[#5C4A3E] hover:text-rose-500'
                      }`}
                    >
                      Eliminar foto
                    </button>
                  )}
                </div>

                <div>
                  <label className={`block text-[10px] uppercase tracking-widest font-bold mb-1.5 font-mono ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 ${
                      isDark ? 'bg-[#1E120C] border-[#3D281E] text-[#FFF9F6] placeholder:text-[#A89588]' : 'bg-[#FFF9F6] border-[#F0E4DA] text-[#1A0E0A] placeholder:text-[#A89588]'
                    }`}
                    placeholder="Ej: María González"
                    required
                  />
                </div>

                <div>
                  <label className={`block text-[10px] uppercase tracking-widest font-bold mb-1.5 font-mono ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 ${
                      isDark ? 'bg-[#1E120C] border-[#3D281E] text-[#FFF9F6] placeholder:text-[#A89588]' : 'bg-[#FFF9F6] border-[#F0E4DA] text-[#1A0E0A] placeholder:text-[#A89588]'
                    }`}
                    placeholder="maria@correo.com"
                  />
                </div>

                <div>
                  <label className={`block text-[10px] uppercase tracking-widest font-bold mb-1.5 font-mono ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 ${
                      isDark ? 'bg-[#1E120C] border-[#3D281E] text-[#FFF9F6] placeholder:text-[#A89588]' : 'bg-[#FFF9F6] border-[#F0E4DA] text-[#1A0E0A] placeholder:text-[#A89588]'
                    }`}
                    placeholder="099123456"
                  />
                </div>

                {formError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs">
                    {formError}
                  </div>
                )}

                <div className={`flex gap-3 pt-3 border-t ${isDark ? 'border-[#3D281E]' : 'border-[#F0E4DA]'}`}>
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); resetForm(); }}
                    className={`flex-1 py-2.5 rounded-xl border text-xs font-bold uppercase transition-colors ${
                      isDark ? 'border-[#3D281E] text-[#A89588] hover:bg-[#3D281E]' : 'border-[#F0E4DA] text-[#5C4A3E] hover:bg-[#F0E4DA]'
                    }`}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving || uploadingAvatar}
                    className="flex-1 py-2.5 rounded-xl text-[#1A0E0A] text-xs font-bold uppercase flex items-center justify-center gap-2 shadow-md hover:scale-105 transition-all bg-[#D4AF37] hover:bg-[#E8D5A0] disabled:opacity-50"
                  >
                    {saving || uploadingAvatar ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving || uploadingAvatar ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>

      <style jsx global>{`
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 8s linear infinite; }
      `}</style>

    </div>
  )
}