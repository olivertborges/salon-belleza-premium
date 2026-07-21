// @ts-nocheck
'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/config/supabase'
import { Bell, Clock, Gift, Star, X, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface NotificacionesProps {
  citas?: any[]
  puntos?: number
  user: any
}

export default function Notificaciones({ citas = [], puntos = 0, user }: NotificacionesProps) {
  const [notificaciones, setNotificaciones] = useState<any[]>([])
  const [mostrarPanel, setMostrarPanel] = useState(false)
  const [noLeidas, setNoLeidas] = useState(0)
  const [loading, setLoading] = useState(true)

  const cargarNotificacionesSupabase = async () => {
    if (!user?.email) return []
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_email', user.email)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error cargando notificaciones de Supabase:', error)
      return []
    }
  }

  const generarNotificacionesLocales = () => {
    const locales = []
    if (user?.role !== 'client') return locales

    const yaVistoBienvenida = localStorage.getItem('notificacion_bienvenida')
    if (!yaVistoBienvenida && user) {
      locales.push({
        id: 'bienvenida',
        titulo: "✨ ¡Bienvenida al Club!",
        mensaje: "Explora tus tratamientos exclusivos y acumula puntos en cada visita.",
        tipo: "info",
        leida: false,
        fecha: new Date().toISOString(),
        esLocal: true
      })
      localStorage.setItem('notificacion_bienvenida', 'true')
    }

    const citaProxima = citas?.find(c => {
      const fecha = new Date(c.date)
      const diff = Math.ceil((fecha.getTime() - new Date().getTime()) / (1000 * 60 * 60))
      return diff <= 48 && diff > 0 && c.status !== 'cancelada'
    })

    if (citaProxima && !localStorage.getItem(`recordatorio_${citaProxima.id}`)) {
      locales.push({
        id: `recordatorio_${citaProxima.id}`,
        titulo: "📅 Confirmación de Turno",
        mensaje: `Tienes una cita agendada en menos de 48 horas.`,
        tipo: "cita",
        leida: false,
        fecha: new Date().toISOString(),
        esLocal: true
      })
      localStorage.setItem(`recordatorio_${citaProxima.id}`, 'true')
    }

    if (puntos > 0 && puntos < 500 && !localStorage.getItem('notificacion_puntos')) {
      locales.push({
        id: 'puntos_acumulados',
        titulo: "⭐ Balance de Puntos",
        mensaje: `Cuentas con ${puntos} puntos listos para ser canjeados.`,
        tipo: "puntos",
        leida: false,
        fecha: new Date().toISOString(),
        esLocal: true
      })
      localStorage.setItem('notificacion_puntos', 'true')
    }

    return locales
  }

  const cargarTodasNotificaciones = async () => {
    setLoading(true)
    try {
      const supabaseNotis = await cargarNotificacionesSupabase()
      const localesNotis = generarNotificacionesLocales()

      const supabaseFormateadas = supabaseNotis.map(n => ({
        id: n.id,
        titulo: n.title,
        mensaje: n.message,
        tipo: n.type === 'cita_agendada' || n.type === 'cita_cancelada' ? 'cita' : 'info',
        leida: n.read,
        fecha: n.created_at,
        esLocal: false,
        supabaseId: n.id
      }))

      const todas = [...supabaseFormateadas, ...localesNotis]
      todas.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())

      setNotificaciones(todas)
      setNoLeidas(todas.filter(n => !n.leida).length)
    } catch (error) {
      console.error('Error estructurando notificaciones:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user?.email) return

    cargarTodasNotificaciones()

    const channel = supabase.channel(`notifications-${user.email}`)

    channel.on('postgres_changes', 
      { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications', 
        filter: `user_email=eq.${user.email}` 
      },
      (payload) => {
        const nuevaNotif = {
          id: payload.new.id,
          titulo: payload.new.title,
          mensaje: payload.new.message,
          tipo: payload.new.type === 'cita_agendada' || payload.new.type === 'cita_cancelada' ? 'cita' : 'info',
          leida: false,
          fecha: payload.new.created_at,
          esLocal: false,
          supabaseId: payload.new.id
        }

        setNotificaciones(prev => [nuevaNotif, ...prev])
        setNoLeidas(prev => prev + 1)

        toast.success(payload.new.title, { 
          duration: 4500, 
          icon: '🔔',
          style: {
            background: '#1c1917',
            color: '#fafaf9',
            fontFamily: 'monospace',
            fontSize: '11px',
            borderRadius: '12px'
          }
        })
      }
    )

    channel.subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [user?.email])

  const marcarLeida = async (notif: any) => {
    if (notif.leida) return

    if (!notif.esLocal && notif.supabaseId) {
      try {
        await supabase.from('notifications').update({ read: true }).eq('id', notif.supabaseId)
      } catch (error) {
        console.error('Error actualizando lectura:', error)
      }
    }

    setNotificaciones(prev => prev.map(n => n.id === notif.id ? { ...n, leida: true } : n))
    setNoLeidas(prev => Math.max(0, prev - 1))
  }

  const marcarTodasLeidas = async () => {
    const unreadSupabase = notificaciones.filter(n => !n.esLocal && !n.leida)
    for (const notif of unreadSupabase) {
      if (notif.supabaseId) {
        await supabase.from('notifications').update({ read: true }).eq('id', notif.supabaseId)
      }
    }

    setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })))
    setNoLeidas(0)
    toast.success('Todas marcadas como leídas')
  }

  const eliminarNotificacion = async (notif: any) => {
    if (!notif.esLocal && notif.supabaseId) {
      try {
        await supabase.from('notifications').delete().eq('id', notif.supabaseId)
      } catch (error) {
        console.error('Error eliminando notificación:', error)
      }
    }

    setNotificaciones(prev => prev.filter(n => n.id !== notif.id))
    if (!notif.leida) setNoLeidas(prev => prev - 1)
  }

  const getIcono = (tipo: string) => {
    switch (tipo) {
      case 'cita': return <Clock className="w-3.5 h-3.5 text-stone-700" />
      case 'puntos': return <Gift className="w-3.5 h-3.5 text-stone-600" />
      case 'promocion': return <Star className="w-3.5 h-3.5 text-stone-700" />
      default: return <Bell className="w-3.5 h-3.5 text-stone-400" />
    }
  }

  if (!user?.email) return null

  return (
    <div className="relative">
      <button
        onClick={() => setMostrarPanel(!mostrarPanel)}
        className="relative p-2.5 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 transition-all shadow-xs"
      >
        <Bell className="w-4 h-4 text-stone-700" />
        {noLeidas > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4 h-4 bg-stone-900 rounded-full text-[9px] text-white flex items-center justify-center font-mono px-1 font-bold shadow-sm animate-pulse">
            {noLeidas > 9 ? '9+' : noLeidas}
          </span>
        )}
      </button>

      {mostrarPanel && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMostrarPanel(false)} />
          <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-xl border border-stone-200/80 z-50 overflow-hidden transition-all duration-200">
            <div className="p-4 border-b border-stone-100 bg-stone-50/50 flex justify-between items-center">
              <div>
                <h3 className="text-xs font-mono uppercase tracking-wider text-stone-700 font-bold">Notificaciones</h3>
                <p className="text-[10px] text-stone-400 font-light mt-0.5">Alertas de turnos y beneficios</p>
              </div>
              <div className="flex items-center gap-3">
                {notificaciones.length > 0 && (
                  <button onClick={marcarTodasLeidas} className="text-[10px] font-mono uppercase text-stone-400 hover:text-stone-800 transition-all">
                    Leer todas
                  </button>
                )}
                <button onClick={() => setMostrarPanel(false)} className="text-stone-400 hover:text-stone-700">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-stone-100">
              {loading ? (
                <div className="p-8 text-center flex justify-center">
                  <div className="w-5 h-5 border-2 border-stone-900 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : notificaciones.length === 0 ? (
                <div className="p-8 text-center text-stone-400 font-light">
                  <Bell className="w-6 h-6 mx-auto mb-2 opacity-30 text-stone-500" />
                  <p className="text-xs">Bandeja de entrada vacía.</p>
                </div>
              ) : (
                notificaciones.map(notif => (
                  <div
                    key={notif.id}
                    className={`p-4 transition-all flex gap-3 relative group/item cursor-pointer ${notif.leida ? 'opacity-50 bg-white' : 'bg-stone-50/30 font-medium'}`}
                    onClick={() => marcarLeida(notif)}
                  >
                    <div className="w-7 h-7 bg-stone-100 rounded-lg flex items-center justify-center flex-shrink-0 border border-stone-200/40">
                      {getIcono(notif.tipo)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-stone-800 tracking-tight leading-tight">{notif.titulo}</p>
                      <p className="text-[11px] text-stone-500 font-light mt-0.5 leading-snug">{notif.mensaje}</p>
                      <p className="text-[9px] font-mono text-stone-400 mt-1.5">
                        {new Date(notif.fecha).toLocaleDateString()} · {new Date(notif.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); eliminarNotificacion(notif); }}
                      className="text-stone-300 hover:text-stone-600 transition-all opacity-0 group-hover/item:opacity-100 self-start pt-0.5"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
