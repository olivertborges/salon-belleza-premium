'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { 
  Scissors, Sparkles, Star, Heart, 
  Clock, User, ChevronRight, Calendar, 
  Crown, ArrowRight, Gem,
  Wind, Droplets, Flower2, 
  Waves, Sparkle, Leaf, Eye, Brush, Palette
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

export default function ServiciosPage() {
  const { theme } = useTheme()
  const { user } = useAuth()
  const isDark = theme === 'dark'
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('todos')
  const [categoriasDisponibles, setCategoriasDisponibles] = useState<string[]>([])

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
        .order('name', { ascending: true })

      if (error) throw error
      setServicios(data || [])

      const categorias = [...new Set(data.map(s => s.category).filter(Boolean))] as string[]
      setCategoriasDisponibles(categorias)
      
    } catch (error) {
      console.error('Error cargando servicios:', error)
    } finally {
      setLoading(false)
    }
  }

  const getIconForCategory = (cat: string) => {
    const map: Record<string, any> = {
      'Corte': Scissors,
      'Color': Palette,
      'Tratamientos': Flower2,
      'Peinados': Waves,
      'Extensiones': Leaf,
      'Cejas': Eye,
      'Pestañas': Sparkle,
      'Estética': Sparkles,
      'Manicuría': Brush,
      'General': Sparkles
    }
    return map[cat] || Sparkles
  }

  const categoriasFiltro = [
    { id: 'todos', label: 'Todos', icon: Sparkles },
    ...categoriasDisponibles.map(cat => ({
      id: cat,
      label: cat,
      icon: getIconForCategory(cat)
    }))
  ]

  const categoriasFinal = categoriasFiltro.length > 1 
    ? categoriasFiltro 
    : [
        { id: 'todos', label: 'Todos', icon: Sparkles },
        { id: 'Corte', label: 'Corte', icon: Scissors },
        { id: 'Color', label: 'Color', icon: Palette },
        { id: 'Tratamientos', label: 'Tratamientos', icon: Flower2 },
        { id: 'Cejas', label: 'Cejas', icon: Eye },
        { id: 'Pestañas', label: 'Pestañas', icon: Sparkle },
        { id: 'Manicuría', label: 'Manicuría', icon: Brush },
        { id: 'Estética', label: 'Estética', icon: Sparkles },
      ]

  const serviciosFiltrados = selectedCategory === 'todos' 
    ? servicios 
    : servicios.filter(s => s.category === selectedCategory)

  const getIcon = (iconName: string) => {
    const icons: Record<string, any> = {
      Scissors: Scissors,
      Sparkles: Sparkles,
      Wind: Wind,
      Droplets: Droplets,
      Flower2: Flower2,
      Waves: Waves,
      Sparkle: Sparkle,
      Leaf: Leaf,
      Crown: Crown,
      Star: Star,
      Heart: Heart,
      Eye: Eye,
      Brush: Brush,
      Palette: Palette
    }
    return icons[iconName] || Scissors
  }

  const getBadgeColor = (badge?: string) => {
    switch(badge) {
      case 'Más Solicitado': return 'bg-rose-500/10 border-rose-500/20 text-rose-500'
      case 'Tendencia': return 'bg-violet-500/10 border-violet-500/20 text-violet-500'
      case 'Premium': return 'bg-amber-500/10 border-amber-500/20 text-amber-500'
      case 'Nuevo': return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
      default: return 'bg-stone-500/10 border-stone-500/20 text-stone-500'
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-pink-300 border-t-pink-600 rounded-full animate-spin" />
          <Sparkles className="w-5 h-5 text-pink-500 absolute animate-pulse" />
        </div>
        <p className={`text-xs font-mono tracking-widest uppercase font-black animate-pulse ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
          Iniciando Catálogo...
        </p>
      </div>
    )
  }

  return (
    <div className={`w-full max-w-7xl mx-auto p-4 md:p-6 antialiased selection:bg-pink-500/20 relative min-h-screen transition-colors duration-500 ${
      isDark ? 'bg-stone-950 text-stone-200' : 'bg-gradient-to-b from-pink-50/10 via-amber-50/5 to-stone-50/30 text-stone-800'
    }`}>

      {/* Auras de Fondo */}
      <div className="absolute top-0 left-1/4 w-[400px] h-[400px] rounded-full blur-[160px] bg-pink-500/[0.03] pointer-events-none" />
      <div className="absolute bottom-20 right-1/4 w-[300px] h-[300px] rounded-full blur-[140px] bg-amber-500/[0.02] pointer-events-none" />

      {/* ============================================================ */}
      {/* HERO BANNER DE SERVICIOS PRESTIGE */}
      {/* ============================================================ */}
      <div className={`relative overflow-hidden rounded-3xl border p-6 md:p-8 shadow-xl transition-all duration-300 ${
        isDark 
          ? 'bg-gradient-to-br from-stone-950 via-pink-950/10 to-neutral-950 border-pink-950/30' 
          : 'bg-gradient-to-br from-stone-900 via-pink-600 to-amber-500 border-pink-100'
      }`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className={`inline-flex items-center gap-2 border px-3 py-1 rounded-full backdrop-blur-md ${isDark ? 'bg-pink-500/10 border-pink-500/30' : 'bg-white/20 border-white/30'}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
              <span className={`text-[9px] uppercase tracking-widest font-black ${isDark ? 'text-pink-300' : 'text-white'}`}>Menú Experiencias Elite</span>
            </div>
            <h2 className="text-3xl font-black tracking-tight text-white">
              Nuestros <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-pink-200 via-amber-200 to-white">Servicios</span>
            </h2>
            <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-pink-100/90 font-medium'}`}>
              Explora una selección integral de rituales y tratamientos diseñados para tu bienestar.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <div className={`px-3 py-2 rounded-xl border text-[10px] font-mono font-black uppercase tracking-wider flex items-center gap-1.5 backdrop-blur-md ${
              isDark ? 'bg-stone-900 border-stone-800 text-stone-400' : 'bg-white/90 border-pink-100 text-stone-800'
            }`}>
              <Crown className="w-3 h-3 text-amber-400" />
              {servicios.length} Rituales
            </div>
            
            <Link 
              href={user ? '/agenda' : '/login'} 
              className={`px-4 py-2 rounded-xl text-[10px] font-mono font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-1.5 border shadow-sm ${
                isDark 
                  ? 'bg-pink-500/20 border-pink-500/30 text-pink-300 hover:bg-pink-500/30' 
                  : 'bg-stone-950 border-stone-900 text-white hover:bg-stone-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Agendar Ritual
            </Link>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECCIÓN CATEGORÍAS */}
      {/* ============================================================ */}
      <div className="mt-10 space-y-6">
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-sm font-black uppercase tracking-wider font-mono flex items-center gap-2 text-stone-800 dark:text-stone-200">
              <Sparkles className="w-4 h-4 text-pink-500" />
              Filtrar Experiencias
            </h3>
            <p className={`text-[11px] ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
              Mostrando {serviciosFiltrados.length} opciones disponibles
            </p>
          </div>
          {selectedCategory !== 'todos' && (
            <button
              onClick={() => setSelectedCategory('todos')}
              className="text-[10px] font-mono font-black uppercase tracking-widest text-pink-500 hover:text-pink-400 transition-colors flex items-center gap-1"
            >
              Limpiar Filtros
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Mallas de Botones de Categorías */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
          {categoriasFinal.map((cat) => {
            const Icon = cat.icon
            const isActive = selectedCategory === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all duration-300 ${
                  isActive
                    ? isDark
                      ? 'bg-pink-500/10 border-pink-500/40 text-pink-400 shadow-sm'
                      : 'bg-stone-950 border-stone-900 text-white shadow-sm'
                    : isDark
                      ? 'bg-stone-900/40 border-stone-900 text-stone-400 hover:border-pink-500/20 hover:text-stone-200'
                      : 'bg-white border-pink-100/60 text-stone-500 hover:border-pink-300 hover:text-stone-800 shadow-sm'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-pink-400' : 'text-stone-400'}`} />
                <span className="text-[10px] font-bold uppercase tracking-wide truncate">
                  {cat.label}
                </span>
              </button>
            )
          })}
        </div>

        {/* ============================================================ */}
        {/* GRID DE TARJETAS BOUTIQUE */}
        {/* ============================================================ */}
        {serviciosFiltrados.length === 0 ? (
          <div className={`border border-dashed rounded-3xl p-16 text-center backdrop-blur-md ${
            isDark ? 'border-stone-800 bg-stone-900/10' : 'border-pink-100 bg-white/40 shadow-inner'
          }`}>
            <Scissors className={`w-10 h-10 mx-auto mb-4 ${isDark ? 'text-stone-800' : 'text-pink-200'}`} />
            <p className="text-sm font-black tracking-tight text-stone-800 dark:text-stone-200">No hay servicios en esta categoría</p>
            <p className={`text-xs mt-1 max-w-sm mx-auto ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
              Prueba seleccionando otra sección del menú de filtros superior.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {serviciosFiltrados.map((servicio) => {
              const Icon = getIcon(servicio.icon || 'Scissors')
              const badgeColor = getBadgeColor(servicio.badge)

              return (
                <div 
                  key={servicio.id} 
                  className={`group relative rounded-2xl border p-5 transition-all duration-300 transform hover:-translate-y-0.5 flex flex-col justify-between min-h-[220px] overflow-hidden ${
                    isDark 
                      ? 'bg-stone-900/40 border-stone-900 hover:border-pink-500/20 hover:bg-stone-900/60 shadow-lg' 
                      : 'bg-white border-pink-100/60 hover:border-pink-300 hover:shadow-md'
                  }`}
                >
                  {/* Cristal decorativo */}
                  <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-pink-500/[0.02] to-transparent rounded-bl-full pointer-events-none transition-all group-hover:from-pink-500/[0.06]" />

                  <div>
                    {/* Header Tarjeta: Icono y Badge */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all group-hover:scale-105 ${
                        isDark ? 'bg-pink-500/10 border border-pink-500/20 text-pink-400' : 'bg-stone-50 border border-stone-100 text-pink-600'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      
                      {servicio.badge && (
                        <span className={`text-[8px] font-mono font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${badgeColor}`}>
                          {servicio.badge}
                        </span>
                      )}
                    </div>

                    {/* Nombre y descripción */}
                    <div className="space-y-1">
                      <h4 className="font-black text-sm tracking-tight text-stone-900 dark:text-stone-200 group-hover:text-pink-500 dark:group-hover:text-pink-400 transition-colors">
                        {servicio.name}
                      </h4>
                      <p className={`text-[11px] leading-relaxed line-clamp-3 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                        {servicio.description || 'Tratamiento personalizado formulado bajo estándares de la firma.'}
                      </p>
                    </div>
                  </div>

                  {/* Footer Tarjeta: Precio, Tiempo y Botón */}
                  <div className={`flex items-center justify-between border-t border-dashed mt-5 pt-3.5 ${
                    isDark ? 'border-stone-800/80' : 'border-stone-100'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <span className={`text-base font-mono font-black tracking-tight ${
                        isDark ? 'text-pink-400' : 'text-stone-950'
                      }`}>
                        ${servicio.price?.toLocaleString()}
                      </span>
                      <span className={`text-[9px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                        <Clock className="w-3 h-3 text-pink-400" />
                        {servicio.duration || 60} Min
                      </span>
                    </div>

                    <Link
                      href={user ? '/agenda' : '/login'}
                      className={`p-2 rounded-xl transition-all duration-300 ${
                        isDark 
                          ? 'bg-stone-950/60 border border-stone-800 text-stone-400 hover:text-pink-400 hover:border-pink-500/30' 
                          : 'bg-stone-50 border border-stone-100 text-stone-500 hover:text-stone-950 hover:border-pink-300'
                      }`}
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* BANNER INVITACIÓN PRESTIGE */}
      {/* ============================================================ */}
      <div className={`relative overflow-hidden rounded-3xl border p-6 shadow-xl mt-12 ${
        isDark 
          ? 'bg-gradient-to-br from-stone-950 via-stone-900/40 to-neutral-950 border-pink-950/30' 
          : 'bg-gradient-to-br from-pink-50/40 via-stone-50/50 to-amber-50/20 border-pink-100'
      }`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/[0.02] rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl shrink-0 ${
              isDark ? 'bg-pink-500/10 border border-pink-500/20 text-pink-400' : 'bg-white border border-pink-100 text-pink-600 shadow-sm'
            }`}>
              <Gem className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-sm font-black tracking-tight text-stone-900 dark:text-stone-200">
                Diseña Tu Rutina de Cuidado Ideal
              </h3>
              <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                Combina múltiples servicios coordinando tu agenda con nuestro equipo de profesionales.
              </p>
            </div>
          </div>

          <Link
            href={user ? '/agenda' : '/login'}
            className="px-5 py-3 rounded-xl text-[10px] font-mono font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-2 shadow-sm shrink-0 bg-stone-950 border border-stone-900 text-white hover:bg-stone-900 dark:bg-white dark:border-white dark:text-stone-950 dark:hover:bg-stone-100"
          >
            <Calendar className="w-3.5 h-3.5 text-pink-500" />
            Reservar Ahora
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

    </div>
  )
}