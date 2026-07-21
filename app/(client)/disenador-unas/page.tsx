// @ts-nocheck
'use client';

import React, { useRef, useEffect, useState } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

export default function DiseñadorUnasPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [landmarker, setLandmarker] = useState<HandLandmarker | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Estados del diseño de la uña
  const [nailColor, setNailColor] = useState<string>('#E29B9B'); // Color base (Nude)
  const [nailFinish, setNailFinish] = useState<'glossy' | 'matte' | 'glitter'>('glossy');
  const [nailShape, setNailShape] = useState<'coffin' | 'almond' | 'square'>('almond');

  // 1. Cargar MediaPipe Hands de forma asíncrona en el cliente
  useEffect(() => {
    async function initMediaPipe() {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );
      const handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numHands: 1
      });
      setLandmarker(handLandmarker);
      setIsLoading(false);
    }
    initMediaPipe();
  }, []);

  // 2. Encender la cámara web / frontal del teléfono
  useEffect(() => {
    if (isLoading || !videoRef.current) return;

    navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: 640, height: 480 },
      audio: false
    }).then((stream) => {
      if (videoRef.current) videoRef.current.srcObject = stream;
    }).catch(err => console.error("Error en cámara de Fresh Nails:", err));
  }, [isLoading]);

  // 3. Bucle de tracking y dibujo sobre las uñas
  useEffect(() => {
    let animationFrameId: number;
    if (!landmarker || !videoRef.current || !canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const renderLoop = () => {
      if (videoRef.current && videoRef.current.readyState >= 3) {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (canvas.width !== video.videoWidth) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const startTimeMs = performance.now();
        const results = landmarker.detectForVideo(video, startTimeMs);

        if (results.landmarks && results.landmarks.length > 0) {
          const hand = results.landmarks[0];

          // Índices de las puntas de los dedos (Pulgar, Índice, Medio, Anular, Meñique)
          const fingertipIndices = [4, 8, 12, 16, 20];

          fingertipIndices.forEach((index) => {
            const tip = hand[index];
            const base = hand[index - 1]; // Nodo inmediatamente anterior para calcular orientación

            // Coordenadas en píxeles dentro del canvas
            const x = tip.x * canvas.width;
            const y = tip.y * canvas.height;

            // Calcular tamaño dinámico basado en la cercanía de la mano a la cámara
            const distance = Math.sqrt(Math.pow(tip.x - base.x, 2) + Math.pow(tip.y - base.y, 2));
            const nailWidth = distance * canvas.width * 0.35;
            const nailHeight = nailWidth * (nailShape === 'coffin' ? 1.8 : 1.5);

            ctx.save();
            ctx.translate(x, y - nailHeight / 4);

            // Dibujar la máscara de la uña virtual
            ctx.beginPath();
            ctx.fillStyle = nailColor;

            // Aplicar filtros nativos de Canvas según el acabado seleccionado
            if (nailFinish === 'matte') {
              ctx.filter = 'contrast(0.9) brightness(0.95)';
            } else if (nailFinish === 'glitter') {
              ctx.filter = 'saturate(1.2) brightness(1.1)';
            } else {
              ctx.filter = 'brightness(1.05)';
            }

            // Renderizar geometría según la forma (Shape) elegida por la clienta
            if (nailShape === 'almond') {
              ctx.ellipse(0, 0, nailWidth / 2, nailHeight / 2, 0, 0, Math.PI * 2);
            } else if (nailShape === 'square') {
              ctx.rect(-nailWidth / 2, -nailHeight / 2, nailWidth, nailHeight);
            } else if (nailShape === 'coffin') {
              ctx.moveTo(-nailWidth * 0.4, -nailHeight / 2);
              ctx.lineTo(nailWidth * 0.4, -nailHeight / 2);
              ctx.lineTo(nailWidth / 2, nailHeight / 2);
              ctx.lineTo(-nailWidth / 2, nailHeight / 2);
            }
            
            ctx.fill();

            // Reflejo de brillo realista de alta gama (Glossy Overlay)
            if (nailFinish === 'glossy') {
              const gradient = ctx.createLinearGradient(-nailWidth / 2, 0, nailWidth / 2, 0);
              gradient.addColorStop(0, 'rgba(255,255,255,0)');
              gradient.addColorStop(0.3, 'rgba(255,255,255,0.4)');
              gradient.addColorStop(0.4, 'rgba(255,255,255,0)');
              ctx.fillStyle = gradient;
              ctx.fill();
            }

            ctx.restore();
          });
        }
      }
      animationFrameId = requestAnimationFrame(renderLoop);
    };

    renderLoop();
    return () => cancelAnimationFrame(animationFrameId);
  }, [landmarker, nailColor, nailFinish, nailShape]);

  return (
    <div className="flex-1 p-6 md:p-10 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 bg-[#0D0D0D] text-[#F5F5F7]">
      
      {/* COLUMNA VISUAL: Cámara y Canvas (Ocupa 2 columnas de 3) */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-light tracking-wide text-white">Diseñador Virtual de Uñas</h1>
          <p className="text-sm text-neutral-400 mt-1">Prueba formas, acabados y paletas exclusivas de Fresh Nails sobre tus manos.</p>
        </div>

        <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-white/10 bg-neutral-950 shadow-2xl">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/90 backdrop-blur-md z-10">
              <span className="text-xs tracking-widest text-neutral-400 animate-pulse font-mono">
                CALIBRANDO CÁMARA DE MANOS...
              </span>
            </div>
          )}
          <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover transform -scale-x-100" />
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover transform -scale-x-100 pointer-events-none" />
        </div>

        <button 
          onClick={() => {
            const msg = encodeURIComponent(`¡Hola! Diseñé mis uñas en la web de Fresh Nails: Forma ${nailShape}, Acabado ${nailFinish} y Color ${nailColor}. ¡Quiero agendar este estilo!`);
            window.open(`https://wa.me/TU_SALON?text=${msg}`, '_blank');
          }}
          className="w-full py-4 bg-white text-black font-semibold text-xs tracking-widest uppercase rounded-xl transition-all hover:bg-neutral-200"
        >
          Guardar y Enviar Turno
        </button>
      </div>

      {/* COLUMNA DE CONFIGURACIÓN: Controles de Estilo (Ocupa 1 columna) */}
      <div className="bg-[#121212] border border-white/5 rounded-2xl p-6 flex flex-col gap-6 h-fit self-start shadow-xl">
        
        {/* CONTROL 1: Forma de la Uña */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-mono tracking-wider text-neutral-400 uppercase">1. Estructura y Forma</span>
          <div className="grid grid-cols-3 gap-2">
            {(['almond', 'square', 'coffin'] as const).map((shape) => (
              <button
                key={shape}
                onClick={() => setNailShape(shape)}
                className={`py-3 px-2 rounded-xl border text-[10px] font-medium tracking-wider uppercase transition-all ${
                  nailShape === shape ? 'border-white bg-white text-black' : 'border-white/10 bg-white/5 text-neutral-400 hover:border-white/20'
                }`}
              >
                {shape === 'coffin' ? 'Ballerina' : shape === 'almond' ? 'Almendra' : 'Cuadrada'}
              </button>
            ))}
          </div>
        </div>

        {/* CONTROL 2: Acabado/Textura */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-mono tracking-wider text-neutral-400 uppercase">2. Efecto Final</span>
          <div className="grid grid-cols-3 gap-2">
            {(['glossy', 'matte', 'glitter'] as const).map((finish) => (
              <button
                key={finish}
                onClick={() => setNailFinish(finish)}
                className={`py-3 px-2 rounded-xl border text-[10px] font-medium tracking-wider uppercase transition-all ${
                  nailFinish === finish ? 'border-white bg-white text-black' : 'border-white/10 bg-white/5 text-neutral-400 hover:border-white/20'
                }`}
              >
                {finish}
              </button>
            ))}
          </div>
        </div>

        {/* CONTROL 3: Selección de Color */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-mono tracking-wider text-neutral-400 uppercase">3. Paleta Fresh Nails</span>
          <div className="grid grid-cols-4 gap-2">
            {[
              { name: 'Milky', hex: '#F3EFEF' },
              { name: 'Soft Rose', hex: '#E29B9B' },
              { name: 'Mauve', hex: '#A37081' },
              { name: 'Terracotta', hex: '#B85A4B' },
              { name: 'Emerald', hex: '#1C3A27' },
              { name: 'Midnight', hex: '#1A1C23' },
              { name: 'Glazed', hex: '#EAE1DF' },
              { name: 'Burgundy', hex: '#4A1521' },
            ].map((color) => (
              <button
                key={color.hex}
                onClick={() => setNailColor(color.hex)}
                className={`p-2 rounded-lg border flex flex-col items-center gap-1.5 transition-all ${
                  nailColor === color.hex ? 'border-white bg-white/10' : 'border-white/5 bg-transparent hover:border-white/20'
                }`}
              >
                <div className="w-5 h-5 rounded-md border border-white/10" style={{ backgroundColor: color.hex }} />
                <span className="text-[9px] text-neutral-500 tracking-tighter truncate w-full text-center">{color.name}</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
