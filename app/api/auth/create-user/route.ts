import { createClient } from '@supabase/supabase-js'
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
    // OBTENER EL TOKEN DE LA CABECERA
    // ============================================================
    const authHeader = request.headers.get('authorization')
    console.log('🔑 Auth header:', authHeader ? 'Presente' : 'Ausente')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No hay token de autorización')
      return NextResponse.json(
        { error: 'No autorizado - Token no proporcionado' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    console.log('🔑 Token recibido:', token ? '✅ Sí' : '❌ No')

    // ============================================================
    // VERIFICAR EL TOKEN CON SUPABASE
    // ============================================================
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Verificar el token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      console.log('❌ Error verificando token:', userError)
      return NextResponse.json(
        { error: 'No autorizado - Token inválido' },
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
    // CREAR CLIENTE ADMIN
    // ============================================================
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
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