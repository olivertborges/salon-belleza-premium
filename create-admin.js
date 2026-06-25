const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

try {
  const envPath = path.join(process.cwd(), '.env.local')
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8')
    envConfig.split('\n').forEach(line => {
      const match = line.match(/^([^=~#]+)=(.*)$/)
      if (match) {
        const key = match[1].trim()
        let value = match[2].trim().replace(/^['"]|['"]$/g, '')
        process.env[key] = value;
      }
    })
  }
} catch (e) {}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Error: Faltan las variables en tu .env.local");
  process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

async function run() {
  console.log("Insertando a Aniexis mediante la API de Administración...")
  
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: 'aniexiscamposleyva@gmail.com',
    password: 'Nullaosta87',
    // Forzamos a Supabase a saltarse las verificaciones de correo y teléfono
    email_confirm: true,
    phone_confirm: true, 
    user_metadata: {
      name: 'Aniexis Campo Leyva',
      phone: '097221131',
      role: 'admin'
    }
  })

  if (error) {
    console.error("\n❌ ERROR DE SUPABASE TRANSMITIDO:");
    console.error(error.message);
    console.error("───────────────────────────────────────────\n");
  } else {
    console.log("\n============== ¡ÉXITO! ==============");
    console.log(`✅ Administradora creada correctamente con ID: ${data.user.id}`);
    console.log("=====================================\n");
  }
}

run()
