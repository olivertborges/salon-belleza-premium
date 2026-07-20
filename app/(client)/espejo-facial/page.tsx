'use client';
import React, { useRef, useEffect, useState } from 'react';
// Nota: Las librerías de MediaPipe se cargan dinámicamente en el cliente para no romper el SSR de Next.js
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

interface FaceSimulatorProps {
  volumeType: '2D' | '3D' | '4D' | 'none';
  pigmentationColor: string; // Hexadecimal enviado desde el panel de control UI (ej: #D4AF37)
  isPremiumUser: boolean;
}

export const FaceSimulator: React.FC<FaceSimulatorProps> = ({
  volumeType,
  pigmentationColor,
  isPremiumUser
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [landmarker, setLandmarker] = useState<FaceLandmarker | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Inicializar MediaPipe Face Landmarker en el Cliente
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
        outputFaceBlendshapes: true,
        runningMode: "VIDEO",
        numFaces: 1
      });
      setLandmarker(faceLandmarker);
      setIsLoading(false);
    }
    initExtension();
  }, []);

  // 2. Activar la Cámara Frontal con especificaciones optimizadas para móvil
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

  // 3. Bucle de Renderizado y Detección en Tiempo Real
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
          // Si el volumen es 3D o 4D y no es usuaria premium, bloqueamos el renderizado específico
          const canRenderAdvanced = isPremiumUser || (volumeType !== '3D' && volumeType !== '4D');

          // MÓDULO MICROPIGMENTACIÓN DE LABIOS (Índices fijos MediaPipe)
          // Contorno exterior del labio: Índices del 61 al 91 aproximados de la malla
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
            ctx.globalAlpha = 0.45; // Opacidad sutil para simular tinta real bajo la piel
            ctx.globalCompositeOperation = 'multiply'; // Fusión para respetar sombras naturales del labio
            ctx.fill();
            ctx.restore();
          }

          // MÓDULO PESTAÑAS (Simulación matemática básica en Canvas)
          if (volumeType !== 'none' && canRenderAdvanced) {
            // Índices del párpado superior izquierdo (ejemplo ilustrativo del flujo)
            const leftEyeTop = [33, 246, 161, 160, 159, 158, 157, 173, 133];
            
            ctx.save();
            ctx.strokeStyle = '#111111';
            ctx.lineWidth = volumeType === '2D' ? 2 : volumeType === '3D' ? 3.5 : 5; // Escalado por tipo de volumen
            ctx.lineCap = 'round';

            ctx.beginPath();
            leftEyeTop.forEach((index, i) => {
              const point = landmarks[index];
              const x = point.x * canvas.width;
              const y = point.y * canvas.height;
              
              if (i === 0) ctx.moveTo(x, y);
              else {
                ctx.lineTo(x, y);
                // Dibujar filamentos vectoriales simulando la densidad de las pestañas hacia arriba
                ctx.moveTo(x, y);
                const lashLength = volumeType === '4D' ? 14 : 10;
                ctx.lineTo(x, y - lashLength); // Proyección vertical base
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
            INICIALIZANDO ESPEJO VIRTUAL FRESH NAILS...
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
