'use client'

import Link from 'next/link'
import { ArrowLeft, EyeOff, LayoutGrid, ToggleLeft, ShieldAlert } from 'lucide-react'

export default function AdminCursosPausadosPage() {
  return (
    <div className="space-y-6 antialiased">
      {/* Cabecera del Panel */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/[0.05] via-card to-card border border-amber-500/20 p-6">
        <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-2 rounded-xl border border-border bg-card text-mutedForeground">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-amber-600 font-mono font-bold">⚙️ Configuración del Sistema</p>
              <h2 className="text-2xl font-serif italic text-foreground mt-1">Módulo de Cursos Pausado</h2>
              <p className="text-xs text-mutedForeground mt-1">La creación y gestión de contenidos se encuentra desactivada temporalmente en la plataforma pública.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Contenedor de Estado Técnico */}
      <div className="border border-border rounded-2xl bg-card p-8 text-center max-w-2xl mx-auto my-8">
        <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto mb-4">
          <EyeOff className="w-5 h-5" />
        </div>
        
        <h3 className="text-sm font-bold font-mono text-foreground uppercase tracking-wider">Infraestructura Preservada</h3>
        <p className="text-xs text-mutedForeground max-w-md mx-auto mt-2 leading-relaxed">
          Los esquemas de la base de datos (Supabase), los editores de texto enriquecido y los cargadores de archivos multimedia siguen listos. No se ha eliminado ningún dato técnico, simplemente se restringió el acceso visual en el cliente.
        </p>

        <div className="mt-6 inline-flex items-center gap-4 text-[11px] font-mono p-3 bg-muted/50 rounded-xl border border-border text-mutedForeground">
          <span className="flex items-center gap-1.5 text-rose-500"><ToggleLeft className="w-4 h-4" /> Vista Pública: OFF</span>
          <span className="text-border">|</span>
          <span className="flex items-center gap-1.5 text-amber-500"><ShieldAlert className="w-4 h-4" /> Panel Admin: Bloqueado</span>
        </div>
      </div>
    </div>
  )
}
