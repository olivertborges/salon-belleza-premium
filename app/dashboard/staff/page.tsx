'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  FaCalendarAlt, 
  FaChartLine, 
  FaUserCheck, 
  FaClock, 
  FaCheckCircle,
  FaSignOutAlt,
  FaDollarSign,
  FaUserGraduate,
  FaFolderOpen,
  FaMoneyCheckAlt
} from 'react-icons/fa'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function StaffDashboard() {
  const [activeSection, setActiveSection] = useState<'agenda' | 'finanzas' | 'alumnos'>('agenda')

  const agendaHoy = [
    { id: 1, hora: '09:00 - 11:00', cliente: 'María Delgado', servicio: 'Microblading Cejas (Primera Sesión)', cabina: 'Cabina 2', pago: 'Liquidado', completado: true },
    { id: 2, hora: '11:30 - 12:30', cliente: 'Carlos Ruiz', servicio: 'Retoque Perfilado Cejas', cabina: 'Cabina 1', pago: 'Pendiente', completado: false },
    { id: 3, hora: '15:00 - 17:30', cliente: 'Sofía Martínez', servicio: 'Estructuras Extremas Gel + Decoración', cabina: 'Cabina 2', pago: 'Liquidado', completado: false }
  ]

  const desgloseFinanzas = {
    comisionesAcumuladas: '$1,120.00',
    bonoRendimiento: '$300.00',
    totalMes: '$1,420.00',
    serviciosCompletadosMes: 34
  }

  const alumnosAsignados = [
    { id: 501, nombre: 'Ana María Rossi', curso: 'Máster en Visagismo', asistencia: '92%', estadoExamen: 'Aprobado Práctico' },
    { id: 502, nombre: 'Jimena Fuentes', curso: 'Máster en Visagismo', asistencia: '85%', estadoExamen: 'Pendiente de Evaluación' }
  ]

  return (
    <main className="bg-stone-50 text-stone-900 min-h-screen flex flex-col justify-between">
      <Header />

      <section className="pt-32 pb-24 w-full max-w-7xl mx-auto px-4 flex-1">
        {/* Encabezado Técnico Staff */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-stone-200 pb-8 mb-10 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-white border border-stone-200 flex items-center justify-center font-bold text-lg text-stone-700 shadow-sm">
              DM
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-rose-600">Especialista / Instructor Clínico</p>
              <h2 className="text-2xl font-serif text-stone-800 tracking-tight">Diana Mendoza</h2>
            </div>
          </div>
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-mono text-stone-500 hover:text-stone-800 transition-colors bg-white border border-stone-200 px-4 py-2 rounded-xl shadow-sm">
            <FaSignOutAlt /> Volver al Sitio
          </Link>
        </div>

        {/* Resumen Operativo */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Procedimientos Hoy', val: '3 Citas', icon: <FaUserCheck className="text-rose-500" /> },
            { label: 'Efectividad Diaria', val: '1 / 3 Finalizados', icon: <FaCheckCircle className="text-emerald-600" /> },
            { label: 'Comisiones Netas', val: desgloseFinanzas.totalMes, icon: <FaDollarSign className="text-amber-600" /> },
            { label: 'Alumnos a Cargo', val: '14 Activos', icon: <FaUserGraduate className="text-sky-600" /> }
          ].map((item, idx) => (
            <div key={idx} className="bg-white border border-stone-200 p-4 rounded-xl flex items-center justify-between shadow-sm">
              <div>
                <p className="text-[9px] font-mono uppercase text-stone-400 tracking-wider">{item.label}</p>
                <p className="text-sm font-bold text-stone-800 mt-1">{item.val}</p>
              </div>
              <div className="text-xs">{item.icon}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Navegación Lateral Staff */}
          <div className="space-y-1.5">
            <button 
              onClick={() => setActiveSection('agenda')}
              className={`w-full text-left p-3.5 rounded-xl font-medium text-xs uppercase tracking-wider flex items-center gap-3 transition-all border ${activeSection === 'agenda' ? 'bg-white border-stone-300 text-stone-900 shadow-sm font-bold' : 'bg-transparent border-transparent text-stone-500 hover:bg-stone-200/50'}`}
            >
              <FaCalendarAlt className="text-stone-600" /> Mi Agenda Diaria
            </button>
            <button 
              onClick={() => setActiveSection('finanzas')}
              className={`w-full text-left p-3.5 rounded-xl font-medium text-xs uppercase tracking-wider flex items-center gap-3 transition-all border ${activeSection === 'finanzas' ? 'bg-white border-stone-300 text-stone-900 shadow-sm font-bold' : 'bg-transparent border-transparent text-stone-500 hover:bg-stone-200/50'}`}
            >
              <FaMoneyCheckAlt className="text-stone-600" /> Rendimiento & Comisiones
            </button>
            <button 
              onClick={() => setActiveSection('alumnos')}
              className={`w-full text-left p-3.5 rounded-xl font-medium text-xs uppercase tracking-wider flex items-center gap-3 transition-all border ${activeSection === 'alumnos' ? 'bg-white border-stone-300 text-stone-900 shadow-sm font-bold' : 'bg-transparent border-transparent text-stone-500 hover:bg-stone-200/50'}`}
            >
              <FaUserGraduate className="text-stone-600" /> Mis Alumnos (Academia)
            </button>
          </div>

          {/* Bloques de sección expandidos */}
          <div className="lg:col-span-3">
            
            {/* VISTA 1: AGENDA DIARIA */}
            {activeSection === 'agenda' && (
              <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Hojas de Ruta y Turnos del Día</h3>
                <div className="space-y-3">
                  {agendaHoy.map((turno) => (
                    <div key={turno.id} className={`p-4 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all ${turno.completado ? 'bg-stone-50/70 border-stone-200 opacity-60' : 'bg-white border-stone-200 hover:border-stone-300 shadow-sm'}`}>
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 bg-stone-100 border border-stone-200 rounded text-stone-700 flex items-center gap-1.5"><FaClock /> {turno.hora}</span>
                          <span className="text-[9px] font-mono bg-stone-50 px-2 py-0.5 rounded text-stone-400 border border-stone-100">{turno.cabina}</span>
                          <span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${turno.pago === 'Liquidado' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{turno.pago}</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-stone-900">{turno.cliente}</h4>
                          <p className="text-xs text-stone-500 font-light mt-0.5">{turno.servicio}</p>
                        </div>
                      </div>
                      <div>
                        {turno.completado ? (
                          <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 font-medium">Procedimiento Concluido</span>
                        ) : (
                          <button className="text-[10px] font-mono uppercase tracking-wider bg-stone-900 text-white px-4 py-2 rounded-xl font-bold shadow-sm hover:bg-stone-800 transition-colors">Iniciar Tratamiento</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* VISTA 2: RENDIMIENTO FINANCIERO */}
            {activeSection === 'finanzas' && (
              <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-6">
                <div>
                  <h3 className="text-base font-serif text-stone-800">Liquidación y Comisiones de Servicios</h3>
                  <p className="text-xs text-stone-500 font-light mt-0.5">Control de producción personal acumulada durante el ciclo mensual vigente.</p>
                </div>
                <div className="grid sm:grid-cols-3 gap-4 border-t border-b border-stone-100 py-6">
                  <div>
                    <p className="text-[10px] font-mono text-stone-400 uppercase tracking-wider">Comisión por Tratamientos</p>
                    <p className="text-xl font-black text-stone-900 mt-1">{desgloseFinanzas.comisionesAcumuladas}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-mono text-stone-400 uppercase tracking-wider">Bono por Calificaciones Hoy</p>
                    <p className="text-xl font-black text-stone-900 mt-1">{desgloseFinanzas.bonoRendimiento}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-mono text-stone-400 uppercase tracking-wider">Total Acumulado Neto</p>
                    <p className="text-xl font-black text-stone-900 mt-1 text-emerald-700">{desgloseFinanzas.totalMes}</p>
                  </div>
                </div>
                <div className="text-xs font-light text-stone-500 bg-stone-50 p-3 rounded-xl border border-stone-100">
                  Total de procedimientos médicos-estéticos ejecutados con éxito en el período actual: <strong>{desgloseFinanzas.serviciosCompletadosMes} servicios</strong>.
                </div>
              </div>
            )}

            {/* VISTA 3: ALUMNOS ASIGNADOS */}
            {activeSection === 'alumnos' && (
              <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">Seguimiento de Alumnos en Talleres</h3>
                <div className="overflow-x-auto border border-stone-100 rounded-xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-stone-50 text-[10px] font-mono uppercase tracking-wider text-stone-400 border-b border-stone-100">
                        <th className="p-4 font-medium">Estudiante</th>
                        <th className="p-4 font-medium">Curso Inscripto</th>
                        <th className="p-4 font-medium">Asistencia Física</th>
                        <th className="p-4 font-medium text-right">Evolución / Nota</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 text-xs text-stone-600 font-light">
                      {alumnosAsignados.map((alumno) => (
                        <tr key={alumno.id} className="hover:bg-stone-50/50">
                          <td className="p-4 font-medium text-stone-800">{alumno.nombre}</td>
                          <td className="p-4 text-stone-500">{alumno.curso}</td>
                          <td className="p-4 text-stone-500 font-mono">{alumno.asistencia}</td>
                          <td className="p-4 text-right"><span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200">{alumno.estadoExamen}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
