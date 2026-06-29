'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useAuth } from '@/contexts/AuthContext'
import { CourseCard } from '@/components/courses'
import { Search, GraduationCap } from 'lucide-react'

export default function CursosPage() {
  const { tenantId, loading: authLoading } = useAuth()
  const supabaseClient = createClientComponentClient()

  const [cursos, setCursos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all')

  useEffect(() => {
    if (tenantId) {
      cargarCursos()
    }
  }, [tenantId])

  async function cargarCursos() {
    try {
      setLoading(true)
      
      const { data, error } = await supabaseClient
        .from('courses')
        .select(`
          *,
          course_lessons (
            id,
            module_title
          )
        `)
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      setCursos(data || [])
    } catch (error) {
      console.error('💥 Error al inicializar catálogo de contenidos:', error)
    } finally {
      setLoading(false)
    }
  }

  const filtered = cursos.filter(curso => {
    const matchSearch = (curso.title || '').toLowerCase().includes(search.toLowerCase()) ||
                        (curso.instructor || '').toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || curso.level === filter
    return matchSearch && matchFilter
  })

  if (authLoading || loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-8 antialiased">
      {/* Header unificado con la estética institucional */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-500/[0.05] via-card to-card border border-rose-500/20 p-6">
        <div className="absolute top-0 right-0 w-40 h-40 bg-rose-500/5 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-rose-600 dark:text-rose-400 font-mono">📖 Catálogo Público</p>
            <h2 className="text-2xl font-serif italic text-foreground mt-1">Nuestros Cursos</h2>
            <p className="text-xs text-mutedForeground mt-1">Aprende con los mejores profesionales</p>
          </div>
        </div>
      </div>

      {/* Barra de Herramientas Plana (Flexbox directo sin divs anidados redundantes) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Input de Búsqueda Plano */}
        <div className="flex-1 flex items-center bg-card border border-border/60 shadow-sm rounded-xl px-3 py-2 focus-within:border-rose-500/30 transition-all">
          <Search className="w-4 h-4 text-mutedForeground shrink-0" />
          <input
            type="text"
            placeholder="Buscar por título o instructor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-xs text-foreground placeholder-mutedForeground/60 w-full ml-2 focus:ring-0 p-0"
          />
        </div>

        {/* Grupo de Filtros por Nivel Plano */}
        <div className="flex items-center gap-1 bg-card border border-border/60 shadow-sm rounded-xl p-1 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-wider font-bold transition-all shrink-0 ${
              filter === 'all' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'text-mutedForeground hover:text-foreground'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilter('beginner')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-wider font-bold transition-all shrink-0 ${
              filter === 'beginner' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'text-mutedForeground hover:text-foreground'
            }`}
          >
            Principiante
          </button>
          <button
            onClick={() => setFilter('intermediate')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-wider font-bold transition-all shrink-0 ${
              filter === 'intermediate' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'text-mutedForeground hover:text-foreground'
            }`}
          >
            Intermedio
          </button>
          <button
            onClick={() => setFilter('advanced')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-wider font-bold transition-all shrink-0 ${
              filter === 'advanced' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'text-mutedForeground hover:text-foreground'
            }`}
          >
            Avanzado
          </button>
        </div>
      </div>

      {/* Grid de Contenidos */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 border border-dashed rounded-3xl border-border bg-muted/10 max-w-xl mx-auto">
          <GraduationCap className="w-12 h-12 text-mutedForeground/30 mx-auto mb-3" />
          <p className="text-sm font-bold text-foreground font-mono uppercase tracking-wide">Sin resultados disponibles</p>
          <p className="text-xs text-mutedForeground mt-1 max-w-xs mx-auto">No se encontraron programas activos que coincidan con los criterios de búsqueda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((curso) => {
            const lessonsList = curso.course_lessons || []
            const uniqueModules = new Set(lessonsList.map((l: any) => l.module_title)).size
            const totalLessons = lessonsList.length
            
            return (
              <CourseCard
                key={curso.id}
                id={curso.id}
                title={curso.title}
                instructor={curso.instructor}
                description={curso.description || ''}
                image_url={curso.image_url || ''}
                level={curso.level || 'beginner'}
                modules_count={uniqueModules || 1}
                lessons_count={totalLessons}
                is_active={curso.is_active}
                href={`/cursos/${curso.id}`}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
