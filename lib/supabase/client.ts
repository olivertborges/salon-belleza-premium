import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan variables de entorno de Supabase')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      services: {
        Row: {
          id: string
          name: string
          description: string
          price: number
          duration: number
          badge: string
          icon: string
          category: string
          is_active: boolean
          created_at: string
        }
      }
      staff: {
        Row: {
          id: string
          name: string
          role: string
          email: string
          phone: string
          avatar_url: string
          is_active: boolean
          created_at: string
        }
      }
      professionals: {
        Row: {
          id: string
          name: string
          specialty: string
          avatar_url: string
          email: string
          phone: string
          bio: string
          rating: number
          is_active: boolean
          created_at: string
        }
      }
      clients: {
        Row: {
          id: string
          name: string
          email: string
          phone: string
          avatar_url: string
          is_active: boolean
          created_at: string
        }
      }
      testimonials: {
        Row: {
          id: string
          name: string
          location: string
          service: string
          rating: number
          comment: string
          avatar_url: string
          is_verified: boolean
          is_active: boolean
          created_at: string
        }
      }
      gallery: {
        Row: {
          id: string
          image_url: string
          title: string
          category: string
          sort_order: number
          is_active: boolean
          created_at: string
        }
      }
      events: {
        Row: {
          id: string
          title: string
          description: string
          date: string
          time: string
          location: string
          spots: number
          price: string
          instructor: string
          type: string
          is_active: boolean
          created_at: string
        }
      }
      blog_posts: {
        Row: {
          id: string
          title: string
          excerpt: string
          content: string
          read_time: string
          date: string
          image_url: string
          slug: string
          category: string
          tags: string[]
          author: string
          is_published: boolean
          created_at: string
        }
      }
      memberships: {
        Row: {
          id: string
          name: string
          price: string
          features: string[]
          is_popular: boolean
          is_active: boolean
          created_at: string
        }
      }
      analytics: {
        Row: {
          id: string
          metric_name: string
          value: string
          change_percentage: number
          date: string
          created_at: string
        }
      }
      loyalty_points: {
        Row: {
          id: string
          client_id: string
          points: number
          type: string
          description: string
          created_at: string
        }
      }
      referrals: {
        Row: {
          id: string
          code: string
          referrer_name: string
          conversions: number
          points_earned: number
          conversion_rate: number
          created_at: string
        }
      }
    }
  }
}
