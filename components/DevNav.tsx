'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FaTools, FaUser, FaUsers, FaHome } from 'react-icons/fa'

export default function DevNav() {
  const [isDev, setIsDev] = useState(false)

  useEffect(() => {
    // Solo se muestra si estás corriendo el proyecto localmente (npm run dev)
    if (process.env.NODE_ENV === 'development') {
      setIsDev(true)
    }
  }, [])

  if (!isDev) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 bg-slate-900/90 backdrop-blur-md border border-rose-500/30 p-2.5 rounded-2xl shadow-2xl flex items-center gap-2">
      <div className="text-[10px] font-mono text-rose-400 font-bold px-2 flex items-center gap-1.5 border-r border-slate-800 mr-1">
        <FaTools className="animate-pulse" /> DEV
      </div>
      <Link href="/" className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-100 transition-colors text-xs flex items-center gap-1" title="Ir a la Landing">
        <FaHome /> <span className="hidden sm:inline text-[10px] font-mono">Home</span>
      </Link>
      <Link href="/dashboard/client" className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-100 transition-colors text-xs flex items-center gap-1" title="Ir a Cliente">
        <FaUser className="text-amber-400" /> <span className="hidden sm:inline text-[10px] font-mono">Cliente</span>
      </Link>
      <Link href="/dashboard/staff" className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-100 transition-colors text-xs flex items-center gap-1" title="Ir a Staff">
        <FaUsers className="text-sky-400" /> <span className="hidden sm:inline text-[10px] font-mono">Staff</span>
      </Link>
    </div>
  )
}
