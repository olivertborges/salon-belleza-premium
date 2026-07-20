'use client';
import React, { useRef, useEffect, useState } from 'react';
// Nota: Las librerías de MediaPipe se cargan dinámicamente en el cliente para no romper el SSR de Next.js
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

interface FaceSimulatorProps {
  volumeType: '2D' | '3D' | '4D' | 'none';
  pigmentationColor: string; // Hexadecimal enviado desde el panel de control UI (ej: #D4AF37)
  isPremiumUser: boolean;
}

// Componente del simulador de video + canvas
const FaceSimulator: React.FC<FaceSimulatorProps> = ({
  volumeType,
  pigmentationColor,
  isPremiumUser
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [landmarker, setLandmarker] = useState<FaceLandmarker | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Inicializar MediaPipe Face Landmarker en el Cliente apuntando a CDN estable
  useEffect(() => {
    async function initExtension() {
      try {
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
      } catch (error) {
        console.error("Error inicializando MediaPipe en Fresh Nails:", error);
      }
    }
    initExtension();
  }, []);

  // 2. Activar la Cámara Frontal optimizada para web apps móviles
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
    }).catch(err => console.error("Error accediendo a la cámara frontal:", err));
  }, [isLoading]);

  // 3. Bucle de Renderizado y Cómputo Anatómico en Tiempo Real
  useEffect(() => {
    let animationFrameId: number;
    if (!landmarker || !videoRef.current || !canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const renderLoop = () => {
      if (videoRef.current && videoRef.current.readyState >= 3) {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        // Ajustar resolución interna al tamaño real del flujo de video
        if (canvas.width !== video.videoWidth) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }

        // Limpiar lienzo previo
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Capturar landmarks faciales
        const startTimeMs = performance.now();
        const results = landmarker.detectForVideo(video, startTimeMs);

        if (results.faceLandmarks && results.faceLandmarks.length > 0) {
          const landmarks = results.faceLandmarks[0];
          const canRenderAdvanced = isPremiumUser || (volumeType !== '3D' && volumeType !== '4D');

          // ============================================================
          // MÓDULO MICROPIGMENTACIÓN DE LABIOS PROFESIONAL (Volumen Radial)
          // ============================================================
          if (pigmentationColor !== 'none') {
            const lipIndices = [
              61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 
              308, 415, 310, 311, 312, 13, 82, 81, 80, 191, 95
            ];

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

            // Centro anatómico del labio superior para proyectar luces y sombras tridimensionales
            const centerUpperLip = landmarks[0];
            const centerX = centerUpperLip.x * canvas.width;
            const centerY = centerUpperLip.y * canvas.height;
            
            const gradient = ctx.createRadialGradient(
              centerX, centerY, canvas.width * 0.01, 
              centerX, centerY, canvas.width * 0.16
            );
            gradient.addColorStop(0, pigmentationColor);
            gradient.addColorStop(1, '#110005'); // Oscurecimiento perimetral sutil

            ctx.fillStyle = gradient;
            ctx.globalAlpha = 0.38; // Opacidad fluida translúcida
            ctx.globalCompositeOperation = 'multiply'; // Respeta arrugas y poros de los labios reales
            ctx.fill();
            ctx.restore();
          }

          // ============================================================
          // MÓDULO PESTAÑAS ULTRA-REALISTAS (Curvas Bézier & Degradado)
          // ============================================================
          if (volumeType !== 'none' && canRenderAdvanced) {
            const leftEyeTop = [133, 173, 157, 158, 159, 160, 161, 246, 33];
            const rightEyeTop = [362, 398, 384, 385, 386, 387, 388, 466, 263];

            const drawProfessionalLashes = (eyeIndices: number[], isRightEye: boolean) => {
              ctx.save();
              
              // Ajustes físicos según el tipo de volumen seleccionado
              const baseLineWidth = volumeType === '2D' ? 1.4 : volumeType === '3D' ? 2.1 : 3.0;
              const lashLength = volumeType === '4D' ? 15 : volumeType === '3D' ? 11 : 7.5;
              
              const innerCorner = landmarks[eyeIndices[0]];
              const outerCorner = landmarks[eyeIndices[eyeIndices.length - 1]];
              const eyeCenterX = (innerCorner.x + outerCorner.x) / 2 * canvas.width;

              eyeIndices.forEach((index, i) => {
                // Previene que aparezcan pestañas anormales en la zona lagrimal extrema
                if (i < 1 || i > eyeIndices.length - 2) return;

                const point = landmarks[index];
                const x = point.x * canvas.width;
                const y = point.y * canvas.height;

                // Densidad de filamentos para simular volumen híbrido/ruso
                const lashCount = volumeType === '4D' ? 3 : volumeType === '3D' ? 2 : 1;

                for (let j = 0; j < lashCount; j++) {
                  // Variación controlada para romper simetrías mecánicas de apariencia artificial
                  const jitterX = (Math.random() - 0.5) * 2.5;
                  const lashScale = 0.85 + Math.random() * 0.35;
                  const currentLength = lashLength * lashScale;

                  // Las pestañas se abren armónicamente hacia afuera de la línea central del ojo
                  const distanceFromCenter = x - eyeCenterX;
                  const spreadFactor = distanceFromCenter * 0.14 + (isRightEye ? 4.5 : -4.5); 

                  const startX = x + (j * 0.4);
                  const startY = y;
                  
                  // cp1: Caída corta del folículo piloso
                  const cp1x = startX + spreadFactor * 0.18;
                  const cp1y = startY + 1.8;

                  // cp2: Curvatura hacia arriba del filamento
                  const cp2x = startX + spreadFactor * 0.65;
                  const cp2y = startY - currentLength * 0.55;

                  // Punta fina
                  const endX = startX + spreadFactor + jitterX;
                  const endY = startY - currentLength;

                  // Difuminado de la punta para emular el grosor decreciente del cabello real
                  const lashGrad = ctx.createLinearGradient(startX, startY, endX, endY);
                  lashGrad.addColorStop(0, '#0d0d0d');
                  lashGrad.addColorStop(0.75, '#1c1c1c');
                  lashGrad.addColorStop(1, 'rgba(28, 28, 28, 0.15)');

                  ctx.beginPath();
                  ctx.moveTo(startX, startY);
                  ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);

                  ctx.strokeStyle = lashGrad;
                  ctx.lineWidth = baseLineWidth * (1 - (j * 0.18));
                  ctx.lineCap = 'round';
                  ctx.stroke();
                }
              });
              ctx.restore();
            };

            // Dibujar pestañas anatómicamente simétricas basadas en coordenadas
            drawProfessionalLashes(leftEyeTop, false);
            drawProfessionalLashes(rightEyeTop, true);
          }
        }
      }
      animationFrameId = requestAnimationFrame(renderLoop);
    };

    renderLoop();
    return () => cancelAnimationFrame(animationFrameId);
  }, [landmarker, volumeType, pigmentationColor, isPremiumUser]);

  return (
    <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-white/5 bg-neutral-950 shadow-2xl">
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-950/90 backdrop-blur-md z-20 space-y-3">
          <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-medium text-neutral-400 tracking-widest animate-pulse uppercase">
            Cargando Motores de Estilo IA...
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

// ============================================================
// EXPORTACIÓN DEFAULT EXIGIDA POR NEXT.JS APP ROUTER
// ============================================================
export default function EspejoFacialPage() {
  const [volume, setVolume] = useState<'2D' | '3D' | '4D' | 'none'>('3D');
  const [color, setColor] = useState<string>('#E65C7B'); 
  const [premium, setPremium] = useState<boolean>(true);

  return (
    <main className="flex min-h-[calc(100vh-5rem)] flex-col items-center justify-center p-2 md:p-6 bg-transparent text-white">
      <div className="w-full max-w-3xl space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight bg-gradient-to-r from-neutral-100 via-stone-200 to-neutral-400 bg-clip-text text-transparent">
            Espejo Virtual de Estilo Pro
          </h1>
          <p className="text-xs text-neutral-400 font-light max-w-md mx-auto">
            Visualiza servicios de micropigmentación de labios y extensiones de pestañas con precisión milimétrica sobre tu rostro.
          </p>
        </div>
        
        {/* Simulador Completo */}
        <FaceSimulator 
          volumeType={volume} 
          pigmentationColor={color} 
          isPremiumUser={premium} 
        />
        
        {/* Panel Interactivo de Pruebas Continuas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-neutral-950/50 p-4 rounded-2xl border border-white/5 backdrop-blur-xl text-xs shadow-xl">
          <div className="flex flex-col space-y-1.5">
            <label className="text-neutral-400 font-medium">Volumen Pestañas</label>
            <select 
              value={volume} 
              onChange={(e) => setVolume(e.target.value as any)}
              className="bg-neutral-900 p-2.5 rounded-xl border border-neutral-800 focus:border-pink-500/50 focus:outline-none transition-colors text-stone-200 cursor-pointer font-medium"
            >
              <option value="none">Ninguno (Línea Natural)</option>
              <option value="2D">Efecto Rímel 2D</option>
              <option value="3D">Volumen Tecnológico 3D</option>
              <option value="4D">Mega Volumen Glamour 4D</option>
            </select>
          </div>

          <div className="flex flex-col space-y-1.5">
            <label className="text-neutral-400 font-medium">Tono Micropigmentación</label>
            <select 
              value={color} 
              onChange={(e) => setColor(e.target.value)}
              className="bg-neutral-900 p-2.5 rounded-xl border border-neutral-800 focus:border-pink-500/50 focus:outline-none transition-colors text-stone-200 cursor-pointer font-medium"
            >
              <option value="none">Sin pigmento (Color natural)</option>
              <option value="#E65C7B">Rosa Fresh Velvet</option>
              <option value="#B83B5E">Rojo Rubí Satinado</option>
              <option value="#6B2D5C">Borgonia Mate Profundo</option>
              <option value="#D4AF37">Efecto Gloss Destello Dorado</option>
            </select>
          </div>

          <div className="flex flex-col space-y-1.5 justify-end">
            <label className="text-neutral-400 font-medium sm:block hidden">&nbsp;</label>
            <button 
              onClick={() => setPremium(!premium)}
              className={`p-2.5 rounded-xl border font-bold tracking-wide transition-all duration-300 ${
                premium 
                  ? 'bg-pink-500/10 border-pink-500/30 text-pink-400 hover:bg-pink-500/20' 
                  : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              {premium ? '✨ ENTORNO PREMIUM' : 'CAMBIAR A FREE'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
