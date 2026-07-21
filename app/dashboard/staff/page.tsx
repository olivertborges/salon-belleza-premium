'use client'

import { useAuth } from '@/hooks/useAuth'
import AntesDespues from '@/components/AntesDespues'
import Notificaciones from '@/components/Notificaciones'

export default function StaffDashboard() {
  const { user } = useAuth() // ✅ Obtener el usuario

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-serif text-amber-100 italic">Panel de Especialistas</h1>
          <p className="text-xs text-stone-400">Gestiona tus actividades asignadas y portfolio técnico.</p>
        </div>
        <Notificaciones user={user} /> {/* ✅ Pasar user */}
      </div>

      <div className="bg-[#141211] p-6 rounded-2xl border border-stone-850">
        <h3 className="text-sm font-bold uppercase tracking-wider text-stone-200 mb-4">Galería de Trabajos (Control de Cambios)</h3>
        <AntesDespues user={user} /> {/* ✅ Pasar user */}
      </div>
    </div>
  )
}