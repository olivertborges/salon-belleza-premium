'use client'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export default function RegisterPage() {
  const { signUp } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({ email: '', password: '', name: '', phone: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await signUp(formData.email, formData.password, formData.name, formData.phone)
    if (error) alert('Error: ' + error.message)
    else window.location.href = '/portal'
    setLoading(false)
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">Registro</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input className="w-full border p-2" placeholder="Nombre" onChange={e => setFormData({...formData, name: e.target.value})} />
        <input className="w-full border p-2" placeholder="Email" onChange={e => setFormData({...formData, email: e.target.value})} />
        <input className="w-full border p-2" type="password" placeholder="Clase" onChange={e => setFormData({...formData, password: e.target.value})} />
        <button className="bg-black text-white p-2 w-full" disabled={loading}>Registrarse</button>
      </form>
    </div>
  )
}
