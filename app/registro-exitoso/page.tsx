'use client'

import { ArrowRight, Check, Download, Share2, Smartphone, Sparkles } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { QRCodeSVG } from 'qrcode.react'

function SuccessContent() {
  const searchParams = useSearchParams()

  const name = searchParams.get('name') || ''
  const phone = searchParams.get('phone') || ''

  const appUrl =
    `${window.location.origin}/abrir-app?name=${encodeURIComponent(name)}` +
    `&phone=${encodeURIComponent(phone)}`

  const openApp = () => {
    window.location.href = `salonfreshnails://register?name=${encodeURIComponent(name)}&phone=${encodeURIComponent(phone)}`
  }

  const shareInvitation = async () => {
    const message =
      `Hola${name ? ` ${name}` : ''} 💕\n\n` +
      `Tu cuenta de Salón Fresh Nails está lista.\n` +
      `Puedes abrir la aplicación desde este enlace:\n\n` +
      `${appUrl}`

    if (navigator.share) {
      await navigator.share({
        title: 'Salón Fresh Nails',
        text: message,
        url: appUrl,
      })
      return
    }

    await navigator.clipboard.writeText(message)
    alert('Enlace copiado. Puedes enviarlo por WhatsApp.')
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#F9EEF3] px-5 py-10">
      <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#B88A3B]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-[#7B2638]/10 blur-3xl" />

      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md items-center justify-center">
        <div className="w-full overflow-hidden rounded-[32px] border border-white/90 bg-white/70 p-7 text-center shadow-[0_28px_80px_rgba(123,38,56,0.18)] backdrop-blur-xl">

          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[26px] border border-[#B88A3B]/35 bg-white/85 shadow-lg">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#7B2638]">
              <Check className="h-7 w-7 text-[#E8C878]" strokeWidth={3} />
            </div>
          </div>

          <p className="mt-6 text-[10px] font-black tracking-[3px] text-[#B88A3B]">
            SALÓN FRESH NAILS
          </p>

          <h1 className="mt-3 text-3xl font-black tracking-tight text-[#34262C]">
            ¡Cuenta creada!
          </h1>

          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#806B74]">
            Tu cuenta está lista. Ya puedes continuar desde la aplicación.
          </p>

          <div className="mt-6 rounded-[24px] border border-white/90 bg-white/65 p-5 shadow-[0_10px_30px_rgba(123,38,56,0.07)]">
            <p className="text-[9px] font-black tracking-[2px] text-[#B88A3B]">
              ABRIR CON QR
            </p>

            <div className="mx-auto mt-4 flex w-fit items-center justify-center rounded-[22px] border border-[#B88A3B]/25 bg-white p-4 shadow-[0_10px_25px_rgba(123,38,56,0.10)]">
              <QRCodeSVG
                value={appUrl}
                size={190}
                level="M"
                includeMargin
                bgColor="#FFFFFF"
                fgColor="#34262C"
              />
            </div>

            <p className="mt-4 text-xs leading-5 text-[#8A747D]">
              Escanea este código para abrir Salón Fresh Nails.
            </p>
          </div>

          <button
            type="button"
            onClick={openApp}
            className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-[18px] bg-[#7B2638] text-[10px] font-black tracking-[1px] text-white shadow-[0_14px_30px_rgba(123,38,56,0.25)]"
          >
            ABRIR LA APP
            <ArrowRight className="h-4 w-4 text-[#E8C878]" />
          </button>

          <button
            type="button"
            onClick={shareInvitation}
            className="mt-3 flex h-14 w-full items-center justify-center gap-2 rounded-[18px] border border-[#B88A3B]/30 bg-white/70 text-[10px] font-black tracking-[1px] text-[#7B2638]"
          >
            <Share2 className="h-4 w-4 text-[#B88A3B]" />
            COMPARTIR INVITACIÓN
          </button>

          <button
            type="button"
            className="mt-3 flex h-14 w-full items-center justify-center gap-2 rounded-[18px] border border-[#7B2638]/10 bg-white/45 text-[10px] font-black tracking-[1px] text-[#7B2638]"
            onClick={() => {
              alert('Próximamente: descarga de la aplicación.')
            }}
          >
            <Download className="h-4 w-4 text-[#B88A3B]" />
            DESCARGAR APP
          </button>

          <div className="mt-6 flex items-center justify-center gap-2 text-[#8A747D]">
            <Smartphone className="h-4 w-4 text-[#B88A3B]" />
            <span className="text-[10px] font-semibold">
              Reserva tus citas desde la app
            </span>
          </div>

          <div className="mt-4 flex items-center justify-center gap-2 text-[#AA969E]">
            <Sparkles className="h-4 w-4 text-[#B88A3B]" />
            <span className="text-[9px] font-semibold tracking-[1px]">
              Belleza · Cuidado · Experiencia
            </span>
          </div>
        </div>
      </div>
    </main>
  )
}

export default function RegistroExitosoPage() {
  return (
    <Suspense fallback={null}>
      <SuccessContent />
    </Suspense>
  )
}
