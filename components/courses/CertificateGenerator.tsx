// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Award, Download, Loader2, CheckCircle } from 'lucide-react'

interface CertificateGeneratorProps {
  courseId: string
  courseTitle: string
  userId: string
  userName: string
  progress: number
}

export function CertificateGenerator({
  courseId,
  courseTitle,
  userId,
  userName,
  progress
}: CertificateGeneratorProps) {
  const [generating, setGenerating] = useState(false)
  const [certificateUrl, setCertificateUrl] = useState<string | null>(null)
  const [hasCertificate, setHasCertificate] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Verificar si ya tiene certificado
  useEffect(() => {
    async function checkCertificate() {
      try {
        const { data, error } = await supabase
          .from('course_certificates')
          .select('id, download_url')
          .eq('user_id', userId)
          .eq('course_id', courseId)
          .maybeSingle()

        if (error) throw error
        if (data) {
          setHasCertificate(true)
          setCertificateUrl(data.download_url || null)
        }
      } catch (error) {
        console.error('Error checking certificate:', error)
      } finally {
        setLoading(false)
      }
    }

    checkCertificate()
  }, [courseId, userId])

  // Solo mostrar si completó el curso (100% de progreso)
  if (progress < 100) {
    return (
      <div className="p-4 rounded-xl bg-muted/20 border border-border text-center">
        <Award className="w-8 h-8 text-mutedForeground/30 mx-auto mb-2" />
        <p className="text-xs text-mutedForeground">
          Completa el curso al 100% para obtener tu certificado
        </p>
        <p className="text-[10px] text-mutedForeground/50 font-mono mt-1">
          Progreso actual: {progress}%
        </p>
        <div className="mt-2 h-1.5 bg-muted/30 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-rose-500 to-amber-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-4 rounded-xl bg-muted/20 border border-border text-center">
        <Loader2 className="w-6 h-6 animate-spin text-mutedForeground mx-auto" />
      </div>
    )
  }

  if (hasCertificate && certificateUrl) {
    return (
      <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/20">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium text-foreground">¡Certificado disponible!</p>
            <p className="text-[10px] text-mutedForeground font-mono">
              {courseTitle}
            </p>
          </div>
        </div>
        <a
          href={certificateUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-all"
        >
          <Download className="w-4 h-4" />
          Descargar Certificado
        </a>
      </div>
    )
  }

  return (
    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-emerald-500/20">
          <Award className="w-5 h-5 text-emerald-500" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-medium text-foreground">¡Felicidades! Has completado el curso</p>
          <p className="text-[10px] text-mutedForeground font-mono">
            {courseTitle}
          </p>
        </div>
      </div>

      <button
        onClick={async () => {
          setGenerating(true)
          setError(null)

          try {
            // Generar número de certificado
            const certNumber = `FN-${Date.now().toString().slice(-6)}-${userId.slice(0, 4)}`

            const { data, error } = await supabase
              .from('course_certificates')
              .insert([{
                user_id: userId,
                course_id: courseId,
                certificate_number: certNumber
              }])
              .select()
              .single()

            if (error) throw error

            setHasCertificate(true)
            setCertificateUrl(`/certificates/${courseId}/${userId}`)
            
          } catch (err: any) {
            setError(err.message || 'Error al generar certificado')
          } finally {
            setGenerating(false)
          }
        }}
        disabled={generating}
        className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-all disabled:opacity-50"
      >
        {generating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generando...
          </>
        ) : (
          'Obtener Certificado'
        )}
      </button>

      {error && (
        <p className="mt-2 text-[10px] text-red-500 font-mono">{error}</p>
      )}
    </div>
  )
}
