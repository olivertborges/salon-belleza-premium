'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { 
  Calendar, Sparkles, Gem, Gift, Camera, Clock, Star, Users, Zap, Heart,
  FaCalendarCheck, FaHistory, FaGraduationCap, FaIdCard, FaPlayCircle, FaAward
} from 'react-icons/fa'
import { LucideIcon } from 'lucide-react'

// Componentes interactivos que ya tenías desarrollados
import InsigniasLogros from '@/components/InsigniasLogros'
import Cumpleanos from '@/components/Cumpleanos'
import Notificaciones from '@/components/Notificaciones'
import InstagramFeed from '@/components/InstagramFeed'
import AntesDespues from '@/components/AntesDespues'
import QRReferido from '@/components/QRReferido'
import EstadisticasPersonales from '@/components/EstadisticasPersonales'
import RuedaSuerte from '@/components/RuedaSuerte'
import MisionesDiarias from '@/components/MisionesDiarias'
import RachaDeVisitas from '@/components/RachaDeVisitas'
import AgendarCita from '@/components/AgendarCita'
import PromocionesCliente from '@/components/PromocionesCliente'
import AnunciosCliente from '@/components/AnunciosCliente'

// Integración con tus servicios reales de Supabase
import { getClientes, getCitas, getServicios, actualizarPuntos } from '@/services/supabaseService'

