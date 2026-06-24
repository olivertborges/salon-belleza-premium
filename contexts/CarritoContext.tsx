'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

interface CarritoItem {
  id: string
  nombre: string
  precio: number
  cantidad: number
  [key: string]: any
}

interface CarritoContextType {
  carrito: CarritoItem[]
  totalItems: number
  totalPrecio: number
  loadingCheckout: boolean
  agregarAlCarrito: (producto: any, cantidad?: number) => void
  eliminarDelCarrito: (id: string) => void
  actualizarCantidad: (id: string, cantidad: number) => void
  vaciarCarrito: () => void
  iniciarCheckout: () => Promise<string | false>
}

const CarritoContext = createContext<CarritoContextType | undefined>(undefined)

export function CarritoProvider({ children }: { children: React.ReactNode }) {
  const [carrito, setCarrito] = useState<CarritoItem[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [totalPrecio, setTotalPrecio] = useState(0)
  const [loadingCheckout, setLoadingCheckout] = useState(false)
  const [isReady, setIsReady] = useState(false)

  // 1. Cargar carrito SOLO en el cliente tras el montaje inicial
  useEffect(() => {
    try {
      const carritoGuardado = localStorage.getItem('freshNails_carrito')
      if (carritoGuardado) {
        const carritoData = JSON.parse(carritoGuardado)
        setCarrito(carritoData)
        
        const items = carritoData.reduce((sum: number, item: CarritoItem) => sum + (item.cantidad || 0), 0)
        const precio = carritoData.reduce((sum: number, item: CarritoItem) => sum + ((item.precio || 0) * (item.cantidad || 0)), 0)
        setTotalItems(items)
        setTotalPrecio(precio)
      }
    } catch (error) {
      console.error('Error loading cart:', error)
    } finally {
      setIsReady(true)
    }
  }, [])

  // 2. Guardar en localStorage de forma segura solo si ya se hidrató
  useEffect(() => {
    if (isReady) {
      localStorage.setItem('freshNails_carrito', JSON.stringify(carrito))
    }
  }, [carrito, isReady])

  const agregarAlCarrito = useCallback((producto: any, cantidad = 1) => {
    setCarrito(prev => {
      const existe = prev.find(item => item.id === producto.id)
      let nuevoCarrito

      if (existe) {
        nuevoCarrito = prev.map(item =>
          item.id === producto.id ? { ...item, cantidad: item.cantidad + cantidad } : item
        )
      } else {
        nuevoCarrito = [...prev, { ...producto, cantidad }]
      }

      const items = nuevoCarrito.reduce((sum, item) => sum + (item.cantidad || 0), 0)
      const precio = nuevoCarrito.reduce((sum, item) => sum + ((item.precio || 0) * (item.cantidad || 0)), 0)

      setTotalItems(items)
      setTotalPrecio(precio)

      return nuevoCarrito
    })
  }, [])

  const eliminarDelCarrito = useCallback((id: string) => {
    setCarrito(prev => {
      const nuevoCarrito = prev.filter(item => item.id !== id)
      const items = nuevoCarrito.reduce((sum, item) => sum + (item.cantidad || 0), 0)
      const precio = nuevoCarrito.reduce((sum, item) => sum + ((item.precio || 0) * (item.cantidad || 0)), 0)

      setTotalItems(items)
      setTotalPrecio(precio)

      return nuevoCarrito
    })
  }, [])

  const actualizarCantidad = useCallback((id: string, cantidad: number) => {
    if (cantidad <= 0) {
      eliminarDelCarrito(id)
      return
    }

    setCarrito(prev => {
      const nuevoCarrito = prev.map(item =>
        item.id === id ? { ...item, cantidad } : item
      )
      const items = nuevoCarrito.reduce((sum, item) => sum + (item.cantidad || 0), 0)
      const precio = nuevoCarrito.reduce((sum, item) => sum + ((item.precio || 0) * (item.cantidad || 0)), 0)

      setTotalItems(items)
      setTotalPrecio(precio)

      return nuevoCarrito
    })
  }, [eliminarDelCarrito])

  const vaciarCarrito = useCallback(() => {
    setCarrito([])
    setTotalItems(0)
    setTotalPrecio(0)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('freshNails_carrito')
    }
  }, [])

  const iniciarCheckout = useCallback(async () => {
    if (carrito.length === 0) {
      return false
    }

    setLoadingCheckout(true)

    try {
      const response = await fetch('http://localhost:3001/api/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: carrito.map(item => ({
            nombre: item.nombre,
            cantidad: item.cantidad,
            precio: item.precio,
          })),
        }),
      })

      const data = await response.json()

      if (data.preferenceId) {
        return data.preferenceId
      } else {
        return false
      }
    } catch (error) {
      console.error('Error:', error)
      return false
    } finally {
      setLoadingCheckout(false)
    }
  }, [carrito])

  return (
    <CarritoContext.Provider value={{
      carrito,
      totalItems,
      totalPrecio,
      loadingCheckout,
      agregarAlCarrito,
      eliminarDelCarrito,
      actualizarCantidad,
      vaciarCarrito,
      iniciarCheckout
    }}>
      {children}
    </CarritoContext.Provider>
  )
}

export function useCarrito() {
  const context = useContext(CarritoContext)
  if (!context) {
    throw new Error('useCarrito must be used within a CarritoProvider')
  }
  return context
}
