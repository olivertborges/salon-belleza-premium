'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
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
    if (stock === 0) return { label: 'Agotado', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: '🔴' }
    if (stock <= 5) return { label: 'Stock Bajo', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: '🟡' }
    return { label: 'Disponible', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: '🟢' }
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
    return <div className="flex h-96 items-center justify-center font-mono text-xs text-violet-400">Cargando productos...</div>
  }

  return (
    <div className="space-y-5">

      {/* HEADER - TÍTULO MÁS GRANDE */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-950/40 via-stone-900/40 to-[#0e0c0b] border border-violet-500/20 p-5 shadow-xl">
        <div className="absolute top-0 right-0 w-40 h-40 bg-violet-500/5 rounded-full blur-3xl"></div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-violet-400 font-mono">🛒 Gestión de Productos</p>
            <h2 className="text-3xl font-serif italic text-white mt-1">Productos</h2>
            <p className="text-xs text-stone-400 mt-0.5">{productos.length} productos en catálogo</p>
          </div>
          <button 
            onClick={() => { setEditingId(null); setFormData({ name: '', description: '', category: 'Microblading', price: '', cost: '', stock: '', sku: '', image_url: '' }); setShowModal(true) }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-all shadow-lg shadow-violet-600/10 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Nuevo Producto
          </button>
        </div>
      </div>

      {/* ERROR Y SUCCESS */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-xs">
          <p className="font-mono">❌ {error}</p>
        </div>
      )}
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-emerald-400 text-xs">
          <p className="font-mono">✅ {success}</p>
        </div>
      )}

      {/* MÉTRICAS */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-stone-900/30 border border-stone-900 p-3 text-center">
          <p className="text-[8px] text-stone-500 font-mono uppercase tracking-wider">Productos</p>
          <span className="text-xl font-mono font-bold text-stone-100 block">{productos.length}</span>
        </div>
        <div className="rounded-xl bg-stone-900/30 border border-stone-900 p-3 text-center">
          <p className="text-[8px] text-stone-500 font-mono uppercase tracking-wider">Stock Bajo</p>
          <span className={`text-xl font-mono font-bold block ${bajoStockCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {bajoStockCount}
          </span>
        </div>
        <div className="rounded-xl bg-stone-900/30 border border-stone-900 p-3 text-center">
          <p className="text-[8px] text-stone-500 font-mono uppercase tracking-wider">Inventario</p>
          <span className="text-xl font-mono font-bold text-emerald-400 block">${valorInventario.toLocaleString()}</span>
        </div>
      </div>

      {/* BÚSQUEDA Y FILTROS */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center bg-stone-900/40 border border-stone-900 rounded-xl px-3 py-2.5 flex-1">
          <Search className="w-4 h-4 text-stone-500 shrink-0" />
          <input 
            type="text" 
            placeholder="Buscar producto por nombre, SKU o categoría..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-xs text-stone-200 placeholder-stone-500 w-full ml-2"
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {['Todos', ...categorias].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-medium border transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-violet-950/40 border-violet-500/40 text-violet-400'
                  : 'bg-transparent border-stone-900 text-stone-400 hover:text-stone-200 hover:bg-stone-900/30'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* GRID DE PRODUCTOS - TARJETAS MEJORADAS */}
      <div className="grid grid-cols-2 gap-3">
        {filtrados.map((prod: Producto) => {
          const status = getStockStatus(prod.stock)
          
          return (
            <div key={prod.id} className="bg-[#0e0c0b] border border-stone-900 rounded-xl p-3 hover:border-violet-500/30 transition-all group">
              {/* Header de tarjeta */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[8px] font-mono text-stone-500 truncate">{prod.sku || 'N/A'}</span>
                    <span className={`text-[7px] px-1.5 py-0.5 rounded-full border ${status.color}`}>
                      {status.icon}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-stone-200 group-hover:text-violet-400 transition-colors truncate">
                    {prod.name}
                  </h3>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => handleEdit(prod)} className="p-1 rounded-lg bg-stone-900 border border-stone-800 text-stone-400 hover:text-white transition-all">
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(prod.id)} className="p-1 rounded-lg bg-stone-900 border border-stone-800 text-stone-400 hover:text-red-400 hover:border-red-500/20 transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Categoría */}
              <div className="flex items-center gap-1 mt-1">
                <Layers className="w-3.5 h-3.5 text-stone-600" />
                <span className="text-[10px] text-stone-400">{prod.category}</span>
              </div>

              {/* Precio y Stock */}
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-900/60">
                <div>
                  <p className="text-[7px] text-stone-500 font-mono uppercase tracking-wider">Precio</p>
                  <p className="text-base font-bold text-emerald-400">${prod.price?.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-[7px] text-stone-500 font-mono uppercase tracking-wider">Stock</p>
                  <p className={`text-sm font-mono font-bold ${prod.stock === 0 ? 'text-red-500' : prod.stock <= 5 ? 'text-amber-500' : 'text-stone-300'}`}>
                    {prod.stock} <span className="text-[8px] text-stone-500 font-normal">unid.</span>
                  </p>
                </div>
              </div>

              {/* Descripción (si existe) */}
              {prod.description && (
                <p className="text-[8px] text-stone-500 mt-1 line-clamp-1">{prod.description}</p>
              )}
            </div>
          )
        })}

        {filtrados.length === 0 && (
          <div className="col-span-full py-12 text-center font-mono text-stone-500 text-xs border border-dashed border-stone-900 rounded-xl">
            No se encontraron productos
          </div>
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0e0c0b] border border-stone-900 rounded-2xl p-5 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-violet-400" />
                {editingId ? 'Editar Producto' : 'Nuevo Producto'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-stone-900 rounded-lg transition-colors">
                <X className="w-4 h-4 text-stone-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[10px] text-stone-400 font-medium mb-1">Nombre *</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  className="w-full bg-stone-900/50 border border-stone-900 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/30" 
                  required 
                />
              </div>
              <div>
                <label className="block text-[10px] text-stone-400 font-medium mb-1">Descripción</label>
                <textarea 
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})} 
                  rows={2} 
                  className="w-full bg-stone-900/50 border border-stone-900 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/30" 
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-stone-400 font-medium mb-1">SKU</label>
                  <input 
                    type="text" 
                    value={formData.sku} 
                    onChange={(e) => setFormData({...formData, sku: e.target.value})} 
                    className="w-full bg-stone-900/50 border border-stone-900 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/30" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-stone-400 font-medium mb-1">Categoría</label>
                  <select 
                    value={formData.category} 
                    onChange={(e) => setFormData({...formData, category: e.target.value})} 
                    className="w-full bg-stone-900/50 border border-stone-900 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/30"
                  >
                    {categorias.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-stone-400 font-medium mb-1">Precio ($) *</label>
                  <input 
                    type="number" 
                    value={formData.price} 
                    onChange={(e) => setFormData({...formData, price: e.target.value})} 
                    className="w-full bg-stone-900/50 border border-stone-900 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/30" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-stone-400 font-medium mb-1">Costo ($)</label>
                  <input 
                    type="number" 
                    value={formData.cost} 
                    onChange={(e) => setFormData({...formData, cost: e.target.value})} 
                    className="w-full bg-stone-900/50 border border-stone-900 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/30" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-stone-400 font-medium mb-1">Stock *</label>
                <input 
                  type="number" 
                  value={formData.stock} 
                  onChange={(e) => setFormData({...formData, stock: e.target.value})} 
                  className="w-full bg-stone-900/50 border border-stone-900 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/30" 
                  required 
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-stone-900">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="flex-1 px-3 py-2 bg-stone-900/50 border border-stone-900 text-stone-400 rounded-xl text-xs font-medium hover:bg-stone-900 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-3 py-2 bg-gradient-to-r from-violet-600 to-indigo-500 text-white rounded-xl text-xs font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
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
