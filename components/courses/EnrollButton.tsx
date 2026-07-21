// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { CheckCircle, BookOpen, Loader2 } from 'lucide-react'

interface EnrollButtonProps {
  courseId: string
  onEnroll?: () => void
}

export function EnrollButton({ courseId, onEnroll }: EnrollButtonProps) {
  const { user } = useAuth()
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [profileId, setProfileId] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      getProfileId()
    }
  }, [user])

  async function getProfileId() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', user?.email)
        .maybeSingle()

      if (error) throw error
      
      if (data) {
        setProfileId(data.id)
      } else {
        setErrorMsg('No se encontró tu perfil')
        setLoading(false)
      }
    } catch (error: any) {
      setErrorMsg('Error al obtener perfil')
      setLoading(false)
    }
  }

  useEffect(() => {
    if (profileId && courseId) {
      checkEnrollment()
    } else if (user && !profileId) {
      setLoading(false)
    }
  }, [profileId, courseId, user])

  async function checkEnrollment() {
    try {
      const { data, error } = await supabase
        .from('course_enrollments')
        .select('id, status')
        .eq('course_id', courseId)
        .eq('user_id', profileId)
        .maybeSingle()

      if (error) throw error
      setIsEnrolled(!!data)
    } catch (error: any) {
      setErrorMsg('Error al verificar')
    } finally {
      setLoading(false)
    }
  }

  async function handleEnroll() {
    if (!user || !profileId) return

    setEnrolling(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      const payload = {
        course_id: courseId,
        user_id: profileId,
        status: 'active'
      }

      const { error } = await supabase
        .from('course_enrollments')
        .insert([payload])
        .select()

      if (error) throw error

      setSuccessMsg('✅ Te has inscrito correctamente')
      setIsEnrolled(true)
      if (onEnroll) onEnroll()

    } catch (error: any) {
      setErrorMsg('❌ Error: ' + (error.message || 'Error desconocido'))
    } finally {
      setEnrolling(false)
    }
  }

  if (loading) {
    return (
      <button disabled className="px-6 py-3 rounded-xl bg-muted/30 text-mutedForeground text-sm font-medium cursor-wait flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        Verificando...
      </button>
    )
  }

  if (isEnrolled) {
    return (
      <button className="px-6 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-sm font-medium flex items-center gap-2 cursor-default">
        <CheckCircle className="w-4 h-4" />
        Ya estás inscrito
      </button>
    )
  }

  return (
    <div className="space-y-2">
      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-500 p-2 rounded-lg text-xs font-mono">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 p-2 rounded-lg text-xs font-mono">
          {successMsg}
        </div>
      )}
      <button
        onClick={handleEnroll}
        disabled={enrolling || !profileId}
        className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-medium transition-all shadow-lg shadow-rose-600/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed w-full justify-center"
      >
        {enrolling ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Inscribiendo...
          </>
        ) : (
          <>
            <BookOpen className="w-4 h-4" />
            Inscribirme al curso
          </>
        )}
      </button>
    </div>
  )
}
