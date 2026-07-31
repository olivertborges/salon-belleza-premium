// @ts-nocheck
'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/contexts/ThemeContext'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  User,
  Calendar,
  Camera,
  Edit2,
  Save,
  X,
  AlertCircle,
  CheckCircle2,
  Shield,
  Smartphone,
  AtSign,
  UserCircle,
  BadgeCheck,
  Loader2,
  ArrowLeft
} from 'lucide-react'

interface AdminProfile {
  id?: string
  user_id?: string
  full_name?: string
  name?: string
  email: string
  phone?: string
  avatar_url?: string
  role: string
  tenant_id?: string
  created_at: string
  updated_at?: string
}

export default function AdminPerfilPage() {
  const { user } = useAuth()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [profile, setProfile] = useState<AdminProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    full_name: '',
    phone: ''
  })

  const getTargetTable = () => {
    const role = user?.user_metadata?.role || 'staff'
    return role === 'admin' ? 'profiles' : 'staff'
  }

  const getNameColumn = () => {
    return getTargetTable() === 'profiles' ? 'full_name' : 'name'
  }

  const loadProfile = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      setError(null)

      const targetTable = getTargetTable()
      const idColumn = targetTable === 'profiles' ? 'id' : 'user_id'

      const { data, error } = await supabase
        .from(targetTable)
        .select('*')
        .eq(idColumn, user.id)
        .maybeSingle()

      if (error) throw error

      if (data) {
        setProfile(data)
        const currentName = data.full_name || data.name || ''
        setFormData({
          full_name: currentName,
          phone: data.phone || ''
        })
        if (data.avatar_url) {
          setAvatarPreview(data.avatar_url)
        }
      } else {
        setError(`No se encontró el registro en la tabla de ${targetTable}.`)
      }

    } catch (error) {
      console.error('Error cargando perfil:', error)
      setError('Error al cargar los datos del perfil')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.id) {
      loadProfile()
    }
  }, [user?.id])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      setError('La imagen es muy pesada. Máximo 2MB.')
      return
    }

    setAvatarFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    if (!user?.id || !profile) return

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      let avatarUrl = profile.avatar_url
      const targetTable = getTargetTable()
      const idColumn = targetTable === 'profiles' ? 'id' : 'user_id'
      const nameCol = getNameColumn()

      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop()
        // Guardamos directamente en la raíz con el ID del usuario para evitar problemas de carpetas y permisos
        const filePath = `${user.id}-${Date.now()}.${fileExt}`

        console.log('📤 Subiendo avatar al bucket staff:', filePath)

        const { error: uploadError } = await supabase.storage
          .from('staff')
          .upload(filePath, avatarFile, {
            cacheControl: '3600',
            upsert: true
          })

        if (uploadError) {
          throw new Error(`Error al subir la imagen: ${uploadError.message}`)
        }

        const { data: urlData } = supabase.storage
          .from('staff')
          .getPublicUrl(filePath)

        avatarUrl = urlData.publicUrl
        console.log('✅ URL pública generada:', avatarUrl)
      }

      const updatePayload: any = {
        phone: formData.phone?.trim() || null,
        avatar_url: avatarUrl,
      }
      updatePayload[nameCol] = formData.full_name.trim()

      if (targetTable === 'profiles') {
        updatePayload.updated_at = new Date().toISOString()
      }

      const { error: updateError } = await supabase
        .from(targetTable)
        .update(updatePayload)
        .eq(idColumn, user.id)

      if (updateError) {
        throw new Error(`Error en Base de Datos (${targetTable}): ${updateError.message}`)
      }

      setProfile(prev => ({
        ...prev!,
        [nameCol]: formData.full_name.trim(),
        phone: formData.phone?.trim() || null,
        avatar_url: avatarUrl
      }))

      setAvatarFile(null)
      setEditing(false)
      setSuccess('✅ Perfil y foto actualizados correctamente')
      setTimeout(() => setSuccess(null), 3000)

    } catch (err: any) {
      console.error('Error guardando perfil:', err)
      setError(err.message || 'Error al guardar los cambios')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (profile) {
      const currentName = profile.full_name || profile.name || ''
      setFormData({
        full_name: currentName,
        phone: profile.phone || ''
      })
      setAvatarPreview(profile.avatar_url || null)
      setAvatarFile(null)
    }
    setEditing(false)
    setError(null)
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-[60vh] transition-colors duration-500 ${isDark ? 'bg-[#1E120C]' : 'bg-[#FFF9F6]'}`}>
        <div className="flex flex-col items-center gap-6">
          <div className="relative w-16 h-16">
            <div className={`absolute inset-0 rounded-full border ${isDark ? 'border-[#D4AF37]/10' : 'border-[#D4AF37]/20'}`} />
            <div className="absolute inset-0 rounded-full border-t-2 border-[#D4AF37] animate-spin" />
          </div>
          <p className={`text-[10px] tracking-[0.4em] uppercase font-light animate-pulse ${isDark ? 'text-[#FFF9F6]/60' : 'text-[#1A0E0A]/60'}`}>
            Cargando perfil...
          </p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-[60vh] ${isDark ? 'bg-[#1E120C]' : 'bg-[#FFF9F6]'}`}>
        <div className={`rounded-2xl p-8 max-w-md text-center border ${isDark ? 'bg-[#2A1B14] border-[#3D281E]' : 'bg-white border-[#F0E4DA]'}`}>
          <AlertCircle className="w-12 h-12 text-[#D4AF37] mx-auto mb-4" />
          <p className={`text-lg font-bold ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>
            No se encontró tu perfil
          </p>
          <p className={`text-sm mt-2 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>
            {error || 'Por favor, contacta con el administrador del sistema.'}
          </p>
          <Link
            href="/dashboard"
            className={`mt-4 inline-block px-6 py-2 rounded-xl font-bold text-sm transition-colors ${
              isDark 
                ? 'bg-[#D4AF37] text-[#1A0E0A] hover:bg-[#E8D5A0]' 
                : 'bg-[#1A0E0A] text-[#FFF9F6] hover:bg-[#D4AF37] hover:text-[#1A0E0A]'
            }`}
          >
            Volver al Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const displayName = profile.full_name || profile.name || 'Miembro de la App'

  return (
    <div className={`min-h-screen transition-colors duration-500 antialiased pb-16 relative overflow-x-hidden ${
      isDark ? 'bg-[#1E120C] text-[#FFF9F6]' : 'bg-[#FFF9F6] text-[#1A0E0A]'
    }`}>
      <div className="absolute inset-0 pointer-events-none z-0 opacity-10 mix-blend-multiply bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:60px_60px]" />

      <div className="max-w-3xl mx-auto px-4 space-y-8 relative z-10">

        {error && (
          <div className={`flex items-start gap-4 border p-5 rounded-2xl transition-all duration-300 ${
            isDark ? 'bg-[#3D281E]/40 border-[#D4AF37]/30 text-[#FFF9F6]' : 'bg-[#FFF9F6] border-[#D4AF37]/30 text-[#1A0E0A]'
          }`}>
            <div className={`p-2 rounded-xl shrink-0 ${isDark ? 'bg-[#3D281E]' : 'bg-[#FFF9F6]'}`}>
              <AlertCircle className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <div>
              <p className={`text-[9px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>Error</p>
              <p className="text-sm font-light">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className={`flex items-start gap-4 border p-5 rounded-2xl transition-all duration-300 ${
            isDark ? 'bg-[#3D281E]/40 border-[#D4AF37]/30 text-[#FFF9F6]' : 'bg-[#FFF9F6] border-[#D4AF37]/30 text-[#1A0E0A]'
          }`}>
            <div className={`p-2 rounded-xl shrink-0 ${isDark ? 'bg-[#3D281E]' : 'bg-[#FFF9F6]'}`}>
              <CheckCircle2 className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <div>
              <p className={`text-[9px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>Éxito</p>
              <p className="text-sm font-light">{success}</p>
            </div>
          </div>
        )}

        <div className={`relative overflow-hidden rounded-2xl border p-7 md:p-10 shadow-lg transition-all duration-300 mt-4 ${
          isDark 
            ? 'bg-[#2A1B14] border-[#3D281E] shadow-[0_15px_35px_rgba(0,0,0,0.3)]' 
            : 'bg-white border-[#F0E4DA] shadow-[0_15px_35px_rgba(240,228,218,0.6)]'
        }`}>
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute -bottom-32 left-1/4 w-80 h-80 bg-[#D4AF37]/5 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
            <div className="relative group">
              <div className="w-28 h-28 rounded-2xl overflow-hidden border-2 border-[#D4AF37]/40 shadow-lg relative">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center ${isDark ? 'bg-[#3D281E]' : 'bg-[#FFF9F6]'}`}>
                    <UserCircle className="w-16 h-16 text-[#A89588]" />
                  </div>
                )}
              </div>

              {editing && (
                <label className="absolute -bottom-2 -right-2 p-2 rounded-xl cursor-pointer transition-all duration-300 hover:scale-110 shadow-md bg-[#D4AF37] text-[#1A0E0A]">
                  <Camera className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3 flex-wrap">
                <h1 className={`font-serif text-3xl font-light ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>
                  {displayName}
                </h1>
                <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30">
                  <BadgeCheck className="w-3 h-3" />
                  {profile.role || user?.user_metadata?.role || 'Staff'}
                </span>
              </div>

              <p className={`text-sm font-light mt-1 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>
                <Shield className="w-4 h-4 inline mr-1 text-[#D4AF37]" />
                Cuenta de {getTargetTable() === 'profiles' ? 'Administrador' : 'Personal (Staff)'}
              </p>

              <div className="flex flex-wrap items-center gap-4 mt-3">
                <div className={`flex items-center gap-1.5 text-xs ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>
                  <Calendar className="w-4 h-4 text-[#D4AF37]" />
                  Miembro desde {profile.created_at ? new Date(profile.created_at).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  }) : 'Reciente'}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 shrink-0">
              {editing ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95 ${
                      isDark 
                        ? 'bg-[#D4AF37] text-[#1A0E0A] hover:bg-[#E8D5A0]' 
                        : 'bg-[#1A0E0A] text-[#FFF9F6] hover:bg-[#D4AF37] hover:text-[#1A0E0A]'
                    }`}
                  >
                    {saving ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Guardando</>
                    ) : (
                      <><Save className="w-4 h-4" /> Guardar</>
                    )}
                  </button>
                  <button
                    onClick={handleCancel}
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 flex items-center gap-2 border ${
                      isDark 
                        ? 'border-[#3D281E] text-[#A89588] hover:bg-[#3D281E] hover:text-[#FFF9F6]' 
                        : 'border-[#F0E4DA] text-[#5C4A3E] hover:bg-[#F0E4DA] hover:text-[#1A0E0A]'
                    }`}
                  >
                    <X className="w-4 h-4" /> Cancelar
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95 ${
                    isDark 
                      ? 'bg-[#D4AF37] text-[#1A0E0A] hover:bg-[#E8D5A0]' 
                      : 'bg-[#1A0E0A] text-[#FFF9F6] hover:bg-[#D4AF37] hover:text-[#1A0E0A]'
                  }`}
                >
                  <Edit2 className="w-4 h-4" /> Editar Perfil
                </button>
              )}
            </div>
          </div>
        </div>

        <div className={`border rounded-2xl p-6 md:p-8 shadow-sm transition-all duration-300 ${
          isDark ? 'bg-[#2A1B14] border-[#3D281E]' : 'bg-white border-[#F0E4DA]'
        }`}>
          <h2 className={`font-serif text-xl font-light border-b pb-3 mb-6 ${
            isDark ? 'text-[#FFF9F6] border-[#3D281E]' : 'text-[#1A0E0A] border-[#F0E4DA]'
          }`}>
            Información Personal
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={`text-[9px] font-black uppercase tracking-[0.2em] block mb-1.5 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>
                <User className="w-3.5 h-3.5 inline mr-1.5" /> Nombre completo
              </label>
              {editing ? (
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  className={`w-full border rounded-xl px-4 py-2.5 text-sm transition-all duration-300 ${
                    isDark 
                      ? 'bg-[#1E120C] border-[#3D281E] text-[#FFF9F6] focus:border-[#D4AF37]/60' 
                      : 'bg-[#FFF9F6] border-[#F0E4DA] text-[#1A0E0A] focus:border-[#D4AF37]/60'
                  }`}
                  placeholder="Tu nombre completo"
                />
              ) : (
                <p className={`text-sm font-medium ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>
                  {displayName}
                </p>
              )}
            </div>

            <div>
              <label className={`text-[9px] font-black uppercase tracking-[0.2em] block mb-1.5 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>
                <AtSign className="w-3.5 h-3.5 inline mr-1.5" /> Correo electrónico
              </label>
              <p className={`text-sm font-medium ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>
                {profile.email || user?.email || 'No especificado'}
              </p>
            </div>

            <div>
              <label className={`text-[9px] font-black uppercase tracking-[0.2em] block mb-1.5 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>
                <Smartphone className="w-3.5 h-3.5 inline mr-1.5" /> Teléfono
              </label>
              {editing ? (
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`w-full border rounded-xl px-4 py-2.5 text-sm transition-all duration-300 ${
                    isDark 
                      ? 'bg-[#1E120C] border-[#3D281E] text-[#FFF9F6] focus:border-[#D4AF37]/60' 
                      : 'bg-[#FFF9F6] border-[#F0E4DA] text-[#1A0E0A] focus:border-[#D4AF37]/60'
                  }`}
                  placeholder="Tu teléfono"
                />
              ) : (
                <p className={`text-sm font-medium ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>
                  {profile.phone || 'No especificado'}
                </p>
              )}
            </div>

            <div>
              <label className={`text-[9px] font-black uppercase tracking-[0.2em] block mb-1.5 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>
                <Shield className="w-3.5 h-3.5 inline mr-1.5" /> Rol Asignado
              </label>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#D4AF37]/30 text-[#D4AF37]">
                <BadgeCheck className="w-4 h-4" />
                <span className="text-sm font-bold uppercase tracking-wider">
                  {profile.role || user?.user_metadata?.role || 'Staff'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className={`border-t pt-6 ${isDark ? 'border-[#3D281E]' : 'border-[#F0E4DA]'}`}>
          <Link
            href="/dashboard"
            className={`inline-flex items-center gap-2 text-xs font-medium transition-colors ${
              isDark ? 'text-[#A89588] hover:text-[#D4AF37]' : 'text-[#5C4A3E] hover:text-[#D4AF37]'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al Dashboard
          </Link>
        </div>

      </div>
    </div>
  )
}
