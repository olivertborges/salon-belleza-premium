'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Camera,
  Edit2,
  Save,
  X,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Gem,
  Award,
  Calendar as CalendarIcon,
  LogOut,
  ArrowRight,
  Smartphone,
  AtSign,
  UserCircle,
  BadgeCheck,
  Loader2
} from 'lucide-react'

interface ClientProfile {
  id: string
  name: string
  email: string
  phone: string
  birth_date?: string
  address?: string
  avatar_url?: string
  created_at: string
  referral_code?: string
  points_glow: number
  points_hair: number
  total_appointments: number
  vip_level: string
}

const PerfilLoadingSpinner = ({ isDark }: { isDark: boolean }) => (
  <div className={`flex items-center justify-center min-h-[60vh] transition-colors duration-500 ${isDark ? 'bg-[#1E120C]' : 'bg-[#FFF9F6]'}`}>
    <div className="flex flex-col items-center gap-6">
      <div className="relative w-16 h-16">
        <div className={`absolute inset-0 rounded-full border ${isDark ? 'border-[#D4AF37]/10' : 'border-[#D4AF37]/20'}`} />
        <div className="absolute inset-0 rounded-full border-t-2 border-[#D4AF37] animate-spin" />
      </div>
      <p className={`text-[10px] tracking-[0.4em] uppercase font-light animate-pulse ${isDark ? 'text-[#FFF9F6]/60' : 'text-[#1A0E0A]/60'}`}>
        Cargando tu perfil...
      </p>
    </div>
  </div>
)

