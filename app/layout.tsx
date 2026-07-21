import { ThemeProvider } from '@/contexts/ThemeContext'
import { AuthProvider } from '@/contexts/AuthContext'
import { SettingsProvider } from '@/contexts/SettingsContext'
import './globals.css'

export const metadata = {
  title: 'Salon Fresh Nails',
  description: 'Creado con Next.js, Supabase y Modo Claro/Oscuro',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <body className="bg-stone-50 text-stone-900 dark:bg-[#0a0908] dark:text-white min-h-screen transition-colors duration-300">
        <ThemeProvider>
          <AuthProvider>
            <SettingsProvider>
              {children}
            </SettingsProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
