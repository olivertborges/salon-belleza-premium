'use client';
import React, { useRef, useEffect, useState } from 'react';
// Nota: Las librerías de MediaPipe se cargan dinámicamente en el cliente para no romper el SSR de Next.js
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

interface FaceSimulatorProps {
  volumeType: '2D' | '3D' | '4D' | 'none';
  pigmentationColor: string; // Hexadecimal enviado desde el panel de control UI (ej: #D4AF37)
  isPremiumUser: boolean;
}

// 1. Cambiamos la exportación nombrada a una constante interna
const FaceSimulator: React.FC<FaceSimulatorProps> = ({
  volumeType,
  pigmentationColor,
  isPremiumUser
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [landmarker, setLandmarker] = useState<FaceLandmarker | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Inicializar MediaPipe Face Landmarker en el Cliente
  useEffect(() => {
    async function initExtension() {
      const filesetResolver = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );
      const faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numFaces: 1
      });
      setLandmarker(faceLandmarker);
      setIsLoading(false);
    }
    initExtension();
  }, []);

  // Activar la Cámara Frontal con especificaciones optimizadas para móvil
  useEffect(() => {
    if (!videoRef.current) return;

    navigator.mediaDevices.getUserMedia({
      video: { 
        facingMode: "user",
        width: { ideal: 640 },
        height: { ideal: 480 }
      },
      audio: false
    }).then((stream) => {
      if (videoRef.current) videoRef.current.srcObject = stream;
    }).catch(err => console.error("Error accediendo a la cámara en Fresh Nails:", err));
  }, [isLoading]);

  // Bucle de Renderizado y Detección en Tiempo Real
  useEffect(() => {
    let animationFrameId: number;
    if (!landmarker || !videoRef.current || !canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const renderLoop = () => {
      if (videoRef.current && videoRef.current.readyState >= 3) {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        // Ajustar dimensiones del Canvas al contenedor exacto
        if (canvas.width !== video.videoWidth) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }

        // Limpiar lienzo anterior
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Detectar puntos faciales
        const startTimeMs = performance.now();
        const results = landmarker.detectForVideo(video, startTimeMs);

        if (results.faceLandmarks && results.faceLandmarks.length > 0) {
          const landmarks = results.faceLandmarks[0];

          // --- CONTROL CAPA PREMIUM ---
          const canRenderAdvanced = isPremiumUser || (volumeType !== '3D' && volumeType !== '4D');

          // MÓDULO MICROPIGMENTACIÓN DE LABIOS
          if (pigmentationColor !== 'none') {
            const lipIndices = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 308, 415, 310, 311, 312, 13, 82, 81, 80, 191];
            ctx.save();
            ctx.beginPath();
            lipIndices.forEach((index, i) => {
              const point = landmarks[index];
              const x = point.x * canvas.width;
              const y = point.y * canvas.height;
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            });
            ctx.closePath();
            ctx.fillStyle = pigmentationColor;
            ctx.globalAlpha = 0.45; 
            ctx.globalCompositeOperation = 'multiply'; 
            ctx.fill();
            ctx.restore();
          }

          // MÓDULO PESTAÑAS
          if (volumeType !== 'none' && canRenderAdvanced) {
            const leftEyeTop = [33, 246, 161, 160, 159, 158, 157, 173, 133];

            ctx.save();
            ctx.strokeStyle = '#111111';
            ctx.lineWidth = volumeType === '2D' ? 2 : volumeType === '3D' ? 3.5 : 5; 
            ctx.lineCap = 'round';

            ctx.beginPath();
            leftEyeTop.forEach((index, i) => {
              const point = landmarks[index];
              const x = point.x * canvas.width;
              const y = point.y * canvas.height;

              if (i === 0) ctx.moveTo(x, y);
              else {
                ctx.lineTo(x, y);
                ctx.moveTo(x, y);
                const lashLength = volumeType === '4D' ? 14 : 10;
                ctx.lineTo(x, y - lashLength); 
                ctx.moveTo(x, y);
              }
            });
            ctx.stroke();
            ctx.restore();
          }
        }
      }
      animationFrameId = requestAnimationFrame(renderLoop);
    };

    renderLoop();
    return () => cancelAnimationFrame(animationFrameId);
  }, [landmarker, volumeType, pigmentationColor, isPremiumUser]);

  return (
    <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-white/10 bg-neutral-950">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-10">
          <span className="text-sm font-light text-neutral-400 tracking-widest animate-pulse">
            INICIALIZANDO ESPEJO VIRTUAL...
          </span>
        </div>
      )}
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        muted 
        className="absolute inset-0 w-full h-full object-cover transform -scale-x-100"
      />
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full object-cover transform -scale-x-100 pointer-events-none"
      />
    </div>
  );
};

// 2. CREAMOS Y EXPORTAMOS POR DEFECTO LA COMPONENTE PÁGINA QUE NEXT.JS NECESITA
export default function EspejoFacialPage() {
  // Aquí puedes conectar controles de UI reales más adelante para cambiar estos estados
  const [volume, setVolume] = useState<'2D' | '3D' | '4D' | 'none'>('2D');
  const [color, setColor] = useState<string>('#E65C7B'); // Color de labios inicial de prueba
  const [premium, setPremium] = useState<boolean>(true);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-neutral-900 text-white">
      <div className="w-full max-w-3xl space-y-4">
        <h1 className="text-2xl font-bold tracking-tight text-center">Espejo Facial Inteligente</h1>
        
        {/* Inyección de tu simulador */}
        <FaceSimulator 
          volumeType={volume} 
          pigmentationColor={color} 
          isPremiumUser={premium} 
        />
        
        {/* Panel de control básico de pruebas rápidas */}
        <div className="grid grid-cols-3 gap-2 bg-neutral-950 p-4 rounded-xl border border-white/5 text-xs">
          <div>
            <p className="mb-1 text-neutral-400">Volumen Pestañas</p>
            <select 
              value={volume} 
              onChange={(e) => setVolume(e.target.value as any)}
              className="bg-neutral-800 p-1.5 rounded w-full border border-neutral-700"
            >
              <option value="none">Ninguno</option>
              <option value="2D">2D</option>
              <option value="3D">3D (Premium)</option>
              <option value="4D">4D (Premium)</option>
            </select>
          </div>
          <div>
            <p className="mb-1 text-neutral-400">Tono Labios</p>
            <select 
              value={color} 
              onChange={(e) => setColor(e.target.value)}
              className="bg-neutral-800 p-1.5 rounded w-full border border-neutral-700"
            >
              <option value="none">Sin color</option>
              <option value="#E65C7B">Rosa Fresh</option>
              <option value="#D4AF37">Dorado Glam (Prueba)</option>
              <option value="#800020">Borgonia Profundo</option>
            </select>
          </div>
          <div>
            <p className="mb-1 text-neutral-400">Suscripción</p>
            <button 
              onClick={() => setPremium(!premium)}
              className={`p-1.5 rounded w-full border font-bold ${premium ? 'bg-emerald-950 border-emerald-500 text-emerald-300' : 'bg-neutral-800 border-neutral-700 text-neutral-400'}`}
            >
              {premium ? 'PREMIUM ACTIVO' : 'FREE USER'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
