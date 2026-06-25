import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { email, password, name, phone, role } = await request.json()

    if (role !== 'employee' && role !== 'admin') {
      return NextResponse.json({ error: 'Rol no permitido' }, { status: 400 })
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, phone, role }
    })

    if (authError) throw authError

    return NextResponse.json({ 
      success: true, 
      message: `Staff creado exitosamente con el rol de ${role}.` 
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
