import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Inicializamos Supabase con la clave de servicio
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, password, role, auth_role, phone, specialty, experience, avatar_url } = body

    // Validar datos requeridos
    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, error: 'Nombre, email y contraseña son obligatorios.' },
        { status: 400 }
      )
    }

    // 1. Crear el usuario en Autenticación
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim(),
      password: password,
      email_confirm: true
    })

    if (authError) {
      return NextResponse.json(
        { success: false, error: `Error en Auth: ${authError.message}` },
        { status: 400 }
      )
    }

    const userId = authUser.user?.id

    // 2. Insertar en staff con user_id (NO id)
    const { data: staffData, error: staffError } = await supabaseAdmin
      .from('staff')
      .insert([
        {
          user_id: userId,        // ← CORREGIDO: usar user_id
          name: name.trim(),
          email: email.trim().toLowerCase(),
          role: role || 'Especialista',
          auth_role: auth_role || 'staff',
          phone: phone?.trim() || '',
          specialty: specialty?.trim() || '',
          experience: experience ? String(experience) : '',
          avatar_url: avatar_url?.trim() || ''
        }
      ])
      .select()
      .single()

    if (staffError) {
      // Rollback: eliminar usuario de auth
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return NextResponse.json(
        { success: false, error: `Error en Tabla Staff: ${staffError.message}` },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, data: staffData })

  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}