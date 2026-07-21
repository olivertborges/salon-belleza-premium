"use client";

import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';

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

  // FUNCIÓN CENTRAL DE REDIRECCIÓN
  const verificarYRedirigir = async (userId: string) => {
    addLog("🛰️ Verificando rol del usuario directamente...");
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        addLog(`🚨 Error al traer perfil: ${error.message}`);
      }

      const userRole = profile?.role || 'client';
      addLog(`🎭 Rol detectado: "${userRole}"`);

      const destino = ['admin', 'staff', 'owner'].includes(userRole) ? '/dashboard' : '/portal';
      addLog(`🔄 Forzando redirección inmediata a: ${destino}`);
      
      // Usamos window.location.replace para evitar que el botón "Atrás" del móvil te regrese al login
      window.location.replace(destino);
    } catch (err: any) {
      addLog(`💥 Error en redirección: ${err.message}`);
    }
  };

  // 1. AUTO-LOGIN: Si el móvil ya tiene sesión (tu caso actual), redirigir de inmediato
  useEffect(() => {
    addLog("🔍 Comprobando sesión activa al cargar...");
    
    supabase.auth.getSession().then(({ data, error }) => {
      if (data?.session?.user) {
        addLog(`👤 Sesión detectada para: ${data.session.user.id}`);
        verificarYRedirigir(data.session.user.id);
      } else {
        addLog("⚪ Sin sesión activa. Esperando credenciales...");
      }
    });
  }, []);

  // 2. Control del Formulario
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    addLog("🚀 Procesando intento de login...");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        addLog(`❌ ERROR: ${error.message}`);
        setLoading(false);
        return;
      }

      addLog("✅ ¡Credenciales correctas!");
      if (data?.user) {
        await verificarYRedirigir(data.user.id);
      }
    } catch (err: any) {
      addLog(`💥 CRITICAL: ${err.message}`);
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

      <div style={{
        marginTop: '30px',
        padding: '12px',
        backgroundColor: '#1e1e1e',
        color: '#39ff14', 
        borderRadius: '8px',
        fontFamily: 'monospace',
        fontSize: '12px',
        minHeight: '200px',
        maxHeight: '300px',
        overflowY: 'scroll',
        border: '2px solid #333'
      }}>
        <div style={{ borderBottom: '1px solid #333', paddingBottom: '5px', marginBottom: '8px', color: '#aaa', fontWeight: 'bold' }}>
          Console Monitor (Frontend Control)
        </div>
        {screenLogs.map((log, index) => (
          <div key={index} style={{ marginBottom: '6px', wordBreak: 'break-word' }}>
            {log}
          </div>
        ))}
      </div>
    </div>
  );
}
