'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingBag } from 'lucide-react'
import { useCarrito } from '../contexts/CarritoContext'

export default function CarritoWidget() {
  const { totalItems } = useCarrito()
  const router = useRouter()

  return (
    <button
      onClick={() => router.push('/dashboard/client/tienda')}
      className="relative p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all"
    >
      <ShoppingBag className="w-5 h-5 text-white" />
      {totalItems > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#DB5B9A] rounded-full text-[10px] text-white flex items-center justify-center font-bold">
          {totalItems}
        </span>
      )}
    </button>
  )
}
