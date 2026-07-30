import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient' // Ajusta la ruta a tu cliente de Supabase

interface ProfileData {
  id: string
  name: string
  phone: string
  birth_date?: string
  avatar_url?: string
}

export default function UserProfileComponent() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Estado del Formulario
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    birth_date: ''
  })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  useEffect(() => {
    async function getProfile() {
      try {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          setUser(user)
          
          const { data, error: profileError } = await supabase
            .from('clients')
            .select('*')
            .eq('id', user.id)
            .single()

          if (profileError) throw profileError

          if (data) {
            setProfile(data)
            setFormData({
              name: data.name || '',
              phone: data.phone || '',
              birth_date: data.birth_date || ''
            })
            setAvatarPreview(data.avatar_url || null)
          }
        }
      } catch (err: any) {
        console.error('Error cargando perfil:', err)
        setError('No se pudo cargar la información del perfil.')
      } finally {
        setLoading(false)
      }
    }

    getProfile()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  const handleSave = async () => {
    if (!user?.id || !profile) return

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      let avatarUrl = profile.avatar_url

      // 1. Subida de imagen al BUCKET de Storage 'clients'
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop()
        const fileName = `${user.id}-${Date.now()}.${fileExt}`
        const filePath = `avatars/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('clients') // Tu bucket de storage
          .upload(filePath, avatarFile, { cacheControl: '3600', upsert: true })

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('clients')
          .getPublicUrl(filePath)

        avatarUrl = publicUrl
      }

      // 2. Actualizar datos en la TABLA 'clients' (Sin la columna 'address')
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

      // 3. Sincronizar metadatos de Auth para el Header/Layout global
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
      setError(`Error al guardar los cambios: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-4 text-center">Cargando perfil...</div>

  return (
    <div className="max-w-md mx-auto my-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Mi Perfil</h2>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">{success}</div>}

      <div className="flex flex-col items-center mb-6">
        <div className="relative w-24 h-24 mb-4 rounded-full overflow-hidden bg-gray-200 border">
          {avatarPreview ? (
            <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">Sin Foto</div>
          )}
        </div>
        
        {editing && (
          <label className="cursor-pointer bg-blue-50 text-blue-600 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-blue-100 transition">
            <span>Cambiar foto</span>
            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </label>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            disabled={!editing}
            className="w-full p-2 border border-gray-300 rounded-md disabled:bg-gray-50 disabled:text-gray-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
          <input
            type="text"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            disabled={!editing}
            className="w-full p-2 border border-gray-300 rounded-md disabled:bg-gray-50 disabled:text-gray-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Nacimiento</label>
          <input
            type="date"
            name="birth_date"
            value={formData.birth_date}
            onChange={handleInputChange}
            disabled={!editing}
            className="w-full p-2 border border-gray-300 rounded-md disabled:bg-gray-50 disabled:text-gray-500"
          />
        </div>

        <div className="pt-4 flex justify-end space-x-2">
          {editing ? (
            <>
              <button
                onClick={() => {
                  setEditing(false)
                  if (profile) {
                    setFormData({
                      name: profile.name || '',
                      phone: profile.phone || '',
                      birth_date: profile.birth_date || ''
                    })
                    setAvatarPreview(profile.avatar_url || null)
                  }
                }}
                disabled={saving}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400"
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700"
            >
              Editar Perfil
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
