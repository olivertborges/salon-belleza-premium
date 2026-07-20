import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  console.log('🚀 API create-user: Iniciando...')
  
  try {
    const body = await request.json()
    console.log('📝 Body recibido:', body)

    const { email, password, full_name, phone, role, level, tenant_id } = body

    // Validar campos obligatorios
    if (!email || !password || !full_name) {
      console.log('❌ Faltan campos obligatorios')
      return NextResponse.json(
        { error: 'Email, contraseña y nombre son obligatorios' },
        { status: 400 }
      )
    }

    // ============================================================
    // CREAR CLIENTE DE SUPABASE CON LAS COOKIES (NEXT.JS 15)
    // ============================================================
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.delete({ name, ...options })
          },
        },
      }
    )

    console.log('✅ Cliente Supabase creado con cookies')

    // ============================================================
    // VERIFICAR QUE EL USUARIO ESTÁ AUTENTICADO Y ES ADMIN
    // ============================================================
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.log('❌ Error obteniendo usuario:', userError)
      return NextResponse.json(
        { error: 'No autorizado - Usuario no autenticado' },
        { status: 401 }
      )
    }

    console.log('👤 Usuario autenticado:', user.email)

    // Verificar que el usuario es admin en profiles
    const { data: adminProfile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.log('❌ Error obteniendo perfil del admin:', profileError)
      return NextResponse.json(
        { error: 'No se pudo verificar tu rol' },
        { status: 500 }
      )
    }

    console.log('👤 Rol del admin:', adminProfile?.role)

    if (!adminProfile || (adminProfile.role !== 'admin' && adminProfile.role !== 'owner')) {
      console.log('❌ Rol no autorizado:', adminProfile?.role)
      return NextResponse.json(
        { error: `No tienes permisos. Tu rol es: ${adminProfile?.role || 'sin rol'}` },
        { status: 403 }
      )
    }

    // ============================================================
    // CREAR CLIENTE ADMIN PARA CREAR USUARIO
    // ============================================================
    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.delete({ name, ...options })
          },
        },
      }
    )

    // ============================================================
    // CREAR USUARIO CON LA API DE ADMIN
    // ============================================================
    console.log('📝 Creando usuario en Auth...')
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
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

    if (createError) {
      console.log('❌ Error creando usuario en Auth:', createError)
      return NextResponse.json(
        { error: createError.message || 'Error al crear el usuario en Auth' },
        { status: 500 }
      )
    }

    console.log('✅ Usuario creado en Auth:', newUser.user?.id)

    // ============================================================
    // CREAR PERFIL EN PROFILES
    // ============================================================
    if (newUser.user) {
      console.log('📝 Creando perfil en profiles...')
      
      const profileData = {
        id: newUser.user.id,
        tenant_id: tenant_id || null,
        email: email,
        full_name: full_name || null,
        phone: phone || null,
        role: role || 'client',
        level: level || 'bronze',
        is_active: true,
        loyalty_points: 0,
        avatar_url: null,
        referral_code: null,
        referred_by: null,
        preferences: {}
      }

      console.log('📝 Profile data:', profileData)

      const { error: profileInsertError } = await supabaseAdmin
        .from('profiles')
        .insert([profileData])

      if (profileInsertError) {
        console.log('❌ Error insertando perfil:', profileInsertError)
        await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
        return NextResponse.json(
          { error: profileInsertError.message || 'Error al crear el perfil' },
          { status: 500 }
        )
      }

      console.log('✅ Perfil creado correctamente')
    }

    console.log('🎉 Usuario creado exitosamente')
    return NextResponse.json({
      success: true,
      message: 'Usuario creado correctamente',
      user: newUser.user
    })

  } catch (error: any) {
    console.error('❌ Error general en API:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}