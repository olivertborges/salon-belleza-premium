// components/appointments/SmartCalendar.tsx
// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { useAppointments } from '@/hooks/useAppointments'
import { useAI } from '@/hooks/useAI'

export function SmartCalendar() {
  const { appointments, createAppointment, cancelAppointment } = useAppointments()
  const { predictAvailability, suggestTimes } = useAI()
  const [selectedService, setSelectedService] = useState('')
  const [selectedProfessional, setSelectedProfessional] = useState('')
  const [suggestedTimes, setSuggestedTimes] = useState([])

  const handleDateSelect = async (selectInfo) => {
    // IA sugiere mejores horarios
    const suggestions = await suggestTimes({
      date: selectInfo.startStr,
      service: selectedService,
      professional: selectedProfessional
    })
    setSuggestedTimes(suggestions)
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6">
      {/* Filtros inteligentes */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <select 
          className="p-3 border rounded-xl"
          onChange={(e) => setSelectedService(e.target.value)}
        >
          <option value="">Selecciona servicio</option>
          <option value="corte">Corte de cabello</option>
          <option value="color">Coloración</option>
          <option value="peinado">Peinado</option>
          <option value="maquillaje">Maquillaje</option>
          <option value="tratamiento">Tratamiento capilar</option>
        </select>

        <select 
          className="p-3 border rounded-xl"
          onChange={(e) => setSelectedProfessional(e.target.value)}
        >
          <option value="">Estilista</option>
          <option value="maria">María - Experta en color</option>
          <option value="carlos">Carlos - Cortes modernos</option>
          <option value="laura">Laura - Maquillaje</option>
          <option value="ana">Ana - Tratamientos</option>
        </select>

        <button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-3 rounded-xl">
          🔮 Buscar con IA
        </button>
      </div>

      {/* Calendario */}
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        initialView='timeGridWeek'
        editable={true}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={true}
        weekends={true}
        select={handleDateSelect}
        events={appointments}
        eventContent={renderEventContent}
        slotMinTime="08:00:00"
        slotMaxTime="21:00:00"
        allDaySlot={false}
        height="auto"
        themeSystem='standard'
      />

      {/* Sugerencias de IA */}
      {suggestedTimes.length > 0 && (
        <motion.div 
          className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <h3 className="font-bold mb-3">🤖 IA recomienda:</h3>
          <div className="grid grid-cols-3 gap-3">
            {suggestedTimes.map((time, idx) => (
              <motion.button
                key={idx}
                className="p-3 bg-white rounded-xl shadow-md hover:shadow-lg"
                whileHover={{ scale: 1.05 }}
                onClick={() => createAppointment(time)}
              >
                <p className="font-bold">{time.time}</p>
                <p className="text-sm text-gray-500">{time.professional}</p>
                <p className="text-green-500 text-sm">⭐ {time.rating}</p>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}