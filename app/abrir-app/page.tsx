'use client'

import { Download, Smartphone, Sparkles } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

function OpenAppContent() {
  const searchParams = useSearchParams()
  const [opened, setOpened] = useState(false)

  const name = searchParams.get('name') || ''
  const phone = searchParams.get('phone') || ''

  useEffect(() => {
    const url =
      `salonfreshnails://register?name=${encodeURIComponent(name)}` +
      `&phone=${encodeURIComponent(phone)}`

    const timer = setTimeout(() => {
      setOpened(true)
      window.location.href = url
    }, 700)

    return () => clearTimeout(timer)
  }, [name, phone])

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#F9EEF3] px-5 py-10">
      <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#B88A3B]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-[#7B2638]/10 blur-3xl" />

      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md items-center justify-center">
        <div className="w-full rounded-[32px] border border-white/90 bg-white/70 p-8 text-center shadow-[0_28px_80px_rgba(123,38,56,0.18)] backdrop-blur-xl">

          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[26px] border border-[#B88A3B]/35 bg-white/85 shadow-lg">
            <Smartphone className="h-9 w-9 text-[#7B2638]" />
          </div>

          <p className="mt-6 text-[10px] font-black tracking-[3px] text-[#B88A3B]">
            SALÓN FRESH NAILS
          </p>

          <h1 className="mt-3 text-3xl font-black tracking-tight text-[#34262C]">
            Abriendo la aplicación
          </h1>

          <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-[#806B74]">
            Estamos intentando abrir Salón Fresh Nails en tu dispositivo.
          </p>

          {opened && (
            <div className="mt-7 rounded-[22px] border border-[#B88A3B]/25 bg-white/65 p-5">
              <p className="text-sm font-black text-[#34262C]">
                ¿La aplicación no se abrió?
              </p>

              <p className="mt-2 text-xs leading-5 text-[#8A747D]">
                Si todavía no tienes la aplicación instalada, puedes descargarla
                para continuar.
              </p>

              <button
                type="button"
                className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-[18px] bg-[#7B2638] text-[10px] font-black tracking-[1px] text-white shadow-[0_14px_30px_rgba(123,38,56,0.25)]"
                onClick={() => {
                  alert('Próximamente: descarga de la aplicación.')
                }}
              >
                <Download className="h-4 w-4 text-[#E8C878]" />
                DESCARGAR APP
              </button>
            </div>
          )}

          <div className="mt-7 flex items-center justify-center gap-2 text-[#8A747D]">
            <Sparkles className="h-4 w-4 text-[#B88A3B]" />
            <span className="text-[10px] font-semibold">
              Belleza · Cuidado · Experiencia
            </span>
          </div>
        </div>
      </div>
    </main>
  )
}

export default function OpenAppPage() {
  return (
    <Suspense fallback={null}>
      <OpenAppContent />
    </Suspense>
  )
}
