'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/config/supabase'
import { 
  FaCalendarCheck, FaGift, FaShoppingBag, FaHeart, 
  FaArrowRight, FaClock, FaMapMarkerAlt 
} from 'react-icons/fa' // <-- Quitamos FaSparkles de aquí
import { Sparkles } from 'lucide-react' // <-- Traemos Sparkles desde lucide-react
import Link from 'next/link'

interface Cita {
  id: string
  date: string
  time: string
  status: string
  services: { name: string } | null
}

interface Producto {
  id: string
  name: string
  price: number
  image_url: string
  category: string
}

export default function ClientDashboardHome() {
  const { user, tenantId } = useAuth()
  const [proximaCita, setProximaCita] = useState<Cita | null>(null)
  const [puntos, setPuntos] = useState(0)
  const [productosDestacados, setProductosDestacados] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)

  // Controlar la carga de la sesión
  useEffect(() => {
    // Si los datos de autenticación ya están disponibles, cargamos la info
    if (user?.email && tenantId) {
      cargarDatosDashboard()
    } else {
      // Plan de respaldo: si después de 2.5 segundos el contexto no responde,
      // quitamos la pantalla de carga para que el usuario no vea la app congelada
      const timer = setTimeout(() => {
        setLoading(false)
      }, 2500)
      
      return () => clearTimeout(timer)
    }
  }, [user, tenantId])

