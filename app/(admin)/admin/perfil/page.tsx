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
  ArrowLeft,
  Info
} from 'lucide-react'

export default function AdminPerfilPage() {
  const { user } = useAuth()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [debugLog, setDebugLog] = useState<string | null>(null) // NUEVO: Para ver logs en pantalla
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

      setDebugLog(`Cargando desde tabla: ${targetTable} con ID: ${user.id}`)

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
        setDebugLog(null)
      } else {
        setError(`No se encontró registro en ${targetTable} para tu usuario.`)
      }
    } catch (err: any) {
      setError(`Error al cargar: ${err.message}`)
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
    setDebugLog('Iniciando proceso de guardado...')

    try {
      let avatarUrl = profile.avatar_url
      const targetTable = getTargetTable()
      const idColumn = targetTable === 'profiles' ? 'id' : 'user_id'
      const nameCol = getNameColumn()

      // Si seleccionó una nueva foto, la subimos
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop()
        const filePath = `${user.id}-${Date.now()}.${fileExt}`
        
        setDebugLog(`Subiendo imagen al bucket 'staff' (${filePath})...`)

        const { error: uploadError } = await supabase.storage
          .from('staff')
          .upload(filePath, avatarFile, {
            cacheControl: '3600',
            upsert: true
          })

        if (uploadError) {
          throw new Error(`Error en Storage (Subida): ${uploadError.message}`)
        }

        const { data: urlData } = supabase.storage
          .from('staff')
          .getPublicUrl(filePath)

        avatarUrl = urlData.publicUrl
        setDebugLog(`Imagen subida con éxito. URL: ${avatarUrl}`)
      }

      const updatePayload: any = {
        phone: formData.phone?.trim() || null,
        avatar_url: avatarUrl,
      }
      updatePayload[nameCol] = formData.full_name.trim()

      if (targetTable === 'profiles') {
        updatePayload.updated_at = new Date().toISOString()
      }

      setDebugLog(`Actualizando base de datos en tabla '${targetTable}'...`)

      const { error: updateError } = await supabase
        .from(targetTable)
        .update(updatePayload)
        .eq(idColumn, user.id)

      if (updateError) {
        throw new Error(`Error en Base de Datos: ${updateError.message}`)
      }

      setProfile((prev: any) => ({
        ...prev,
        [nameCol]: formData.full_name.trim(),
        phone: formData.phone?.trim() || null,
        avatar_url: avatarUrl
      }))

      setAvatarFile(null)
      setEditing(false)
      setDebugLog(null)
      setSuccess('✅ ¡Guardado exitoso!')
      setTimeout(() => setSuccess(null), 4000)

    } catch (err: any) {
      console.error(err)
      setError(err.message)
      setDebugLog('❌ Proceso interrumpido por error.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || profile.name || '',
        phone: profile.phone || ''
      })
      setAvatarPreview(profile.avatar_url || null)
      setAvatarFile(null)
    }
    setEditing(false)
    setError(null)
    setDebugLog(null)
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-[60vh] ${isDark ? 'bg-[#1E120C]' : 'bg-[#FFF9F6]'}`}>
        <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
      </div>
    )
  }

  const displayName = profile?.full_name || profile?.name || 'Miembro'

  return (
    <div className={`min-h-screen p-4 pb-16 ${isDark ? 'bg-[#1E120C] text-[#FFF9F6]' : 'bg-[#FFF9F6] text-[#1A0E0A]'}`}>
      <div className="max-w-xl mx-auto space-y-6">

        {/* REGISTRO VISUAL EN PANTALLA (DEBUG LOG) */}
        {debugLog && (
          <div className="bg-amber-500/20 border border-amber-500/40 text-amber-300 p-4 rounded-xl text-xs flex items-start gap-3">
            <Info className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
            <div>
              <p className="font-bold uppercase tracking-wider text-[10px]">Estado en tiempo real:</p>
              <p className="mt-1 font-mono">{debugLog}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-500/20 border border-red-500/40 text-red-300 p-4 rounded-xl text-xs flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold uppercase tracking-wider text-[10px]">Error detectado</p>
              <p className="mt-1">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-500/20 border border-green-500/40 text-green-300 p-4 rounded-xl text-xs flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <p>{success}</p>
          </div>
        )}

        {/* Tarjeta de Perfil */}
        <div className={`border p-6 rounded-2xl ${isDark ? 'bg-[#2A1B14] border-[#3D281E]' : 'bg-white border-[#F0E4DA]'}`}>
          <div className="flex flex-col items-center text-center gap-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-[#D4AF37]/40">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-black/20">
                    <UserCircle className="w-12 h-12 text-[#A89588]" />
                  </div>
                )}
              </div>

              {editing && (
                <label className="absolute -bottom-2 -right-2 p-2 rounded-xl cursor-pointer bg-[#D4AF37] text-[#1A0E0A] shadow-lg">
                  <Camera className="w-4 h-4" />
                  <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                </label>
              )}
            </div>

            <div>
              <h1 className="text-xl font-serif">{displayName}</h1>
              <p className="text-xs text-[#A89588] mt-1">{profile?.email || user?.email}</p>
            </div>

            <div className="flex gap-2 w-full mt-2">
              {editing ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 py-2.5 rounded-xl bg-[#D4AF37] text-[#1A0E0A] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Guardar
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2.5 rounded-xl border border-[#3D281E] text-xs font-bold uppercase"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="w-full py-2.5 rounded-xl bg-[#D4AF37] text-[#1A0E0A] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  <Edit2 className="w-4 h-4" /> Editar Perfil
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Inputs de edición */}
        {editing && (
          <div className={`border p-6 rounded-2xl space-y-4 ${isDark ? 'bg-[#2A1B14] border-[#3D281E]' : 'bg-white border-[#F0E4DA]'}`}>
            <div>
              <label className="text-[10px] uppercase font-bold text-[#A89588] block mb-1">Nombre</label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                className="w-full border rounded-xl p-3 text-sm bg-transparent border-[#3D281E]"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-[#A89588] block mb-1">Teléfono</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full border rounded-xl p-3 text-sm bg-transparent border-[#3D281E]"
              />
            </div>
          </div>
        )}

        <div className="pt-2">
          <Link href="/dashboard" className="text-xs text-[#A89588] flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Volver al Dashboard
          </Link>
        </div>

      </div>
    </div>
  )
}
