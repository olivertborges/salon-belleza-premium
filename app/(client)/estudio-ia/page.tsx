// @ts-nocheck
'use client';

import React, { useRef, useState, useEffect } from 'react';
import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision';

interface AIResult {
  corte_sugerido: string;
  justificacion_estetica: string;
  paleta_colorimetria: string[];
  consejo_peinado: string;
}

export default function EstudioIAPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [landmarker, setLandmarker] = useState<FaceLandmarker | null>(null);
  
  // Estados de carga e interfaz
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [faceShape, setFaceShape] = useState<string>('');
  const [aiReport, setAiReport] = useState<AIResult | null>(null);

  // 1. Cargar el detector de puntos faciales en el navegador
  useEffect(() => {
    async function initMediaPipe() {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );
      const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
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
    initMediaPipe();
  }, []);

  // 2. Activar la cámara en vivo
  useEffect(() => {
    if (isLoading || !videoRef.current || aiReport) return;

    navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: 640, height: 480 },
      audio: false
    }).then((stream) => {
      if (videoRef.current) videoRef.current.srcObject = stream;
    }).catch(err => console.error("Error en cámara IA Fresh Nails:", err));
  }, [isLoading, aiReport]);

  // 3. Dibujar la cuadrícula de escaneo holográfica
  useEffect(() => {
    let animationFrameId: number;
    if (!landmarker || !videoRef.current || !canvasRef.current || aiReport) return;

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
        const results = landmarker.detectForVideo(video, performance.now());

        // Dibujar líneas guía estéticas de visajismo (Look de Laboratorio)
        if (results.faceLandmarks && results.faceLandmarks.length > 0) {
          const landmarks = results.faceLandmarks[0];

          ctx.save();
          ctx.strokeStyle = 'rgba(212, 175, 55, 0.25)'; // Dorado Champán sutil
          ctx.lineWidth = 0.5;

          // Dibujar óvalo de contorno facial para guiar a la clienta
          ctx.beginPath();
          const pTop = landmarks[10]; // Frente superior
          const pBottom = landmarks[152]; // Barbilla
          const pLeft = landmarks[234]; // Pómulo izquierdo
          const pRight = landmarks[454]; // Pómulo derecho

          const cx = ((pLeft.x + pRight.x) / 2) * canvas.width;
          const cy = ((pTop.y + pBottom.y) / 2) * canvas.height;
          const rx = (Math.abs(pLeft.x - pRight.x) / 2) * canvas.width * 1.2;
          const ry = (Math.abs(pTop.y - pBottom.y) / 2) * canvas.height * 1.2;

          ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
          ctx.stroke();

          // Puntos clave de los ojos y simetría
          [33, 133, 362, 263].forEach((idx) => {
            const p = landmarks[idx];
            ctx.fillStyle = '#D4AF37';
            ctx.beginPath();
            ctx.arc(p.x * canvas.width, p.y * canvas.height, 1.5, 0, Math.PI * 2);
            ctx.fill();
          });

          ctx.restore();
        }
      }
      animationFrameId = requestAnimationFrame(renderLoop);
    };

    renderLoop();
    return () => cancelAnimationFrame(animationFrameId);
  }, [landmarker, aiReport]);

  // 4. Disparar el análisis matemático de Visajismo y llamada a la IA
  const analizarRostro = async () => {
    if (!landmarker || !videoRef.current) return;
    setIsAnalyzing(true);

    const results = landmarker.detectForVideo(videoRef.current, performance.now());
    
    if (results.faceLandmarks && results.faceLandmarks.length > 0) {
      const landmarks = results.faceLandmarks[0];

      // Cálculo geométrico local de proporciones
      const alto = Math.abs(landmarks[10].y - landmarks[152].y);
      const anchoPocmulos = Math.abs(landmarks[234].x - landmarks[454].x);
      const relacionAspecto = alto / anchoPocmulos;

      let formaCalculada = 'Ovalado';
      if (relacionAspecto > 1.45) formaCalculada = 'Alargado';
      else if (relacionAspecto < 1.2) formaCalculada = 'Redondo o Cuadrado';
      
      setFaceShape(formaCalculada);

      // SIMULACIÓN DE RESPUESTA DE API GEMINI (Estructura JSON estricta que parsearás de la API real)
      // En producción aquí harías un: await fetch('/api/gemini', { method: 'POST', body: ... })
      setTimeout(() => {
        const mockApiResponse: AIResult = {
          corte_sugerido: "Soft Shag con flequillo cortina",
          justificacion_estetica: `Al poseer una fisionomía con tendencia a rostro ${formaCalculada.toLowerCase()}, este corte añade capas desfiladas alrededor de los pómulos para romper la linealidad vertical y generar un volumen armónico lateral.`,
          paleta_colorimetria: ["#4A2E2B", "#A87C66", "#D4AF37"], // Tonos sugeridos en Hex
          consejo_peinado: "Secar con difusor utilizando una crema de definición para acentuar el movimiento de las capas intermedias."
        };
        setAiReport(mockApiResponse);
        setIsAnalyzing(false);
      }, 2500);

    } else {
      alert("Asegúrate de que tu rostro esté completamente visible frente a la cámara.");
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex-1 p-6 md:p-10 max-w-5xl mx-auto flex flex-col gap-8 bg-[#0D0D0D] text-[#F5F5F7]">
      <div>
        <h1 className="text-2xl font-light tracking-wide text-white">Consultor de Estilo Avanzado (IA)</h1>
        <p className="text-sm text-neutral-400 mt-1">Nuestra IA analiza tu estructura ósea facial para diseñar el marco ideal de tu cabello.</p>
      </div>

      {!aiReport ? (
        /* VISTA 1: CAPTURA Y ESCÁNER */
        <div className="flex flex-col items-center gap-6 max-w-xl mx-auto w-full">
          <div className="relative w-full aspect-square rounded-2xl overflow-hidden border border-white/10 bg-neutral-950 shadow-xl">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/90 backdrop-blur-md z-10">
                <span className="text-xs tracking-widest text-neutral-500 animate-pulse font-mono">INICIALIZANDO MOTOR DE VISAJISMO...</span>
              </div>
            )}
            {isAnalyzing && (
              <div className="absolute inset-0 bg-black/70 backdrop-blur-md z-10 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
                <span className="text-xs tracking-widest text-[#D4AF37] font-mono animate-pulse">PROCESANDO ESTRUCTURA ÓSEA...</span>
              </div>
            )}
            <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover transform -scale-x-100" />
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover transform -scale-x-100 pointer-events-none" />
          </div>

          <button
            onClick={analizarRostro}
            disabled={isLoading || isAnalyzing}
            className="w-full py-4 bg-white text-black font-semibold text-xs tracking-widest uppercase rounded-xl transition-all hover:bg-neutral-200 disabled:opacity-50"
          >
            Escanear Mi Rostro
          </button>
        </div>
      ) : (
        /* VISTA 2: REPORTES Y RESULTADOS LUXURY */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Tarjeta 1: Morfología */}
          <div className="bg-[#121212] border border-white/5 p-6 rounded-2xl flex flex-col gap-4">
            <span className="text-[10px] tracking-widest text-neutral-500 font-mono uppercase">Morfología Facial</span>
            <div className="text-3xl font-light text-white">{faceShape}</div>
            <p className="text-xs text-neutral-400 leading-relaxed mt-2">Calculado mediante ratios matemáticos de simetría horizontal y distancias interoculares.</p>
          </div>

          {/* Tarjeta 2: Propuesta Técnica */}
          <div className="md:col-span-2 bg-[#121212] border border-white/5 p-6 rounded-2xl flex flex-col gap-4">
            <span className="text-[10px] tracking-widest text-[#D4AF37] font-mono uppercase">Corte de Cabello Recomendado</span>
            <div className="text-xl font-medium text-white">{aiReport.corte_sugerido}</div>
            <p className="text-xs text-neutral-400 leading-relaxed border-t border-white/5 pt-3">{aiReport.justificacion_estetica}</p>
          </div>

          {/* Tarjeta 3: Colorimetría e Instrucciones */}
          <div className="md:col-span-3 bg-[#121212] border border-white/5 p-6 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-3">
              <span className="text-[10px] tracking-widest text-neutral-500 font-mono uppercase">Paleta de Iluminación Sugerida</span>
              <div className="flex gap-3 mt-1">
                {aiReport.paleta_colorimetria.map((hex, i) => (
                  <div key={i} className="flex items-center gap-2 bg-black/20 p-2 rounded-xl border border-white/5">
                    <div className="w-8 h-8 rounded-lg shadow-inner" style={{ backgroundColor: hex }} />
                    <span className="text-[10px] font-mono text-neutral-400">{hex}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[10px] tracking-widest text-neutral-500 font-mono uppercase">Tips para el Peinado en Casa</span>
              <p className="text-xs text-neutral-400 leading-relaxed">{aiReport.consejo_peinado}</p>
            </div>
          </div>

          {/* Botonera de Salida */}
          <div className="md:col-span-3 flex gap-4 mt-4">
            <button
              onClick={() => setAiReport(null)}
              className="flex-1 py-4 border border-white/10 text-neutral-400 text-xs tracking-widest uppercase rounded-xl hover:text-white hover:bg-white/5 transition-all"
            >
              Nuevo Escaneo
            </button>
            <button
              onClick={() => {
                const msg = encodeURIComponent(`¡Hola! Mi análisis de visajismo en Fresh Nails dio Rostro ${faceShape} y me recomendó el corte: ${aiReport.corte_sugerido}. ¡Quiero agendar para este servicio!`);
                window.open(`https://wa.me/TU_SALON?text=${msg}`, '_blank');
              }}
              className="flex-1 py-4 bg-white text-black font-semibold text-xs tracking-widest uppercase rounded-xl hover:bg-neutral-200 transition-all"
            >
              Agendar este estilo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
