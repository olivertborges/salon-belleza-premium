'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  FaArrowLeft, 
  FaUserPlus, 
  FaCopy, 
  FaWhatsapp, 
  FaDollarSign, 
  FaGift, 
  FaToggleOn, 
  FaToggleOff, 
  FaCheckCircle,
  FaShareAlt
} from 'react-icons/fa'

export default function ReferidosPage() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [copied, setCopied] = useState(false)
  
  // Código de referido simulado del cliente actual
  const referralCode = "VALERIA50"
  const referralLink = `https://tusitio.com/reservas?ref=${referralCode}`

  // Historial simulado de referidos
  const [referidos, setReferidos] = useState([
    { id: 1, name: 'María Alejandra', date: '12/06/2026', status: 'Completado', reward: '$15 Balance' },
    { id: 2, name: 'Lucía Fernández', date: '18/06/2026', status: 'Pendiente', reward: 'Esperando Cita' },
    { id: 3, name: 'Daniela Ortiz', date: '20/06/2026', status: 'Completado', reward: 'Lifting 50% Off' }
  ])

  const copiarEnlace = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-100 pb-20 overflow-x-hidden">
      
      {/* Top Navbar */}
      <div className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 p-4 sticky top-0 z-40 flex items-center justify-between">
        <Link href="/" className="text-slate-400 flex items-center gap-1.5 text-xs uppercase tracking-wider font-medium">
          <FaArrowLeft className="text-rose-400" /> Volver
        </Link>
        <button 
          onClick={() => setIsAdmin(!isAdmin)} 
          className="flex items-center gap-2 text-[10px] bg-slate-950 px-3 py-1.5 rounded-full border border-slate-800 tracking-widest uppercase text-slate-300 active:scale-95 transition-all"
        >
          {isAdmin ? <FaToggleOn className="text-rose-400 text-sm" /> : <FaToggleOff className="text-slate-500 text-sm" />}
          Vista: {isAdmin ? 'Admin Ref' : 'Embajador'}
        </button>
      </div>

      <div className="max-w-md mx-auto px-4 mt-6">
        
        {/* Cabecera */}
        <div className="mb-6">
          <h1 className="text-2xl font-light text-slate-100 tracking-tight">
            Programa de <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-amber-400 to-rose-400">Referidos</span>
          </h1>
          <p className="text-slate-400 text-xs font-light mt-1">Comparte la belleza. Invita a tus amigas y ambas recibirán beneficios exclusivos.</p>
        </div>

        {/* CONTENEDOR PRINCIPAL: TARJETA DE RECOMPENSA */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl mb-6 relative overflow-hidden">
          <div className="flex justify-around text-center mb-6 bg-slate-950/40 p-4 rounded-2xl border border-slate-850">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Invitadas</span>
              <span className="text-xl font-black text-slate-200">3 Amigas</span>
            </div>
            <div className="border-r border-slate-800" />
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Ganado</span>
              <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">$30.00</span>
            </div>
          </div>

          {/* Caja del Enlace para Compartir */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Tu Enlace de Invitación Único</label>
            <div className="flex gap-2 bg-slate-950 border border-slate-800 rounded-xl p-2 items-center">
              <input 
                type="text" 
                readOnly 
                value={referralLink}
                className="bg-transparent text-slate-300 text-xs flex-1 outline-none px-2 font-mono select-all truncate"
              />
              <button 
                onClick={copiarEnlace}
                className="bg-slate-800 text-slate-200 p-2.5 rounded-lg text-xs active:scale-90 transition-transform relative hover:bg-slate-700/80"
              >
                {copied ? <FaCheckCircle className="text-emerald-400" /> : <FaCopy />}
              </button>
            </div>
            {copied && (
              <p className="text-[10px] text-emerald-400 text-right font-medium animate-pulse">¡Enlace copiado al portapapeles!</p>
            )}
          </div>

          {/* Botón rápido de WhatsApp */}
          <a 
            href={`https://wa.me/?text=¡Hola!%20Te%20recomiendo%2520este%2520salón%2520estético.%2520Reserva%2520desde%252520mi%2520enlace%2520y%2520recibe%2520un%2520descuento%2520especial%2520en%2520tu%2520primer%2520tratamiento:%2520${encodeURIComponent(referralLink)}`}
            target="_blank"
            className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-md"
          >
            <FaWhatsapp className="text-sm" /> Compartir por WhatsApp
          </a>
        </div>

        {/* PASO A PASO EXPLICATIVO */}
        <div className="bg-slate-900/40 border border-slate-850 p-5 rounded-2xl mb-6 space-y-3">
          <h3 className="text-[11px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1.5">
            <FaGift className="text-rose-400" /> ¿Cómo funciona?
          </h3>
          <ol className="text-xs space-y-2 text-slate-300 font-light list-decimal pl-4 marker:text-rose-400 marker:font-bold">
            <li>Comparte tu enlace con amigas que nunca hayan asistido al salón.</li>
            <li>Ellas reciben un **10% de descuento** en su primera cita.</li>
            <li>Cuando asistan, tú recibes **$15 de saldo de regalo** en tu cuenta.</li>
          </ol>
        </div>

        {/* LISTADO / HISTORIAL DE REFERIDOS */}
        <h2 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-3 flex items-center gap-1.5">
          <FaUserPlus className="text-amber-400" /> {isAdmin ? 'Monitoreo Global de Referidos' : 'Tus Amigas Invitadas'}
        </h2>

        <div className="space-y-2.5">
          {referidos.map((ref) => (
            <div 
              key={ref.id}
              className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex justify-between items-center text-xs animate-in fade-in"
            >
              <div>
                <h4 className="font-bold text-slate-200">{ref.name}</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Enlace usado: {ref.date}</p>
              </div>

              <div className="text-right">
                <span className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md block mb-1 text-center ${
                  ref.status === 'Completado' 
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                    : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                }`}>
                  {ref.status}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">{ref.reward}</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </main>
  )
}
