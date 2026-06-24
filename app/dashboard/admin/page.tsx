'use client'

import AnunciosCliente from '@/components/AnunciosCliente'
import PromocionesCliente from '@/components/PromocionesCliente'

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-serif text-rose-400 italic">Consola de Administración General</h1>
        <p className="text-xs text-stone-400">Controla el marketing, anuncios y promociones calientes del Atelier.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-[#141211] p-6 rounded-2xl border border-stone-850">
          <AnunciosCliente />
        </div>
        <div className="bg-[#141211] p-6 rounded-2xl border border-stone-850">
          <PromocionesCliente />
        </div>
      </div>
    </div>
  )
}
