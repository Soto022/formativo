import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./index.css";
import BirdProvider from "./context/BirdContext";
import { AuthProvider } from "./context/AuthContext";

// 🆕 VERIFICACIÓN DE CARGA
console.log('🚀 main.jsx ejecutándose...')
console.log('React:', typeof React)
console.log('createRoot:', typeof createRoot)

try {
  const rootElement = document.getElementById('root')
  console.log('Root element:', rootElement)
  
  if (!rootElement) {
    throw new Error('No se encontró el elemento con id "root"')
  }

  const root = createRoot(rootElement)
  
  root.render(
    <React.StrictMode>
      <AuthProvider>
        <BirdProvider>
          <App />
        </BirdProvider>
      </AuthProvider>
    </React.StrictMode>
  )
  
  console.log('✅ React aplicado correctamente al DOM')
} catch (error) {
  console.error('❌ Error al inicializar React:', error)
  document.body.innerHTML = `
    <div style="padding: 20px; color: red; font-family: Arial; background: #1f2937; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center;">
      <h1 style="color: #ef4444; font-size: 2rem; margin-bottom: 1rem;">Error al cargar la aplicación</h1>
      <p style="color: #d1d5db; margin-bottom: 2rem;">${error.message}</p>
      <button 
        onclick="window.location.reload()" 
        style="padding: 10px 20px; background: #ef4444; color: white; border: none; border-radius: 5px; cursor: pointer;"
      >
        Recargar Página
      </button>
    </div>
  `
}