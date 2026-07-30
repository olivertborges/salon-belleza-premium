// @ts-nocheck
'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useSettings } from '@/contexts/SettingsContext'
import { useTheme } from '@/contexts/ThemeContext'
import { 
  User, Search, Plus, Phone, Mail, Calendar, 
  UserCheck, TrendingUp, RefreshCw, XCircle, 
  AlertCircle, Crown, Loader2, Save, Camera, Upload, X,
  ChevronLeft, ChevronRight, Filter
} from 'lucide-react'
import { format } from 'date-fns'

type Cliente = {
  id: string
  name: string
  email: string
  phone: string
  avatar_url: string
  is_active: boolean
  created_at: string
}

const GOLD_PALETTE = { primary: '#D4AF37', light: '#E8D5A0', dark: '#C9A96E' }
const ITEMS_PER_PAGE = 9

export default function ClientesPage() {
  const { settings } = useSettings()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [clientes, setClientes] = useState<Cliente[]>([])
  const [search, setSearch] = useState<string>('')
  const [filterSegment, setFilterSegment] = useState<string>('todos')
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [loading, setLoading] = useState<boolean>(true)
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Modal states
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', avatar_url: '' })
  const [formError, setFormError] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Depuración visual
  const [debugInfo, setDebugInfo] = useState<string | null>(null)
  const [showDebug, setShowDebug] = useState(false)

  const headerGradient = useMemo(() => ({
    backgroundImage: `linear-gradient(135deg, ${GOLD_PALETTE.primary} 0%, ${GOLD_PALETTE.dark} 50%, ${GOLD_PALETTE.light} 100%)`
  }), [])

  // ============================================================
  // COMPRIMIR IMAGEN
  // ============================================================
  const compressImage = useCallback((file: File, maxWidth = 500, maxHeight = 500, quality = 0.8): Promise<File> => {
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
  }, [])

  const fetchClientes = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true)
    else setRefreshing(true)
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
  }, [])

  useEffect(() => {
    fetchClientes(true)
  }, [fetchClientes])

  // Resetear paginación al cambiar términos de búsqueda o segmentos
  useEffect(() => {
    setCurrentPage(1)
  }, [search, filterSegment])

  const handleRefresh = () => fetchClientes(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const resetForm = () => {
    setFormData({ name: '', email: '', phone: '', avatar_url: '' })
    setAvatarFile(null)
    setAvatarPreview(null)
    setFormError(null)
    setUploadingAvatar(false)
    setDebugInfo(null)
    setShowDebug(false)
  }

  // ============================================================
  // MANEJAR AVATAR
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
      const compressedFile = await compressImage(file, 500, 500, 0.8)
      setAvatarFile(compressedFile)
      setUploadingAvatar(false)

      const reader = new FileReader()
      reader.onloadend = () => setAvatarPreview(reader.result as string)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setSaving(true)
    setDebugInfo(null)
    setShowDebug(false)

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
      setDebugInfo('🔍 Verificando sesión...')
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        setDebugInfo('❌ Error de sesión')
        setShowDebug(true)
        setFormError('No hay sesión activa. Inicia sesión nuevamente.')
        setSaving(false)
        return
      }

      setDebugInfo('🔍 Obteniendo tenant_id...')
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', session.user.id)
        .maybeSingle()

      if (profileError || !profile?.tenant_id) {
        setDebugInfo('❌ No se encontró tenant_id')
        setShowDebug(true)
        setFormError('No se encontró tenant_id. Contacta al administrador.')
        setSaving(false)
        return
      }

      const tenantId = profile.tenant_id
      let avatarUrl = formData.avatar_url.trim() || null

      if (avatarFile) {
        setUploadingAvatar(true)
        setDebugInfo('📤 Subiendo avatar...')
        avatarUrl = await uploadAvatar(avatarFile)
        setUploadingAvatar(false)
      }

      setDebugInfo('📦 Insertando cliente via RPC...')
      const { data: clientId, error: rpcError } = await supabase.rpc('insert_client_secure', {
        p_name: formData.name.trim(),
        p_email: formData.email.trim() || null,
        p_phone: formData.phone.trim() || null,
        p_avatar_url: avatarUrl,
        p_tenant_id: tenantId
      })

      if (rpcError) {
        setDebugInfo(`❌ Error RPC: ${rpcError.message}`)
        setShowDebug(true)
        setFormError(`Error: ${rpcError.message}`)
        setSaving(false)
        return
      }

      const nuevoClienteLocal: Cliente = {
        id: clientId,
        name: formData.name.trim(),
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        avatar_url: avatarUrl || '',
        is_active: true,
        created_at: new Date().toISOString()
      }

      setClientes(prev => [nuevoClienteLocal, ...prev])
      setSuccess('✅ Cliente agregado correctamente')
      setTimeout(() => setSuccess(null), 3000)
      setShowModal(false)
      resetForm()

    } catch (err: any) {
      setDebugInfo(`❌ Error inesperado: ${err.message}`)
      setShowDebug(true)
      setFormError(err.message || 'Error inesperado')
    } finally {
      setSaving(false)
      setUploadingAvatar(false)
    }
  }

  // Lógica de Métricas Procesadas en Memoria
  const stats = useMemo(() => {
    const total = clientes.length
    const recientes = clientes.filter(c => {
      const diff = (new Date().getTime() - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24)
      return diff <= 30
    }).length
    const vip = Math.round(total * 0.4) // Proporción estimada fija en base a lógica original
    return { total, recientes, vip }
  }, [clientes])

  // Lógica de Filtrado y Segmentación Avanzada
  const filtrados = useMemo(() => {
    let result = clientes.filter((c: Cliente) => 
      c.name?.toLowerCase().includes(search.toLowerCase()) || 
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search)
    )

    if (filterSegment === 'recientes') {
      result = result.filter(c => {
        const diff = (new Date().getTime() - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24)
        return diff <= 30
      })
    } else if (filterSegment === 'vip') {
      // Tomamos el primer 40% alfabéticamente como VIP simulado bajo tu regla original
      const totalVipCount = Math.round(clientes.length * 0.4)
      const vipIds = new Set(clientes.slice(0, totalVipCount).map(c => c.id))
      result = result.filter(c => vipIds.has(c.id))
    }

    return result
  }, [clientes, search, filterSegment])

  // Lógica de Paginación Interna
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filtrados.slice(start, start + ITEMS_PER_PAGE)
  }, [filtrados, currentPage])

  const totalPages = Math.ceil(filtrados.length / ITEMS_PER_PAGE)

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

      <div className="max-w-6xl mx-auto px-4 space-y-5 relative z-10 pt-6">

        {/* CABECERA */}
        <div className="relative overflow-hidden rounded-2xl p-5 md:p-6 shadow-2xl text-white border border-white/10" style={headerGradient}>
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[9px] font-black uppercase tracking-widest text-white/80">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
                Base de Datos del Salón
              </div>
              <h1 className="text-2xl font-serif font-black tracking-tight drop-shadow-sm">Clientes Fresh Nails</h1>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button 
                onClick={handleRefresh} 
                disabled={refreshing} 
                className="p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white transition-all active:scale-95 shadow-lg"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>

              <button 
                onClick={() => { resetForm(); setShowModal(true); }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-stone-900 font-black text-[10px] uppercase tracking-wider shadow-xl hover:bg-[#F0E4DA] transition-all"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3] text-[#D4AF37]" />
                <span>Nueva Cliente</span>
              </button>
            </div>
          </div>
        </div>

        {/* MENSAJES */}
        {error && <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs">{error}</div>}
        {success && <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-xs">{success}</div>}

        {/* KPIS */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Registradas', value: stats.total, icon: UserCheck, color: 'text-[#D4AF37]' },
            { label: 'VIP Activas', value: stats.vip, icon: Crown, color: 'text-[#D4AF37]' },
            { label: 'Nuevas (30d)', value: `+${stats.recientes}`, icon: TrendingUp, color: 'text-[#D4AF37]' }
          ].map((kpi, idx) => (
            <div key={idx} className={`rounded-xl p-2.5 border transition-all duration-300 ${isDark ? 'bg-[#2A1B14] border-[#3D281E]' : 'bg-white border-[#F0E4DA]'}`}>
              <div className="flex items-center gap-2">
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                <div>
                  <p className="text-[7px] font-mono uppercase tracking-wider font-bold opacity-60">{kpi.label}</p>
                  <p className="text-sm font-black">{kpi.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* BUSCADOR Y SEGMENTOS */}
        <div className={`flex flex-wrap items-center gap-3 p-3 rounded-xl border shadow-sm ${isDark ? 'bg-[#2A1B14] border-[#3D281E]' : 'bg-white border-[#F0E4DA]'}`}>
          <div className="flex items-center gap-2 flex-1 min-w-[160px]">
            <Search className="w-4 h-4 opacity-50" />
            <input 
              type="text" 
              placeholder="Buscar por nombre, correo o teléfono..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-xs w-full outline-none"
            />
            {search && <XCircle className="w-4 h-4 cursor-pointer opacity-60" onClick={() => setSearch('')} />}
          </div>

          <div className="w-px h-5 bg-[#F0E4DA] dark:bg-[#3D281E]" />

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 opacity-50" />
            <select 
              value={filterSegment} 
              onChange={(e) => setFilterSegment(e.target.value)}
              className="bg-transparent text-[10px] font-bold uppercase tracking-wider outline-none cursor-pointer"
            >
              <option value="todos">Todos los Segmentos</option>
              <option value="vip">Clientas VIP</option>
              <option value="recientes">Recientes (30 días)</option>
            </select>
          </div>
        </div>

        {/* GRID DE CLIENTES PAGINADO */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 transition-opacity duration-300 ${refreshing ? 'opacity-50' : 'opacity-100'}`}>
          {paginatedItems.map((cliente: Cliente) => (
            <div 
              key={cliente.id} 
              className={`relative overflow-hidden rounded-xl border p-4 shadow-sm transition-all duration-300 group ${
                isDark ? 'bg-[#2A1B14] border-[#3D281E] hover:border-[#D4AF37]/40' : 'bg-white border-[#F0E4DA] hover:border-[#D4AF37]/40'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  {cliente.avatar_url ? (
                    <img src={cliente.avatar_url} alt={cliente.name} className="w-10 h-10 rounded-lg object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0 bg-[#D4AF37]">
                      {cliente.name?.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0">
                    <h3 className="font-medium text-xs truncate group-hover:text-[#D4AF37] transition-colors">{cliente.name}</h3>
                    <span className="text-[7px] font-mono opacity-50 block truncate">ID_{cliente.id.substring(0, 8).toUpperCase()}</span>
                  </div>
                </div>
              </div>

              <hr className={`my-3 ${isDark ? 'border-[#3D281E]' : 'border-[#F0E4DA]'}`} />

              <div className="space-y-1.5 font-mono text-[10px] opacity-80">
                <div className="flex items-center gap-2 truncate"><Mail className="w-3.5 h-3.5 shrink-0 opacity-60" /> <span>{cliente.email || 'sin_correo@nails.com'}</span></div>
                <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 shrink-0 opacity-60" /> <span>{cliente.phone || 'Sin teléfono'}</span></div>
                <div className="flex items-center gap-2 pt-1">
                  <Calendar className="w-3.5 h-3.5 shrink-0 opacity-60" />
                  <span className={`px-1.5 py-0.5 rounded border text-[8px] ${isDark ? 'bg-[#1E120C] border-[#3D281E]' : 'bg-[#FFF9F6] border-[#F0E4DA]'}`}>
                    Alta: {new Date(cliente.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {paginatedItems.length === 0 && (
            <div className="col-span-full text-center py-10 border border-dashed rounded-xl font-mono text-xs opacity-50">
              No se encontraron clientas.
            </div>
          )}
        </div>

        {/* PAGINADOR INFERIOR */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-[10px] opacity-60">Página {currentPage} de {totalPages} ({filtrados.length} clientas)</p>
            <div className="flex items-center gap-2">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-1.5 rounded-lg border disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-1.5 rounded-lg border disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}

        {/* MODAL: NUEVA CLIENTE */}
        {showModal && (
          <div className="fixed inset-0 z-[9999] bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4" onClick={() => { setShowModal(false); resetForm(); }}>
            <div 
              className={`relative w-full max-w-md rounded-2xl border p-6 shadow-2xl max-h-[90vh] overflow-y-auto ${isDark ? 'bg-[#2A1B14] border-[#3D281E]' : 'bg-white border-[#F0E4DA]'}`}
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={() => { setShowModal(false); resetForm(); }} className="absolute top-4 right-4 p-2 opacity-60 hover:opacity-100"><X className="w-5 h-5" /></button>

              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl text-white bg-[#D4AF37]"><User className="w-5 h-5" /></div>
                <h3 className="text-lg font-serif font-extrabold">Nueva Cliente</h3>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* AVATAR UPLOAD */}
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <div className={`w-20 h-20 rounded-full overflow-hidden border-2 flex items-center justify-center ${isDark ? 'bg-[#1E120C] border-[#3D281E]' : 'bg-[#FFF9F6] border-[#F0E4DA]'}`}>
                      {avatarPreview ? <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" /> : <User className="w-8 h-8 opacity-40" />}
                    </div>
                    <div className="absolute -bottom-1 -right-1 flex gap-1">
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="p-1.5 rounded-full bg-[#D4AF37] text-white shadow"><Upload className="w-3 h-3" /></button>
                      <button type="button" onClick={() => {
                        const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*'; input.capture = 'environment';
                        input.onchange = (e) => { if (e.target.files?.length) handleAvatarFileSelect({ target: { files: e.target.files } }) }
                        input.click()
                      }} className="p-1.5 rounded-full bg-[#D4AF37] text-white shadow"><Camera className="w-3 h-3" /></button>
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarFileSelect} className="hidden" />
                  </div>
                  {uploadingAvatar && <p className="text-[10px] text-[#D4AF37] mt-1 animate-pulse">Procesando imagen...</p>}
                </div>

                <div>
                  <label className="block text-[9px] uppercase tracking-wider font-bold mb-1 opacity-70">Nombre Completo *</label>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${isDark ? 'bg-[#1E120C] border-[#3D281E]' : 'bg-[#FFF9F6] border-[#F0E4DA]'}`} required placeholder="Ej: María González" />
                </div>

                <div>
                  <label className="block text-[9px] uppercase tracking-wider font-bold mb-1 opacity-70">Correo Electrónico</label>
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${isDark ? 'bg-[#1E120C] border-[#3D281E]' : 'bg-[#FFF9F6] border-[#F0E4DA]'}`} placeholder="maria@correo.com" />
                </div>

                <div>
                  <label className="block text-[9px] uppercase tracking-wider font-bold mb-1 opacity-70">Teléfono</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${isDark ? 'bg-[#1E120C] border-[#3D281E]' : 'bg-[#FFF9F6] border-[#F0E4DA]'}`} placeholder="099123456" />
                </div>

                {showDebug && debugInfo && (
                  <div className="p-2 rounded-lg border text-[9px] font-mono bg-stone-900 text-stone-300 whitespace-pre-wrap break-all">
                    {debugInfo}
                    <button type="button" onClick={() => setShowDebug(false)} className="block text-[#D4AF37] mt-1 font-bold">Cerrar</button>
                  </div>
                )}

                {formError && <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500 text-xs">{formError}</div>}

                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="flex-1 py-2 rounded-xl border text-xs font-bold uppercase opacity-70">Cancelar</button>
                  <button type="submit" disabled={saving || uploadingAvatar} className="flex-1 py-2 rounded-xl bg-[#D4AF37] text-stone-900 font-bold text-xs uppercase flex items-center justify-center gap-1">
                    {saving || uploadingAvatar ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>Guardar</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
