import { useState, useEffect, useRef } from "react";
import { 
  Plus, 
  Bell, 
  Trash2, 
  Loader2, 
  Image, 
  User, 
  Users, 
  X, 
  AlertTriangle, 
  ShieldAlert,
  Heart,
  Eye,
  ArrowLeft,
  ArrowRight
} from "lucide-react";
import { supabase } from "../services/supabase";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

interface GalleryImage {
  id: string;
  client_id: string | null;
  tenant_id: string;
  image_url: string;
  title: string;
  description: string;
  is_active: boolean;
  is_public: boolean;
  created_at: string;
  client_name?: string;
  likes?: number;
  views?: number;
  dominant_color?: string;
}

export default function CentroOperaciones() {
  // --- ESTADOS ORIGINALES DE TU COMPONENTE ---
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'public' | 'private'>('all');
  
  // Estados para el formulario de subida original
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [isPublicForm, setIsPublicForm] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // --- NUEVOS ESTADOS DE LA EXPERIENCIA CINEMATOGRÁFICA ---
  const containerRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoplayTimer = useRef<NodeJS.Timeout | null>(null);

  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [cursorType, setCursorType] = useState<'default' | 'view'>('default');
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>({});
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [isAutoplayActive, setIsAutoplayActive] = useState(false);
  const [likedImages, setLikedImages] = useState<Set<string>>(new Set());

  // --- LÓGICA DE CURSOR E INTERACTIVIDAD ---
  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      if (!cursorRef.current) return;
      cursorRef.current.style.transform = `translate3d(${e.clientX - 16}px, ${e.clientY - 16}px, 0)`;
      resetAutoplayTimer();
    };
    window.addEventListener('mousemove', moveCursor);
    return () => window.removeEventListener('mousemove', moveCursor);
  }, []);

  const resetAutoplayTimer = () => {
    setIsAutoplayActive(false);
    if (autoplayTimer.current) clearTimeout(autoplayTimer.current);
    autoplayTimer.current = setTimeout(() => {
      if (selectedIdx === null) setIsAutoplayActive(true);
    }, 5000);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAutoplayActive && images.length > 0) {
      interval = setInterval(() => {
        const container = containerRef.current;
        if (container) {
          container.scrollBy({ left: 200, behavior: 'smooth' });
          if (container.scrollLeft + container.clientWidth >= container.scrollWidth - 10) {
            container.scrollTo({ left: 0, behavior: 'smooth' });
          }
        }
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [isAutoplayActive, images]);

  // --- EFECTO ONDA EXPANSIVA (RIPPLE) ---
  const handleScreenClick = (e: React.MouseEvent) => {
    const newRipple = { id: Date.now(), x: e.clientX, y: e.clientY };
    setRipples(prev => [...prev, newRipple]);
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, 600);
  };

  // --- TECLADO PARA EL Lightbox ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedIdx === null) return;
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'Escape') setSelectedIdx(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIdx, images]);

  const handleNext = () => {
    if (selectedIdx !== null && images.length > 0) {
      setSelectedIdx((selectedIdx + 1) % images.length);
    }
  };

  const handlePrev = () => {
    if (selectedIdx !== null && images.length > 0) {
      setSelectedIdx((selectedIdx - 1 + images.length) % images.length);
    }
  };

  // --- PETICIONES Y MÉTODOS ORIGINALES DE SUPABASE ---
  const fetchGallery = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('client_gallery')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const adaptiveColors = ['#EAE3DB', '#D2C9BF', '#E8DCC4', '#C3B091', '#E3D7FF', '#D1E8E2'];
      const formatted = (data || []).map((img, i) => ({
        ...img,
        dominant_color: img.dominant_color || adaptiveColors[i % adaptiveColors.length],
        client_name: img.client_name || 'Atelier',
        likes: img.likes || 0,
        views: img.views || 0
      }));
      setImages(formatted);
    } catch (e: any) {
      toast.error("Error al cargar la galería: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGallery();
    resetAutoplayTimer();
    return () => { if (autoplayTimer.current) clearTimeout(autoplayTimer.current); };
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return toast.error("Selecciona una imagen primero");

    try {
      setUploading(true);
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `gallery/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('gallery-bucket')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('gallery-bucket')
        .getPublicUrl(filePath);

      const { error: insertError } = await supabase
        .from('client_gallery')
        .insert([{
          title: newTitle || "Sin título",
          description: newDescription,
          image_url: publicUrl,
          is_public: isPublicForm,
          is_active: true
        }]);

      if (insertError) throw insertError;

      toast.success("Arte añadido exitosamente");
      setNewTitle("");
      setNewDescription("");
      setSelectedFile(null);
      fetchGallery();
    } catch (error: any) {
      toast.error("Error al subir: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("¿Seguro que deseas eliminar esta imagen de la galería?")) return;

    try {
      const { error } = await supabase
        .from('client_gallery')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      toast.success("Imagen removida");
      if (selectedIdx !== null) setSelectedIdx(null);
      fetchGallery();
    } catch (error: any) {
      toast.error("No se pudo eliminar: " + error.message);
    }
  };

  const handleLike = async (e: React.MouseEvent, id: string, index: number) => {
    e.stopPropagation();
    const nextLikes = new Set(likedImages);
    let updatedLikes = images[index].likes || 0;

    if (nextLikes.has(id)) {
      nextLikes.delete(id);
      updatedLikes = Math.max(0, updatedLikes - 1);
    } else {
      nextLikes.add(id);
      updatedLikes += 1;
    }
    setLikedImages(nextLikes);
    
    const updatedImages = [...images];
    updatedImages[index].likes = updatedLikes;
    setImages(updatedImages);

    await supabase.from('client_gallery').update({ likes: updatedLikes }).eq('id', id);
  };

  // Filtrado de pestañas original
  const filteredImages = images.filter(img => {
    if (activeTab === 'public') return img.is_public;
    if (activeTab === 'private') return !img.is_public;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] dark:bg-neutral-950 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-6 h-6 text-neutral-800 dark:text-neutral-200 animate-spin stroke-[1]" />
        <p className="text-[10px] tracking-[0.25em] uppercase text-neutral-400 font-mono">Cargando Centro de Control...</p>
      </div>
    )
  }

  return (
    <div 
      onClick={handleScreenClick}
      className="min-h-screen bg-[#FAF9F5] dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 transition-colors duration-700 relative overflow-x-hidden select-none cursor-none"
    >
      {/* 7. CURSOR PERSONALIZADO EDITORIAL */}
      <div 
        ref={cursorRef}
        className={`fixed top-0 left-0 w-8 h-8 rounded-full pointer-events-none z-50 transition-all duration-300 border border-neutral-900/40 dark:border-white/40 flex items-center justify-center bg-white/10 backdrop-blur-xs mix-blend-difference ${
          cursorType === 'view' ? 'scale-[2.2] bg-neutral-900/20' : 'scale-100'
        }`}
      >
        {cursorType === 'view' && <span className="text-[5px] tracking-widest text-white uppercase font-bold">Ver</span>}
      </div>

      {/* ONDAS EXPANSIVAS (RIPPLES) */}
      {ripples.map(r => (
        <span 
          key={r.id} 
          style={{ left: r.x, top: r.y }} 
          className="fixed w-3 h-3 bg-neutral-900/10 dark:bg-white/10 rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2 animate-[ping_0.6s_cubic-bezier(0.1,0.8,0.3,1)_1] z-50"
        />
      ))}

      {/* PANEL DE CONTROL SUPERIOR (Tus inputs y formulario intactos, estilizados estéticamente) */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 pt-20 pb-10 border-b border-neutral-200/50 dark:border-neutral-800/50 relative z-10">
        <div className="flex flex-col lg:flex-row gap-12 justify-between items-start">
          
          <div className="space-y-4 max-w-md">
            <div className="flex items-center gap-2 text-[10px] tracking-widest uppercase font-mono text-neutral-400">
              <ShieldAlert className="w-3.5 h-3.5" /> Módulo de Administración
            </div>
            <h1 className="text-3xl md:text-5xl font-light font-serif tracking-tight">Centro de Operaciones</h1>
            <p className="text-xs text-neutral-400 leading-relaxed font-light">
              Sube nuevas capturas, gestiona su privacidad pública/privada y audita la interacción de tus clientes en tiempo real.
            </p>
            
            {/* SELECTOR DE PESTAÑAS ORIGINAL */}
            <div className="flex p-1 bg-neutral-200/50 dark:bg-neutral-900/50 rounded-xl max-w-xs border border-neutral-300/20">
              {(['all', 'public', 'private'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-1.5 text-[10px] font-mono uppercase rounded-lg transition-all ${
                    activeTab === tab 
                      ? 'bg-white dark:bg-neutral-800 shadow-xs font-bold text-neutral-900 dark:text-white' 
                      : 'text-neutral-400 hover:text-neutral-600'
                  }`}
                >
                  {tab === 'all' ? 'Todos' : tab === 'public' ? 'Públicos' : 'Privados'}
                </button>
              ))}
            </div>
          </div>

          {/* FORMULARIO ORIGINAL DE SUBIDA */}
          <form onSubmit={handleUpload} className="w-full lg:max-w-md bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60 shadow-xs space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <input 
                type="text" 
                placeholder="Título del Arte"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-neutral-400"
              />
              <div className="flex items-center justify-around bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl px-2">
                <span className="text-[10px] uppercase font-mono text-neutral-400">¿Público?</span>
                <input 
                  type="checkbox" 
                  checked={isPublicForm}
                  onChange={(e) => setIsPublicForm(e.target.checked)}
                  className="rounded border-neutral-300 text-neutral-800 focus:ring-neutral-500 w-3.5 h-3.5"
                />
              </div>
            </div>

            <textarea 
              placeholder="Descripción corta o etiquetas de diseño..."
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              rows={2}
              className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-neutral-400 resize-none"
            />

            <div className="flex items-center gap-3">
              <input 
                type="file" 
                accept="image/*"
                ref={fileInputRef}
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-2 px-3 border border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl text-[10px] uppercase font-mono text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-950 transition-colors flex items-center justify-center gap-2"
              >
                <Image className="w-3.5 h-3.5" />
                {selectedFile ? selectedFile.name.substring(0, 15) + '...' : 'Elegir Imagen'}
              </button>

              <button
                type="submit"
                disabled={uploading}
                className="py-2 px-4 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-xl text-[10px] uppercase tracking-widest font-bold font-mono hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                Publicar
              </button>
            </div>
          </form>

        </div>
      </div>

      {/* 1. INTERFAZ DE MOSAICO "SIN CUADRÍCULA" (Con los datos filtrados originales) */}
      <main 
        ref={containerRef}
        className="max-w-7xl mx-auto px-6 md:px-12 pt-16 pb-32 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-x-8 gap-y-20 items-start"
      >
        {filteredImages.map((img, idx) => {
          const isHovered = hoveredId === img.id;
          const isLoaded = loadedImages.has(img.id);

          // Alternancia asimétrica de rejilla para romper la rigidez (Regla 1)
          const gridClasses = [
            'md:col-span-4 mt-0',
            'md:col-span-5 md:mt-12',
            'md:col-span-3 mt-0',
            'md:col-span-6 md:mt-[-2rem]',
            'md:col-span-3 mt-4',
            'md:col-span-3 md:mt-16'
          ][idx % 6];

          // Ligeras rotaciones orgánicas "efecto mesa"
          const customRotation = [
            'hover:rotate-0 rotate-1',
            'hover:rotate-0 -rotate-1',
            'hover:rotate-0 rotate-2',
            'hover:rotate-0 -rotate-2',
            'hover:rotate-0 rotate-0'
          ][idx % 5];

          return (
            <motion.div
              key={img.id}
              className={`${gridClasses} relative group`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, delay: (idx % 3) * 0.08, ease: [0.16, 1, 0.3, 1] }} // 2. Carga en cascada
              onMouseEnter={() => { setHoveredId(img.id); setCursorType('view'); }}
              onMouseLeave={() => { setHoveredId(null); setCursorType('default'); }}
              onClick={() => setSelectedIdx(idx)}
            >
              {/* Contenedor de la Imagen */}
              <div className={`relative w-full overflow-hidden rounded-2xl shadow-xs transition-transform duration-700 ease-[0.16,1,0.3,1] bg-neutral-100 dark:bg-neutral-900 ${customRotation}`}>
                
                {/* 6. LAZY LOAD CON GRADIENTE / COLOR DOMINANTE */}
                <div 
                  style={{ backgroundColor: img.dominant_color }}
                  className={`w-full aspect-[4/5] transition-opacity duration-700 ${isLoaded ? 'opacity-0 absolute inset-0' : 'opacity-100 animate-pulse'}`}
                />

                {/* 2. Micro-interacción: Zoom lento y cambio de brillo */}
                <img 
                  src={img.image_url} 
                  alt={img.title}
                  onLoad={() => setLoadedImages(prev => new Set([...prev, img.id]))}
                  className={`w-full aspect-[4/5] object-cover transition-all duration-[1.2s] cubic-bezier(0.16, 1, 0.3, 1) ${
                    isHovered ? 'scale-106 brightness-90' : 'scale-100'
                  } ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                />

                {/* BOTÓN DE ELIMINAR ORIGINAL (Intacto y accesible) */}
                <button
                  onClick={(e) => handleDelete(img.id, e)}
                  className="absolute top-3 right-3 p-2 rounded-xl bg-white/90 dark:bg-neutral-900/90 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-xs border border-neutral-200/20 z-10"
                  title="Eliminar de la galería"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                {/* INDICADOR DE PRIVACIDAD ORIGINAL */}
                <div className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-black/40 backdrop-blur-xs text-[8px] font-mono text-white/80 uppercase tracking-widest">
                  {img.is_public ? 'Público' : 'Privado'}
                </div>

                {/* 5. EFECTO POLAROID INTERACTIVO (Likes) */}
                <button 
                  onClick={(e) => handleLike(e, img.id, idx)}
                  className={`absolute bottom-4 right-4 p-2.5 rounded-full bg-white/95 dark:bg-neutral-900/95 shadow-md text-neutral-900 dark:text-white transition-all duration-500 transform ${
                    isHovered ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-4 opacity-0 scale-75'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${likedImages.has(img.id) ? 'fill-red-500 text-red-500' : ''}`} />
                </button>
              </div>

              {/* 5. INFORMACIÓN FLOTANTE CON SUBRAYADO PROGRESIVO */}
              <div className="mt-4 space-y-1 px-1">
                <h3 className="font-serif text-lg tracking-wide text-neutral-800 dark:text-neutral-100 relative inline-block">
                  {img.title}
                  <span className={`absolute bottom-0 left-0 h-[1px] bg-neutral-900 dark:bg-white transition-all duration-500 ${isHovered ? 'w-full' : 'w-0'}`} />
                </h3>
                <div className="flex items-center justify-between text-[10px] tracking-wider text-neutral-400 uppercase font-mono">
                  <span>{img.client_name}</span>
                  <span className="flex items-center gap-1"><Eye className="w-2.5 h-2.5" /> {img.views}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </main>

      {/* 3. TRANSICIONES DE CINE / LIGHTBOX EXPANDIDO */}
      <AnimatePresence>
        {selectedIdx !== null && (
          <motion.div 
            className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-xl flex items-center justify-center p-4 md:p-12 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            onClick={() => setSelectedIdx(null)}
            onMouseEnter={() => setCursorType('default')}
          >
            <button 
              onClick={() => setSelectedIdx(null)}
              className="absolute top-6 right-6 p-3 text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-all border border-white/10 z-50"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-full max-w-5xl h-full flex items-center justify-center relative">
              
              {/* 4. NAVEGACIÓN INVISIBLE LATERAL */}
              <div 
                className="absolute left-0 inset-y-0 w-1/5 z-30 cursor-none flex items-center justify-start p-4 group/nav"
                onClick={(e) => { e.stopPropagation(); handlePrev(); }}
              >
                <div className="p-3 bg-white/5 border border-white/10 rounded-full text-white/40 group-hover/nav:text-white group-hover/nav:bg-white/10 transition-all opacity-0 group-hover/nav:opacity-100">
                  <ArrowLeft className="w-4 h-4" />
                </div>
              </div>

              <div 
                className="absolute right-0 inset-y-0 w-1/5 z-30 cursor-none flex items-center justify-end p-4 group/nav"
                onClick={(e) => { e.stopPropagation(); handleNext(); }}
              >
                <div className="p-3 bg-white/5 border border-white/10 rounded-full text-white/40 group-hover/nav:text-white group-hover/nav:bg-white/10 transition-all opacity-0 group-hover/nav:opacity-100">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>

              {/* Contenedor de la vista de cine */}
              <motion.div 
                key={selectedIdx}
                className="bg-neutral-900 text-white rounded-3xl overflow-hidden max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 shadow-2xl border border-white/10 relative z-20 h-auto md:max-h-[85vh]"
                initial={{ scale: 0.94, y: 15, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.94, y: 15, opacity: 0 }}
                transition={{ type: 'spring', damping: 26, stiffness: 190 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="relative aspect-square md:aspect-auto md:h-full bg-neutral-950 flex items-center">
                  <img 
                    src={filteredImages[selectedIdx].image_url} 
                    alt={filteredImages[selectedIdx].title} 
                    className="w-full h-full object-cover"
                  />
                  
                  {/* 4. CONTADOR MINIMALISTA */}
                  <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-lg text-[9px] font-mono tracking-widest text-white/90 uppercase border border-white/10">
                    {String(selectedIdx + 1).padStart(2, '0')} / {String(filteredImages.length).padStart(2, '0')}
                  </div>
                </div>

                {/* Detalle y Métricas de Administración */}
                <div className="p-8 sm:p-12 flex flex-col justify-between bg-neutral-900 space-y-6 overflow-y-auto">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] tracking-[0.25em] font-bold text-neutral-500 uppercase">Inspección de Arte</span>
                      <button 
                        onClick={(e) => handleDelete(filteredImages[selectedIdx].id, e)}
                        className="text-red-400 hover:text-red-300 flex items-center gap-1.5 text-[10px] uppercase font-mono tracking-wider bg-red-500/10 px-2 py-1 rounded-md transition-colors"
                      >
                        <Trash2 className="w-3 h-3" /> Borrar Item
                      </button>
                    </div>
                    <h2 className="font-serif text-3xl font-light tracking-wide">{filteredImages[selectedIdx].title}</h2>
                    {filteredImages[selectedIdx].description && (
                      <p className="text-xs font-light leading-relaxed text-neutral-400 bg-black/20 p-4 rounded-xl border border-white/5">
                        {filteredImages[selectedIdx].description}
                      </p>
                    )}
                  </div>

                  <div className="pt-6 border-t border-white/10 flex items-center justify-between gap-4">
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase font-bold text-neutral-500 tracking-wider">Visibilidad</span>
                      <span className="text-xs font-mono text-neutral-300">
                        {filteredImages[selectedIdx].is_public ? '🌍 Galería Pública' : '🔒 Solo Clientes'}
                      </span>
                    </div>
                    <button 
                      onClick={(e) => handleLike(e, filteredImages[selectedIdx].id, selectedIdx)}
                      className="px-4 py-2.5 bg-white text-neutral-900 rounded-xl text-[10px] uppercase tracking-widest font-bold hover:bg-neutral-200 transition-colors flex items-center gap-2"
                    >
                      <Heart className={`w-3.5 h-3.5 ${likedImages.has(filteredImages[selectedIdx].id) ? 'fill-current text-red-500' : ''}`} /> 
                      Votos ({filteredImages[selectedIdx].likes})
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
