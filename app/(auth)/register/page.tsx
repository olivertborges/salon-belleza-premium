'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { ArrowRight, Sparkles, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

function RegisterContent() {
  const searchParams = useSearchParams()
  const { signUp } = useAuth()

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      name: searchParams.get('name') || prev.name,
      phone: searchParams.get('phone') || prev.phone,
    }))
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.name.trim()) {
      setError('Ingresa tu nombre.')
      return
    }

    if (!formData.email.trim()) {
      setError('Ingresa tu email.')
      return
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    setLoading(true)

    const { error: authError } = await signUp(
      formData.email.trim().toLowerCase(),
      formData.password,
      formData.name.trim(),
      formData.phone.trim()
    )

    setLoading(false)

    if (authError) {
      setError(authError.message || 'No pudimos crear tu cuenta.')
      return
    }

    window.location.href =
      `/registro-exitoso?name=${encodeURIComponent(formData.name.trim())}&phone=${encodeURIComponent(formData.phone.trim())}`
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#F9EEF3] px-5 py-10">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#B88A3B]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-[#7B2638]/10 blur-3xl" />

      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md items-center justify-center">
        <div className="w-full overflow-hidden rounded-[32px] border border-white/90 bg-white/70 p-7 shadow-[0_28px_80px_rgba(123,38,56,0.18)] backdrop-blur-xl">

          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[#B88A3B]/35 bg-white/80 shadow-lg">
              <Sparkles className="h-7 w-7 text-[#B88A3B]" />
            </div>

            <p className="mt-5 text-[10px] font-black tracking-[3px] text-[#B88A3B]">
              SALÓN FRESH NAILS
            </p>

            <h1 className="mt-3 text-3xl font-black tracking-tight text-[#34262C]">
              Crea tu cuenta
            </h1>

            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#806B74]">
              Reserva tus citas y disfruta de tu experiencia Fresh Nails.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">

            <div>
              <label className="mb-2 ml-1 block text-[9px] font-black tracking-[1.5px] text-[#B88A3B]">
                NOMBRE
              </label>
              <input
                value={formData.name}
                onChange={e =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Tu nombre completo"
                autoComplete="name"
                className="h-14 w-full rounded-[18px] border border-white/95 bg-white/75 px-4 text-sm font-semibold text-[#34262C] outline-none shadow-[0_5px_15px_rgba(123,38,56,0.05)] placeholder:text-[#B5A4AB] focus:border-[#B88A3B]/45 focus:ring-2 focus:ring-[#B88A3B]/10"
              />
            </div>

            <div>
              <label className="mb-2 ml-1 block text-[9px] font-black tracking-[1.5px] text-[#B88A3B]">
                TELÉFONO
              </label>
              <input
                value={formData.phone}
                onChange={e =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="Número de contacto"
                autoComplete="tel"
                className="h-14 w-full rounded-[18px] border border-white/95 bg-white/75 px-4 text-sm font-semibold text-[#34262C] outline-none shadow-[0_5px_15px_rgba(123,38,56,0.05)] placeholder:text-[#B5A4AB] focus:border-[#B88A3B]/45 focus:ring-2 focus:ring-[#B88A3B]/10"
              />
            </div>

            <div>
              <label className="mb-2 ml-1 block text-[9px] font-black tracking-[1.5px] text-[#B88A3B]">
                EMAIL
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={e =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="tu@email.com"
                autoComplete="email"
                className="h-14 w-full rounded-[18px] border border-white/95 bg-white/75 px-4 text-sm font-semibold text-[#34262C] outline-none shadow-[0_5px_15px_rgba(123,38,56,0.05)] placeholder:text-[#B5A4AB] focus:border-[#B88A3B]/45 focus:ring-2 focus:ring-[#B88A3B]/10"
              />
            </div>

            <div>
              <label className="mb-2 ml-1 block text-[9px] font-black tracking-[1.5px] text-[#B88A3B]">
                CONTRASEÑA
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={e =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
                className="h-14 w-full rounded-[18px] border border-white/95 bg-white/75 px-4 text-sm font-semibold text-[#34262C] outline-none shadow-[0_5px_15px_rgba(123,38,56,0.05)] placeholder:text-[#B5A4AB] focus:border-[#B88A3B]/45 focus:ring-2 focus:ring-[#B88A3B]/10"
              />
            </div>

            {error && (
              <div className="rounded-2xl border border-[#B85C5C]/25 bg-[#B85C5C]/10 px-4 py-3">
                <p className="text-xs font-semibold leading-5 text-[#9D4545]">
                  {error}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex h-14 w-full items-center justify-center gap-2 rounded-[18px] bg-[#7B2638] text-[10px] font-black tracking-[1px] text-white shadow-[0_14px_30px_rgba(123,38,56,0.25)] transition hover:bg-[#682031] disabled:opacity-60"
            >
              {loading ? (
                'CREANDO CUENTA...'
              ) : (
                <>
                  CREAR MI CUENTA
                  <ArrowRight className="h-4 w-4 text-[#E8C878]" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-center gap-2 text-[#8A747D]">
            <ShieldCheck className="h-4 w-4 text-[#B88A3B]" />
            <span className="text-[10px] font-semibold">
              Tu información está protegida
            </span>
          </div>

          <div className="mt-5 text-center">
            <a
              href="/login"
              className="text-[11px] font-extrabold text-[#7B2638]"
            >
              Ya tengo una cuenta
            </a>
          </div>

          <p className="mt-5 text-center text-[9px] font-semibold tracking-[1px] text-[#AA969E]">
            Belleza · Cuidado · Experiencia
          </p>
        </div>
      </div>
    </main>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterContent />
    </Suspense>
  )
}
