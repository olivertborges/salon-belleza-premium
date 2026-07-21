'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Sparkles, Eye, EyeOff, LogIn, User, Shield, CheckCircle2, XCircle } from 'lucide-react'

export default function LoginPage() {
  const { signIn, role, user, loading: authLoading } = useAuth
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [panelEstado, setPanelEstado] = useState([])

  const agregarEstado = (texto, color='blanco') => {
    const hora = new Date().toLocaleTimeString()
    setPanelEstado(a => [{hora, texto, color}, ...a].slice(0,8))
  }

  useEffect(() => {
    if (!mounted) return
    agregarEstado(`Usuario: ${user?.email || 'NO'}`, user ? 'verde' : 'rojo')
    agregarEstado(`Rol: ${role || 'NO'}`, role ? 'verde' : 'amarillo')
    agregarEstado(`Cargando: ${authLoading ? 'SI' : 'NO'}`, authLoading ? 'naranja' : 'verde')
  }, [user, role, authLoading, mounted])

  useEffect(() => { setMounted(true); agregarEstado('LISTO', 'verde') }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    if (loading || !email || !password) return setError('Completa los datos')
    setLoading(true); setError('')
    try {
      const { error: err } = await signIn(email, password)
      if (err) throw err
      agregarEstado('INGRESO OK', 'verde')
      setSuccess('Redirigiendo...')
      setTimeout(() => window.location.reload(), 1000)
    } catch (err) {
      setError(err.message)
      agregarEstado('ERROR', 'rojo')
    } finally { setLoading(false) }
  }

  const irManual = () => {
    if (!user || !role) return
    const dest = ['admin','staff','owner'].includes(role) ? '/dashboard' : '/portal'
    agregarEstado(`IR A: ${dest}`, 'verde')
    window.location.replace(dest)
  }

  if (!mounted) return <div className="flex items-center justify-center h-screen bg-black text-pink-400">Cargando...</div>

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-pink-50 to-amber-50 dark:from-black dark:to-gray-900 flex items-center justify-center p-3">
      <div className="w-full max-w-md bg-white/90 dark:bg-gray-900/95 rounded-3xl p-4">

        <div className="mb-4 p-3 bg-gray-800 rounded-xl">
          <p className="text-xs font-bold text-gray-300 mb-2">ESTADO:</p>
          <div className="space-y-1 text-[10px] font-mono">
            {panelEstado.map((e,i) => (
              <p key={i} className={`${e.color==='verde'?'text-green-400'} ${e.color==='rojo'?'text-red-400'} ${e.color==='amarillo'?'text-yellow-400'} ${e.color==='naranja'?'text-orange-400'}`}>
                [{e.hora}] {e.texto}
              </p>
            ))}
          </div>
          {user && role && <button onClick={irManual} className="mt-3 w-full py-2 bg-green-600 text-white text-xs font-bold rounded-lg">IR AL PANEL</button>}
        </div>

        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl text-white mb-2" style={{background:'linear-gradient(135deg,#ec4899,#f59e0b)'}}>
            <Sparkles className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold" style={{background:'linear-gradient(135deg,#ec4899,#f59e0b)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Fresh Nails</h2>
        </div>

        <div className="flex gap-1 p-1 rounded-xl bg-pink-100 dark:bg-gray-800 mb-4">
          {[{id:'login',label:'Ingresar',icon:LogIn},{id:'reg',label:'Registro',icon:User},{id:'rec',label:'Ayuda',icon:Shield}].map(t=>{
            const I = t.icon
            return <button key={t.id} onClick={()=>{setActiveTab(t.id);setError('')}} className={`flex-1 flex items-center justify-center gap-1 p-2 rounded-lg text-[10px] font-bold ${activeTab===t.id?'text-white':'text-gray-400'}`} style={activeTab===t.id?{background:'linear-gradient(135deg,#ec4899,#f59e0b)'}:{}}><I className="w-4 h-4"/>{t.label}</button>
          })}
        </div>

        {error && <div className="mb-3 p-2 bg-red-900/30 text-red-400 text-xs rounded-lg flex items-center gap-1"><XCircle className="w-3 h-3"/>{error}</div>}
        {success && <div className="mb-3 p-2 bg-green-900/30 text-green-400 text-xs rounded-lg flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/>{success}</div>}

        {activeTab==='login' && <form onSubmit={handleLogin} className="space-y-4">
          <div><label className="text-xs text-gray-500">Correo</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full p-2 border-b border-gray-300 dark:border-gray-700 bg-transparent text-sm focus:border-pink-500 outline-none" required/></div>
          <div><label className="text-xs text-gray-500">Contraseña</label><div className="flex items-center"><input type={showPassword?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} className="flex-1 p-2 border-b border-gray-300 dark:border-gray-700 bg-transparent text-sm focus:border-pink-500 outline-none" required/><button type="button" onClick={()=>setShowPassword(!showPassword)} className="p-2 text-gray-500">{showPassword?<EyeOff size={16}/>:<Eye size={16}/>}</button></div></div>
          <button type="submit" disabled={loading} className="w-full py-3 rounded-xl text-white text-xs font-bold" style={{background:'linear-gradient(135deg,#ec4899,#f59e0b)'}}>{loading?'...':'Ingresar'}</button>
        </form>}
      </div>
    </div>
  )
}