export default function ClientDashboard() {
  const { user, db } = useAuth()
  const [activeTab, setActiveTab] = useState<'experiencia' | 'citas' | 'ficha' | 'cursos'>('experiencia')
  
  // Estados integrados de tu lógica original
  const [servicios, setServicios] = useState<any[]>([])
  const [citas, setCitas] = useState<any[]>([])
  const [puntos, setPuntos] = useState(0)
  const [referidos, setReferidos] = useState<any[]>([])
  const [fotos, setFotos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [serviciosAgrupados, setServiciosAgrupados] = useState([])
  const [racha, setRacha] = useState(0)

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [clientesData, citasData, serviciosData] = await Promise.all([
          getClientes(),
          getCitas(),
          getServicios()
        ])

        const cliente = clientesData.find((c: any) => c.email === user?.email)
        const misCitas = citasData.filter((c: any) => c.client_id === cliente?.id)

        setCitas(misCitas)
        setPuntos(cliente?.points || 0)
        setServicios(serviciosData)
      } catch (error) {
        console.error('Error cargando datos en Dashboard:', error)
      } finally {
        setLoading(false)
      }
    }

    if (user) cargarDatos()
  }, [user])

  // Lógica de cálculo de Niveles y Gamificación extraída de tu diseño previo
  const citasProximas = citas.filter(c => new Date(c.date) > new Date()).sort((a, b) => new Date(a.date) - new Date(b.date))
  const fotosRecientes = fotos.slice(0, 6)
  const codigoReferido = user?.codigoReferido || `FRESH${user?.name?.substring(0, 3).toUpperCase()}`

  const nivel = puntos >= 2000 ? 'Diamante' : puntos >= 1000 ? 'Oro' : puntos >= 500 ? 'Plata' : 'Bronce'
  const nivelesInfo: Record<string, { icon: string, next: number, beneficio: string }> = {
    Bronce: { icon: '🥉', next: 500, beneficio: '5% dcto cumpleaños' },
    Plata: { icon: '🥈', next: 1000, beneficio: '10% dcto + café gratis' },
    Oro: { icon: '🥇', next: 2000, beneficio: '15% dcto + servicio express' },
    Diamante: { icon: '💎', next: 3000, beneficio: '20% dcto + kit de regalo' }
  }

  const progresoNivel = Math.min(100, (puntos / nivelesInfo[nivel].next) * 100)
  const puntosFaltantes = nivelesInfo[nivel].next - puntos
  const serviciosUnicos = [...new Set(citas.map(c => c.serviceId))].length

  const handlePuntosGanados = (puntosGanados: number) => {
    setPuntos(prev => prev + puntosGanados)
    localStorage.setItem('freshNails_puntos', String(puntos + puntosGanados))
    if (db && user) {
      const cliente = db.clients?.find((c: any) => c.name === user?.name)
      if (cliente) {
        cliente.points = puntos + puntosGanados
      }
    }
  }

  // Ficha estética de cabina (Sección técnica extendida)
  const fichaEstetica = {
    biotipoCutaneo: 'Piel Mixta / Sensible',
    cejasDiseño: 'Arco suave y natural, técnica híbrida',
    pigmentoUtilizado: 'PhiBrows Brown 2 + Fox (Proporción 2:1)',
    ultimaModificacion: '12 Mayo, 2026'
  }

  // Cursos de la academia contratados
  const misCursos = [
    { id: 1, titulo: 'Masterclass en Arquitectura de Miradas y Visagismo', progreso: 75, leccionesCompletadas: 9, totalLecciones: 12, instructor: 'Diana Mendoza' }
  ]

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-stone-50">
        <div className="w-10 h-10 border-2 border-stone-900 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-mono tracking-widest text-stone-400 uppercase">Cargando tu experiencia...</p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 text-stone-900">
      
      {/* Sistema Superior de Alertas y Anuncios */}
      <div className="mb-6 space-y-3">
        <AnunciosCliente />
        <PromocionesCliente />
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        
        {/* Navegación de Control de Pestañas */}
        <div className="space-y-1.5">
          <button 
            onClick={() => setActiveTab('experiencia')}
            className={`w-full text-left p-3.5 rounded-xl font-medium text-xs uppercase tracking-wider flex items-center gap-3 transition-all border ${activeTab === 'experiencia' ? 'bg-white border-stone-300 text-stone-900 shadow-sm font-bold' : 'bg-transparent border-transparent text-stone-500 hover:bg-stone-200/50'}`}
          >
            <Gem className="text-amber-600 w-4 h-4" /> Club & Experiencia
          </button>
          <button 
            onClick={() => setActiveTab('citas')}
            className={`w-full text-left p-3.5 rounded-xl font-medium text-xs uppercase tracking-wider flex items-center gap-3 transition-all border ${activeTab === 'citas' ? 'bg-white border-stone-300 text-stone-900 shadow-sm font-bold' : 'bg-transparent border-transparent text-stone-500 hover:bg-stone-200/50'}`}
          >
            <FaCalendarCheck className="text-rose-500 w-4 h-4" /> Mis Turnos y Citas
          </button>
          <button 
            onClick={() => setActiveTab('ficha')}
            className={`w-full text-left p-3.5 rounded-xl font-medium text-xs uppercase tracking-wider flex items-center gap-3 transition-all border ${activeTab === 'ficha' ? 'bg-white border-stone-300 text-stone-900 shadow-sm font-bold' : 'bg-transparent border-transparent text-stone-500 hover:bg-stone-200/50'}`}
          >
            <FaIdCard className="text-stone-600 w-4 h-4" /> Historial Clínico
          </button>
          <button 
            onClick={() => setActiveTab('cursos')}
            className={`w-full text-left p-3.5 rounded-xl font-medium text-xs uppercase tracking-wider flex items-center gap-3 transition-all border ${activeTab === 'cursos' ? 'bg-white border-stone-300 text-stone-900 shadow-sm font-bold' : 'bg-transparent border-transparent text-stone-500 hover:bg-stone-200/50'}`}
          >
            <FaGraduationCap className="text-sky-600 w-4 h-4" /> Mis Cursos Aula
          </button>
        </div>

        {/* Contenido Principal Dinámico */}
        <div className="lg:col-span-3 space-y-8">
          
          {/* SECCIÓN 1: GAMIFICACIÓN Y CLUB DE FIDELIZACIÓN */}
          {activeTab === 'experiencia' && (
            <div className="space-y-6">
              
              {/* Tarjeta de Bienvenida y Reserva Rápida */}
              <div className="relative overflow-hidden rounded-2xl bg-stone-900 p-8 text-white shadow-md">
                <div className="relative z-10 max-w-lg">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-stone-400">Diseño & Alta Estética</p>
                  <h2 className="text-2xl font-serif text-stone-100 tracking-tight mt-1">¿Qué servicio deseas lucir hoy?</h2>
                  <p className="text-xs text-stone-300 font-light mt-2 mb-6">Agenda de forma inmediata tu turno o explora tus beneficios acumulados.</p>
                  <AgendarCita />
                </div>
                <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-white/10 to-transparent rounded-full -mr-16 -mt-16 pointer-events-none" />
              </div>

              {/* Rueda de la suerte y Racha integradas directamente en el flujo principal */}
              <div className="grid md:grid-cols-2 gap-6">
                <RuedaSuerte onPuntosGanados={handlePuntosGanados} />
                <RachaDeVisitas />
              </div>

              {/* Misiones y Cumpleaños */}
              <MisionesDiarias />
              <Cumpleanos user={user} onPuntosGanados={handlePuntosGanados} />

              {/* Métricas Estilizadas en Tarjetas Blancas con Contraste Suave */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white border border-stone-200 p-5 rounded-xl shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-mono uppercase text-stone-400 tracking-wider">Citas Realizadas</p>
                    <Calendar className="w-4 h-4 text-stone-400" />
                  </div>
                  <p className="text-2xl font-bold text-stone-800 mt-2">{citas.length}</p>
                </div>

                <div className="bg-white border border-stone-200 p-5 rounded-xl shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-mono uppercase text-stone-400 tracking-wider">Tu Puntuación</p>
                    <span className="text-xs">{nivelesInfo[nivel].icon} {nivel}</span>
                  </div>
                  <p className="text-2xl font-bold text-stone-800">{puntos} pts</p>
                  <div className="w-full bg-stone-100 h-1 rounded-full overflow-hidden">
                    <div className="bg-stone-900 h-full" style={{ width: `${progresoNivel}%` }} />
                  </div>
                  <p className="text-[9px] font-mono text-stone-400">Faltan {puntosFaltantes} pts para el siguiente rango</p>
                </div>

                <div className="bg-white border border-stone-200 p-5 rounded-xl shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-mono uppercase text-stone-400 tracking-wider">Amigas Referidas</p>
                    <Gift className="w-4 h-4 text-stone-400" />
                  </div>
                  <p className="text-2xl font-bold text-stone-800 mt-2">{referidos.length}</p>
                  <p className="text-[9px] font-mono text-emerald-600 mt-1">+{referidos.length * 500} pts extras</p>
                </div>
              </div>

              {/* Logros e Insignias */}
              <InsigniasLogros 
                citas={citas.length}
                serviciosUnicos={serviciosUnicos}
                referidos={referidos.length}
                puntos={puntos}
                racha={racha}
              />

              {/* Sistema de Invitaciones y Código de Referido Luminoso */}
              <QRReferido codigo={codigoReferido} user={user} />

              <div className="bg-white border border-stone-200 p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                  <h4 className="text-sm font-bold text-stone-800 tracking-tight">Invita a tus amigas a vivir la experiencia</h4>
                  <p className="text-xs text-stone-500 font-light mt-0.5">Sumarás 500 puntos por cada registro efectivo en nuestro centro.</p>
                </div>
                <div className="flex items-center gap-2">
                  <code className="bg-stone-50 border border-stone-200 rounded-lg px-4 py-2 text-xs font-mono font-bold text-stone-700">{codigoReferido}</code>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(codigoReferido)
                      alert('✨ ¡Código copiado de forma segura!')
                    }}
                    className="bg-stone-900 hover:bg-stone-800 text-white text-xs font-mono uppercase px-4 py-2 rounded-lg font-bold shadow-sm transition-all"
                  >
                    Copiar
                  </button>
                </div>
              </div>

              {/* Galería de Recuerdos y Trabajos */}
              <div className="bg-white border border-stone-200 p-6 rounded-2xl shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-stone-400 flex items-center gap-2"><Camera /> Tus Resultados Reales</h3>
                  <button className="text-xs font-mono tracking-wide text-stone-600 hover:underline">+ Subir Registro</button>
                </div>
                {fotosRecientes.length === 0 ? (
                  <div className="text-center py-6 text-stone-400 border border-dashed border-stone-200 rounded-xl">
                    <p className="text-xs font-light">Tus capturas de diseño de cejas o estructuras aparecerán aquí.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                    {fotosRecientes.map(foto => (
                      <div key={foto.id} className="aspect-square rounded-xl overflow-hidden bg-stone-100 border border-stone-200">
                        <img src={foto.url} className="w-full h-full object-cover" alt="Evolución estética" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Feeds y Antes/Después */}
              <AntesDespues user={user} onFotoSubida={handlePuntosGanados} />
              <InstagramFeed />
            </div>
          )}

          {/* SECCIÓN 2: CONTROL DE TURNOS Y AGENDAS */}
          {activeTab === 'citas' && (
            <div className="space-y-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">Tus Citas Próximas</h3>
              {citasProximas.length === 0 ? (
                <div className="bg-white border border-stone-200 p-8 rounded-2xl text-center text-stone-400">
                  <p className="text-xs font-light">No registras turnos agendados para los próximos días.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {citasProximas.map(cita => (
                    <div key={cita.id} className="bg-white border border-stone-200 p-4 rounded-xl flex justify-between items-center shadow-sm">
                      <div>
                        <p className="font-bold text-sm text-stone-800">{cita.serviceId}</p>
                        <p className="text-[11px] font-mono text-stone-400 mt-1">{new Date(cita.date).toLocaleString()}</p>
                      </div>
                      <span className="text-[10px] font-mono bg-stone-100 border border-stone-200 text-stone-700 px-3 py-1 rounded-full">Confirmado</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SECCIÓN 3: FICHA CLÍNICA / VISAGISMO */}
          {activeTab === 'ficha' && (
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
              <div>
                <h3 className="text-base font-serif text-stone-800">Ficha Técnica de Cabina</h3>
                <p className="text-xs text-stone-400 font-light mt-0.5">Parámetros morfológicos utilizados en tus visitas.</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-4 pt-2 text-xs">
                <div className="p-4 bg-stone-50 rounded-xl border border-stone-100">
                  <p className="font-mono text-[9px] uppercase text-stone-400">Dermis Facial</p>
                  <p className="font-medium text-stone-800 mt-1">{fichaEstetica.biotipoCutaneo}</p>
                </div>
                <div className="p-4 bg-stone-50 rounded-xl border border-stone-100">
                  <p className="font-mono text-[9px] uppercase text-stone-400">Último Diseño de Cejas</p>
                  <p className="font-medium text-stone-800 mt-1">{fichaEstetica.cejasDiseño}</p>
                </div>
              </div>
            </div>
          )}

          {/* SECCIÓN 4: CAPACITACIONES ACADÉMICAS */}
          {activeTab === 'cursos' && (
            <div className="grid md:grid-cols-2 gap-6">
              {misCursos.map((curso) => (
                <div key={curso.id} className="bg-white border border-stone-200 p-6 rounded-2xl shadow-sm flex flex-col justify-between space-y-4">
                  <div>
                    <span className="text-[9px] font-mono bg-stone-100 px-2 py-0.5 rounded text-stone-500">Instructor: {curso.instructor}</span>
                    <h4 className="text-sm font-bold text-stone-800 mt-2">{curso.titulo}</h4>
                  </div>
                  <button className="w-full bg-stone-900 text-white font-mono text-[10px] uppercase py-2.5 rounded-xl shadow-sm">Ingresar al Aula Virtual</button>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