const cargarDatosDashboard = async () => {
    try {
      setLoading(true)
      const clientAnonym: any = supabase

      // 1. Obtener ID del cliente y sus puntos reales
      const { data: cliente, error: clientError } = await clientAnonym
        .from('clients')
        .select('id, points')
        .eq('email', user?.email)
        .eq('tenant_id', tenantId)
        .maybeSingle() // Usamos maybeSingle para evitar bloqueos si no encuentra fila

      if (clientError) throw clientError

      if (cliente) {
        setPuntos(cliente.points || 0)

        // Formateamos la fecha de hoy de forma segura: YYYY-MM-DD
        const hoy = new Date().toISOString().split('T')[0]

        // 2. Obtener su próxima cita pendiente o confirmada
        const { data: citas, error: appointmentsError } = await clientAnonym
          .from('appointments')
          .select('id, date, time, status, services(name)')
          .eq('client_id', cliente.id)
          .eq('tenant_id', tenantId)
          .in('status', ['pending', 'confirmed'])
          .gte('date', hoy)
          .order('date', { ascending: true })
          .limit(1)

        if (appointmentsError) throw appointmentsError

        if (citas && citas.length > 0) {
          setProximaCita(citas[0] as any)
        }
      }

      // 3. Obtener productos destacados para la mini tienda del home
      const { data: productos, error: productsError } = await clientAnonym
        .from('products')
        .select('id, name, price, image_url, category')
        .eq('tenant_id', tenantId)
        .limit(3)

      if (productsError) throw productsError

      if (productos) {
        setProductosDestacados(productos)
      }
    } catch (error) {
      console.error('Error cargando el home del dashboard:', error)
    } finally {
      setLoading(false) // Esto garantiza que pase lo que pase, la pantalla de carga se retire
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-[#c97d6a] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-serif italic text-[#8c7a70]">Preparando tu experiencia VIP...</p>
      </div>
    )
  }

  return (
    <div className="space-y-10 pb-12 animate-fadeIn">
      
      {/* 1. HERO BANNER EDITORIAL (BANNER BIENVENIDA) */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a1513] to-[#2a221f] text-white p-8 md:p-12 shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#c97d6a]/10 rounded-full blur-3xl -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-[#e5a46e]/5 rounded-full blur-2xl" />
        
        <div className="max-w-xl relative z-10 space-y-4">
          <div className="flex items-center gap-2 text-[#c97d6a] text-xs uppercase tracking-[0.2em] font-semibold">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Espace Haute Beauté
          </div>
          <h1 className="text-3xl md:text-4xl font-serif italic font-light tracking-wide leading-tight">
            Diseña tu propio destello, <br className="hidden sm:block" />
            tú eres tu mejor arte.
          </h1>
          <p className="text-xs md:text-sm text-[#a3948c] font-light leading-relaxed max-w-sm">
            Reserva tus tratamientos de autor, gestiona tus citas VIP y descubre productos exclusivos creados para realzar tu belleza natural.
          </p>
          <div className="pt-4 flex flex-wrap gap-3">
            <Link 
              href="/dashboard/client/citas" 
              className="bg-[#c97d6a] hover:bg-[#b56b59] text-white text-xs font-semibold tracking-wider uppercase px-6 py-3.5 rounded-full transition-all shadow-md active:scale-95"
            >
              Agendar Cita VIP
            </Link>
            <Link 
              href="/dashboard/client/tienda" 
              className="bg-transparent border border-white/20 hover:border-white/60 hover:bg-white/5 text-white text-xs font-semibold tracking-wider uppercase px-6 py-3.5 rounded-full transition-all active:scale-95"
            >
              Explorar Tienda
            </Link>
          </div>
        </div>
      </section>

      {/* 2. GRID PRINCIPAL: COMPUESTOS DE DOS COLUMNAS RESPONSIVE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQUIERDA: CITAS Y CLUB FIDELIDAD (OCUPA 2/3 EN DESKTOP) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* TARJETA PRÓXIMA CITA */}
          <div className="bg-white border border-[#f0eae6] rounded-2xl p-6 md:p-8 shadow-xs">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-serif italic text-lg text-[#1a1513]">Tu Próximo Ritual</h3>
                <p className="text-[10px] text-[#a3948c] uppercase tracking-wider mt-0.5">Estado de tu reserva actual</p>
              </div>
              <div className="p-3 bg-[#fdf6f4] border border-[#f5e1db] text-[#c97d6a] rounded-full">
                <FaCalendarCheck className="text-sm" />
              </div>
            </div>

            {proximaCita ? (
              <div className="bg-[#faf6f4] border border-[#f5e1db]/60 rounded-xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-2">
                  <span className="text-[9px] uppercase tracking-widest font-bold px-2.5 py-1 bg-[#c97d6a] text-white rounded-full">
                    {proximaCita.status === 'confirmed' ? 'Confirmada' : 'Pendiente'}
                  </span>
                  <h4 className="font-serif text-base text-[#2c2623] pt-1">
                    {/* @ts-ignore */}
                    {proximaCita.services?.name || 'Servicio Personalizado'}
                  </h4>
                  <div className="flex flex-wrap gap-4 text-xs text-[#6e5d55]">
                    <span className="flex items-center gap-1.5"><FaClock className="text-[#c97d6a] text-[11px]" /> {proximaCita.date} a las {proximaCita.time} hs</span>
                    <span className="flex items-center gap-1.5"><FaMapMarkerAlt className="text-[#c97d6a] text-[11px]" /> Salon Principal VIP</span>
                  </div>
                </div>
                <Link href="/dashboard/client/citas" className="text-xs font-semibold text-[#c97d6a] hover:text-[#b56b59] flex items-center gap-1 shrink-0 self-end sm:self-center transition-colors">
                  Gestionar <FaArrowRight className="text-[10px]" />
                </Link>
              </div>
            ) : (
              <div className="text-center py-8 bg-[#faf8f6] rounded-xl border border-dashed border-[#e6ded9] px-4">
                <p className="text-xs text-[#8c7a70] italic">No tienes ningún ritual programado por el momento.</p>
                <Link href="/dashboard/client/citas" className="inline-block text-xs font-bold text-[#c97d6a] mt-2 tracking-wide hover:underline">
                  ¡Haz tu primera reserva hoy mismo! ✦
                </Link>
              </div>
            )}
          </div>

          {/* TARJETA FIDELIDAD VIP */}
          <div className="bg-white border border-[#f0eae6] rounded-2xl p-6 md:p-8 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 right-0 translate-x-4 -translate-y-4 text-[#fdf6f4] text-9xl font-serif select-none pointer-events-none font-light italic">
              ✦
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h3 className="font-serif italic text-lg text-[#1a1513]">Club de Privilegios</h3>
                <p className="text-[10px] text-[#a3948c] uppercase tracking-wider mt-0.5">Acumula y canjea por mimos de autor</p>
              </div>
              <div className="flex items-center gap-1.5 bg-[#fdf6f4] text-[#c97d6a] px-4 py-2 rounded-full border border-[#f5e1db] font-serif text-sm italic">
                <FaGift /> {puntos} Puntos Activos
              </div>
            </div>

            <p className="text-xs text-[#6e5d55] font-light leading-relaxed mb-6 max-w-lg">
              Por cada visita o compra en nuestro salón sumas puntos que se convierten en masajes capilares, decoraciones premium gratuitas o productos de spa exclusivos.
            </p>

            {/* Barra de progreso elegante hacia un regalo */}
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] uppercase tracking-wider font-semibold text-[#8c7a70]">
                <span>Progreso Siguiente Premio</span>
                <span>{puntos} / 500 pts</span>
              </div>
              <div className="w-full bg-[#f5eee9] h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-[#c97d6a] to-[#e5a46e] h-full transition-all duration-500"
                  style={{ width: `${Math.min((puntos / 500) * 100, 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-[#a3948c] italic text-right">Faltan {Math.max(500 - puntos, 0)} puntos para desbloquear un set de esmaltado de cortesía.</p>
            </div>
          </div>

        </div>

        {/* COLUMNA DERECHA: MINI TIENDA DESTACADOS (OCUPA 1/3 EN DESKTOP) */}
        <div className="space-y-8">
          <div className="bg-white border border-[#f0eae6] rounded-2xl p-6 md:p-8 shadow-xs flex flex-col h-full justify-between">
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-serif italic text-lg text-[#1a1513]">Les Essentiels</h3>
                  <p className="text-[10px] text-[#a3948c] uppercase tracking-wider mt-0.5">Joyas de nuestro escaparate</p>
                </div>
                <Link href="/dashboard/client/tienda" className="text-[10px] uppercase tracking-widest font-bold text-[#c97d6a] hover:text-[#b56b59] flex items-center gap-1 transition-colors">
                  Ver Todo
                </Link>
              </div>

              {/* Lista de productos responsive */}
              <div className="space-y-4">
                {productosDestacados.length > 0 ? (
                  productosDestacados.map((prod) => (
                    <div key={prod.id} className="flex items-center gap-4 p-2 rounded-xl hover:bg-[#faf6f4] transition-colors border border-transparent hover:border-[#f5e1db]/40 group">
                      <div className="w-14 h-14 bg-[#faf6f4] rounded-lg overflow-hidden shrink-0 border border-[#f0eae6]">
                        {prod.image_url ? (
                          <img src={prod.image_url} alt={prod.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-[#a3948c]"><FaShoppingBag /></div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[8px] uppercase tracking-widest font-semibold bg-[#faf6f4] px-2 py-0.5 rounded text-[#8c7a70]">{prod.category || 'Luxury'}</span>
                        <h4 className="text-xs font-medium text-[#2c2623] truncate mt-1">{prod.name}</h4>
                        <p className="text-xs font-serif italic text-[#c97d6a] mt-0.5">${prod.price}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-xs text-[#a3948c] italic">
                    Cargando joyas exclusivas...
                  </div>
                )}
              </div>
            </div>

            {/* Banner inferior de la mini tienda publicitario */}
            <div className="mt-6 bg-[#fdf6f4] border border-[#f5e1db] p-4 rounded-xl text-center space-y-2">
              <div className="text-[#c97d6a] text-xs"><FaHeart className="mx-auto" /></div>
              <h5 className="text-xs font-serif italic text-[#1a1513]">¿Recogida en salón?</h5>
              <p className="text-[10px] text-[#6e5d55] font-light">Compra online y retira cómodamente el día de tu próxima cita asignada.</p>
            </div>
          </div>
        </div>

      </div>

    </div>
  )
}
