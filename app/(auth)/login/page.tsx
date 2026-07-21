"use client";

import React, { useState, useEffect } from 'react';
// IMPORTANTE: Usamos la versión de cliente compatible con Server-Side Rendering
import { createBrowserClient } from '@supabase/ssr'; 

// Inicializamos el cliente del navegador. 
// Esto automáticamente sincroniza el almacenamiento con las cookies de forma transparente.
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [screenLogs, setScreenLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setScreenLogs((prev) => [...prev, `[${timestamp}] ${message}`]);
  };

  useEffect(() => {
    addLog("🔍 Página cargada en el teléfono. Verificando entorno...");
    
    try {
      addLog(`🍪 Cookies iniciales: ${document.cookie ? "Detectadas" : "Ninguna"}`);
    } catch (e: any) {
      addLog(`🚨 Error cookies: ${e.message}`);
    }

    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        addLog(`🚨 Error getSession: ${error.message}`);
      } else if (data.session) {
        addLog(`👤 Sesión en caché para ID: ${data.session.user.id}`);
      } else {
        addLog("⚪ Sin sesión activa inicial.");
      }
    });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    addLog("🚀 Iniciando signInWithPassword...");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        addLog(`❌ ERROR SUPABASE: ${error.message}`);
        setLoading(false);
        return;
      }

      addLog("✅ ¡LOGIN EXITOSO!");
      
      // ESPERA CRÍTICA: Forzamos a que Supabase asiente las cookies en el navegador móvil.
      // Damos un pequeño respiro de 300ms antes de leer el document.cookie.
      await new Promise((resolve) => setTimeout(resolve, 300));
      addLog(`🍪 Cookies creadas: ${document.cookie ? "¡LOGRADO!" : "⚠️ CONTINÚAN VACÍAS"}`);

      // Consultar el Rol
      addLog("🛰️ Buscando rol...");
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .maybeSingle();

      const userRole = profile?.role || 'client';
      addLog(`🎭 Rol: "${userRole}"`);

      const destino = ['admin', 'staff', 'owner'].includes(userRole) ? '/dashboard' : '/portal';
      addLog(`🔄 Redirigiendo a: ${destino}`);
      
      // Retraso final para asegurar la escritura y que logres leer la confirmación en la pantalla del celular
      setTimeout(() => {
        window.location.href = destino;
      }, 1000);

    } catch (err: any) {
      addLog(`💥 ERROR CRÍTICO: ${err.message}`);
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '400px', margin: '0 auto' }}>
      <h2>Iniciar Sesión</h2>
      
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
        Limpiar Monitor
      </button>

      <div style={{
        marginTop: '30px',
        padding: '12px',
        backgroundColor: '#1e1e1e',
        color: '#39ff14', 
        borderRadius: '8px',
        fontFamily: 'monospace',
        fontSize: '12px',
        minHeight: '220px',
        maxHeight: '350px',
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
            <div key={index} style={{ marginBottom: '6px', wordBreak: 'break-word' }}>
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
