'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { CourseCard } from '@/components/courses'
import { Search, Filter, GraduationCap } from 'lucide-react'

export default function CursosPage() {
  const [cursos, setCursos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all')

  useEffect(() => {
    cargarCursos()
  }, [])

  async function cargarCursos() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      setCursos(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const filtered = cursos.filter(curso => {
    const matchSearch = curso.title.toLowerCase().includes(search.toLowerCase()) ||
                        curso.instructor.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || curso.level === filter
    return matchSearch && matchFilter
  })

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-8">
      <div className="text-center">
        <h1 className="text-3xl font-serif italic text-foreground">Nuestros Cursos</h1>
        <p className="text-sm text-mutedForeground mt-1">Aprende con los mejores profesionales</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] flex items-center bg-muted/30 border border-border rounded-xl px-3 py-2">
          <Search className="w-4 h-4 text-mutedForeground shrink-0" />
          <input
            type="text"
            placeholder="Buscar cursos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-xs text-foreground placeholder-mutedForeground w-full ml-2"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-muted/30 border border-border rounded-xl p-1">
          <button
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors ${
              filter === 'all' ? 'bg-rose-500/20 text-rose-500' : 'text-mutedForeground hover:text-foreground'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilter('beginner')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors ${
              filter === 'beginner' ? 'bg-emerald-500/20 text-emerald-500' : 'text-mutedForeground hover:text-foreground'
            }`}
          >
            Principiante
          </button>
          <button
            onClick={() => setFilter('intermediate')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors ${
              filter === 'intermediate' ? 'bg-amber-500/20 text-amber-500' : 'text-mutedForeground hover:text-foreground'
            }`}
          >
            Intermedio
          </button>
          <button
            onClick={() => setFilter('advanced')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors ${
              filter === 'advanced' ? 'bg-rose-500/20 text-rose-500' : 'text-mutedForeground hover:text-foreground'
            }`}
          >
            Avanzado
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed rounded-3xl border-border bg-muted/20">
          <GraduationCap className="w-12 h-12 text-mutedForeground/30 mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">No hay cursos disponibles</p>
          <p className="text-xs text-mutedForeground mt-1">Pronto tendremos nuevos cursos</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((curso) => {
            const modules = curso.modules || []
            const totalLessons = modules.reduce((acc: number, m: any) => acc + (m.lecciones?.length || 0), 0)
            
            return (
              <CourseCard
                key={curso.id}
                id={curso.id}
                title={curso.title}
                instructor={curso.instructor}
                description={curso.description || ''}
                image_url={curso.image_url || ''}
                level={curso.level || 'beginner'}
                modules_count={modules.length}
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
