'use client'

import { useState } from 'react'
import Link from 'next/link'
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
  FaCircle
} from 'react-icons/fa'

export default function NotificacionesPage() {
  const [isAdmin, setIsAdmin] = useState(false)

  // Mensajes y Alertas simuladas (Listo para conectar con tu tabla 'notifications' en Supabase)
  const [notificaciones, setNotificaciones] = useState([
    { id: 1, type: 'cita', title: 'Recordatorio de Cita', message: 'Tu sesión de Microblading con Elena Gómez es mañana a las 10:30 AM. ¡Te esperamos!', time: 'Hace 2 horas', read: false },
    { id: 2, type: 'promo', title: 'Regalo de Cumpleaños 🎉', message: '¡Felicidades! Tienes un 20% de descuento válido durante todo este mes en Micropigmentación.', time: 'Hace 1 día', read: false },
    { id: 3, type: 'puntos', title: '¡Puntos Acreditados!', message: 'Sumaste +150 puntos en tu cuenta por tu última visita. Estás muy cerca del nivel Diamond.', time: 'Hace 3 días', read: true },
    { id: 4, type: 'sistema', title: 'Retoque Pendiente', message: 'Ya han pasado 30 días desde tu Lifting de Pestañas. Te recomendamos agendar un mantenimiento.', time: 'Hace 1 semana', read: true },
  ])

  // Estados para simular envío masivo de notificaciones push
  const [pushTitle, setPushTitle] = useState('')
  const [pushType, setPushType] = useState('promo')
  const [pushMessage, setPushMessage] = useState('')

  // Marcar una como leída
  const marcarLeida = (id: number) => {
    setNotificaciones(notificaciones.map(n => n.id === id ? { ...n, read: true } : n))
  }

  // Eliminar notificación
  const eliminarNotificacion = (id: number) => {
    setNotificaciones(notificaciones.filter(n => n.id !== id))
  }

  // Simular envío masivo desde caja/administración
  const handleSendPush = (e: React.FormEvent) => {
    e.preventDefault()
    if (!pushTitle || !pushMessage) return

    const nuevaPush = {
      id: Date.now(),
      type: pushType,
      title: pushTitle,
      message: pushMessage,
      time: 'Ahora mismo',
      read: false
    }

    setNotificaciones([nuevaPush, ...notificaciones])
    setPushTitle('')
    setPushMessage('')
  }

  // Helper para asignar icono según tipo
  const getIcon = (type: string) => {
    switch (type) {
      case 'cita': return <FaCalendarCheck className="text-rose-400" />
      case 'promo': return <FaGift className="text-amber-400" />
      case 'puntos': return <FaGem className="text-emerald-400" />
      default: return <FaBell className="text-slate-400" />
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-100 pb-20 overflow-x-hidden">
      
      {/* Top Bar de navegación */}
      <div className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 p-4 sticky top-0 z-40 flex items-center justify-between">
        <Link href="/" className="text-slate-400 flex items-center gap-1.5 text-xs uppercase tracking-wider font-medium">
          <FaArrowLeft className="text-rose-400" /> Volver
        </Link>
        <button 
          onClick={() => setIsAdmin(!isAdmin)} 
          className="flex items-center gap-2 text-[10px] bg-slate-950 px-3 py-1.5 rounded-full border border-slate-800 tracking-widest uppercase text-slate-300 active:scale-95 transition-all"
        >
          {isAdmin ? <FaToggleOn className="text-rose-400 text-sm" /> : <FaToggleOff className="text-slate-500 text-sm" />}
          Sistema: {isAdmin ? 'Caja Push' : 'Alertas VIP'}
        </button>
      </div>

      <div className="max-w-md mx-auto px-4 mt-6">
        
        {/* Título e introducción */}
        <div className="mb-6">
          <h1 className="text-2xl font-light text-slate-100 tracking-tight">
            Centro de <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-amber-400 to-rose-400">Notificaciones</span>
          </h1>
          <p className="text-slate-400 text-xs font-light mt-1">Mantente al tanto de tus citas programadas, promociones exclusivas y balances del club.</p>
        </div>

        {/* MODAL / FORMULARIO EMISIÓN PUSH (MODO ADMIN) */}
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
                  onChange={(e) => setPushType(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-2 py-2.5 text-xs text-slate-300 focus:outline-none"
                >
                  <option value="cita">Cita</option>
                  <option value="promo">Promo</option>
                  <option value="puntos">Puntos</option>
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
                className="w-full bg-gradient-to-r from-amber-500 to-rose-500 text-white py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider active:scale-[0.99] transition-transform flex items-center justify-center gap-1.5 shadow-lg"
              >
                Disparar Alerta Premium
              </button>
            </form>
          </div>
        )}

        {/* CONTENEDOR DE MENSAJES RECIBIDOS */}
        <div className="space-y-3">
          {notificaciones.map((notif) => (
            <div 
              key={notif.id}
              onClick={() => marcarLeida(notif.id)}
              className={`p-4 rounded-2xl border transition-all relative flex gap-4 cursor-pointer group ${
                notif.read 
                  ? 'bg-slate-900/40 border-slate-900 opacity-60' 
                  : 'bg-slate-900/80 border-slate-800 shadow-md shadow-rose-500/[0.02]'
              }`}
            >
              {/* Icono Redondeado de Tipo */}
              <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-850 flex items-center justify-center text-sm shrink-0">
                {getIcon(notif.type)}
              </div>

              {/* Contenido */}
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-xs text-slate-200 tracking-tight truncate">{notif.title}</h3>
                  {!notif.read && <FaCircle className="text-[6px] text-rose-500 animate-pulse shrink-0" />}
                </div>
                <p className="text-[11px] text-slate-400 font-light mt-0.5 leading-relaxed">{notif.message}</p>
                <span className="text-[9px] text-slate-500 block mt-2 font-medium">{notif.time}</span>
              </div>

              {/* Acciones Rápidas */}
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
          ))}

          {notificaciones.length === 0 && (
            <div className="text-center py-12 border border-dashed border-slate-800 rounded-3xl">
              <FaBell className="text-slate-700 text-3xl mx-auto mb-2 opacity-40" />
              <p className="text-xs text-slate-500">Tu bandeja de entrada está impecable y vacía.</p>
            </div>
          )}
        </div>

      </div>
    </main>
  )
}
