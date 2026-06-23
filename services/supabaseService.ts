import { supabase } from '@/lib/supabase/client'

// ============================================
// CLIENTES
// ============================================
export const getClientes = async (tenantId: string) => {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

// ============================================
// CITAS
// ============================================
export const getCitas = async (tenantId: string, clientId?: string) => {
  let query = supabase
    .from('appointments')
    .select(`
      *,
      services:service_id (name, price, duration),
      staff:staff_id (name)
    `)
    .eq('tenant_id', tenantId)

  if (clientId) {
    query = query.eq('client_id', clientId)
  }

  const { data, error } = await query.order('date', { ascending: true })

  if (error) throw error
  return data || []
}

// ============================================
// SERVICIOS
// ============================================
export const getServicios = async (tenantId: string) => {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)

  if (error) throw error
  return data || []
}

// ============================================
// PUNTOS / FIDELIZACIÓN
// ============================================
export const actualizarPuntos = async (clientId: string, puntos: number, tipo: string, descripcion: string) => {
  const { data, error } = await supabase
    .from('loyalty_points')
    .insert({
      client_id: clientId,
      points: puntos,
      type: tipo,
      description: descripcion
    })
    .select()
    .single()

  if (error) throw error
  return data
}
