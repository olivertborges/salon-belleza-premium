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
  RefreshCw,
  Terminal,
  Trash2,
  Copy
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

interface LogEntry {
  id: string
  time: string
  type: 'info' | 'success' | 'error' | 'warn'
  message: string
  details?: any
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
  const [activeTable, setActiveTable] = useState<string>('profiles')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  // System Logs visuales
  const [logs, setLogs] = useState<LogEntry[]>([])

  const addLog = (message: string, type: 'info' | 'success' | 'error' | 'warn' = 'info', details?: any) => {
    const time = new Date().toLocaleTimeString('es-ES', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 })
    const newEntry: LogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      time,
      type,
      message,
      details
    }
    setLogs(prev => [newEntry, ...prev])
  }

  const [formData, setFormData] = useState({
    full_name: '',
    phone: ''
  })

  const uploadAvatar = async (file: File, path: string): Promise<string> => {
    addLog(`[STORAGE] Iniciando subida de archivo: ${file.name}`, 'info', {
      type: file.type,
      sizeBytes: file.size,
      pathDestino: path
    })

    try {
      addLog(`[STORAGE] Ejecutando supabase.storage.from('staff').upload('${path}')`, 'info')
      
      const { data, error: uploadError } = await supabase.storage
        .from('staff')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        addLog(`[STORAGE ERROR] Falló la subida`, 'error', {
          name: uploadError.name,
          message: uploadError.message,
          errorObj: uploadError
        })
        throw uploadError
      }

      addLog(`[STORAGE SUCCESS] Archivo subido con éxito`, 'success', data)

      const { data: publicUrlData } = supabase.storage
        .from('staff')
        .getPublicUrl(path)

      addLog(`[STORAGE] URL Pública obtenida: ${publicUrlData.publicUrl}`, 'info')
      return publicUrlData.publicUrl

    } catch (err: any) {
      addLog(`[CATCH STORAGE] Excepción detectada en uploadAvatar`, 'error', {
        errorMessage: err?.message || String(err),
        errorCause: err?.cause,
        errorStack: err?.stack,
        fullErrorObject: err
      })
      throw err
    }
  }

  const loadProfile = async () => {
    if (!user?.id) {
      addLog('No se encontró ID de usuario en la sesión de Auth', 'warn')
      return
    }

    try {
      setLoading(true)
      setError(null)
      addLog(`[INIT] Cargando perfil para usuario ID: ${user.id}`, 'info')

      // 1. Intentar 'profiles'
      addLog(`[DB] Consultando tabla 'profiles' para ID: ${user.id}...`, 'info')
      let { data: profileData, error: profErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (profErr) {
        addLog(`[DB WARN] Error leyendo 'profiles'`, 'warn', profErr)
      }

      if (profileData) {
        addLog(`[DB SUCCESS] Encontrado en 'profiles'`, 'success', profileData)
        setActiveTable('profiles')
        const avatar = profileData.avatar_url || user.user_metadata?.avatar_url || null
        setProfile({ ...profileData, avatar_url: avatar })
        setFormData({
          full_name: profileData.full_name || profileData.name || '',
          phone: profileData.phone || ''
        })
        setAvatarPreview(avatar)
        setLoading(false)
        return
      }

      // 2. Intentar 'staff'
      addLog(`[DB] No estaba en 'profiles'. Buscando en tabla 'staff'...`, 'info')
      let { data: staffData, error: staffErr } = await supabase
        .from('staff')
        .select('*')
        .or(`user_id.eq.${user.id},auth_user_id.eq.${user.id},id.eq.${user.id}`)
        .maybeSingle()

      if (staffErr) {
        addLog(`[DB WARN] Error leyendo 'staff'`, 'warn', staffErr)
      }

      if (staffData) {
        addLog(`[DB SUCCESS] Encontrado en 'staff'`, 'success', staffData)
        setActiveTable('staff')
        const avatar = staffData.avatar_url || user.user_metadata?.avatar_url || null
        setProfile({ ...staffData, avatar_url: avatar })
        setFormData({
          full_name: staffData.name || staffData.full_name || '',
          phone: staffData.phone || ''
        })
        setAvatarPreview(avatar)
        setLoading(false)
        return
      }

      // 3. Respaldo por email
      if (user.email) {
        addLog(`[DB] Buscando en 'staff' por email (${user.email})...`, 'info')
        let { data: staffByEmail } = await supabase
          .from('staff')
          .select('*')
          .eq('email', user.email)
          .maybeSingle()

        if (staffByEmail) {
          addLog(`[DB SUCCESS] Encontrado por email en 'staff'`, 'success', staffByEmail)
          setActiveTable('staff')
          const avatar = staffByEmail.avatar_url || user.user_metadata?.avatar_url || null
          setProfile({ ...staffByEmail, avatar_url: avatar })
          setFormData({
            full_name: staffByEmail.name || staffByEmail.full_name || '',
            phone: staffByEmail.phone || ''
          })
          setAvatarPreview(avatar)
          setLoading(false)
          return
        }
      }

      // 4. Fallback Auth
      addLog(`[DB] No existe en tablas. Usando metadatos de Auth`, 'warn')
      const fallbackProfile: AdminProfile = {
        id: user.id,
        user_id: user.id,
        email: user.email || '',
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Staff',
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Staff',
        role: user.user_metadata?.role || 'staff',
        avatar_url: user.user_metadata?.avatar_url || null,
        created_at: new Date().toISOString()
      }

      setActiveTable('staff')
      setProfile(fallbackProfile)
      setFormData({
        full_name: fallbackProfile.full_name,
        phone: ''
      })
      setAvatarPreview(fallbackProfile.avatar_url)

    } catch (err: any) {
      addLog(`[ERROR FATAL] Excepción en loadProfile`, 'error', {
        message: err?.message,
        errObj: err
      })
      setError('Error al conectar con la base de datos: ' + (err.message || String(err)))
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

    addLog(`Archivo de imagen seleccionado: ${file.name} (${file.type}, ${file.size} bytes)`, 'info')

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
    if (!validTypes.includes(file.type)) {
      setError('Formato de imagen no válido.')
      addLog('Validación fallida: Formato no soportado', 'error')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen es muy pesada. Máximo 5MB.')
      addLog('Validación fallida: Archivo > 5MB', 'error')
      return
    }

    setAvatarFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
    setError(null)
  }

  const handleSave = async () => {
    if (!user?.id || !profile) return

    setSaving(true)
    setUploadingAvatar(true)
    setError(null)
    setSuccess(null)
    addLog(`=== INICIANDO PROCESO DE GUARDADO ===`, 'info')

    try {
      let avatarUrl = profile.avatar_url

      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop()
        const fileName = `${user.id}-${Date.now()}.${fileExt}`
        const filePath = `${user.id}/${fileName}`

        addLog(`Subiendo avatar a la ruta: ${filePath}`, 'info')
        avatarUrl = await uploadAvatar(avatarFile, filePath)
      } else {
        addLog(`No se seleccionó nueva foto, conservando URL anterior: ${avatarUrl}`, 'info')
      }

      const isProfiles = activeTable === 'profiles'
      const updatePayload: Record<string, any> = {
        phone: formData.phone?.trim() || null,
        avatar_url: avatarUrl,
      }

      addLog(`Actualizando en tabla '${activeTable}'...`, 'info', updatePayload)

      if (isProfiles) {
        updatePayload.full_name = formData.full_name.trim()
        updatePayload.updated_at = new Date().toISOString()

        const { error: profileError } = await supabase
          .from('profiles')
          .update(updatePayload)
          .eq('id', user.id)

        if (profileError) throw profileError
      } else {
        updatePayload.name = formData.full_name.trim()

        let { error: staffError } = await supabase
          .from('staff')
          .update(updatePayload)
          .or(`user_id.eq.${user.id},auth_user_id.eq.${user.id},id.eq.${profile.id || user.id}`)

        if (staffError) {
          addLog(`Falló actualización primaria en 'staff', reintentando por email...`, 'warn', staffError)
          if (user.email) {
            const { error: retryError } = await supabase
              .from('staff')
              .update(updatePayload)
              .eq('email', user.email)

            if (retryError) throw retryError
          }
        }
      }

      addLog(`Actualización en Base de Datos finalizada correctamente`, 'success')

      // Sincronizar metadatos de usuario
      addLog(`Sincronizando Auth Metadata del usuario...`, 'info')
      await supabase.auth.updateUser({
        data: {
          avatar_url: avatarUrl,
          full_name: formData.full_name.trim()
        }
      }).then(() => addLog(`Auth Metadata sincronizada`, 'success'))
        .catch(err => addLog(`Aviso Auth Metadata: ${err.message}`, 'warn'))

      setProfile(prev => ({
        ...prev!,
        full_name: formData.full_name.trim(),
        name: formData.full_name.trim(),
        phone: formData.phone?.trim() || null,
        avatar_url: avatarUrl
      }))

      setAvatarPreview(avatarUrl)
      setAvatarFile(null)
      setEditing(false)
      setSuccess('✅ Perfil y foto actualizados correctamente')
      addLog(`=== PROCESO COMPLETADO EXITOSAMENTE ===`, 'success')

    } catch (err: any) {
      addLog(`=== ERROR EN GUARDADO ===`, 'error', {
        message: err?.message || String(err),
        name: err?.name,
        errObj: err
      })
      setError(err.message || 'Error al guardar los cambios')
    } finally {
      setSaving(false)
      setUploadingAvatar(false)
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
    addLog(`Edición cancelada`, 'info')
  }

  const copyLogsToClipboard = () => {
    const text = logs.map(l => `[${l.time}] [${l.type.toUpperCase()}] ${l.message} ${l.details ? JSON.stringify(l.details) : ''}`).join('\n')
    navigator.clipboard.writeText(text)
    alert('Logs copiados al portapapeles')
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-[60vh] ${isDark ? 'bg-[#1E120C]' : 'bg-[#FFF9F6]'}`}>
        <div className="flex flex-col items-center gap-6">
          <Loader2 className="w-10 h-10 text-[#D4AF37] animate-spin" />
          <p className="text-xs uppercase tracking-widest text-[#D4AF37]">Cargando perfil y conexiones...</p>
        </div>
      </div>
    )
  }

  const displayName = profile?.full_name || profile?.name || user?.email?.split('@')[0] || 'Miembro'

  return (
    <div className={`min-h-screen pb-16 relative overflow-x-hidden ${isDark ? 'bg-[#1E120C] text-[#FFF9F6]' : 'bg-[#FFF9F6] text-[#1A0E0A]'}`}>
      <div className="max-w-3xl mx-auto px-4 space-y-8 mt-6">

        {error && (
          <div className="flex items-start gap-4 border border-red-500/40 bg-red-500/10 p-5 rounded-2xl text-red-500">
            <AlertCircle className="w-6 h-6 shrink-0" />
            <div>
              <p className="font-bold text-xs uppercase tracking-wider">Error detectado</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-4 border border-green-500/40 bg-green-500/10 p-5 rounded-2xl text-green-500">
            <CheckCircle2 className="w-6 h-6 shrink-0" />
            <div>
              <p className="font-bold text-xs uppercase tracking-wider">Éxito</p>
              <p className="text-sm mt-1">{success}</p>
            </div>
          </div>
        )}

        {/* Card Principal */}
        <div className={`rounded-2xl border p-6 md:p-8 ${isDark ? 'bg-[#2A1B14] border-[#3D281E]' : 'bg-white border-[#F0E4DA]'}`}>
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative">
              <div className="w-28 h-28 rounded-2xl overflow-hidden border-2 border-[#D4AF37]/40 relative">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-stone-800 text-stone-400">
                    <UserCircle className="w-16 h-16" />
                  </div>
                )}
                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  </div>
                )}
              </div>

              {editing && !uploadingAvatar && (
                <label className="absolute -bottom-2 -right-2 p-2.5 rounded-xl cursor-pointer bg-[#D4AF37] text-[#1A0E0A] hover:scale-110 transition-transform">
                  <Camera className="w-4 h-4" />
                  <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                </label>
              )}
            </div>

            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl font-bold">{displayName}</h1>
              <p className="text-xs opacity-70 mt-1">Tabla activa: <span className="font-mono text-[#D4AF37]">{activeTable}</span></p>
            </div>

            <div className="flex gap-2">
              {editing ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={saving || uploadingAvatar}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#D4AF37] text-[#1A0E0A] hover:opacity-90 flex items-center gap-2"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Guardar
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={saving || uploadingAvatar}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold border border-stone-600 flex items-center gap-2"
                  >
                    <X className="w-4 h-4" /> Cancelar
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#D4AF37] text-[#1A0E0A] hover:opacity-90 flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4" /> Editar Perfil
                </button>
              )}
            </div>
          </div>

          {/* Formulario de Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-stone-700/40">
            <div>
              <label className="text-[10px] uppercase font-bold tracking-wider opacity-70 block mb-1">Nombre</label>
              {editing ? (
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  className={`w-full p-2.5 rounded-xl border text-sm ${isDark ? 'bg-[#1E120C] border-[#3D281E]' : 'bg-[#FFF9F6] border-[#F0E4DA]'}`}
                />
              ) : (
                <p className="text-sm font-semibold">{displayName}</p>
              )}
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold tracking-wider opacity-70 block mb-1">Teléfono</label>
              {editing ? (
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`w-full p-2.5 rounded-xl border text-sm ${isDark ? 'bg-[#1E120C] border-[#3D281E]' : 'bg-[#FFF9F6] border-[#F0E4DA]'}`}
                />
              ) : (
                <p className="text-sm font-semibold">{profile?.phone || 'No especificado'}</p>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CONSOLA DE LOGS VISUALES EN PANTALLA (DEBUGGING TERMINAL)                   */}
        {/* ========================================================================= */}
        <div className="rounded-2xl border border-stone-800 bg-[#0F0A08] text-stone-200 p-5 shadow-2xl font-mono text-xs">
          <div className="flex items-center justify-between border-b border-stone-800 pb-3 mb-3">
            <div className="flex items-center gap-2 text-[#D4AF37]">
              <Terminal className="w-4 h-4" />
              <span className="font-bold text-xs uppercase tracking-widest">Logs de depuración en vivo</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={copyLogsToClipboard}
                className="px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-[10px] flex items-center gap-1 transition-colors"
                title="Copiar logs"
              >
                <Copy className="w-3 h-3" /> Copiar
              </button>
              <button
                onClick={() => setLogs([])}
                className="px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-[10px] text-red-400 flex items-center gap-1 transition-colors"
                title="Limpiar logs"
              >
                <Trash2 className="w-3 h-3" /> Limpiar
              </button>
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto space-y-2 pr-2 scrollbar-thin">
            {logs.length === 0 ? (
              <p className="text-stone-600 italic">No hay logs registrados aún. Realiza una acción para ver los detalles aquí.</p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="p-2 rounded bg-black/40 border border-stone-800/60 leading-relaxed">
                  <div className="flex items-center gap-2">
                    <span className="text-stone-500 text-[10px]">{log.time}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                      log.type === 'error' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                      log.type === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                      log.type === 'warn' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                      'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}>
                      {log.type}
                    </span>
                    <span className="font-medium text-stone-200">{log.message}</span>
                  </div>

                  {log.details && (
                    <pre className="mt-1.5 p-2 rounded bg-black/80 text-[11px] text-stone-400 overflow-x-auto whitespace-pre-wrap border border-stone-900">
                      {typeof log.details === 'object' ? JSON.stringify(log.details, null, 2) : String(log.details)}
                    </pre>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
