import Link from 'next/link'
import { FaArrowLeft } from 'react-icons/fa'

export default function CursosPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-20">
      <div className="container mx-auto px-4">
        <Link href="/" className="inline-flex items-center gap-2 text-rose-400 hover:text-rose-500 transition-colors mb-8">
          <FaArrowLeft /> Volver al inicio
        </Link>
        <h1 className="text-4xl font-light text-gray-800 mb-4">
          <span className="font-bold bg-gradient-to-r from-rose-400 to-amber-400 text-transparent bg-clip-text">Cursos</span>
        </h1>
        <p className="text-gray-400">Formación profesional en belleza.</p>
      </div>
    </main>
  )
}
