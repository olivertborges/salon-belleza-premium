'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { 
  Heart, 
  X, 
  Loader,     
  Sparkles,
  Columns,
  Maximize2,
  Scissors,
  CheckCircle2,
  Eye,
  Camera,
  Upload,
  User,
  Trash2,
  Grid
} from 'lucide-react'
import toast from 'react-hot-toast'

interface GalleryImage {
  id: string
  image_url: string
  title: string
  description: string
  is_active: boolean
  is_public: boolean
  created_at: string
  client_id?: string
  client_name?: string
  sensory_category?: 'glow' | 'mirada' | 'transformacion' | 'tendencia'
  price?: string | number
}

export default function GaleriaInnovadoraPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [activeTab, setActiveTab] = useState<'public' | 'private'>('public')
  
  // Estados de imágenes
  const [allImages, setAllImages] = useState<GalleryImage[]>([])
  const [privateImages, setPrivateImages] = useState<GalleryImage[]>([])
  const [favorites, setFavorites] = useState<GalleryImage[]>([])
  
  // Estados de interactividad
  const [compareMode, setCompareMode] = useState(false)
  const [slotA, setSlotA] = useState<GalleryImage | null>(null)
  const [slotB, setSlotB] = useState<GalleryImage | null>(null)
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null)
  const [activeHeartId, setActiveHeartId] = useState<string | null>(null)

  useEffect(() => {
    loadGalleryData()
    if (user) {
      loadPrivateImages()
    }
  }, [user])

  const loadGalleryData = async () => {
    setLoading(true)
    try {
      const { data: publicPhotos, error } = await supabase
        .from('client_gallery')
        .select('*')
        .eq('is_active', true)
        .eq('is_public', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      if (publicPhotos) {
        const mapped = publicPhotos.map((photo: any) => ({
          ...photo,
          client_name: photo.client_name || 'Studio Premium',
          sensory_category: photo.sensory_category || 'mirada',
          price: photo.price ? `$${photo.price}` : '$60.00'
        }))
        setAllImages(mapped)
      }
    } catch (error) {
      console.error('Error cargando galería pública:', error)
      toast.error('No se pudo cargar el catálogo público')
    } finally {
      setLoading(false)
    }
  }

  const loadPrivateImages = async () => {
    if (!user) return
    try {
      const { data: userPhotos, error } = await supabase
        .from('client_gallery')
        .select('*')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPrivateImages(userPhotos || [])
    } catch (error) {
      console.error('Error cargando fotos privadas:', error)
    }
  }

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    if (!user) {
      toast.error('Debes iniciar sesión para subir tus fotos de seguimiento')
      return
    }

    setUploading(true)
    try {
      const file = e.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`
      const filePath = `gallery/${fileName}`

      // 1. Subir imagen al Storage
      const { error: uploadError } = await supabase.storage
        .from('salon-assets')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // 2. Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('salon-assets')
        .getPublicUrl(filePath)

      // 3. Registrar en la base de datos como privada
      const { data: newPhoto, error: dbError } = await supabase
        .from('client_gallery')
        .insert([
          {
            client_id: user.id,
            image_url: publicUrl,
            title: `Mi sesión - ${new Date().toLocaleDateString()}`,
            description: 'Foto de seguimiento privado de mis tratamientos.',
            is_public: false,
            is_active: true,
            sensory_category: 'tendencia'
          }
        ])
        .select()

      if (dbError) throw dbError

      toast.success('¡Foto de seguimiento guardada!')
      loadPrivateImages()
    } catch (error) {
      console.error('Error al subir:', error)
      toast.error('Error al procesar la imagen')
    } finally {
      setUploading(false)
    }
  }

  const handleDeletePrivate = async (id: string) => {
    if (!confirm('¿Estás segura de que quieres eliminar esta foto de tu historial?')) return
    try {
      const { error } = await supabase
        .from('client_gallery')
        .delete()
        .eq('id', id)
        .eq('client_id', user?.id)

      if (error) throw error
      toast.success('Foto eliminada con éxito')
      setPrivateImages(prev => prev.filter(img => img.id !== id))
      if (slotA?.id === id) setSlotA(null)
      if (slotB?.id === id) setSlotB(null)
    } catch (error) {
      toast.error('No se pudo eliminar la foto')
    }
  }

  const handleAddToCompare = (img: GalleryImage) => {
    if (!slotA) {
      setSlotA(img)
      setCompareMode(true)
    } else if (!slotB && slotA.id !== img.id) {
      setSlotB(img)
      setCompareMode(true)
    } else {
      setSlotA(slotB)
      setSlotB(img)
    }
  }

  const toggleFavorite = (img: GalleryImage) => {
    const isAdding = !favorites.some(f => f.id === img.id)
    if (isAdding) {
      setActiveHeartId(img.id)
      setTimeout(() => setActiveHeartId(null), 400)
    }
    setFavorites(prev => 
      prev.some(f => f.id === img.id) ? prev.filter(f => f.id !== img.id) : [...prev, img]
    )
  }

  const categories = {
    mirada: allImages.filter(i => i.sensory_category === 'mirada' || !i.sensory_category),
    glow: allImages.filter(i => i.sensory_category === 'glow'),
    transformacion: allImages.filter(i => i.sensory_category === 'transformacion'),
    tendencia: allImages.filter(i => i.sensory_category === 'tendencia'),
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-[#070708] flex flex-col items-center justify-center gap-4 transition-colors duration-500">
        <div className="relative flex items-center justify-center">
          <Loader className="w-8 h-8 text-neutral-400 dark:text-neutral-500 animate-spin absolute" />
          <div className="w-12 h-12 rounded-full border border-neutral-200 dark:border-neutral-800 animate-ping" />
        </div>
        <span className="text-[10px] tracking-[0.5em] uppercase text-neutral-500 dark:text-neutral-400 font-light mt-2 animate-pulse">Cargando Lookbook</span>
      </div>
    )
  }

  return (
    <div className="bg-white text-neutral-800 dark:bg-[#070708] dark:text-neutral-200 min-h-screen pb-32 font-sans antialiased overflow-x-hidden selection:bg-neutral-200 dark:selection:bg-neutral-800 transition-colors duration-500">
      
      {/* DESTELLOS DE LUZ AMBIENTAL ADAPTATIVOS */}
      <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-rose-200/40 dark:bg-rose-950/10 rounded-full filter blur-[140px] pointer-events-none animate-pulse duration-[6s]" />
      <div className="absolute top-[30vh] right-0 w-[400px] h-[500px] bg-neutral-100 dark:bg-neutral-900/30 rounded-full filter blur-[120px] pointer-events-none" />

      {/* CABECERA ADAPTATIVA */}
      <header className="max-w-7xl mx-auto px-6 pt-24 pb-6 space-y-4 relative z-10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400/80 animate-spin duration-1000" />
          <span className="text-[10px] uppercase tracking-[0.4em] text-neutral-500 dark:text-neutral-400 font-medium">Estudio de Belleza Avanzado</span>
        </div>
        <h1 className="text-4xl md:text-7xl font-light font-serif tracking-tight text-neutral-900 dark:text-white lowercase transition-all duration-500 hover:tracking-normal">
          galería de <span className="italic text-neutral-400 dark:text-neutral-500 font-normal">resultados</span>
        </h1>
        
        {/* SELECTOR DE PESTAÑAS PREMIUM */}
        <div className="flex items-center gap-3 pt-6 border-b border-neutral-200 dark:border-neutral-900 max-w-md">
          <button 
            onClick={() => setActiveTab('public')}
            className={`pb-3 text-xs uppercase tracking-widest flex items-center gap-2 font-medium border-b-2 transition-all duration-300 ${activeTab === 'public' ? 'border-neutral-900 dark:border-white text-neutral-900 dark:text-white' : 'border-transparent text-neutral-400 hover:text-neutral-600'}`}
          >
            <Grid className="w-3.5 h-3.5" /> Explorar Looks
          </button>
          <button 
            onClick={() => setActiveTab('private')}
            className={`pb-3 text-xs uppercase tracking-widest flex items-center gap-2 font-medium border-b-2 transition-all duration-300 ${activeTab === 'private' ? 'border-neutral-900 dark:border-white text-neutral-900 dark:text-white' : 'border-transparent text-neutral-400 hover:text-neutral-600'}`}
          >
            <User className="w-3.5 h-3.5" /> Mis Fotos Privadas
          </button>
        </div>
      </header>

      {/* VISTA 1: CATÁLOGO PÚBLICO */}
      {activeTab === 'public' && (
        <main className="space-y-20 pl-6 md:pl-16 mt-12 relative z-10">
          {Object.entries(categories).map(([categoryName, images]) => {
            if (images.length === 0) return null
            return (
              <div key={categoryName} className="space-y-6 transition-all duration-300">
                
                {/* Título de Línea de Estética */}
                <div className="flex items-center justify-between pr-6 md:pr-16 border-b border-neutral-200 dark:border-neutral-900/60 pb-3 group">
                  <h2 className="text-sm font-light tracking-[0.25em] uppercase text-neutral-700 dark:text-neutral-300 flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 dark:bg-rose-400 inline-block opacity-70 group-hover:scale-150 transition-transform duration-300" />
                    {categoryName === 'mirada' ? (
                      <span className="flex items-center gap-2"><Eye className="w-3.5 h-3.5 text-neutral-400" /> Diseño de Mirada & Pestañas</span>
                    ) : categoryName === 'glow' ? (
                      <span className="flex items-center gap-2"><Sparkles className="w-3.5 h-3.5 text-neutral-400" /> Micropigmentación Avanzada</span>
                    ) : categoryName === 'transformacion' ? (
                      <span className="flex items-center gap-2"><Scissors className="w-3.5 h-3.5 text-neutral-400" /> Cambios de Estilo & Cabello</span>
                    ) : (
                      <span className="flex items-center gap-2"><Camera className="w-3.5 h-3.5 text-neutral-400" /> Tendencias de temporada</span>
                    )}
                  </h2>
                  <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono tracking-widest bg-neutral-100 dark:bg-neutral-900/40 px-2 py-0.5 rounded-md border border-neutral-200 dark:border-neutral-800/40">
                    {images.length} looks
                  </span>
                </div>

                {/* Slider Horizontal */}
                <div className="flex gap-6 overflow-x-auto pr-6 md:pr-16 pt-2 pb-6 scrollbar-none snap-x snap-mandatory scroll-smooth">
                  {images.map((img) => {
                    const isFav = favorites.some(f => f.id === img.id)
                    const isPulsing = activeHeartId === img.id
                    return (
                      <div key={img.id} className="w-[290px] md:w-[390px] shrink-0 snap-start space-y-4 group relative">
                        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[2.25rem] bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/80 dark:border-neutral-900 shadow-xl group-hover:shadow-2xl transition-all duration-500 group-hover:border-neutral-400 dark:group-hover:border-neutral-700/50">
                          
                          <img src={img.image_url} alt={img.title} className="w-full h-full object-cover grayscale-[10%] group-hover:grayscale-0 transition-all duration-700 ease-out group-hover:scale-[1.04]" loading="lazy" />
                          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/80 dark:to-black/90 opacity-90" />

                          {/* Botones Flotantes */}
                          <div className="absolute top-5 right-5 flex flex-col gap-2.5 opacity-90 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300">
                            <button 
                              onClick={() => toggleFavorite(img)}
                              className={`p-3 rounded-full backdrop-blur-xl border transition-all duration-300 shadow-lg hover:-translate-y-0.5 ${isFav ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/20 text-rose-500' : 'border-white/20 bg-black/20 text-white hover:bg-black/60'} ${isPulsing ? 'scale-125 ring-4 ring-rose-500/20' : ''}`}
                            >
                              <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500' : ''}`} />
                            </button>
                            <button 
                              onClick={() => handleAddToCompare(img)}
                              className={`p-3 rounded-full backdrop-blur-xl border transition-all duration-300 shadow-lg hover:-translate-y-0.5 ${slotA?.id === img.id || slotB?.id === img.id ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/20 text-amber-500 scale-105' : 'border-white/20 bg-black/20 text-white hover:bg-black/60'}`}
                            >
                              <Columns className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Info de tarjeta */}
                          <div className="absolute bottom-6 left-6 right-6 space-y-3">
                            <p className="text-[9px] font-mono tracking-widest text-neutral-300 uppercase">{img.client_name}</p>
                            <h3 className="font-serif text-2xl text-white font-light tracking-wide leading-none">{img.title}</h3>
                            <div className="pt-2.5 flex items-center justify-between border-t border-white/10">
                              <span className="text-xs font-mono font-medium tracking-wider text-rose-200">{img.price}</span>
                              <button 
                                onClick={() => setSelectedImage(img)}
                                className="text-[10px] uppercase tracking-widest text-neutral-200 flex items-center gap-1.5 hover:text-white transition-colors"
                              >
                                <span>Ver Acercamiento</span> <Maximize2 className="w-2.5 h-2.5 text-rose-400" />
                              </button>
                            </div>
                          </div>

                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </main>
      )}

      {/* VISTA 2: PANEL DE FOTOS PRIVADAS DE LA CLIENTA */}
      {activeTab === 'private' && (
        <main className="max-w-7xl mx-auto px-6 mt-12 relative z-10 space-y-10">
          
          {/* Tarjeta de Subida */}
          <div className="bg-neutral-50 dark:bg-[#0c0c0e] border border-neutral-200 dark:border-neutral-900 p-8 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
            <div className="space-y-1 text-center md:text-left">
              <h3 className="text-base font-serif font-light tracking-wide text-neutral-900 dark:text-white">Área de Seguimiento Personalizado</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-md leading-relaxed">
                Sube las fotografías de tus sesiones o de tu evolución en casa. Estas imágenes se almacenan en tu expediente privado y no son visibles públicamente.
              </p>
            </div>
            
            <label className={`w-full md:w-auto px-6 py-4 rounded-xl border border-dashed flex items-center justify-center gap-3 cursor-pointer transition-all duration-300 active:scale-98 ${uploading ? 'bg-neutral-100 border-neutral-300 cursor-wait' : 'bg-neutral-900 text-white dark:bg-white dark:text-black border-neutral-300 hover:border-rose-400 dark:hover:border-rose-500'}`}>
              {uploading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin text-neutral-500" />
                  <span className="text-xs uppercase tracking-wider font-semibold">Guardando en tu Perfil...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span className="text-xs uppercase tracking-wider font-semibold">Subir Foto de Evolución</span>
                </>
              )}
              <input type="file" accept="image/*" onChange={handleUploadPhoto} disabled={uploading} className="hidden" />
            </label>
          </div>

          {/* Rejilla de fotos de la clienta */}
          {!user ? (
            <div className="text-center py-20 border border-dashed border-neutral-200 dark:border-neutral-900 rounded-[2rem]">
              <User className="w-8 h-8 text-neutral-300 mx-auto mb-3" />
              <p className="text-sm text-neutral-500">Inicia sesión con tu cuenta premium para ver tu historial visual privado.</p>
            </div>
          ) : privateImages.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-neutral-200 dark:border-neutral-900 rounded-[2rem]">
              <Camera className="w-8 h-8 text-neutral-300 mx-auto mb-3" />
              <p className="text-sm text-neutral-500">Aún no has subido fotos de tu tratamiento actual. ¡Comienza hoy!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
              {privateImages.map((img) => (
                <div key={img.id} className="group relative aspect-[3/4] rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-900 bg-neutral-100 dark:bg-neutral-950">
                  <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Acciones Rápidas sobre fotos privadas */}
                  <div className="absolute top-3 right-3 flex gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all">
                    <button 
                      onClick={() => handleAddToCompare(img)}
                      className="p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/10"
                      title="Comparar evolución"
                    >
                      <Columns className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleDeletePrivate(img.id)}
                      className="p-2 rounded-full bg-rose-950/80 hover:bg-rose-900 text-rose-300 backdrop-blur-md border border-rose-900/40"
                      title="Eliminar registro"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-[10px] text-white font-mono truncate">{img.title}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      )}

      {/* ESTUDIO DE COMPARACIÓN EN PANTALLA DIVIDIDA */}
      {compareMode && (
        <div className="fixed inset-0 z-50 bg-neutral-50 dark:bg-[#050506] flex flex-col animate-in fade-in zoom-in-95 duration-300 transition-colors duration-500">
          
          <div className="p-4 md:p-6 border-b border-neutral-200 dark:border-neutral-900/80 flex items-center justify-between bg-white dark:bg-[#070708]">
            <div className="space-y-0.5">
              <h3 className="text-xs uppercase tracking-[0.2em] font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                <Scissors className="w-3 h-3 text-rose-500 dark:text-rose-400" /> Simulador de Resultados
              </h3>
              <p className="text-[10px] text-neutral-500 dark:text-neutral-400">Compara diseños de catálogo o evalúa tu propia evolución de tratamiento</p>
            </div>
            <button 
              onClick={() => setCompareMode(false)}
              className="p-3 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 rounded-full text-neutral-500 dark:text-neutral-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 grid grid-cols-2 bg-neutral-200 dark:bg-black h-full relative">
            
            {/* Panel A */}
            <div className="relative border-r border-neutral-300 dark:border-neutral-900/60 h-full bg-white dark:bg-neutral-950 flex items-center justify-center overflow-hidden">
              {slotA ? (
                <div className="w-full h-full animate-in slide-in-from-left duration-500">
                  <img src={slotA.image_url} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-90" />
                  <div className="absolute bottom-6 left-6 bg-black/40 backdrop-blur-xl p-4 rounded-2xl border border-white/5 max-w-[85%]">
                    <p className="text-[10px] font-mono uppercase text-rose-300 tracking-wider">Muestra Seleccionada</p>
                    <p className="text-sm font-medium text-white truncate mt-0.5">{slotA.title}</p>
                  </div>
                  <button onClick={() => setSlotA(null)} className="absolute top-4 left-4 p-2.5 bg-black/60 text-white rounded-full"><X className="w-3 h-3" /></button>
                </div>
              ) : (
                <div className="text-center p-6 space-y-3 animate-pulse">
                  <div className="w-8 h-8 rounded-full border border-dashed border-neutral-400 dark:border-neutral-700 flex items-center justify-center mx-auto text-neutral-400 dark:text-neutral-600 font-mono text-xs">A</div>
                  <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-medium">Primer Look Vacío</p>
                </div>
              )}
            </div>

            {/* Panel B */}
            <div className="relative h-full bg-white dark:bg-neutral-950 flex items-center justify-center overflow-hidden">
              {slotB ? (
                <div className="w-full h-full animate-in slide-in-from-right duration-500">
                  <img src={slotB.image_url} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-90" />
                  <div className="absolute bottom-6 left-6 bg-black/40 backdrop-blur-xl p-4 rounded-2xl border border-white/5 max-w-[85%]">
                    <p className="text-[10px] font-mono uppercase text-rose-300 tracking-wider">Muestra Seleccionada</p>
                    <p className="text-sm font-medium text-white truncate mt-0.5">{slotB.title}</p>
                  </div>
                  <button onClick={() => setSlotB(null)} className="absolute top-4 right-4 p-2.5 bg-black/60 text-white rounded-full"><X className="w-3 h-3" /></button>
                </div>
              ) : (
                <div className="text-center p-6 space-y-3 animate-pulse">
                  <div className="w-8 h-8 rounded-full border border-dashed border-neutral-400 dark:border-neutral-700 flex items-center justify-center mx-auto text-neutral-400 dark:text-neutral-600 font-mono text-xs">B</div>
                  <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-medium">Segundo Look Vacío</p>
                </div>
              )}
            </div>
          </div>

          <div className="p-5 bg-white dark:bg-[#070708] border-t border-neutral-200 dark:border-neutral-900/80 flex items-center justify-between">
            <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-light italic">¿Evaluaste tu look ideal?</span>
            <button 
              onClick={() => { setCompareMode(false); alert('Abriendo sistema de reserva...'); }}
              className="px-6 py-3.5 bg-neutral-900 text-white dark:bg-white dark:text-black font-semibold text-[10px] uppercase tracking-widest rounded-xl disabled:opacity-40"
              disabled={!slotA && !slotB}
            >
              Solicitar Asesoría con Estos Looks
            </button>
          </div>
        </div>
      )}

      {/* DISPARADOR FLOTANTE DE COMPARADOR */}
      {(slotA || slotB) && !compareMode && (
        <button 
          onClick={() => setCompareMode(true)}
          className="fixed bottom-6 right-6 z-40 bg-neutral-900 text-white dark:bg-white dark:text-black px-5 py-3.5 rounded-full flex items-center gap-2.5 shadow-2xl text-[11px] tracking-wider uppercase font-semibold border dark:border-neutral-200/20"
        >
          <div className="relative flex items-center justify-center w-2 h-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
          </div>
          Estudio de Estilo ({slotA ? 1 : 0}/{slotB ? 1 : 0})
        </button>
      )}

      {/* POPUP LIGHTBOX DE ACERCAMIENTO DINÁMICO */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/95 backdrop-blur-lg animate-in fade-in" onClick={() => setSelectedImage(null)}>
          <div className="bg-white dark:bg-[#0c0c0e] border border-neutral-200 dark:border-neutral-900 rounded-[2.5rem] max-w-lg w-full overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="aspect-square relative w-full bg-neutral-100 dark:bg-neutral-900 overflow-hidden">
              <img src={selectedImage.image_url} alt="" className="w-full h-full object-cover" />
              <button onClick={() => setSelectedImage(null)} className="absolute top-4 right-4 p-2.5 bg-black/60 text-white rounded-full"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-7 space-y-5">
              <div>
                <span className="text-[9px] text-rose-600 bg-rose-50 border border-rose-200 dark:text-rose-400 dark:bg-rose-950/40 dark:border-rose-900/50 px-2.5 py-1 rounded-full uppercase tracking-widest font-mono font-medium">
                  {selectedImage.sensory_category === 'mirada' ? 'Diseño Mirada' : selectedImage.sensory_category === 'glow' ? 'Micropigmentación' : selectedImage.sensory_category === 'transformacion' ? 'Estilismo' : 'Tendencia'}
                </span>
                <h4 className="text-2xl font-serif text-neutral-900 dark:text-white italic mt-3 font-light tracking-wide">{selectedImage.title}</h4>
                {selectedImage.description && <p className="text-xs text-neutral-600 dark:text-neutral-400 font-light mt-2.5 leading-relaxed bg-neutral-50 dark:bg-neutral-950 p-3 rounded-xl">{selectedImage.description}</p>}
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-neutral-200 dark:border-neutral-900">
                <div>
                  <p className="text-[9px] text-neutral-400 dark:text-neutral-500 uppercase tracking-wider font-mono">Inversión del Servicio</p>
                  <p className="text-xl font-mono text-neutral-900 dark:text-white font-medium mt-0.5">{selectedImage.price}</p>
                </div>
                <button onClick={() => { setSelectedImage(null); alert('Redireccionando...'); }} className="px-5 py-3 bg-neutral-900 text-white dark:bg-neutral-800 text-[10px] tracking-widest uppercase font-semibold rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-rose-400" /> Reservar este Servicio
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
