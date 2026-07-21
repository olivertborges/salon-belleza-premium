// @ts-nocheck
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export default function AdminDashboard() {
  const { user, role, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login')
      } else if (role !== 'admin') {
        router.push('/dashboard/client')
      }
    }
  }, [user, role, authLoading, router])

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-stone-400 text-xs font-mono">VERIFICANDO SESIÓN...</div>
      </div>
    )
  }

  if (!user || role !== 'admin') {
    return null
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-light text-stone-900 tracking-tight">
          Dashboard de Administración
        </h1>
        <p className="text-sm text-stone-400 font-light">
          Bienvenido, {user?.full_name || user?.email || 'Admin'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Citas hoy', value: '8', change: '+2' },
          { label: 'Clientes nuevos', value: '12', change: '+5' },
          { label: 'Ingresos', value: '$450', change: '+12%' },
          { label: 'Tasa ocupación', value: '78%', change: '-3%' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm">
            <p className="text-sm text-stone-400 font-light">{stat.label}</p>
            <p className="text-2xl font-bold text-stone-900 mt-1">{stat.value}</p>
            <p className={`text-xs font-light ${stat.change.startsWith('+') ? 'text-emerald-500' : 'text-rose-400'}`}>
              {stat.change} vs ayer
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
