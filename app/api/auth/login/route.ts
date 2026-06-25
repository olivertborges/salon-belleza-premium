import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  console.log("\n╔════════════════════════════════════════════╗")
  console.log("║ 📩 INTENTO DE LOGIN DETECTADO EN SERVER    ║")
  
  try {
    const { email, password } = await request.json()
    console.log(`║ 📧 Email provisto: ${email}`)

    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value },
          set(name: string, value: string, options: CookieOptions) { cookieStore.set({ name, value, ...options }) },
          remove(name: string, options: CookieOptions) { cookieStore.set({ name, value: '', ...options }) },
        },
      }
    )

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      console.log("║ ❌ ERROR DE AUTENTICACIÓN EN SUPABASE:     ║")
      console.log(`║ 🛑 Mensaje: ${error.message}`)
      console.log(`║ ⚠️ Código: ${error.status}`)
      console.log("╚════════════════════════════════════════════╝\n")
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    console.log("║ ✅ LOGIN EXITOSO EN SUPABASE               ║")
    console.log("╚════════════════════════════════════════════╝\n")
    return NextResponse.json({ success: true, user: data.user })

  } catch (err: any) {
    console.log("║ 💥 CRASH CRÍTICO EN EL SERVIDOR:           ║")
    console.log(`║ 🛑 ${err.stack || err.message}`)
    console.log("╚════════════════════════════════════════════╝\n")
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
