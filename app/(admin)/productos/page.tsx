'use client'

import React, { useState } from 'react'
import { 
  Plus, Search, Package, AlertTriangle, 
  TrendingUp, Edit, Trash2, Layers 
} from 'lucide-react'

// Declaramos la estructura exacta de nuestro producto para TypeScript
interface Producto {
  id: number
  name: string
  category: string
  price: number
  cost: number
  stock: number
  minStock: number
  sku: string
  brand: string
}

const productosIniciales: Producto[] = [
  {
    id: 1,
    name: 'Aceite de Cutículas Hidratante - Almendras',
    category: 'Cuidado en Casa',
    price: 1500,
    cost: 700,
    stock: 24,
    minStock: 10,
    sku: 'FN-ACC-01',
    brand: 'Fresh Premium',
  },
  {
    id: 2,
    name: 'Top Coat Ultra Gloss - Larga Duración',
    category: 'Esmaltes & geles',
    price: 3200,
    cost: 1500,
    stock: 4,
    minStock: 8,
    sku: 'FN-TCG-02',
    brand: 'NailsPro',
  },
  {
    id: 3,
    name: 'Crema Exfoliante de Manos - Coco & Vainilla',
    category: 'Spa & Tratamientos',
    price: 2800,
    cost: 1200,
    stock: 15,
    minStock: 5,
    sku: 'FN-EXF-03',
    brand: 'Fresh Premium',
  },
  {
    id: 4,
    name: 'Kit de Limas Profesionales (Granulados Varios)',
    category: 'Herramientas',
    price: 950,
    cost: 400,
    stock: 0,
    minStock: 15,
    sku: 'FN-LIM-04',
    brand: 'Stylist Tools',
  }
]

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>(productosIniciales)
  const [search, setSearch] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos')

  const categorias: string[] = ['Todos', 'Esmaltes & geles', 'Cuidado en Casa', 'Spa & Tratamientos', 'Herramientas']

  // Filtrado con tipos estrictos de TS
  const filtrados: Producto[] = productos.filter((p: Producto) => {
    const matchSearch: boolean = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase())
    const matchCategory: boolean = selectedCategory === 'Todos' || p.category === selectedCategory
    return matchSearch && matchCategory
  })

  // Métricas con tipos estrictos de TS
  const bajoStockCount: number = productos.filter((p: Producto) => p.stock <= p.minStock).length
  const valorInventario: number = productos.reduce((sum: number, p: Producto) => sum + (p.stock * p.cost), 0)

  return (
    <div className="space-y-6">
      
      {/* HEADER PRINCIPAL */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-950/40 via-stone-900/40 to-[#0e0c0b] border border-violet-500/20 p-6 shadow-xl">
        <div className="absolute top-0 right-0 w-40 h-40 bg-violet-500/5 rounded-full blur-3xl"></div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-violet-400 font-mono">🛒 Retail & Inventory</p>
            <h2 className="text-2xl font-serif italic text-white mt-1">Control de Tienda y Productos</h2>
            <p className="text-xs text-stone-400 mt-1">Gestiona el catálogo de venta al público, controla existencias y calcula el valor de tu inventario.</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-all shadow-lg shadow-violet-600/10 self-start sm:self-auto">
            <Plus className="w-4 h-4" />
            Nuevo Producto
          </button>
        </div>
      </div>

      {/* METRICAS PRINCIPALES */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="rounded-2xl bg-stone-900/30 border border-stone-900 p-5 flex items-center justify-between">
          <div>
            <p className="text-stone-400 text-xs font-medium">Líneas de Productos</p>
            <span className="text-2xl font-mono font-bold text-stone-100 block mt-1">{productos.length}</span>
          </div>
          <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-2xl bg-stone-900/30 border border-stone-900 p-5 flex items-center justify-between">
          <div>
            <p className="text-stone-400 text-xs font-medium">Alertas de Stock Bajo</p>
            <span className={`text-2xl font-mono font-bold block mt-1 ${bajoStockCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {bajoStockCount}
            </span>
          </div>
          <div className={`p-3 rounded-xl border ${bajoStockCount > 0 ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-stone-900 border-stone-800 text-stone-500'}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-2xl bg-stone-900/30 border border-stone-900 p-5 flex items-center justify-between">
          <div>
            <p className="text-stone-400 text-xs font-medium">Inversión en Almacén (Costo)</p>
            <span className="text-2xl font-mono font-bold text-emerald-400 block mt-1">
              ${valorInventario.toLocaleString()}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* BARRA DE FILTROS Y BÚSQUEDA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
        <div className="flex items-center bg-stone-900/40 border border-stone-900 rounded-xl px-4 py-3 max-w-md flex-1">
          <Search className="w-4 h-4 text-stone-500 shrink-0" />
          <input 
            type="text" 
            placeholder="Buscar por producto, marca o SKU..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-xs text-stone-200 placeholder-stone-500 w-full ml-3 font-sans"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {categorias.map((cat: string) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all whitespace-nowrap ${
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

      {/* TABLA DE PRODUCTOS */}
      <div className="rounded-2xl border border-stone-900 bg-[#0e0c0b] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-900 bg-stone-900/20 text-[10px] font-mono uppercase tracking-wider text-stone-400">
                <th className="p-4">Detalle del Producto</th>
                <th className="p-4">SKU / Marca</th>
                <th className="p-4">Categoría</th>
                <th className="p-4 text-right">Precio Venta</th>
                <th className="p-4 text-center">Stock Disponible</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-900/60 text-xs">
              {filtrados.map((prod: Producto) => {
                const esBajoStock = prod.stock <= prod.minStock
                const esAgotado = prod.stock === 0

                return (
                  <tr key={prod.id} className="hover:bg-stone-900/10 transition-all group">
                    <td className="p-4 font-medium text-stone-200 group-hover:text-violet-400 transition-colors">
                      {prod.name}
                    </td>
                    
                    <td className="p-4 font-mono text-[11px] text-stone-400">
                      <div className="flex flex-col">
                        <span>{prod.sku}</span>
                        <span className="text-[10px] text-stone-500 mt-0.5">{prod.brand}</span>
                      </div>
                    </td>

                    <td className="p-4">
                      <span className="flex items-center gap-1.5 text-stone-300">
                        <Layers className="w-3 h-3 text-stone-600" />
                        {prod.category}
                      </span>
                    </td>

                    <td className="p-4 text-right font-mono font-bold text-stone-200">
                      ${prod.price.toLocaleString()}
                    </td>

                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className={`font-mono font-bold text-sm ${
                          esAgotado ? 'text-red-500' : esBajoStock ? 'text-amber-500' : 'text-stone-300'
                        }`}>
                          {prod.stock}
                        </span>
                        <span className="text-[10px] text-stone-500 font-mono">/ min {prod.minStock}</span>
                        
                        {esAgotado ? (
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></span>
                        ) : esBajoStock ? (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        )}
                      </div>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-1.5 rounded-lg bg-stone-900 border border-stone-800 text-stone-400 hover:text-white transition-all">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button className="p-1.5 rounded-lg bg-stone-900 border border-stone-800 text-stone-400 hover:text-red-400 hover:border-red-500/20 transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}

              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 font-mono text-stone-500 text-xs">
                    No se encontraron productos con los criterios de búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}