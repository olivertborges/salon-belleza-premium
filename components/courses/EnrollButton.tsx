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
  const [logs, setLogs] = useState<string[]>([])
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [profileId, setProfileId] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${msg}`])
  }

  // Obtener el perfil del usuario logueado
  useEffect(() => {
    if (user) {
      addLog(`✅ Usuario autenticado: ${user.email}`)
      getProfile()
    } else {
      addLog('❌ No hay usuario autenticado')
      setLoading(false)
    }
  }, [user])

  async function getProfile() {
    try {
      addLog('🔍 Buscando perfil en profiles...')
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', user?.id)
        .maybeSingle()

      if (error) {
        addLog(`❌ Error al buscar perfil: ${error.message}`)
        throw error
      }

      if (data) {
        setProfileId(data.id)
        setUserRole(data.role)
        addLog(`✅ Perfil encontrado: ID=${data.id}, Rol=${data.role}`)
      } else {
        addLog('❌ No se encontró perfil para este usuario')
        setErrorMsg('❌ No se encontró tu perfil. Contacta al administrador.')
        setLoading(false)
      }
    } catch (error: any) {
      addLog(`❌ Error: ${error.message}`)
      setErrorMsg('Error al obtener perfil: ' + error.message)
      setLoading(false)
    }
  }

  useEffect(() => {
    if (profileId && courseId) {
      checkEnrollment()
    } else if (!profileId && !loading) {
      setLoading(false)
    }
  }, [profileId, courseId])

  async function checkEnrollment() {
    try {
      addLog(`🔍 Verificando inscripción para curso ${courseId}...`)
      
      const { data, error } = await supabase
        .from('course_enrollments')
        .select('id, status')
        .eq('course_id', courseId)
        .eq('user_id', profileId)
        .maybeSingle()

      if (error) {
        addLog(`❌ Error al verificar: ${error.message}`)
        throw error
      }

      if (data) {
        addLog(`✅ Ya estás inscrito: ${data.status}`)
        setIsEnrolled(true)
      } else {
        addLog('📝 No estás inscrito en este curso')
        setIsEnrolled(false)
      }
    } catch (error: any) {
      addLog(`❌ Error: ${error.message}`)
      setErrorMsg('Error al verificar: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleEnroll() {
    addLog('🔥 CLICK EN INSCRIBIRSE')
    setErrorMsg(null)
    setSuccessMsg(null)

    if (!user) {
      addLog('❌ Usuario no autenticado')
      alert('❌ No estás autenticado.')
      window.location.href = '/login'
      return
    }

    if (!profileId) {
      addLog('❌ No hay profileId')
      alert('❌ No se encontró tu perfil. Recarga la página.')
      return
    }

    if (userRole === 'admin') {
      addLog('❌ Usuario admin no puede inscribirse')
      alert('❌ Los administradores no pueden inscribirse a cursos.')
      return
    }

    addLog(`👤 Usuario: ${user.email} (ID: ${profileId})`)
    addLog(`📚 Curso: ${courseId}`)

    setEnrolling(true)

    try {
      const payload = {
        course_id: courseId,
        user_id: profileId,
        status: 'active'
      }

      addLog(`📦 Enviando a Supabase: ${JSON.stringify(payload)}`)

      const { data, error } = await supabase
        .from('course_enrollments')
        .insert([payload])
        .select()

      if (error) {
        addLog(`❌ Error de Supabase: ${error.message}`)
        if (error.code === '23505') {
          addLog('⚠️ Ya estás inscrito (duplicado)')
          setIsEnrolled(true)
          setSuccessMsg('✅ Ya estabas inscrito en este curso')
          if (onEnroll) onEnroll()
          setEnrolling(false)
          return
        }
        throw error
      }

      addLog(`✅ Inscripción exitosa! Data: ${JSON.stringify(data)}`)
      setSuccessMsg('✅ Te has inscrito correctamente al curso')
      setIsEnrolled(true)
      if (onEnroll) onEnroll()

    } catch (error: any) {
      addLog(`❌ Error: ${error.message}`)
      setErrorMsg('❌ Error: ' + (error.message || 'Error desconocido'))
      alert(`❌ Error:\n${error.message || 'Error desconocido'}`)
    } finally {
      setEnrolling(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <button disabled className="px-6 py-3 rounded-xl bg-muted/30 text-mutedForeground text-sm font-medium cursor-wait flex items-center gap-2 w-full justify-center">
          <Loader2 className="w-4 h-4 animate-spin" />
          Verificando...
        </button>
        <LogDisplay logs={logs} />
      </div>
    )
  }

  return (
    <div className="space-y-3">
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
      
      {isEnrolled ? (
        <button className="px-6 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-sm font-medium flex items-center gap-2 cursor-default w-full justify-center">
          <CheckCircle className="w-4 h-4" />
          Ya estás inscrito
        </button>
      ) : (
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
      )}
      
      <LogDisplay logs={logs} />
    </div>
  )
}

// Componente para mostrar logs en pantalla
function LogDisplay({ logs }: { logs: string[] }) {
  if (logs.length === 0) return null
  
  return (
    <div className="bg-black/80 rounded-lg p-3 max-h-48 overflow-y-auto font-mono text-[10px] space-y-0.5">
      {logs.map((log, i) => {
        const isError = log.includes('❌') || log.includes('Error')
        const isSuccess = log.includes('✅')
        const isWarning = log.includes('⚠️')
        
        let color = 'text-stone-400'
        if (isError) color = 'text-red-400'
        if (isSuccess) color = 'text-emerald-400'
        if (isWarning) color = 'text-amber-400'
        
        return (
          <div key={i} className={color}>
            {log}
          </div>
        )
      })}
    </div>
  )
}
