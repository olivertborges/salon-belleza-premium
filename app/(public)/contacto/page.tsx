'use client'

import Link from 'next/link'
import { FaArrowLeft, FaWhatsapp, FaPhone, FaEnvelope, FaMapMarkerAlt, FaClock, FaInstagram, FaFacebook, FaYoutube } from 'react-icons/fa'

export default function ContactoPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <Link href="/" className="inline-flex items-center gap-2 text-rose-400 hover:text-rose-500 transition-colors mb-8">
          <FaArrowLeft /> Volver al inicio
        </Link>

        <div className="bg-white rounded-3xl p-8 shadow-xl">
          <h1 className="text-4xl font-light text-gray-800 mb-4">
            <span className="font-bold bg-gradient-to-r from-rose-400 to-amber-400 text-transparent bg-clip-text">Contacto</span>
          </h1>
          <p className="text-gray-400 mb-8">Estamos aquí para ayudarte.</p>

          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-500 text-xl">
                  <FaWhatsapp />
                </div>
                <div>
                  <p className="text-sm text-gray-500">WhatsApp</p>
                  <a href="https://wa.me/1234567890" target="_blank" className="font-medium hover:text-green-600">+34 123 456 789</a>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-500 text-xl">
                  <FaPhone />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Teléfono</p>
                  <p className="font-medium">+34 123 456 789</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center text-pink-500 text-xl">
                  <FaEnvelope />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">info@salonpremium.com</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-500 text-xl">
                  <FaMapMarkerAlt />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Dirección</p>
                  <p className="font-medium">Calle Principal 123, Madrid</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center text-yellow-500 text-xl">
                  <FaClock />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Horario</p>
                  <p className="font-medium">Lun-Sáb: 9:00 - 21:00</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-4">Síguenos</h3>
              <div className="flex gap-4">
                <a href="#" className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center text-white hover:scale-110 transition-transform">
                  <FaInstagram size={20} />
                </a>
                <a href="#" className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center text-white hover:scale-110 transition-transform">
                  <FaFacebook size={20} />
                </a>
                <a href="#" className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center text-white hover:scale-110 transition-transform">
                  <FaYoutube size={20} />
                </a>
              </div>

              <div className="mt-8">
                <h3 className="font-semibold text-gray-800 mb-4">Envíanos un mensaje</h3>
                <form className="space-y-4">
                  <input type="text" placeholder="Nombre" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-200 transition-all" />
                  <input type="email" placeholder="Email" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-200 transition-all" />
                  <textarea rows={3} placeholder="Mensaje" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-200 transition-all" />
                  <button className="w-full bg-gradient-to-r from-rose-400 to-amber-400 text-white py-3 rounded-xl font-medium hover:shadow-lg transition-all">
                    Enviar mensaje
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
