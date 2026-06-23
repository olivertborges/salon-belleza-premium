'use client'

import Link from 'next/link'
import { FaArrowLeft, FaCalendarAlt, FaWhatsapp } from 'react-icons/fa'

export default function ReservasPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-20">
      <div className="container mx-auto px-4 max-w-2xl">
        <Link href="/" className="inline-flex items-center gap-2 text-rose-400 hover:text-rose-500 transition-colors mb-8">
          <FaArrowLeft /> Volver al inicio
        </Link>

        <div className="bg-white rounded-3xl p-8 shadow-xl">
          <h1 className="text-4xl font-light text-gray-800 mb-4">
            <span className="font-bold bg-gradient-to-r from-rose-400 to-amber-400 text-transparent bg-clip-text">Reservar Cita</span>
          </h1>
          <p className="text-gray-400 mb-8">Completa el formulario y te confirmaremos tu cita.</p>

          <form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-200 transition-all" placeholder="Tu nombre" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono</label>
                <input type="tel" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-200 transition-all" placeholder="Tu teléfono" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input type="email" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-200 transition-all" placeholder="tu@email.com" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Servicio</label>
                <select className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-200 transition-all">
                  <option>Selecciona un servicio</option>
                  <option>Microblading</option>
                  <option>Powder Brows</option>
                  <option>Micropigmentación Labial</option>
                  <option>Uñas Acrílicas</option>
                  <option>Uñas de Gel</option>
                  <option>Nail Art</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fecha</label>
                <input type="date" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-200 transition-all" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mensaje</label>
              <textarea rows={3} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-200 transition-all" placeholder="¿Algo que quieras agregar?"></textarea>
            </div>
            <button className="w-full bg-gradient-to-r from-rose-400 to-amber-400 text-white py-4 rounded-xl font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2">
              <FaCalendarAlt /> Enviar solicitud
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            O contáctanos por <a href="https://wa.me/1234567890" target="_blank" className="text-green-500 font-medium hover:underline">WhatsApp <FaWhatsapp className="inline" /></a>
          </div>
        </div>
      </div>
    </main>
  )
}
