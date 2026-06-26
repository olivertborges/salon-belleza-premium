'use client'

import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react'

interface ImageUploaderProps {
  value: string
  onChange: (url: string) => void
  folder?: string
  label?: string
}

export function ImageUploader({ 
  value, 
  onChange, 
  folder = 'courses',
  label = 'Subir imagen'
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)

    try {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        throw new Error('Solo se permiten imágenes')
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('La imagen no puede superar los 5MB')
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `${folder}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('course-images')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('course-images')
        .getPublicUrl(filePath)

      onChange(publicUrl)
      setError(null)

    } catch (err: any) {
      setError(err.message || 'Error al subir la imagen')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemove = () => {
    onChange('')
  }

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-[10px] font-mono uppercase tracking-wider text-mutedForeground">
          {label}
        </label>
      )}

      {value ? (
        <div className="relative">
          <img 
            src={value} 
            alt="Preview" 
            className="w-full aspect-video object-cover rounded-xl border border-border"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 text-white hover:bg-black/90 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-rose-500/30 transition-colors ${
            uploading ? 'opacity-50 cursor-wait' : ''
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="hidden"
            disabled={uploading}
          />
          
          {uploading ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-rose-500" />
              <span className="text-xs text-mutedForeground">Subiendo...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 rounded-full bg-muted/30">
                <ImageIcon className="w-6 h-6 text-mutedForeground" />
              </div>
              <p className="text-xs text-mutedForeground font-mono">
                <Upload className="w-3 h-3 inline mr-1" />
                {label}
              </p>
              <p className="text-[9px] text-mutedForeground/50">
                PNG, JPG, WebP • Max 5MB
              </p>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500 font-mono">{error}</p>
      )}
    </div>
  )
}
