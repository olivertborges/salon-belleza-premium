// components/ai/BeautyAssistant.tsx
// @ts-nocheck
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAI } from '@/hooks/useAI'
import { FaRobot, FaSparkles } from 'react-icons/fa'

export function BeautyAssistant() {
  const [message, setMessage] = useState('')
  const [conversation, setConversation] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const { getAIRecommendation, analyzePhoto } = useAI()

  const handleSend = async () => {
    setIsLoading(true)
    
    // Análisis avanzado con IA
    const response = await getAIRecommendation({
      message,
      history: conversation,
      clientData: {
        hairType: 'ondulado',
        skinType: 'mixta',
        previousStyles: ['corto', 'largo'],
        preferences: ['moderno', 'natural']
      }
    })

    setConversation(prev => [
      ...prev,
      { role: 'user', content: message },
      { role: 'assistant', content: response }
    ])
    
    setIsLoading(false)
  }

  return (
    <div className="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl p-6 shadow-2xl">
      <div className="flex items-center gap-3 mb-4">
        <FaRobot className="text-4xl text-purple-600" />
        <h2 className="text-2xl font-bold">✨ Asistente de Belleza IA</h2>
      </div>

      {/* Chat */}
      <div className="bg-white/90 backdrop-blur rounded-xl p-4 h-96 overflow-y-auto">
        {conversation.map((msg, idx) => (
          <motion.div
            key={idx}
            className={`mb-3 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}
            initial={{ x: msg.role === 'user' ? 50 : -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
          >
            <div className={`inline-block p-3 rounded-xl max-w-xs ${
              msg.role === 'user' 
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {msg.content}
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <div className="text-center text-gray-500">
            <FaSparkles className="animate-spin inline-block" />
            Pensando...
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-3 mt-4">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="¿Qué look te gustaría probar?"
          className="flex-1 p-3 rounded-xl border-2 border-purple-300 focus:border-purple-600"
        />
        <button
          onClick={handleSend}
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-3 rounded-xl hover:shadow-lg"
        >
          Enviar
        </button>
      </div>

      {/* Recomendaciones rápidas */}
      <div className="flex gap-2 mt-4 overflow-x-auto">
        {['Trendy', 'Clásico', 'Atrevido', 'Natural', 'Glamour', 'Edgy'].map((style) => (
          <button
            key={style}
            className="px-4 py-2 bg-white/80 rounded-full whitespace-nowrap hover:bg-white"
          >
            {style}
          </button>
        ))}
      </div>
    </div>
  )
}