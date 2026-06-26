'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { Plus, Search, Grid3x3, List, X, GraduationCap } from 'lucide-react'
import Link from 'next/link'

export default function AdminCursosPage() {
  const { tenantId, loading: authLoading } = useAuth()
  const [cursos, setCursos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (tenantId) {
      cargarCursos()
    }
  }, [tenantId])

  async function cargarCursos() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setCursos(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const filtered = cursos.filter(curso =>
    curso.title.toLowerCase().includes(search.toLowerCase()) ||
    curso.instructor.toLowerCase().includes(search.toLowerCase())
  )

  if (authLoading || loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-500/[0.05] via-card to-card border border-rose-500/20 p-6">
        <div className="absolute top-0 right-0 w-40 h-40 bg-rose-500/5 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-rose-600 dark:text-rose-400 font-mono">🎓 Administración</p>
            <h2 className="text-2xl font-serif italic text-foreground mt-1">Cursos</h2>
            <p className="text-xs text-mutedForeground mt-1">{cursos.length} cursos en total</p>
          </div>
          <Link
            href="/admin/cursos/crear"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium transition-all shadow-lg shadow-rose-600/10 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Nuevo Curso
          </Link>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="flex items-center bg-muted/30 border border-border rounded-xl px-3 py-2">
        <Search className="w-4 h-4 text-mutedForeground shrink-0" />
        <input
          type="text"
          placeholder="Buscar cursos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent border-none outline-none text-xs text-foreground placeholder-mutedForeground w-full ml-2"
        />
        {search && (
          <button onClick={() => setSearch('')} className="text-mutedForeground hover:text-foreground">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Lista de cursos */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed rounded-3xl border-border bg-muted/20">
          <GraduationCap className="w-12 h-12 text-mutedForeground/30 mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">
            {search ? 'No se encontraron cursos' : 'No hay cursos creados'}
          </p>
          <p className="text-xs text-mutedForeground mt-1">
            {search ? 'Prueba con otra búsqueda' : 'Crea tu primer curso'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((curso) => (
            <div key={curso.id} className="group rounded-2xl bg-card border border-border hover:border-rose-500/30 transition-all overflow-hidden">
              <div className="relative h-32 bg-gradient-to-br from-rose-950/40 via-stone-900/40 to-card">
                {curso.image_url ? (
                  <img src={curso.image_url} alt={curso.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <GraduationCap className="w-12 h-12 text-mutedForeground/20" />
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-mono font-bold uppercase border ${
                    curso.is_active 
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                      : 'bg-stone-500/20 text-stone-400 border-stone-500/30'
                  }`}>
                    {curso.is_active ? 'Publicado' : 'Borrador'}
                  </span>
                </div>
              </div>

              <div className="p-4 space-y-3">
                <div>
                  <h3 className="text-sm font-bold text-foreground group-hover:text-rose-500 transition-colors line-clamp-1">
                    {curso.title}
                  </h3>
                  <p className="text-xs text-mutedForeground">Por: {curso.instructor}</p>
                  {curso.description && (
                    <p className="text-[10px] text-mutedForeground line-clamp-2 mt-1">{curso.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-3 text-[10px] text-mutedForeground font-mono">
                  <span className="flex items-center gap-1">
                    <span>Nivel: {curso.level || 'beginner'}</span>
                  </span>
                </div>

                <Link
                  href={`/admin/cursos/${curso.id}`}
                  className="w-full block text-center px-3 py-1.5 rounded-lg bg-muted/50 border border-border text-mutedForeground hover:text-foreground hover:border-rose-500/30 transition-all text-[10px] font-mono font-bold uppercase tracking-wider"
                >
                  Editar Curso
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
