//@ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import PageLayout from '@/components/PageLayout'
import { 
  Users, Calendar, Clock, CheckCircle, ArrowRight, ShieldAlert
} from 'lucide-react'

export default function DashboardPage() {
  const { user, role, loading: authLoading } = useAuth()
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  const [stats, setStats] = useState({
    citasHoy: 0,
    citasPendientes: 0,
    citasCompletadas: 0,
    clientesTotales: 0
  })

  const [proximasCitas, setProximasCitas] = useState<any[]>([])

  useEffect(() => {
    if (authLoading) return

    const validarAccesoPanel = async () => {
      if (!user) {
        setAuthorized(false)
        return
      }

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle()

        const rolPerfil = profile?.role?.toLowerCase().trim() || role?.toLowerCase().trim()

        if (rolPerfil === 'admin' || rolPerfil === 'owner' || rolPerfil === 'staff') {
          setIsAdmin(rolPerfil === 'admin' || rolPerfil === 'owner')
          setAuthorized(true)
          cargarEstadisticas()
          return
        }

        const { data: staffData } = await supabase
          .from('staff')
          .select('id, is_active')
          .eq('auth_user_id', user.id)
          .maybeSingle()

        if (staffData && staffData.is_active !== false) {
          setIsAdmin(false)
          setAuthorized(true)
          cargarEstadisticas()
          return
        }

        setAuthorized(false)
      } catch (err) {
        console.error('Error verificando permisos en el dashboard:', err)
        setAuthorized(false)
      }
    }

    validarAccesoPanel()
  }, [user, role, authLoading])

  const cargarEstadisticas = async () => {
    setLoading(true)
    try {
      const hoy = new Date().toISOString().split('T')[0]

      const { count: countHoy } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .gte('appointment_date', `${hoy}T00:00:00`)
        .lte('appointment_date', `${hoy}T23:59:59`)

      const { count: countPendientes } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      const { count: countCompletadas } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')

      const { count: countClientes } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })

      setStats({
        citasHoy: countHoy || 0,
        citasPendientes: countPendientes || 0,
        citasCompletadas: countCompletadas || 0,
        clientesTotales: countClientes || 0
      })

      const { data: citas } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          status,
          clients ( full_name, phone ),
          services ( name, duration_minutes )
        `)
        .gte('appointment_date', `${hoy}T00:00:00`)
        .order('appointment_date', { ascending: true })
        .limit(5)

      setProximasCitas(citas || [])
    } catch (err) {
      console.error('Error cargando datos del dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || authorized === null) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </PageLayout>
    )
  }

  if (!authorized) {
    return (
      <PageLayout>
        <div className="max-w-md mx-auto my-12 bg-white rounded-lg shadow-md p-6 text-center">
          <ShieldAlert className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Acceso Denegado</h2>
          <p className="text-gray-600 mb-6">
            No tienes los permisos necesarios para acceder a esta sección.
          </p>
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Volver al inicio
          </Link>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Panel de Control</h1>
            <p className="mt-1 text-sm text-gray-500">
              Resumen general del estado de tus citas y clientes
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <Link
              href="/admin/agenda"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Ir a la Agenda
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Tarjetas de Estadísticas */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Citas para Hoy</dt>
                  <dd className="text-2xl font-semibold text-gray-900">{stats.citasHoy}</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Citas Pendientes</dt>
                  <dd className="text-2xl font-semibold text-gray-900">{stats.citasPendientes}</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Citas Completadas</dt>
                  <dd className="text-2xl font-semibold text-gray-900">{stats.citasCompletadas}</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Clientes Registrados</dt>
                  <dd className="text-2xl font-semibold text-gray-900">{stats.clientesTotales}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Listado de Próximas Citas */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Próximas Citas Agendadas</h2>
          {loading ? (
            <div className="py-8 text-center text-gray-500">Cargando próximas citas...</div>
          ) : proximasCitas.length === 0 ? (
            <p className="text-gray-500 py-4">No hay citas programadas en los próximos días.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha y Hora
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Servicio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {proximasCitas.map((cita) => {
                    const fechaObj = new Date(cita.appointment_date)
                    return (
                      <tr key={cita.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {fechaObj.toLocaleDateString()} - {fechaObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {cita.clients?.full_name || 'Sin nombre'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {cita.services?.name || 'Servicio no especificado'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            cita.status === 'completed' ? 'bg-green-100 text-green-800' :
                            cita.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {cita.status}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  )
}
