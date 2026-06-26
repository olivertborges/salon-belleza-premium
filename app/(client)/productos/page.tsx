'use client'

import React, { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { Store, Sparkles, Tag, ArchiveX } from 'lucide-react'

interface Producto {
  id: string
  name: string
  description: string
  price: number
  image_url: string
  stock: number
  is_active: boolean
}

export default function TiendaProductos() {
  const { user, tenantId } = useAuth()
  const { theme } = useTheme()
  const supabase = createClientComponentClient()
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)

  const isDark = theme === 'dark'

  useEffect(() => {
    async function cargarProductos() {
      if (!user?.email || !tenantId) {
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('items')
          .select('*')
          .eq('is_active', true)

        if (!error && data) {
          setProductos(data)
        }
      } catch (error) {
        console.error('Error cargando boutique:', error)
      } finally {
        setLoading(false)
      }
    }
    cargarProductos()
  }, [user, tenantId, supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-8 h-8 border-2 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-10 selection:bg-rose-500/20 antialiased max-w-7xl mx-auto w-full">

      {/* CONTENEDOR BOUTIQUE HÍBRIDO */}
      <div className={`border rounded-3xl p-6 sm:p-8 transition-all duration-300 ${
        isDark 
          ? 'bg-[#141211] border-stone-850 shadow-[0_20px_50px_rgba(0,0,0,0.5)]' 
          : 'bg-white border-stone-200 shadow-[0_10px_30px_rgba(0,0,0,0.04)]'
      }`}>
        
        <div className={`flex items-center gap-4 mb-6 border-b pb-4 ${isDark ? 'border-stone-900' : 'border-stone-100'}`}>
           <Store className="text-rose-500 w-5 h-5" />
           <div>
             <h2 className={`text-lg font-extralight ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
               La Boutique <span className="font-serif italic text-rose-600 dark:text-rose-300">Fresh Products</span>
             </h2>
           </div>
        </div>

        {productos.length === 0 ? (
          <div className={`text-center py-12 border border-dashed rounded-2xl ${
            isDark ? 'border-stone-800 bg-stone-950/10' : 'border-stone-200 bg-stone-50/50'
          }`}>
             <ArchiveX className="w-6 h-6 text-stone-400 dark:text-stone-600 mx-auto mb-2 stroke-[1.5]" />
             <p className={`text-xs font-light ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
               Próximamente velas artesanales y productos de autor disponibles.
             </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {productos.map((producto) => (
              <div 
                key={producto.id} 
                className={`flex flex-col justify-between border rounded-2xl overflow-hidden transition-all duration-300 group ${
                  isDark 
                    ? 'bg-stone-900/40 border-stone-850 hover:border-stone-800' 
                    : 'bg-stone-50/40 border-stone-200/80 hover:border-stone-300 hover:bg-white'
                }`}
              >
                <div>
                  {/* Imagen */}
                  <div className={`aspect-[4/3] w-full border-b relative overflow-hidden ${
                    isDark ? 'bg-stone-950 border-stone-850' : 'bg-stone-100 border-stone-200'
                  }`}>
                    {producto.image_url ? (
                      <img 
                        src={producto.image_url} 
                        alt={producto.name} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-103"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-400 dark:text-stone-700">
                        <Tag className="w-8 h-8 stroke-[1.2]" />
                      </div>
                    )}

                    {producto.stock <= 0 && (
                      <div className="absolute inset-0 bg-stone-950/60 backdrop-blur-[1px] flex items-center justify-center">
                        <span className="px-2.5 py-1 bg-stone-900 text-white font-mono text-[9px] uppercase tracking-widest rounded-full border border-stone-800">
                          Agotado
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-5 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className={`text-sm font-medium tracking-tight transition-colors line-clamp-1 ${
                        isDark ? 'text-stone-200 group-hover:text-rose-300' : 'text-stone-800 group-hover:text-rose-600'
                      }`}>
                        {producto.name}
                      </h4>
                      <span className="font-mono text-xs font-bold text-rose-500 dark:text-rose-400 shrink-0">
                        ${producto.price.toLocaleString()}
                      </span>
                    </div>
                    <p className={`text-xs font-light line-clamp-2 leading-relaxed ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                      {producto.description}
                    </p>
                  </div>
                </div>

                {/* Acciones */}
                <div className="p-5 pt-0 space-y-3">
                  <div className={`flex items-center justify-between text-[10px] font-mono border-t pt-3 ${
                    isDark ? 'border-stone-900/60' : 'border-stone-200'
                  }`}>
                    <span className={isDark ? 'text-stone-500' : 'text-stone-400'}>Disponibilidad</span>
                    <span className={producto.stock > 0 ? 'text-emerald-500 font-medium' : 'text-stone-400 dark:text-stone-500'}>
                      {producto.stock > 0 ? `${producto.stock} uds` : 'Sin stock'}
                    </span>
                  </div>

                  <button 
                    disabled={producto.stock <= 0}
                    className={`w-full py-2.5 rounded-xl font-mono text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 font-bold ${
                      isDark 
                        ? 'bg-stone-100 text-stone-950 hover:bg-stone-200' 
                        : 'bg-stone-900 text-white hover:bg-stone-800'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Comprar Artículo
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
