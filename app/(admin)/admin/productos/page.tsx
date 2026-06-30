'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useTheme } from '@/contexts/ThemeContext'
import { 
  Plus, Search, Package, AlertTriangle, 
  TrendingUp, Edit, Trash2, Layers, X, Save,
  Tag, ShoppingBag, Box, Clock
} from 'lucide-react'

interface Producto {
  id: string
  tenant_id: string
  name: string
  description: string
  price: number
  cost: number
  stock: number
  category: string
  image_url: string
  sku: string
  is_active: boolean
  created_at: string
}

export default function ProductosPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  
  const [productos, setProductos] = useState<Producto[]>([])
  const [search, setSearch] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos')
  const [loading, setLoading] = useState<boolean>(true)
  const [showModal, setShowModal] = useState<boolean>(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Microblading',
    price: '',
    cost: '',
    stock: '',
    sku: '',
    image_url: ''
  })

  const categorias: string[] = ['Microblading', 'Micropigmentación', 'Uñas', 'Cuidado', 'Herramientas']

  const fetchProductos = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (error) {
        console.error('Error:', error)
        setError(error.message)
        return
      }

      setProductos(data || [])
    } catch (err: any) {
      console.error('Error:', err)
      setError(err.message || 'Error al cargar productos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProductos()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!formData.name || !formData.price || !formData.stock) {
      setError('Nombre, precio y stock son obligatorios')
      return
    }

    const payload = {
      name: formData.name,
      description: formData.description || '',
      category: formData.category || 'Microblading',
      price: parseFloat(formData.price) || 0,
      cost: parseFloat(formData.cost) || 0,
      stock: parseInt(formData.stock) || 0,
      sku: formData.sku || `FN-${Date.now().toString().slice(-6)}`,
      image_url: formData.image_url || '',
      is_active: true
    }

    try {
      if (editingId) {
        const { error } = await supabase
          .from('items')
          .update(payload)
          .eq('id', editingId)

        if (error) throw error
        setSuccess('✅ Producto actualizado correctamente')
      } else {
        const { error } = await supabase
          .from('items')
          .insert([payload])

        if (error) throw error
        setSuccess('✅ Producto creado correctamente')
      }

      setShowModal(false)
      setEditingId(null)
      setFormData({ name: '', description: '', category: 'Microblading', price: '', cost: '', stock: '', sku: '', image_url: '' })
      fetchProductos()

      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      console.error('Error al guardar:', err)
      setError(`Error: ${err.message || 'Error desconocido'}`)
    }
  }

  const handleEdit = (producto: Producto) => {
    setEditingId(producto.id)
    setFormData({
      name: producto.name,
      description: producto.description || '',
      category: producto.category || 'Microblading',
      price: String(producto.price || 0),
      cost: String(producto.cost || 0),
      stock: String(producto.stock || 0),
      sku: producto.sku || '',
      image_url: producto.image_url || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return
    try {
      const { error } = await supabase
        .from('items')
        .update({ is_active: false })
        .eq('id', id)

      if (error) throw error
      setSuccess('✅ Producto eliminado')
      fetchProductos()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      console.error('Error al eliminar:', err)
      setError(err.message || 'Error al eliminar')
    }
  }

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: 'Agotado', color: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20', icon: '🔴' }
    if (stock <= 5) return { label: 'Stock Bajo', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20', icon: '🟡' }
    return { label: 'Disponible', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20', icon: '🟢' }
  }

  const filtrados = productos.filter((p: Producto) => {
    const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase()) || 
                        p.sku?.toLowerCase().includes(search.toLowerCase()) ||
                        p.category?.toLowerCase().includes(search.toLowerCase())
    const matchCategory = selectedCategory === 'Todos' || p.category === selectedCategory
    return matchSearch && matchCategory
  })

  const bajoStockCount = productos.filter((p: Producto) => p.stock <= 5).length
  const valorInventario = productos.reduce((sum: number, p: Producto) => sum + (p.stock * (p.cost || 0)), 0)

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="relative">
          <div className="w-8 h-8 border-3 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-8 h-8 border-3 border-violet-500/20 rounded-full animate-ping"></div>
        </div>
        <span className="ml-4 text-xs font-mono text-violet-500 animate-pulse">Cargando productos...</span>
      </div>
    )
  }

  return (
    <div className={`space-y-5 transition-colors duration-300 ${
      isDark ? 'text-stone-200' : 'text-stone-800'
    }`}>

      {/* HEADER CON CARD-GLOW */}
      <div className={`card-glow relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-500/[0.08] via-card to-card border border-violet-500/20 p-5 shadow-xl animate-fade-up ${
        isDark 
          ? 'bg-gradient-to-br from-violet-950/20 via-[#161311] to-[#0a0908]' 
          : 'bg-gradient-to-br from-violet-50/50 via-white to-stone-50'
      }`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-violet-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-violet-600 dark:text-violet-400 font-mono flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
              🛒 Gestión de Productos
            </p>
            <h2 className="text-3xl font-serif italic text-foreground mt-1">
              Productos <span className="text-shimmer">Premium</span>
            </h2>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>{productos.length} productos en catálogo</p>
          </div>
          <button 
            onClick={() => { setEditingId(null); setFormData({ name: '', description: '', category: 'Microblading', price: '', cost: '', stock: '', sku: '', image_url: '' }); setShowModal(true) }}
            className="glow-hover flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-medium transition-all shadow-lg shadow-violet-600/20 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Nuevo Producto
          </button>
        </div>
      </div>

      {/* ALERTAS */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-600 dark:text-red-400 text-xs animate-fade-up">
          <p className="font-mono flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            ❌ {error}
          </p>
        </div>
      )}
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-emerald-600 dark:text-emerald-400 text-xs animate-fade-up">
          <p className="font-mono flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            ✅ {success}
          </p>
        </div>
      )}

      {/* MÉTRICAS */}
      <div className="grid grid-cols-3 gap-3 stagger-children">
        <div className={`card-glow rounded-xl bg-card border border-border p-3 text-center hover:border-violet-500/30 transition-all hover:scale-105 ${
          isDark ? 'bg-[#141211]' : 'bg-white'
        }`}>
          <p className="text-[8px] text-mutedForeground font-mono uppercase tracking-wider">Productos</p>
          <span className="text-xl font-mono font-bold text-foreground block">{productos.length}</span>
        </div>
        <div className={`card-glow rounded-xl bg-card border border-border p-3 text-center hover:border-violet-500/30 transition-all hover:scale-105 ${
          isDark ? 'bg-[#141211]' : 'bg-white'
        }`}>
          <p className="text-[8px] text-mutedForeground font-mono uppercase tracking-wider">Stock Bajo</p>
          <span className={`text-xl font-mono font-bold block ${bajoStockCount > 0 ? 'text-amber-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
            {bajoStockCount}
          </span>
        </div>
        <div className={`card-glow rounded-xl bg-card border border-border p-3 text-center hover:border-violet-500/30 transition-all hover:scale-105 ${
          isDark ? 'bg-[#141211]' : 'bg-white'
        }`}>
          <p className="text-[8px] text-mutedForeground font-mono uppercase tracking-wider">Inventario</p>
          <span className="text-xl font-mono font-bold text-emerald-600 dark:text-emerald-400 block">${valorInventario.toLocaleString()}</span>
        </div>
      </div>

      {/* BÚSQUEDA Y FILTROS */}
      <div className="flex flex-col gap-3">
        <div className={`flex items-center border rounded-xl px-3 py-2.5 flex-1 transition-all focus-within:border-violet-500/50 focus-within:shadow-lg focus-within:shadow-violet-500/5 ${
          isDark ? 'bg-stone-900/40 border-stone-800' : 'bg-stone-100 border-stone-200'
        }`}>
          <Search className="w-4 h-4 text-mutedForeground shrink-0" />
          <input 
            type="text" 
            placeholder="Buscar producto por nombre, SKU o categoría..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`bg-transparent border-none outline-none text-xs text-foreground placeholder-mutedForeground w-full ml-2 ${
              isDark ? 'text-stone-200' : 'text-stone-800'
            }`}
          />
          {search && (
            <button 
              onClick={() => setSearch('')}
              className="text-mutedForeground hover:text-foreground transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {['Todos', ...categorias].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-medium border transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? isDark
                    ? 'bg-violet-500/20 border-violet-500/40 text-violet-400'
                    : 'bg-violet-500/10 border-violet-500/40 text-violet-700'
                  : `bg-transparent border-border text-mutedForeground hover:text-foreground hover:bg-muted ${
                      isDark ? 'hover:text-stone-200 hover:bg-stone-800/30' : ''
                    }`
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* GRID DE PRODUCTOS */}
      <div className="grid grid-cols-2 gap-3 stagger-children">
        {filtrados.map((prod: Producto, index) => {
          const status = getStockStatus(prod.stock)

          return (
            <div 
              key={prod.id} 
              className={`card-glow bg-card border border-border rounded-xl p-3 hover:border-violet-500/30 transition-all group animate-fade-up delay-${(index % 6) * 100} ${
                isDark ? 'bg-[#141211]' : 'bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[8px] font-mono truncate ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>{prod.sku || 'N/A'}</span>
                    <span className={`text-[7px] px-1.5 py-0.5 rounded-full border ${status.color}`}>
                      {status.icon} {status.label}
                    </span>
                  </div>
                  <h3 className={`text-sm font-bold truncate transition-colors ${
                    isDark 
                      ? 'text-stone-200 group-hover:text-violet-400' 
                      : 'text-stone-800 group-hover:text-violet-600'
                  }`}>
                    {prod.name}
                  </h3>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => handleEdit(prod)} className={`p-1 rounded-lg border transition-all hover:scale-110 ${
                    isDark 
                      ? 'bg-stone-800/40 border-stone-700 text-stone-400 hover:text-stone-200' 
                      : 'bg-stone-100/60 border-stone-200 text-stone-500 hover:text-stone-800'
                  }`}>
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(prod.id)} className={`p-1 rounded-lg border transition-all hover:scale-110 ${
                    isDark 
                      ? 'bg-stone-800/40 border-stone-700 text-stone-400 hover:text-rose-400 hover:border-rose-500/30' 
                      : 'bg-stone-100/60 border-stone-200 text-stone-500 hover:text-rose-500 hover:border-rose-500/20'
                  }`}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-1 mt-1">
                <Layers className={`w-3.5 h-3.5 ${isDark ? 'text-stone-600' : 'text-stone-400'}`} />
                <span className={`text-[10px] ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>{prod.category}</span>
              </div>

              <div className={`flex items-center justify-between mt-2 pt-2 border-t ${isDark ? 'border-stone-800/60' : 'border-stone-200/60'}`}>
                <div>
                  <p className="text-[7px] text-mutedForeground font-mono uppercase tracking-wider">Precio</p>
                  <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">${prod.price?.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-[7px] text-mutedForeground font-mono uppercase tracking-wider">Stock</p>
                  <p className={`text-sm font-mono font-bold ${prod.stock === 0 ? 'text-rose-500' : prod.stock <= 5 ? 'text-amber-500' : isDark ? 'text-stone-200' : 'text-stone-800'}`}>
                    {prod.stock} <span className="text-[8px] text-mutedForeground font-normal">unid.</span>
                  </p>
                </div>
              </div>

              {prod.description && (
                <p className={`text-[8px] mt-1 line-clamp-1 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>{prod.description}</p>
              )}
            </div>
          )
        })}

        {filtrados.length === 0 && (
          <div className={`col-span-full py-12 text-center font-mono text-xs border border-dashed rounded-xl ${
            isDark ? 'text-stone-500 border-stone-800 bg-stone-950/10' : 'text-stone-400 border-stone-200 bg-stone-50/50'
          }`}>
            No se encontraron productos
          </div>
        )}
      </div>

      {/* MODAL CORREGIDO */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-up">
          <div className={`border rounded-2xl p-5 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto ${
            isDark 
              ? 'bg-zinc-900 border-zinc-800 text-zinc-100' 
              : 'bg-white border-zinc-200 text-zinc-900'
          }`}>
            <div className={`flex items-center justify-between mb-4 pb-2 border-b ${
              isDark ? 'border-zinc-800' : 'border-zinc-100'
            }`}>
              <h3 className={`text-base font-bold flex items-center gap-2 ${
                isDark ? 'text-zinc-100' : 'text-zinc-900'
              }`}>
                <Plus className={`w-4 h-4 ${isDark ? 'text-violet-400' : 'text-violet-600'}`} />
                {editingId ? 'Editar Producto' : 'Nuevo Producto'}
              </h3>
              <button onClick={() => setShowModal(false)} className={`p-1 rounded-lg transition-colors ${
                isDark 
                  ? 'hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300' 
                  : 'hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600'
              }`}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className={`block text-[10px] font-medium mb-1 ${
                  isDark ? 'text-zinc-400' : 'text-zinc-500'
                }`}>Nombre *</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-500/30 transition-colors ${
                    isDark 
                      ? 'bg-zinc-950 border-zinc-800 text-zinc-100' 
                      : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                  }`} 
                  required 
                />
              </div>
              <div>
                <label className={`block text-[10px] font-medium mb-1 ${
                  isDark ? 'text-zinc-400' : 'text-zinc-500'
                }`}>Descripción</label>
                <textarea 
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})} 
                  rows={2} 
                  className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-500/30 transition-colors ${
                    isDark 
                      ? 'bg-zinc-950 border-zinc-800 text-zinc-100' 
                      : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                  }`} 
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-[10px] font-medium mb-1 ${
                    isDark ? 'text-zinc-400' : 'text-zinc-500'
                  }`}>SKU</label>
                  <input 
                    type="text" 
                    value={formData.sku} 
                    onChange={(e) => setFormData({...formData, sku: e.target.value})} 
                    className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-500/30 transition-colors ${
                      isDark 
                        ? 'bg-zinc-950 border-zinc-800 text-zinc-100' 
                        : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                    }`} 
                  />
                </div>
                <div>
                  <label className={`block text-[10px] font-medium mb-1 ${
                    isDark ? 'text-zinc-400' : 'text-zinc-500'
                  }`}>Categoría</label>
                  <select 
                    value={formData.category} 
                    onChange={(e) => setFormData({...formData, category: e.target.value})} 
                    className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-500/30 transition-colors ${
                      isDark 
                        ? 'bg-zinc-950 border-zinc-800 text-zinc-100' 
                        : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                    }`}
                  >
                    {categorias.map(cat => <option key={cat} value={cat} className={isDark ? 'bg-zinc-950 text-zinc-100' : 'bg-white text-zinc-900'}>{cat}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-[10px] font-medium mb-1 ${
                    isDark ? 'text-zinc-400' : 'text-zinc-500'
                  }`}>Precio ($) *</label>
                  <input 
                    type="number" 
                    value={formData.price} 
                    onChange={(e) => setFormData({...formData, price: e.target.value})} 
                    className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-500/30 transition-colors ${
                      isDark 
                        ? 'bg-zinc-950 border-zinc-800 text-zinc-100' 
                        : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                    }`} 
                    required 
                  />
                </div>
                <div>
                  <label className={`block text-[10px] font-medium mb-1 ${
                    isDark ? 'text-zinc-400' : 'text-zinc-500'
                  }`}>Costo ($)</label>
                  <input 
                    type="number" 
                    value={formData.cost} 
                    onChange={(e) => setFormData({...formData, cost: e.target.value})} 
                    className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-500/30 transition-colors ${
                      isDark 
                        ? 'bg-zinc-950 border-zinc-800 text-zinc-100' 
                        : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                    }`} 
                  />
                </div>
              </div>
              <div>
                <label className={`block text-[10px] font-medium mb-1 ${
                  isDark ? 'text-zinc-400' : 'text-zinc-500'
                }`}>Stock *</label>
                <input 
                  type="number" 
                  value={formData.stock} 
                  onChange={(e) => setFormData({...formData, stock: e.target.value})} 
                  className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-500/30 transition-colors ${
                    isDark 
                      ? 'bg-zinc-950 border-zinc-800 text-zinc-100' 
                      : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                  }`} 
                  required 
                />
              </div>

              <div className={`flex gap-3 pt-3 border-t ${
                isDark ? 'border-zinc-800' : 'border-zinc-200'
              }`}>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className={`flex-1 px-3 py-2 border rounded-xl text-xs font-medium transition-colors ${
                    isDark 
                      ? 'border-zinc-800 text-zinc-400 hover:bg-zinc-950' 
                      : 'border-zinc-200 text-zinc-500 hover:bg-zinc-50'
                  }`}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-3 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-600/20"
                >
                  <Save className="w-3.5 h-3.5" />
                  {editingId ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}