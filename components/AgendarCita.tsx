'use client'

import React, { useState, useEffect } from 'react'
import { Calendar, X, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase/client'

interface AgendarCitaProps {
  onCitaAgendada?: () => void
}

export default function AgendarCita({ onCitaAgendada }: AgendarCitaProps) {
  const { user, tenantId } = useAuth()
  const [servicios, setServicios] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [step, setStep] = useState(1)
  const [mounted, setMounted] = useState(false)
  const [formData, setFormData] = useState({
    servicioId: '',
    fecha: '',
    hora: '',
    notas: ''
  })

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    if (tenantId) {
      cargarServicios()
    }
  }, [tenantId])

  const cargarServicios = async () => {
    try {
      const { data } = await supabase
        .from('services')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)

      if (data) setServicios(data)
    } catch (error) {
      console.error('Error cargando servicios:', error)
    }
  }

  const horasDisponibles = [
    '09:00', '10:00', '11:00', '12:00', '13:00', 
    '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
  ]

  const generarProximosDias = () => {
    const dias = []
    for (let i = 1; i <= 14; i++) {
      const fecha = new Date()
      fecha.setDate(fecha.getDate() + i)
      dias.push({
        fecha: fecha.toISOString().split('T')[0],
        diaSemana: fecha.toLocaleDateString('es-ES', { weekday: 'short' }),
        diaNumero: fecha.getDate(),
        mes: fecha.toLocaleDateString('es-ES', { month: 'short' })
      })
    }
    return dias
  }

  const proximosDias = generarProximosDias()
  const servicioSeleccionado = servicios.find(s => s.id === formData.servicioId)

  const handleNext = () => {
    if (step === 1 && !formData.servicioId) {
      toast.error('Selecciona un servicio')
      return
    }
    setStep(step + 1)
  }

  const handleBack = () => {
    setStep(step - 1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.fecha || !formData.hora) {
      toast.error('Selecciona fecha y hora')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase
        .from('appointments')
        .insert({
          client_id: user?.id,
          service_id: formData.servicioId,
          date: formData.fecha,
          time: formData.hora,
          notes: formData.notas,
          tenant_id: tenantId,
          status: 'pending'
        })

      if (error) throw error

      toast.success('✨ ¡Cita agendada con éxito!')
      setShowModal(false)
      setStep(1)
      setFormData({ servicioId: '', fecha: '', hora: '', notas: '' })

      if (onCitaAgendada) onCitaAgendada()

    } catch (error: any) {
      console.error(error)
      toast.error(error.message || 'Error al agendar la cita')
    } finally {
      setLoading(false)
    }
  }

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] p-4" 
      onClick={() => setShowModal(false)}
    >
      <div 
        className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl md:rounded-2xl w-full max-w-[95vw] sm:max-w-md lg:max-w-lg max-h-[90vh] overflow-y-auto border border-white/20 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-gray-800/95 backdrop-blur-sm border-b border-white/10 p-4 md:p-5">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 md:w-8 md:h-8 bg-gradient-to-br from-[#DB5B9A] to-[#E5A46E] rounded-xl flex items-center justify-center">
                <Calendar className="w-3 h-3 md:w-4 md:h-4 text-white" />
              </div>
              <h3 className="text-base md:text-lg font-bold text-white">Agendar Cita</h3>
            </div>
            <button onClick={() => setShowModal(false)} className="p-1 rounded-full hover:bg-white/10 transition-all">
              <X className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex-1">
                <div className={`h-1 rounded-full transition-all ${step >= s ? 'bg-gradient-to-r from-[#DB5B9A] to-[#E5A46E]' : 'bg-white/20'}`} />
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Paso {step} de 3: {step === 1 ? 'Elige servicio' : step === 2 ? 'Fecha y hora' : 'Confirmar'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4 md:space-y-5">
          {step === 1 && (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">¿Qué servicio deseas?</label>
              <div className="grid grid-cols-1 gap-2 max-h-[50vh] overflow-y-auto pr-1">
                {servicios.map((s: any) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, servicioId: s.id })}
                    className={`p-3 md:p-4 rounded-xl text-left transition-all ${
                      formData.servicioId === s.id
                        ? 'bg-gradient-to-r from-[#DB5B9A] to-[#E5A46E] text-white shadow-lg'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-sm md:text-base">{s.name}</p>
                        <p className="text-xs opacity-80 mt-1">{s.duration || '30 min'}</p>
                      </div>
                      <p className="font-bold text-sm md:text-base">${s.price?.toLocaleString()}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Selecciona una fecha</label>
                <div className="overflow-x-auto pb-2">
                  <div className="flex gap-2 min-w-max">
                    {proximosDias.map((dia) => (
                      <button
                        key={dia.fecha}
                        type="button"
                        onClick={() => setFormData({ ...formData, fecha: dia.fecha })}
                        className={`flex flex-col items-center p-2 md:p-3 rounded-xl min-w-[60px] md:min-w-[70px] transition-all ${
                          formData.fecha === dia.fecha
                            ? 'bg-gradient-to-r from-[#DB5B9A] to-[#E5A46E] text-white shadow-lg'
                            : 'bg-white/10 text-gray-300 hover:bg-white/20'
                        }`}
                      >
                        <span className="text-xs md:text-sm">{dia.diaSemana}</span>
                        <span className="text-lg md:text-xl font-bold">{dia.diaNumero}</span>
                        <span className="text-[10px] md:text-xs">{dia.mes}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Selecciona una hora</label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {horasDisponibles.map(hora => (
                    <button
                      key={hora}
                      type="button"
                      onClick={() => setFormData({ ...formData, hora })}
                      className={`py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-medium transition-all ${
                        formData.hora === hora
                          ? 'bg-gradient-to-r from-[#DB5B9A] to-[#E5A46E] text-white shadow-md'
                          : 'bg-white/10 text-gray-300 hover:bg-white/20'
                      }`}
                    >
                      {hora}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Notas (opcional)</label>
                <textarea
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 md:py-2.5 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:border-[#DB5B9A] placeholder-gray-500"
                  placeholder="Alergias, observaciones adicionales..."
                />
              </div>
            </div>
          )}

          {step === 3 && servicioSeleccionado && formData.fecha && formData.hora && (
            <div className="space-y-4">
              <div className="p-4 md:p-5 bg-gradient-to-r from-[#DB5B9A]/20 to-[#E5A46E]/20 rounded-xl border border-white/10">
                <p className="text-xs text-gray-400 mb-3">📋 Revisa los detalles de tu cita</p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-white/10">
                    <span className="text-gray-400 text-sm">Servicio</span>
                    <span className="text-white font-semibold text-sm">{servicioSeleccionado.name}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-white/10">
                    <span className="text-gray-400 text-sm">Fecha</span>
                    <span className="text-white text-sm">
                      {new Date(formData.fecha).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-white/10">
                    <span className="text-gray-400 text-sm">Hora</span>
                    <span className="text-white text-sm">{formData.hora} hrs</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-gray-400 text-sm">Total</span>
                    <span className="text-[#DB5B9A] font-bold text-lg">${servicioSeleccionado.price?.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className="bg-green-500/10 rounded-xl p-3 border border-green-500/30">
                <p className="text-green-400 text-xs flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Ganarás {Math.floor((servicioSeleccionado.price || 0) / 100)} puntos por esta cita
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            {step > 1 && (
              <button type="button" onClick={handleBack} className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-gray-300 hover:bg-white/20 transition-all text-sm">
                <ChevronLeft className="w-4 h-4 inline" /> Atrás
              </button>
            )}
            {step < 3 ? (
              <button type="button" onClick={handleNext} className="flex-1 py-2 bg-gradient-to-r from-[#DB5B9A] to-[#E5A46E] text-white rounded-xl font-semibold hover:shadow-lg transition-all text-sm">
                Continuar <ChevronRight className="w-4 h-4 inline" />
              </button>
            ) : (
              <button type="submit" disabled={loading} className="flex-1 py-2 bg-gradient-to-r from-[#DB5B9A] to-[#E5A46E] text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 text-sm">
                {loading ? 'Agendando...' : 'Confirmar Cita ✓'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="w-full py-3 md:py-4 bg-gradient-to-r from-[#DB5B9A] to-[#E5A46E] text-white rounded-xl md:rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 text-sm md:text-base"
      >
        <Calendar className="w-4 h-4 md:w-5 md:h-5" />
        Agendar mi cita
      </button>

      {mounted && showModal && modalContent}
    </>
  )
}
