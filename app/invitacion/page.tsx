'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { ArrowRight, Sparkles, Gift } from 'lucide-react'

function InvitacionContent() {
  const searchParams = useSearchParams()

  const name = searchParams.get('name') || ''
  const phone = searchParams.get('phone') || ''

  const registerUrl =
    `/register?name=${encodeURIComponent(name)}&phone=${encodeURIComponent(phone)}`

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F9EEF3] px-5 py-10">
      <div className="relative w-full max-w-md overflow-hidden rounded-[32px] border border-white/80 bg-white/70 p-7 shadow-[0_25px_70px_rgba(123,38,56,0.18)] backdrop-blur-xl">

        <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#D4AF37]/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-44 w-44 rounded-full bg-[#7B2638]/10 blur-2xl" />

        <div className="relative text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#D4AF37]/30 bg-white/80 shadow-lg">
            <Sparkles className="h-7 w-7 text-[#B88A3B]" />
          </div>

          <p className="text-[10px] font-black tracking-[3px] text-[#B88A3B]">
            SALÓN FRESH NAILS
          </p>

          <h1 className="mt-3 text-3xl font-black tracking-tight text-[#34262C]">
            Estás invitada
          </h1>

          {name ? (
            <p className="mt-3 text-lg font-bold text-[#7B2638]">
              {name}
            </p>
          ) : null}

          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#806B74]">
            Crea tu cuenta para reservar tus citas y disfrutar de tu experiencia
            en Salón Fresh Nails.
          </p>

          <div className="mt-7 rounded-2xl border border-[#D4AF37]/20 bg-white/65 p-4 text-left">
            <div className="flex items-start gap-3">
              <Gift className="mt-0.5 h-5 w-5 shrink-0 text-[#B88A3B]" />
              <div>
                <p className="text-sm font-black text-[#34262C]">
                  Tu cuenta te espera
                </p>
                <p className="mt-1 text-xs leading-5 text-[#8A747D]">
                  Regístrate y podrás gestionar tus reservas desde tu espacio personal.
                </p>
              </div>
            </div>
          </div>

          <a
            href={registerUrl}
            className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#7B2638] px-5 py-4 text-sm font-black text-white shadow-[0_12px_28px_rgba(123,38,56,0.25)] transition hover:bg-[#682031]"
          >
            CREAR MI CUENTA
            <ArrowRight className="h-4 w-4" />
          </a>

          <p className="mt-5 text-[10px] font-medium text-[#9A858C]">
            Salón Fresh Nails · Belleza que empieza contigo
          </p>
        </div>
      </div>
    </main>
  )
}

export default function InvitacionPage() {
  return (
    <Suspense fallback={null}>
      <InvitacionContent />
    </Suspense>
  )
}
