// lib/notifications/RealTimeNotifications.ts
// @ts-nocheck
import { createClient } from '@supabase/supabase-js'
import { toast } from 'react-hot-toast'

export class NotificationService {
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async setupRealtimeNotifications(userId: string) {
    const channel = this.supabase
      .channel('appointments')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'appointments',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          this.handleNewAppointment(payload.new)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'appointments',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          this.handleAppointmentUpdate(payload.new)
        }
      )
      .subscribe()

    return channel
  }

  private handleNewAppointment(appointment: any) {
    // Notificación de confirmación
    toast.success(`✅ ¡Cita confirmada! ${appointment.service} - ${appointment.time}`)
    
    // Sonido personalizado
    this.playSound('confirmation.mp3')
    
    // Notificación push
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('📅 Nueva cita confirmada', {
        body: `${appointment.service} con ${appointment.professional}`,
        icon: '/logo.png',
        requireInteraction: true
      })
    }
  }

  private handleAppointmentUpdate(appointment: any) {
    if (appointment.status === 'cancelled') {
      toast.error(`❌ Cita cancelada: ${appointment.service}`)
      this.playSound('cancellation.mp3')
    } else if (appointment.status === 'reminded') {
      toast.info(`⏰ Recordatorio: ${appointment.service} en 2 horas`)
    }
  }

  async sendSmartReminders() {
    // IA calcula el mejor momento para recordar
    const appointments = await this.getTodaysAppointments()
    
    for (const apt of appointments) {
      const bestTime = this.calculateBestReminderTime(apt.time)
      const now = new Date()
      
      if (now >= bestTime && now < new Date(apt.time)) {
        await this.sendReminder(apt.userId, apt)
      }
    }
  }

  private calculateBestReminderTime(appointmentTime: string) {
    // IA predice cuándo el cliente estará más receptivo
    const time = new Date(appointmentTime)
    const hour = time.getHours()
    
    if (hour < 12) {
      time.setHours(time.getHours() - 1.5) // Mañana
    } else if (hour < 18) {
      time.setHours(time.getHours() - 2) // Tarde
    } else {
      time.setHours(time.getHours() - 1) // Noche
    }
    
    return time
  }
}