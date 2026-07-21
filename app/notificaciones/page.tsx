// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase/client'
import { 
  FaArrowLeft, 
  FaBell, 
  FaCalendarCheck, 
  FaGift, 
  FaGem, 
  FaCheck, 
  FaToggleOn, 
  FaToggleOff, 
  FaPaperPlane, 
  FaTrashAlt,
  FaCircle,
  FaSpinner
} from 'react-icons/fa'

interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'cita' | 'promo' | 'puntos' | 'sistema'
  read: boolean
  link?: string
  created_at: string
}

export default function NotificacionesPage() {
  const { user } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [notificaciones, setNotificaciones] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Estados para enviar notificaciones (admin)
  const [pushTitle, setPushTitle] = useState('')
  const [pushType, setPushType] = useState<'cita' | 'promo' | 'puntos' | 'sistema'>('promo')
  const [pushMessage, setPushMessage] = useState('')
  const [sending, setSending] = useState(false)

  // ✅ CARGAR NOTIFICACIONES DEL USUARIO
  const cargarNotificaciones = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setNotificaciones(data || [])
    } catch (err: any) {
      console.error('Error cargando notificaciones:', err)
      setError(err.message || 'Error al cargar notificaciones')
    } finally {
      setLoading(false)
    }
  }

  // ✅ ESCUCHAR NOTIFICACIONES EN TIEMPO REAL
  useEffect(() => {
    cargarNotificaciones()

    if (!user) return

    const canalNotificaciones = supabase
      .channel('notificaciones-usuario')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔔 Nueva notificación recibida:', payload.new)
          setNotificaciones(prev => [payload.new, ...prev])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(canalNotificaciones)
    }
  }, [user])

  // ✅ MARCAR COMO LEÍDA
  const marcarLeida = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id)

      if (error) throw error

      setNotificaciones(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      )
    } catch (err) {
      console.error('Error marcando como leída:', err)
    }
  }

  // ✅ ELIMINAR NOTIFICACIÓN
  const eliminarNotificacion = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id)

      if (error) throw error

      setNotificaciones(prev => prev.filter(n => n.id !== id))
    } catch (err) {
      console.error('Error eliminando notificación:', err)
    }
  }

  // ✅ ENVIAR NOTIFICACIÓN MASIVA (SOLO ADMIN)
  const handleSendPush = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pushTitle || !pushMessage) {
      alert('Completa todos los campos')
      return
    }

    setSending(true)
    try {
      // Obtener todos los usuarios
      const { data: users } = await supabase
        .from('profiles')
        .select('id, email, role')
        .neq('role', 'admin') // No enviar a admins

      if (!users || users.length === 0) {
        alert('No hay usuarios para enviar notificaciones')
        setSending(false)
        return
      }

      // Crear notificaciones para cada usuario
      const notifications = users.map(u => ({
        user_id: u.id,
        title: pushTitle,
        message: pushMessage,
        type: pushType,
        read: false,
        created_at: new Date().toISOString()
      }))

      const { error } = await supabase
        .from('notifications')
        .insert(notifications)

      if (error) throw error

      alert(`✅ Notificación enviada a ${users.length} usuarios`)
      setPushTitle('')
      setPushMessage('')
      setPushType('promo')
    } catch (err: any) {
      console.error('Error enviando notificación:', err)
      alert('Error al enviar notificaciones: ' + err.message)
    } finally {
      setSending(false)
    }
  }

  // ✅ CONTAR NO LEÍDAS
  const noLeidas = notificaciones.filter(n => !n.read).length

  // Helper para iconos
  const getIcon = (type: string) => {
    switch (type) {
      case 'cita': return <FaCalendarCheck className="text-rose-400" />
      case 'promo': return <FaGift className="text-amber-400" />
      case 'puntos': return <FaGem className="text-emerald-400" />
      default: return <FaBell className="text-slate-400" />
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <FaSpinner className="text-rose-500 text-3xl animate-spin" />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-100 pb-20 overflow-x-hidden">
      
      {/* Top Bar */}
      <div className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 p-4 sticky top-0 z-40 flex items-center justify-between">
        <Link href="/" className="text-slate-400 flex items-center gap-1.5 text-xs uppercase tracking-wider font-medium">
          <FaArrowLeft className="text-rose-400" /> Volver
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-slate-400">
            {noLeidas > 0 ? `${noLeidas} no leídas` : 'Todo leído'}
          </span>
          <button 
            onClick={() => setIsAdmin(!isAdmin)} 
            className="flex items-center gap-2 text-[10px] bg-slate-950 px-3 py-1.5 rounded-full border border-slate-800 tracking-widest uppercase text-slate-300 active:scale-95 transition-all"
          >
            {isAdmin ? <FaToggleOn className="text-rose-400 text-sm" /> : <FaToggleOff className="text-slate-500 text-sm" />}
            {isAdmin ? 'Admin Push' : 'Alertas VIP'}
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 mt-6">
        
        <div className="mb-6">
          <h1 className="text-2xl font-light text-slate-100 tracking-tight">
            Centro de <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-amber-400 to-rose-400">Notificaciones</span>
          </h1>
          <p className="text-slate-400 text-xs font-light mt-1">
            {notificaciones.length} notificaciones • {noLeidas} sin leer
          </p>
        </div>

        {/* FORMULARIO ADMIN */}
        {isAdmin && (
          <div className="bg-slate-900 border-2 border-dashed border-amber-500/30 p-5 rounded-3xl shadow-xl mb-6 animate-in slide-in-from-top-4 duration-300">
            <h2 className="text-xs uppercase tracking-wider font-bold text-amber-400 flex items-center gap-1.5 mb-3">
              <FaPaperPlane /> Lanzar Alerta Push Masiva
            </h2>
            <form onSubmit={handleSendPush} className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <input 
                  type="text"
                  placeholder="Título Alerta"
                  value={pushTitle}
                  onChange={(e) => setPushTitle(e.target.value)}
                  className="col-span-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-rose-400 text-slate-100 font-medium"
                  required
                />
                <select 
                  value={pushType} 
                  onChange={(e) => setPushType(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-2 py-2.5 text-xs text-slate-300 focus:outline-none"
                >
                  <option value="cita">Cita</option>
                  <option value="promo">Promo</option>
                  <option value="puntos">Puntos</option>
                  <option value="sistema">Sistema</option>
                </select>
              </div>
              <textarea 
                placeholder="Escribe el mensaje push que le llegará a tus clientes..."
                value={pushMessage}
                onChange={(e) => setPushMessage(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs focus:outline-none h-16 resize-none text-slate-300"
                required
              />
              <button 
                type="submit"
                disabled={sending}
                className="w-full bg-gradient-to-r from-amber-500 to-rose-500 text-white py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider active:scale-[0.99] transition-transform flex items-center justify-center gap-1.5 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <>
                    <FaSpinner className="animate-spin" /> Enviando...
                  </>
                ) : (
                  'Disparar Alerta Premium'
                )}
              </button>
            </form>
          </div>
        )}

        {/* LISTA DE NOTIFICACIONES */}
        <div className="space-y-3">
          {notificaciones.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-800 rounded-3xl">
              <FaBell className="text-slate-700 text-3xl mx-auto mb-2 opacity-40" />
              <p className="text-xs text-slate-500">No hay notificaciones para mostrar</p>
            </div>
          ) : (
            notificaciones.map((notif) => (
              <div 
                key={notif.id}
                onClick={() => marcarLeida(notif.id)}
                className={`p-4 rounded-2xl border transition-all relative flex gap-4 cursor-pointer group ${
                  notif.read 
                    ? 'bg-slate-900/40 border-slate-900 opacity-60' 
                    : 'bg-slate-900/80 border-slate-800 shadow-md shadow-rose-500/[0.02]'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-850 flex items-center justify-center text-sm shrink-0">
                  {getIcon(notif.type)}
                </div>

                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-xs text-slate-200 tracking-tight truncate">{notif.title}</h3>
                    {!notif.read && <FaCircle className="text-[6px] text-rose-500 animate-pulse shrink-0" />}
                  </div>
                  <p className="text-[11px] text-slate-400 font-light mt-0.5 leading-relaxed">{notif.message}</p>
                  <span className="text-[9px] text-slate-500 block mt-2 font-medium">
                    {new Date(notif.created_at).toLocaleDateString('es')} • {new Date(notif.created_at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="absolute right-3 top-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      eliminarNotificacion(notif.id)
                    }}
                    className="text-slate-600 hover:text-rose-500 p-1 text-[11px] transition-colors"
                  >
                    <FaTrashAlt />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </main>
  )
}