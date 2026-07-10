'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'

interface Settings {
  business_name: string
  business_phone: string
  business_email: string
  business_address: string
  schedule: Record<string, string>
  primary_color: string
  secondary_color: string
  bg_light: string
  bg_dark: string
  panel_dark: string
  text_title_color: string
  social: { instagram: string; facebook: string; tiktok: string }
  currency: string
  appointment_duration: number
  appointment_gap: number
  notifications: { email: boolean; whatsapp: boolean }
  loyalty_points: number
}

interface SettingsContextType {
  settings: Settings
  loading: boolean
  refreshSettings: () => Promise<void>
}

const defaultSettings: Settings = {
  business_name: 'Fresh Nails Studio Center',
  business_phone: '',
  business_email: '',
  business_address: '',
  schedule: {
    monday: '09:00 - 21:00', tuesday: '09:00 - 21:00', wednesday: '09:00 - 21:00',
    thursday: '09:00 - 21:00', friday: '09:00 - 21:00', saturday: '09:00 - 21:00', sunday: 'Cerrado'
  },
  primary_color: '#DB5B9A',
  secondary_color: '#E5A46E',
  bg_light: '#fffdfd',
  bg_dark: '#0f0c1b',
  panel_dark: '#130f24',
  text_title_color: '#1c1917',
  social: { instagram: '', facebook: '', tiktok: '' },
  currency: '€',
  appointment_duration: 60,
  appointment_gap: 15,
  notifications: { email: true, whatsapp: true },
  loyalty_points: 1
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { tenantId } = useAuth()
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [loading, setLoading] = useState(true)

  const applyCSSVariables = (s: Settings) => {
    if (typeof window === 'undefined') return
    const root = document.documentElement
    
    root.style.setProperty('--primary-color', s.primary_color)
    root.style.setProperty('--secondary-color', s.secondary_color)
    root.style.setProperty('--bg-light', s.bg_light)
    root.style.setProperty('--bg-dark', s.bg_dark)
    root.style.setProperty('--panel-dark', s.panel_dark)
    root.style.setProperty('--text-title-color', s.text_title_color)
  }

  const loadSettings = async () => {
    if (!tenantId) {
      applyCSSVariables(defaultSettings)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('business_settings')
        .select('*')
        .eq('tenant_id', tenantId)
        .maybeSingle()

      if (data) {
        const mergedSettings = {
          ...defaultSettings,
          ...data,
          schedule: data.schedule || defaultSettings.schedule,
          social: data.social || defaultSettings.social,
          notifications: data.notifications || defaultSettings.notifications
        }
        setSettings(mergedSettings)
        applyCSSVariables(mergedSettings)
      } else {
        applyCSSVariables(defaultSettings)
      }
    } catch (err) {
      console.error('Error cargando el contexto de configuraciones:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [tenantId])

  return (
    <SettingsContext.Provider value={{ settings, loading, refreshSettings: loadSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings debe ser usado dentro de un SettingsProvider')
  }
  return context
}
