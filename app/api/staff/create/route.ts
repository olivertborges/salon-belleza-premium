import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Inicializamos Supabase con la clave de servicio (maestra) para poder gestionar credenciales de otros
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Asegúrate de tener esta variable en tu .env
)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, password, role, auth_role, phone, specialty, experience, avatar_url } = body

    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, error: 'Nombre, email y contraseña son obligatorios.' }, 
        { status: 400 }
      )
    }

    // 1. Crear el usuario directamente en el sistema de Autenticación de Supabase
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim(),
      password: password,
      email_confirm: true // Se auto-confirma inmediatamente sin mandar correos de validación
    })

    if (authError) {
      return NextResponse.json(
        { success: false, error: `Error en Auth: ${authError.message}` }, 
        { status: 400 }
      )
    }

    const userId = authUser.user?.id

    // 2. Insertar los datos en tu tabla pública con el ID del usuario como clave primaria
    const { data: staffData, error: staffError } = await supabaseAdmin
      .from('staff')
      .insert([
        {
          id: userId, // ← CORREGIDO: usamos 'id' que es la clave primaria, no 'user_id'
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
      // Limpieza preventiva: Si falla la tabla pública, removemos el usuario de auth para no dejar datos huérfanos
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