export default function PerfilPage() {
  const { user, signOut } = useAuth()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [profile, setProfile] = useState<ClientProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    birth_date: '',
    address: ''
  })

  const loadProfile = useCallback(async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // 1. Obtener datos del cliente (Casting as any para evitar restricciones estrictas de tipo en build)
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('auth_user_id', user.id)
        .maybeSingle() as any

      if (clientError) {
        console.error('Error cargando cliente:', clientError)
        setError('Error al cargar los datos del perfil')
        setLoading(false)
        return
      }

      if (!clientData) {
        setError('No se encontró tu perfil. Contacta con el administrador.')
        setLoading(false)
        return
      }

      // 2. Obtener puntos de loyalty_wallets
      const { data: walletData, error: walletError } = await supabase
        .from('loyalty_wallets')
        .select('glow_points, hair_points, glow_level, hair_level')
        .eq('client_id', clientData.id)
        .maybeSingle() as any

      if (walletError) {
        console.error('Error cargando wallet:', walletError)
      }

      // 3. Contar citas totales del cliente
      const { count: appointmentsCount, error: countError } = await supabase
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', clientData.id)
        .neq('status', 'cancelled')

      if (countError) {
        console.error('Error contando citas:', countError)
      }

      // 4. Construir perfil completo
      const fullProfile: ClientProfile = {
        id: clientData.id,
        name: clientData.name || '',
        email: clientData.email || '',
        phone: clientData.phone || '',
        birth_date: clientData.birth_date || '',
        address: clientData.address || '',
        avatar_url: clientData.avatar_url || user?.user_metadata?.avatar_url || '',
        created_at: clientData.created_at || new Date().toISOString(),
        referral_code: clientData.referral_code || '',
        points_glow: walletData?.glow_points || 0,
        points_hair: walletData?.hair_points || 0,
        total_appointments: appointmentsCount || 0,
        vip_level: walletData?.glow_level || 'Bronce'
      }

      setProfile(fullProfile)
      setFormData({
        name: clientData.name || '',
        phone: clientData.phone || '',
        birth_date: clientData.birth_date || '',
        address: clientData.address || ''
      })

      if (fullProfile.avatar_url) {
        setAvatarPreview(fullProfile.avatar_url)
      }

    } catch (error) {
      console.error('Error cargando perfil:', error)
      setError('Error al cargar los datos del perfil')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

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

      // Subida de imagen al BUCKET 'clients'
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop()
        const fileName = `${user.id}-${Date.now()}.${fileExt}`
        const filePath = `avatars/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('clients')
          .upload(filePath, avatarFile, { cacheControl: '3600', upsert: true })

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('clients')
          .getPublicUrl(filePath)

        avatarUrl = publicUrl
      }

      // CORRECCIÓN AQUÍ: Guardamos los datos omitiendo por completo la columna 'address'
      const { error: updateError } = await supabase
        .from('clients')
        .update({
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          birth_date: formData.birth_date || null,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)

      if (updateError) throw updateError

      // Sincronizar metadatos de Autenticación
      const { error: authUpdateError } = await supabase.auth.updateUser({
        data: {
          full_name: formData.name.trim(),
          avatar_url: avatarUrl
        }
      })

      if (authUpdateError) {
        console.warn('Advertencia en actualización de Auth:', authUpdateError.message)
      }

      setProfile(prev => ({
        ...prev!,
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        birth_date: formData.birth_date || undefined,
        avatar_url: avatarUrl
      }))

      setAvatarFile(null)
      setEditing(false)
      setSuccess('✅ Perfil actualizado correctamente')
      
      setTimeout(() => {
        setSuccess(null)
        window.location.reload()
      }, 1500)

    } catch (err: any) {
      console.error('Error guardando perfil:', err)
      setError(`Error al guardar los cambios: ${err.message || 'Error de sincronización'}`)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        phone: profile.phone || '',
        birth_date: profile.birth_date || '',
        address: profile.address || ''
      })
      setAvatarPreview(profile.avatar_url || null)
      setAvatarFile(null)
    }
    setEditing(false)
    setError(null)
  }

  const handleLogout = async () => {
    try {
      if (signOut) await signOut()
      await supabase.auth.signOut()
      localStorage.clear()
      sessionStorage.clear()
      setTimeout(() => {
        window.location.href = '/login'
      }, 100)
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
  }

  if (loading) {
    return <PerfilLoadingSpinner isDark={isDark} />
  }

  if (!profile) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-[60vh] ${
        isDark ? 'bg-[#1E120C]' : 'bg-[#FFF9F6]'
      }`}>
        <div className={`rounded-2xl p-8 max-w-md text-center border ${
          isDark ? 'bg-[#2A1B14] border-[#3D281E]' : 'bg-white border-[#F0E4DA]'
        }`}>
          <AlertCircle className="w-12 h-12 text-[#D4AF37] mx-auto mb-4" />
          <p className={`text-lg font-bold ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>
            No se encontró tu perfil
          </p>
          <p className={`text-sm mt-2 ${isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'}`}>
            Por favor, contacta con el administrador.
          </p>
          <Link
            href="/portal"
            className={`mt-4 inline-block px-6 py-2 rounded-xl font-bold text-sm transition-colors ${
              isDark 
                ? 'bg-[#D4AF37] text-[#1A0E0A] hover:bg-[#E8D5A0]' 
                : 'bg-[#1A0E0A] text-[#FFF9F6] hover:bg-[#D4AF37] hover:text-[#1A0E0A]'
            }`}
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen transition-colors duration-500 antialiased pb-16 relative overflow-x-hidden ${
      isDark ? 'bg-[#1E120C] text-[#FFF9F6]' : 'bg-[#FFF9F6] text-[#1A0E0A]'
    }`}>
      <div className="absolute inset-0 pointer-events-none z-0 opacity-10 mix-blend-multiply bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:60px_60px]" />

      <div className="max-w-4xl mx-auto px-4 space-y-8 relative z-10">

        {error && (
          <div className={`flex items-start gap-4 border p-5 rounded-2xl transition-all duration-300 ${
            isDark 
              ? 'bg-[#3D281E]/40 border-[#D4AF37]/30 text-[#FFF9F6]' 
              : 'bg-[#FFF9F6] border-[#D4AF37]/30 text-[#1A0E0A]'
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
            isDark 
              ? 'bg-[#3D281E]/40 border-[#D4AF37]/30 text-[#FFF9F6]' 
              : 'bg-[#FFF9F6] border-[#D4AF37]/30 text-[#1A0E0A]'
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

        {/* HERO DEL PERFIL */}
        <div className={`relative overflow-hidden rounded-2xl border p-7 md:p-10 shadow-lg transition-all duration-300 mt-4 ${
          isDark 
            ? 'bg-[#2A1B14] border-[#3D281E] shadow-[0_15px_35px_rgba(0,0,0,0.3)]' 
            : 'bg-white border-[#F0E4DA] shadow-[0_15px_35px_rgba(240,228,218,0.6)]'
        }`}>
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute -bottom-32 left-1/4 w-80 h-80 bg-[#D4AF37]/5 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="relative group">
              <div className={`w-28 h-28 rounded-2xl overflow-hidden border-2 ${
                isDark ? 'border-[#D4AF37]/40' : 'border-[#D4AF37]/40'
              } shadow-lg`}>
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center ${
                    isDark ? 'bg-[#3D281E]' : 'bg-[#FFF9F6]'
                  }`}>
                    <UserCircle className="w-16 h-16 text-[#A89588]" />
                  </div>
                )}
              </div>

              {editing && (
                <label className={`absolute bottom-0 right-0 p-2 rounded-xl cursor-pointer transition-all duration-300 hover:scale-110 ${
                  isDark ? 'bg-[#D4AF37] text-[#1A0E0A]' : 'bg-[#D4AF37] text-[#1A0E0A]'
                }`}>
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

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3 flex-wrap">
                <h1 className={`font-serif text-3xl font-light ${
                  isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'
                }`}>
                  {profile.name || 'Cliente'}
                </h1>
                <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30">
                  <BadgeCheck className="w-3 h-3" />
                  {profile.vip_level || 'VIP'}
                </span>
              </div>

              <p className={`text-sm font-light mt-1 ${
                isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
              }`}>
                Miembro desde {new Date(profile.created_at).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>

              <div className="flex flex-wrap items-center gap-4 mt-3">
                <div className={`flex items-center gap-1.5 text-xs ${
                  isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
                }`}>
                  <Gem className="w-4 h-4 text-[#D4AF37]" />
                  <span className="font-bold text-[#D4AF37]">{profile.points_glow || 0}</span> Glow pts
                </div>
                <div className={`flex items-center gap-1.5 text-xs ${
                  isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
                }`}>
                  <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                  <span className="font-bold text-[#D4AF37]">{profile.points_hair || 0}</span> Hair pts
                </div>
                <div className={`flex items-center gap-1.5 text-xs ${
                  isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
                }`}>
                  <CalendarIcon className="w-4 h-4 text-[#D4AF37]" />
                  <span className="font-bold text-[#D4AF37]">{profile.total_appointments || 0}</span> Citas
                </div>
              </div>
            </div>

            {/* Botones */}
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
                <>
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
                  <button
                    onClick={handleLogout}
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 flex items-center gap-2 border ${
                      isDark 
                        ? 'border-[#3D281E] text-[#A89588] hover:bg-[#3D281E] hover:text-[#FFF9F6]' 
                        : 'border-[#F0E4DA] text-[#5C4A3E] hover:bg-[#F0E4DA] hover:text-[#1A0E0A]'
                    }`}
                  >
                    <LogOut className="w-4 h-4" /> Cerrar Sesión
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* INFORMACIÓN DEL PERFIL */}
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
              <label className={`text-[9px] font-black uppercase tracking-[0.2em] block mb-1.5 ${
                isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
              }`}>
                <User className="w-3.5 h-3.5 inline mr-1.5" /> Nombre completo
              </label>
              {editing ? (
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full border rounded-xl px-4 py-2.5 text-sm transition-all duration-300 ${
                    isDark 
                      ? 'bg-[#1E120C] border-[#3D281E] text-[#FFF9F6] focus:border-[#D4AF37]/60' 
                      : 'bg-[#FFF9F6] border-[#F0E4DA] text-[#1A0E0A] focus:border-[#D4AF37]/60'
                  }`}
                  placeholder="Tu nombre"
                />
              ) : (
                <p className={`text-sm font-medium ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>
                  {profile.name || 'No especificado'}
                </p>
              )}
            </div>

            <div>
              <label className={`text-[9px] font-black uppercase tracking-[0.2em] block mb-1.5 ${
                isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
              }`}>
                <AtSign className="w-3.5 h-3.5 inline mr-1.5" /> Correo electrónico
              </label>
              <p className={`text-sm font-medium ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>
                {profile.email || user?.email || 'No especificado'}
              </p>
            </div>

            <div>
              <label className={`text-[9px] font-black uppercase tracking-[0.2em] block mb-1.5 ${
                isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
              }`}>
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
              <label className={`text-[9px] font-black uppercase tracking-[0.2em] block mb-1.5 ${
                isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
              }`}>
                <Calendar className="w-3.5 h-3.5 inline mr-1.5" /> Fecha de nacimiento
              </label>
              {editing ? (
                <input
                  type="date"
                  name="birth_date"
                  value={formData.birth_date}
                  onChange={handleInputChange}
                  className={`w-full border rounded-xl px-4 py-2.5 text-sm transition-all duration-300 ${
                    isDark 
                      ? 'bg-[#1E120C] border-[#3D281E] text-[#FFF9F6] focus:border-[#D4AF37]/60' 
                      : 'bg-[#FFF9F6] border-[#F0E4DA] text-[#1A0E0A] focus:border-[#D4AF37]/60'
                  }`}
                />
              ) : (
                <p className={`text-sm font-medium ${isDark ? 'text-[#FFF9F6]' : 'text-[#1A0E0A]'}`}>
                  {profile.birth_date ? new Date(profile.birth_date).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  }) : 'No especificado'}
                </p>
              )}
            </div>
          </div>

          {profile.referral_code && (
            <div className={`mt-6 pt-6 border-t ${
              isDark ? 'border-[#3D281E]' : 'border-[#F0E4DA]'
            }`}>
              <label className={`text-[9px] font-black uppercase tracking-[0.2em] block mb-1.5 ${
                isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
              }`}>
                <Award className="w-3.5 h-3.5 inline mr-1.5" /> Código de referido
              </label>
              <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-xl border ${
                isDark ? 'bg-[#1E120C] border-[#3D281E]' : 'bg-[#FFF9F6] border-[#F0E4DA]'
              }`}>
                <code className={`font-mono text-sm font-bold tracking-wider ${
                  isDark ? 'text-[#D4AF37]' : 'text-[#D4AF37]'
                }`}>
                  {profile.referral_code}
                </code>
                <span className={`text-[8px] font-black uppercase tracking-[0.15em] ${
                  isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
                }`}>
                  Comparte y gana puntos
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ESTADÍSTICAS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className={`p-5 rounded-2xl border text-center transition-all duration-300 hover:-translate-y-0.5 ${
            isDark 
              ? 'bg-[#2A1B14] border-[#3D281E] hover:border-[#D4AF37]/40' 
              : 'bg-white border-[#F0E4DA] hover:border-[#D4AF37]/40'
          }`}>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 ${
              isDark ? 'bg-[#3D281E]' : 'bg-[#FFF9F6]'
            }`}>
              <Gem className="w-6 h-6 text-[#D4AF37]" />
            </div>
            <p className={`text-2xl font-serif font-light text-[#D4AF37]`}>
              {profile.points_glow || 0}
            </p>
            <p className={`text-[8px] font-black uppercase tracking-[0.2em] mt-0.5 ${
              isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
            }`}>
              Glow Points
            </p>
          </div>

          <div className={`p-5 rounded-2xl border text-center transition-all duration-300 hover:-translate-y-0.5 ${
            isDark 
              ? 'bg-[#2A1B14] border-[#3D281E] hover:border-[#D4AF37]/40' 
              : 'bg-white border-[#F0E4DA] hover:border-[#D4AF37]/40'
          }`}>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 ${
              isDark ? 'bg-[#3D281E]' : 'bg-[#FFF9F6]'
            }`}>
              <Sparkles className="w-6 h-6 text-[#D4AF37]" />
            </div>
            <p className={`text-2xl font-serif font-light text-[#D4AF37]`}>
              {profile.points_hair || 0}
            </p>
            <p className={`text-[8px] font-black uppercase tracking-[0.2em] mt-0.5 ${
              isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
            }`}>
              Hair Points
            </p>
          </div>

          <div className={`p-5 rounded-2xl border text-center transition-all duration-300 hover:-translate-y-0.5 ${
            isDark 
              ? 'bg-[#2A1B14] border-[#3D281E] hover:border-[#D4AF37]/40' 
              : 'bg-white border-[#F0E4DA] hover:border-[#D4AF37]/40'
          }`}>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 ${
              isDark ? 'bg-[#3D281E]' : 'bg-[#FFF9F6]'
            }`}>
              <Award className="w-6 h-6 text-[#D4AF37]" />
            </div>
            <p className={`text-2xl font-serif font-light text-[#D4AF37]`}>
              {profile.total_appointments || 0}
            </p>
            <p className={`text-[8px] font-black uppercase tracking-[0.2em] mt-0.5 ${
              isDark ? 'text-[#A89588]' : 'text-[#5C4A3E]'
            }`}>
              Citas Realizadas
            </p>
          </div>
        </div>

        {/* BOTÓN DE NAVEGACIÓN */}
        <div className={`border-t pt-6 ${
          isDark ? 'border-[#3D281E]' : 'border-[#F0E4DA]'
        }`}>
          <Link
            href="/portal"
            className={`inline-flex items-center gap-2 text-xs font-medium transition-colors ${
              isDark ? 'text-[#A89588] hover:text-[#D4AF37]' : 'text-[#5C4A3E] hover:text-[#D4AF37]'
            }`}
          >
            <ArrowRight className="w-4 h-4" />
            Volver al panel principal
          </Link>
        </div>

      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
