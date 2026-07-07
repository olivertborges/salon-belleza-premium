const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ No se encontraron las variables de entorno en .env.local")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function analizarEstructura() {
  console.log("🔍 Consultando nombres de columnas reales...")
  
  const tablas = ['clients', 'loyalty_wallets', 'missions', 'client_missions', 'appointments']
  
  for (const tabla of tablas) {
    const { data, error } = await supabase.from(tabla).select('*').limit(1)
    if (error) {
      console.log(`❌ Error en tabla [${tabla}]:`, error.message)
    } else if (data && data.length > 0) {
      console.log(`\n📋 Columnas en [${tabla}]:`)
      console.log(Object.keys(data[0]))
    } else {
      console.log(`\n⚠️ La tabla [${tabla}] existe pero está vacía. Forzando error para ver esquema...`)
      const { error: err2 } = await supabase.from(tabla).select('columna_inexistente_prueba')
      if (err2 && err2.message) {
        console.log(`ℹ️ Info de error de [${tabla}]:`, err2.message)
      }
    }
  }
}

analizarEstructura()
