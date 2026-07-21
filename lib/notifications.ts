// @ts-nocheck
// lib/notifications.ts
import { supabase } from './supabase/client'

export async function createNotification({
  userId,
  title,
  message,
  type = 'info',
  link = null
}: {
  userId: string
  title: string
  message: string
  type?: 'info' | 'success' | 'warning' | 'error'
  link?: string | null
}) {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert([{
        user_id: userId,
        title,
        message,
        type,
        link,
        read: false
      }])

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Error creating notification:', error)
    return { success: false, error }
  }
}
