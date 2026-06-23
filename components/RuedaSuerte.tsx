'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Sparkles, X, RotateCw, Gift } from 'lucide-react'
import confetti from 'canvas-confetti'

interface RuedaSuerteProps {
  onPuntosGanados?: (puntos: number) => void
}

export default function RuedaSuerte({ onPuntosGanados }: RuedaSuerteProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [mensaje, setMensaje] = useState('Gira para descubrir tu beneficio diario')
  const [girando, setGirando] = useState(false)
  const [mostrarModal, setMostrarModal] = useState(false)

  // Paleta de colores sofisticada (escala de piedras/neutros)
  const SEGMENTOS = [
    { label: "50 pts", tipo: "puntos", valor: 50 },
    { label: "10% OFF", tipo: "descuento", valor: 10 },
    { label: "100 pts", tipo: "puntos", valor: 100 },
    { label: "20% OFF", tipo: "descuento", valor: 20 },
    { label: "200 pts", tipo: "puntos", valor: 200 },
    { label: "15% OFF", tipo: "descuento", valor: 15 },
    { label: "500 pts", tipo: "puntos", valor: 500 },
    { label: "Sigue intentando", tipo: "nada", valor: 0 },
  ]
  
  const COLORS = ["#e7e5e4", "#d6d3d1", "#a8a29e", "#f5f5f4", "#e7e5e4", "#d6d3d1", "#a8a29e", "#f5f5f4"]
  const anguloPorSegmento = (Math.PI * 2) / SEGMENTOS.length

  const dibujarRuleta = (anguloInicio: number = 0) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    
    const w = canvas.width
    const h = canvas.height
    const centro = w / 2
    const radio = w * 0.45

    ctx.clearRect(0, 0, w, h)

    for (let i = 0; i < SEGMENTOS.length; i++) {
      const inicio = anguloInicio + i * anguloPorSegmento
      const fin = inicio + anguloPorSegmento
      ctx.beginPath()
      ctx.moveTo(centro, centro)
      ctx.arc(centro, centro, radio, inicio, fin)
      ctx.fillStyle = COLORS[i % COLORS.length]
      ctx.fill()
      ctx.strokeStyle = "#d6d3d1"
      ctx.lineWidth = 1
      ctx.stroke()
      
      ctx.save()
      ctx.translate(centro, centro)
      ctx.rotate(inicio + anguloPorSegmento / 2)
      ctx.textAlign = "center"
      ctx.fillStyle = "#44403c"
      ctx.font = "bold 16px 'serif'"
      ctx.fillText(SEGMENTOS[i].label, radio * 0.6, 6)
      ctx.restore()
    }

    // Marcador de premio
    ctx.beginPath()
    ctx.moveTo(centro, 20)
    ctx.lineTo(centro - 10, 5)
    ctx.lineTo(centro + 10, 5)
    ctx.fillStyle = "#1c1917"
    ctx.fill()
  }

  const girarRuleta = () => {
    if (girando) return
    
    setGirando(true)
    let vueltas = 5 + Math.random() * 8
    let tiempoInicio: number | null = null
    const duracion = 3000

    const animar = (timestamp: number) => {
      if (!tiempoInicio) tiempoInicio = timestamp
      let progreso = Math.min(1, (timestamp - tiempoInicio) / duracion)
      let easing = 1 - Math.pow(1 - progreso, 3)
      let anguloFinalRad = (Math.PI * 2 * vueltas) * easing
      
      dibujarRuleta(anguloFinalRad)
      
      if (progreso < 1) {
        requestAnimationFrame(animar)
      } else {
        let anguloTotal = anguloFinalRad % (Math.PI * 2)
        let indice = Math.floor(anguloTotal / anguloPorSegmento)
        indice = (SEGMENTOS.length - indice) % SEGMENTOS.length
        const premio = SEGMENTOS[indice]

        if (premio.tipo === "puntos") {
          setMensaje(`¡Ganaste ${premio.valor} puntos!`)
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#a8a29e', '#1c1917'] })
          if (onPuntosGanados) onPuntosGanados(premio.valor)
        } else if (premio.tipo === "descuento") {
          setMensaje(`¡Descuento del ${premio.valor}% obtenido!`)
        } else {
          setMensaje("¡Sigue participando!")
        }
        
        localStorage.setItem("freshNails_ultimoGiro", new Date().toDateString())
        setGirando(false)
      }
    }
    requestAnimationFrame(animar)
  }

  useEffect(() => {
    const yaGiroHoy = localStorage.getItem("freshNails_ultimoGiro") === new Date().toDateString()
    if (!yaGiroHoy) {
      setMostrarModal(true)
    }
    if (canvasRef.current) {
      dibujarRuleta(0)
    }
  }, [])

  if (!mostrarModal) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center border border-stone-200 shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
        <button 
          onClick={() => setMostrarModal(false)}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-900 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <h2 className="font-serif text-2xl text-stone-900">Tu Giro Diario</h2>
          <p className="text-xs font-mono uppercase tracking-widest text-stone-400 mt-1">Cortesía del Club</p>
        </div>

        <canvas 
          ref={canvasRef} 
          width="500" 
          height="500" 
          className="w-56 h-56 mx-auto mb-6" 
        />

        <div className="mb-6 h-12 flex items-center justify-center">
          <p className="text-stone-700 font-medium italic">{mensaje}</p>
        </div>

        <button 
          onClick={girarRuleta}
          disabled={girando}
          className="w-full py-4 bg-stone-900 text-white rounded-2xl font-mono text-sm uppercase tracking-wider hover:bg-stone-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {girando ? <RotateCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {girando ? 'Girando...' : 'Girar Ahora'}
        </button>
      </div>
    </div>
  )
}
