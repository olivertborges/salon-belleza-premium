'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { 
  Sparkles, Heart, Star, Award, 
  Clock, User, ChevronRight, Calendar, 
  Crown, Shield, Zap, Gem,
  Flower2, Droplets, Sun, Moon,
  Leaf, Feather, Wand2, 
  Eye, Sparkle, Activity,
  Bath, Scissors, Sparkles as SparklesIcon
} from 'lucide-react'
import Link from 'next/link'

interface Servicio {
  id: string
  name: string
  description: string
  price: number
  duration: number
  category: string
  icon: string
  is_active: boolean
  badge?: string
}

export default function EsteticaPage() {
  const { theme } = useTheme()
  const { user } = useAuth()
  const isDark = theme === 'dark'
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('todos')

  useEffect(() => {
    cargarServicios()
  }, [])

  const cargarServicios = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .eq('category', 'Estética')
        .order('name', { ascending: true })

      if (error) throw error
      setServicios(data || [])
    } catch (error) {
      console.error('Error cargando servicios:', error)
    } finally {
      setLoading(false)
    }
  }

  const categorias = [
    { id: 'todos', label: '🌟 Todos', icon: Sparkles },
    { id: 'Facial', label: '💆 Facial', icon: Flower2 },
    { id: 'Corporal', label: '🧴 Corporal', icon: Droplets },
    { id: 'Masajes', label: '💆‍♂️ Masajes', icon: Sparkles },
    { id: 'Depilación', label: '🪒 Depilación', icon: Feather },
    { id: 'Cejas', label: '👁️ Cejas', icon: Eye },
  ]

  const serviciosFiltrados = selectedCategory === 'todos' 
    ? servicios 
    : servicios.filter(s => s.category === selectedCategory)

  const getIcon = (iconName: string) => {
    const icons: Record<string, any> = {
      Sparkles: Sparkles,
      Sparkle: Sparkle,
      Flower2: Flower2,
      Droplets: Droplets,
      Leaf: Leaf,
      Feather: Feather,
      Wand2: Wand2,
      Eye: Eye,
      Activity: Activity,
      Bath: Bath,
      Scissors: Scissors,
      Crown: Crown,
      Star: Star,
      Heart: Heart,
      Zap: Zap,
      Gem: Gem,
      Sun: Sun,
      Moon: Moon,
      Shield: Shield,
      Award: Award
    }
    return icons[iconName] || Sparkles
  }

  const getBadgeColor = (badge?: string) => {
    switch(badge) {
      case 'Más Solicitado': return 'bg-rose-500/10 border-rose-500/20 text-rose-500'
      case 'Tendencia': return 'bg-violet-500/10 border-violet-500/20 text-violet-500'
      case 'Premium': return 'bg-amber-500/10 border-amber-500/20 text-amber-500'
      case 'Nuevo': return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
      case 'Relax': return 'bg-blue-500/10 border-blue-500/20 text-blue-500'
      default: return 'bg-stone-500/10 border-stone-500/20 text-stone-500'
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="relative flex items-center justify-center">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-12 h-12 border-4 border-emerald-500/20 rounded-full animate-ping"></div>
          </div>
          <Sparkles className="w-5 h-5 text-emerald-500 absolute animate-pulse" />
        </div>
        <p className={`text-xs font-mono tracking-wide animate-pulse ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>Cargando servicios de estética...</p>
      </div>
    )
  }

  return (
    <div className={`w-full max-w-7xl mx-auto p-4 md:p-6 antialiased selection:bg-emerald-500/20 relative min-h-[60vh] transition-colors duration-300 ${
      isDark ? 'text-stone-200' : 'text-stone-800'
    }`}>
      
      {/* Fondos ambientales */}
      <div className={`absolute top-[-10%] left-1/4 w-[400px] h-[400px] rounded-full blur-[150px] pointer-events-none ${
        isDark ? 'bg-emerald-500/[0.04]' : 'bg-emerald-500/[0.03]'
      }`} />
      <div className={`absolute bottom-[10%] right-1/4 w-[300px] h-[300px] rounded-full blur-[120px] pointer-events-none ${
        isDark ? 'bg-teal-500/[0.03]' : 'bg-teal-500/[0.02]'
      }`} />

      {/* ============================================================ */}
      {/* HEADER CON CARD-GLOW */}
      {/* ============================================================ */}
      <div className={`card-glow relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500/[0.08] via-card to-card border border-emerald-500/20 p-6 shadow-xl animate-fade-up ${
        isDark 
          ? 'bg-gradient-to-br from-emerald-950/20 via-[#161311] to-[#0a0908]' 
          : 'bg-gradient-to-br from-emerald-50/50 via-white to-stone-50'
      }`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className={`text-[10px] uppercase tracking-[0.3em] font-mono flex items-center gap-2 ${
              isDark ? 'text-emerald-400' : 'text-emerald-600'
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              🧖‍♀️ Cuidado & Estética
            </p>
            <h2 className="text-2xl font-serif italic text-foreground mt-1">
              Bienestar y <span className="text-shimmer">Belleza Natural</span>
            </h2>
            <p className={`text-xs mt-1 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
              Tratamientos faciales, corporales, masajes y más. Cuida de ti con los mejores profesionales.
            </p>
          </div>
          <div className="flex items-center gap-3 self-start md:self-auto animate-fade-up delay-200">
            <div className={`px-3 py-1.5 rounded-xl border text-[10px] font-mono flex items-center gap-1.5 ${
              isDark 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'
            }`}>
              <Gem className="w-3 h-3" />
              {servicios.length} servicios
            </div>
            {user ? (
              <Link href="/agenda" className={`px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold transition-all flex items-center gap-1.5 ${
                isDark 
                  ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30' 
                  : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/20'
              }`}>
                <Calendar className="w-3 h-3" />
                Reservar
              </Link>
            ) : (
              <Link href="/login" className={`px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold transition-all flex items-center gap-1.5 ${
                isDark 
                  ? 'bg-stone-800/40 border border-stone-700 text-stone-300 hover:bg-stone-700/40' 
                  : 'bg-stone-100/60 border border-stone-200 text-stone-600 hover:bg-stone-200/60'
              }`}>
                Iniciar sesión
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SEPARACIÓN: ESPACIO ENTRE HEADER Y FILTROS */}
      {/* ============================================================ */}
      <div className="mt-8 space-y-4">
        
        {/* Título de la sección de filtros */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`text-sm font-bold ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>
              Descubre nuestros tratamientos
            </h3>
            <p className={`text-[10px] ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
              {serviciosFiltrados.length} tratamientos disponibles
            </p>
          </div>
          {selectedCategory !== 'todos' && (
            <button
              onClick={() => setSelectedCategory('todos')}
              className={`text-[10px] font-mono transition-colors ${
                isDark ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-600 hover:text-emerald-500'
              }`}
            >
              Ver todos →
            </button>
          )}
        </div>

        {/* CATEGORÍAS */}
        <div className="flex flex-wrap gap-2">
          {categorias.map((cat) => {
            const Icon = cat.icon
            const isActive = selectedCategory === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[10px] font-mono font-medium border transition-all hover:scale-105 ${
                  isActive
                    ? isDark
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
                      : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 shadow-[0_0_20px_rgba(16,185,129,0.05)]'
                    : isDark
                      ? 'bg-stone-900/30 border-stone-800 text-stone-400 hover:border-emerald-500/30 hover:text-stone-200'
                      : 'bg-stone-100/50 border-stone-200 text-stone-500 hover:border-emerald-500/30 hover:text-stone-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {cat.label.replace(/[^a-zA-Z\s]/g, '').trim() || cat.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ============================================================ */}
      {/* GRID DE SERVICIOS */}
      {/* ============================================================ */}
      {serviciosFiltrados.length === 0 ? (
        <div className={`border border-dashed rounded-2xl p-12 text-center backdrop-blur-md shadow-inner mt-8 ${
          isDark 
            ? 'border-stone-800/80 bg-stone-900/20' 
            : 'border-stone-200 bg-white/60'
        }`}>
          <Sparkles className={`w-10 h-10 mx-auto mb-3.5 ${isDark ? 'text-stone-700' : 'text-stone-300'}`} />
          <p className={`text-xs font-mono max-w-sm mx-auto ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
            No hay tratamientos disponibles en esta categoría.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children mt-6">
          {serviciosFiltrados.map((servicio) => {
            const Icon = getIcon(servicio.icon || 'Sparkles')
            const badgeColor = getBadgeColor(servicio.badge)

            return (
              <div 
                key={servicio.id} 
                className={`card-glow group relative backdrop-blur-md border rounded-2xl p-5 transition-all duration-500 hover:-translate-y-1 shadow-sm hover:shadow-[0_12px_24px_-10px_rgba(0,0,0,0.05)] overflow-hidden ${
                  isDark 
                    ? 'bg-stone-900/40 border-stone-800/70 hover:border-emerald-500/30 hover:shadow-[0_20px_30px_-10px_rgba(0,0,0,0.7)]' 
                    : 'bg-white border-stone-200/90 hover:border-emerald-500/40 hover:shadow-[0_12px_24px_-10px_rgba(0,0,0,0.05)]'
                }`}
              >
                {/* Glow interno */}
                <div className={`absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl group-hover:bg-emerald-500/[0.08] transition-all duration-500 pointer-events-none ${
                  isDark ? 'bg-emerald-500/[0.03]' : 'bg-emerald-500/[0.02]'
                }`} />

                {/* Icono */}
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-all group-hover:scale-110 ${
                  isDark 
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                    : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600'
                }`}>
                  <Icon className="w-6 h-6" />
                </div>

                {/* Badge */}
                {servicio.badge && (
                  <span className={`inline-block text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border mb-2 ${badgeColor}`}>
                    {servicio.badge}
                  </span>
                )}

                {/* Nombre y descripción */}
                <h3 className={`text-base font-bold tracking-tight transition-colors group-hover:text-emerald-600 dark:group-hover:text-emerald-400 ${
                  isDark ? 'text-stone-100' : 'text-stone-900'
                }`}>
                  {servicio.name}
                </h3>
                <p className={`text-xs leading-relaxed mt-1 line-clamp-2 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                  {servicio.description || 'Tratamiento profesional de cuidado y estética.'}
                </p>

                {/* Precio y duración */}
                <div className={`flex items-center justify-between mt-4 pt-3 border-t ${
                  isDark ? 'border-stone-800/60' : 'border-stone-100'
                }`}>
                  <div className="flex items-center gap-3">
                    <span className={`text-lg font-mono font-bold ${
                      isDark ? 'text-emerald-400' : 'text-emerald-600'
                    }`}>
                      ${servicio.price?.toLocaleString()}
                    </span>
                    <span className={`text-[10px] font-mono flex items-center gap-1 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                      <Clock className="w-3 h-3" />
                      {servicio.duration || 60} min
                    </span>
                  </div>
                  <Link
                    href={user ? '/agenda' : '/login'}
                    className={`p-2 rounded-xl transition-all group-hover:scale-110 ${
                      isDark 
                        ? 'bg-stone-800/40 border border-stone-700 text-stone-400 hover:text-emerald-400 hover:border-emerald-500/30' 
                        : 'bg-stone-100/60 border border-stone-200 text-stone-500 hover:text-emerald-600 hover:border-emerald-500/30'
                    }`}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ============================================================ */}
      {/* BANNER DE PROMOCIÓN - RELAX & WELLNESS */}
      {/* ============================================================ */}
      <div className={`card-glow relative overflow-hidden rounded-2xl border p-6 shadow-xl mt-8 ${
        isDark 
          ? 'bg-gradient-to-br from-emerald-950/20 via-stone-900/30 to-teal-950/20 border-emerald-500/20' 
          : 'bg-gradient-to-br from-emerald-50/50 via-stone-50/50 to-teal-50/50 border-emerald-500/20'
      }`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${
              isDark 
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600'
            }`}>
              <Gem className="w-6 h-6" />
            </div>
            <div>
              <h3 className={`text-sm font-bold ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>
                Date un momento para ti
              </h3>
              <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                Reserva tu tratamiento de bienestar y desconecta del estrés diario.
              </p>
            </div>
          </div>
          <Link
            href={user ? '/agenda' : '/login'}
            className={`px-5 py-2.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 shadow-lg ${
              isDark 
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/20' 
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/20'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Reservar ahora
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* ============================================================ */}
      {/* ESTILOS GLOBALES */}
      {/* ============================================================ */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-slideUp { animation: slideUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        .stagger-children > * { animation: slideUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        .stagger-children > *:nth-child(1) { animation-delay: 0.05s; }
        .stagger-children > *:nth-child(2) { animation-delay: 0.10s; }
        .stagger-children > *:nth-child(3) { animation-delay: 0.15s; }
        .stagger-children > *:nth-child(4) { animation-delay: 0.20s; }
        .stagger-children > *:nth-child(5) { animation-delay: 0.25s; }
        .stagger-children > *:nth-child(6) { animation-delay: 0.30s; }
      `}</style>
    </div>
  )
}