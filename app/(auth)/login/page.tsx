"use client"; // 🔥 ESTO LE DICE A NEXT.JS QUE ES UN COMPONENTE DE CLIENTE

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js'; // O tu importación habitual de Supabase

// Inicializar cliente Supabase para pruebas
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // 🔥 AQUÍ SE GUARDARÁN TODOS LOS LOGS DE PANTALLA
  const [screenLogs, setScreenLogs] = useState<string[]>([]);

  // Función auxiliar para escribir en la pantalla en tiempo real
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setScreenLogs((prev) => [...prev, `[${timestamp}] ${message}`]);
  };

  // 1. Monitorear el estado de las cookies y la sesión al cargar la página en el teléfono
  useEffect(() => {
    addLog("🔍 Página cargada en el teléfono. Verificando entorno...");
    
    // Ver si hay cookies visibles en el navegador del celular
    try {
      addLog(`🍪 Cookies actuales: ${document.cookie ? document.cookie.substring(0, 60) + "..." : "Ninguna"}`);
    } catch (e: any) {
      addLog(`🚨 Error leyendo cookies en pantalla: ${e.message}`);
    }

    // Probar si el cliente de Supabase tiene alguna sesión guardada en memoria local
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        addLog(`🚨 Error getSession inicial: ${error.message}`);
      } else if (data.session) {
        addLog(`👤 Sesión inicial detectada en teléfono para ID: ${data.session.user.id}`);
      } else {
        addLog("⚪ Sin sesión activa detectada al inicio.");
      }
    }).catch(err => addLog(`💥 Catástrofe getSession: ${err.message}`));
  }, []);

  // 2. Ejecución del formulario de Login con rastreo visual completo
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    addLog("🚀 Botón presionado. Iniciando signInWithPassword...");
    addLog(`📧 Intentando con: ${email}`);

    try {
      // Intento de Login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        addLog(`❌ ERROR DE SUPABASE (${error.status}): ${error.message}`);
        setLoading(false);
        return;
      }

      // Si pasa el login con éxito
      addLog("✅ ¡LOGIN EXITOSO EN EL FRONTEND!");
      addLog(`👤 ID de usuario devuelto: ${data.user?.id}`);
      
      // Comprobar si tras el login exitoso, las cookies se crearon en el teléfono
      addLog(`🍪 Cookies post-login: ${document.cookie ? "Detectadas (Ok)" : "¡VACÍAS!"}`);

      // Consultar el Rol del usuario inmediatamente en la pantalla antes de ir al Middleware
      addLog("🛰️ Consultando rol en tabla 'profiles' desde el teléfono...");
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profileError) {
        addLog(`🚨 Error al traer perfil: ${profileError.message}`);
      } else {
        addLog(`🎭 Rol obtenido en BD: "${profile?.role || 'client'}"`);
      }

      // Proceso de redirección manual
      const destino = ['admin', 'staff', 'owner'].includes(profile?.role || '') ? '/dashboard' : '/portal';
      addLog(`🔄 Forzando redirección vía window.location a: ${destino}`);
      
      // Pequeño retraso de 1.5 segundos para que te dé tiempo a leer los logs en la pantalla del celular
      setTimeout(() => {
        window.location.href = destino;
      }, 1500);

    } catch (err: any) {
      addLog(`💥 CRITICAL ERROR EN FUNCIÓN: ${err.message || JSON.stringify(err)}`);
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '400px', margin: '0 auto' }}>
      <h2>Iniciar Sesión (Modo Monitor)</h2>
      
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <input 
          type="email" 
          placeholder="Email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          style={{ padding: '10px', fontSize: '16px', color: '#000' }}
          required 
        />
        <input 
          type="password" 
          placeholder="Contraseña" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          style={{ padding: '10px', fontSize: '16px', color: '#000' }}
          required 
        />
        <button 
          type="submit" 
          disabled={loading}
          style={{ padding: '12px', fontSize: '16px', backgroundColor: '#0070f3', color: '#fff', border: 'none', borderRadius: '5px' }}
        >
          {loading ? 'Procesando...' : 'Entrar'}
        </button>
      </form>

      <button 
        onClick={() => setScreenLogs([])} 
        style={{ marginTop: '15px', padding: '5px', fontSize: '12px', background: '#ccc', border: 'none', color: '#000' }}
      >
        Limpiar Consola Visual
      </button>

      {/* 🔥 MONITOR DE PANTALLA */}
      <div style={{
        marginTop: '30px',
        padding: '12px',
        backgroundColor: '#1e1e1e',
        color: '#39ff14', 
        borderRadius: '8px',
        fontFamily: 'monospace',
        fontSize: '12px',
        minHeight: '250px',
        maxHeight: '400px',
        overflowY: 'scroll',
        border: '2px solid #333'
      }}>
        <div style={{ borderBottom: '1px solid #333', paddingBottom: '5px', marginBottom: '8px', color: '#aaa', fontWeight: 'bold' }}>
          Console Monitor (Pantalla Móvil)
        </div>
        {screenLogs.length === 0 ? (
          <span style={{ color: '#888' }}>Esperando acciones...</span>
        ) : (
          screenLogs.map((log, index) => (
            <div key={index} style={{ marginBottom: '6px', wordBreak: 'break-word', lineHeight: '1.4' }}>
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
