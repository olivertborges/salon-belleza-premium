import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email, password, full_name, phone, role, level, tenant_id } = await request.json()

    // Crear cliente de Supabase con las cookies de la sesión del admin
    const supabase = createRouteHandlerClient({ cookies })

    // Verificar que el usuario actual es admin
    const { data: { user: adminUser }, error: adminError } = await supabase.auth.getUser()
    
    if (adminError || !adminUser) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Verificar rol del admin en profiles
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', adminUser.id)
      .single()

    if (!adminProfile || (adminProfile.role !== 'admin' && adminProfile.role !== 'owner')) {
      return NextResponse.json(
        { error: 'No tienes permisos para crear usuarios' },
        { status: 403 }
      )
    }

    // Crear usuario usando la API de Admin (NO afecta la sesión actual)
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        phone,
        role,
        level,
        tenant_id
      }
    })

    if (createError) throw createError

    // Crear perfil en profiles
    if (newUser.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: newUser.user.id,
          tenant_id: tenant_id || null,
          email: email,
          full_name: full_name || null,
          phone: phone || null,
          role: role,
          level: level || 'bronze',
          is_active: true,
          loyalty_points: 0,
          avatar_url: null,
          referral_code: null,
          referred_by: null,
          preferences: {}
        }])

      if (profileError) throw profileError
    }

    return NextResponse.json({
      success: true,
      message: 'Usuario creado correctamente',
      user: newUser.user
    })

  } catch (error: any) {
    console.error('Error creando usuario:', error)
    return NextResponse.json(
      { error: error.message || 'Error al crear el usuario' },
      { status: 500 }
    )
  }
}