import { useState, useRef, useEffect } from "react";

const colibriImg = "/imagenes/colibri.png"; // ← Ruta correcta a la imagen

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function ChatBox() {
  const [mensajes, setMensajes] = useState([
    {
      texto: "¡Hola! Soy Colibrí, tu asistente de aves 🐦\n\nTengo dos modos:\n\n🔒 **Modo Estricto**: Solo uso tu documentación cargada\n🔍 **Modo Investigativo**: Combino documentación con conocimiento general\n\n¿En qué puedo ayudarte hoy?",
      de: "colibri",
    },
  ]);
  const [input, setInput] = useState("");
  const [abierto, setAbierto] = useState(true);
  const [cargando, setCargando] = useState(false);
  const [modoEstricto, setModoEstricto] = useState(true);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [mensajes]);

  const esError = (texto) => {
    if (!texto) return false;
    const lower = texto.toLowerCase();
    return (
      lower.includes("error") ||
      lower.includes("❌") ||
      lower.includes("no pude") ||
      lower.includes("conexión") ||
      lower.includes("verifica") ||
      lower.includes("localhost:11434")
    );
  };

  const debeMostrarDescarga = (mensaje) => {
    if (!mensaje || !mensaje.texto) return false;

    if (
      esError(mensaje.texto) ||
      mensaje.texto.includes("¡Hola!") ||
      mensaje.texto.includes("No hay documentos") ||
      mensaje.texto.length < 100
    ) {
      return false;
    }

    return (
      mensaje.de === "colibri" &&
      mensaje.mensajeOriginal &&
      (mensaje.fuentes?.length > 0 || mensaje.documentosEncontrados > 0)
    );
  };

  const enviarMensaje = async () => {
    if (!input.trim() || cargando) return;

    const mensajeUsuario = input.trim();
    const nuevoMensajeUsuario = {
      texto: mensajeUsuario,
      de: "usuario",
      timestamp: new Date(),
    };

    setMensajes((prev) => [...prev, nuevoMensajeUsuario]);
    setInput("");
    setCargando(true);

    try {
      const response = await fetch(`${API_URL}/api/documentos/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: mensajeUsuario,
          modoEstricto: modoEstricto,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      const nuevoMensajeColibri = {
        texto: data.reply || "No recibí respuesta del servidor.",
        de: "colibri",
        mensajeOriginal: mensajeUsuario,
        modoUsado: data.modoUsado || "estricto",
        documentosEncontrados: data.documentosEncontrados || 0,
        fuentes: data.fuentes || [],
        timestamp: new Date(),
      };

      setMensajes((prev) => [...prev, nuevoMensajeColibri]);
    } catch (error) {
      console.error("❌ Error:", error);

      let mensajeError = "";
      if (error.message.includes("fetch") || error.message.includes("Failed")) {
        mensajeError = `🔌 **Error de conexión**\n\nVerifica que:\n• El servidor esté corriendo en ${API_URL}\n• Ejecutes: node server.js\n• No haya bloqueos del firewall`;
      } else {
        mensajeError = `⚠️ Error: ${error.message}`;
      }

      const nuevoMensajeError = {
        texto: mensajeError,
        de: "colibri",
        mensajeOriginal: mensajeUsuario,
        fuentes: [],
        timestamp: new Date(),
      };

      setMensajes((prev) => [...prev, nuevoMensajeError]);
    } finally {
      setCargando(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      enviarMensaje();
    }
  };

  const descargarRespuesta = (
    texto,
    pregunta,
    modoUsado = "estricto",
    documentosEncontrados = 0,
    fuentes = []
  ) => {
    const modoTexto =
      modoUsado === "estricto"
        ? "🔒 MODO ESTRICTO (Solo documentación)"
        : "🔍 MODO INVESTIGATIVO (Documentación + conocimiento)";

    const contenido = `ECOALAS - CONSULTA ORNITOLÓGICA
=================================
${modoTexto}
Pregunta: ${pregunta}
Fecha: ${new Date().toLocaleString("es-CO")}
Documentos encontrados: ${documentosEncontrados}
Fuentes: ${fuentes.length > 0 ? fuentes.join(", ") : "No especificadas"}

RESPUESTA:
==========
${texto}

---
EcoAlas - Sistema de consulta ornitológica
Caldas, Colombia | ${new Date().getFullYear()}
`;

    const blob = new Blob([contenido], { type: "text/plain;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    a.download = `ecoalas_consulta_${timestamp}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const limpiarConversacion = () => {
    setMensajes([
      {
        texto:
          "¡Hola! Soy Colibrí, tu asistente de aves 🐦\n\nTengo dos modos:\n\n🔒 **Modo Estricto**: Solo uso tu documentación cargada\n🔍 **Modo Investigativo**: Combino documentación con conocimiento general\n\n¿En qué puedo ayudarte hoy?",
        de: "colibri",
      },
    ]);
  };

  if (!abierto) {
    return (
      <button
        className="fixed bottom-16 right-4 bg-emerald-600 text-white p-4 rounded-full shadow-xl z-50 hover:bg-emerald-700 transition-all duration-300 hover:scale-110"
        onClick={() => setAbierto(true)}
        title="Abrir chat de EcoAlas"
      >
        <div className="flex items-center justify-center">
          <span className="text-2xl">💬</span>
          <span className="w-3 h-3 bg-red-500 rounded-full animate-ping absolute top-0 right-0"></span>
        </div>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 max-w-sm bg-gray-800 rounded-2xl shadow-2xl flex flex-col z-50 border border-emerald-700 overflow-hidden"
      style={{ minHeight: "500px", maxHeight: "700px", height: "70vh" }}
    >
      {/* Cabecera */}
      <div className="flex justify-between items-center p-4 bg-emerald-700 text-white rounded-t-2xl shadow-md">
        <div className="flex items-center space-x-3">
          <img src={colibriImg} alt="Colibrí" className="w-9 h-9 animate-float" />
          <div>
            <h4 className="font-bold text-lg">🌿 EcoChat - Caldas</h4>
            <div className="text-xs opacity-90">Asistente de aves</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={limpiarConversacion}
            className="p-2 rounded-full hover:bg-emerald-600 transition-colors duration-200 text-lg"
            title="Nueva conversación"
          >
            🗑️
          </button>
          <button
            onClick={() => setAbierto(false)}
            className="p-2 rounded-full hover:bg-emerald-600 transition-colors duration-200 text-lg"
            title="Minimizar"
          >
            ➖
          </button>
        </div>
      </div>

             {/* Modo */}
            <div
              className={`px-4 py-2 text-xs font-semibold text-center transition-all duration-300
                ${modoEstricto
                  ? "bg-gray-700 text-gray-200 border-b border-emerald-600"
                  : "bg-gray-700 text-gray-200 border-b border-blue-600"
                }`}
            >
              <button
                onClick={() => setModoEstricto(!modoEstricto)}
                className="flex items-center justify-center space-x-2 w-full py-1 rounded-lg hover:bg-gray-600 transition-colors duration-200"
              >
                <span>{modoEstricto ? "🔒" : "🔍"}</span>
                <span>
                  {modoEstricto
                    ? "Modo Estricto (solo documentación)"
                    : "Modo Investigativo (+ conocimiento)"}
                </span>
                <span className="text-xs opacity-70 ml-2">[click para cambiar]</span>
              </button>
            </div>
      {/* Mensajes */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-900"
        style={{ maxHeight: "calc(70vh - 140px)" }}
      >
        {mensajes.map((m, idx) => (
          <div key={idx} className="group">
            <div
              className={`flex ${m.de === "colibri" ? "justify-start" : "justify-end"
                } items-start`}
            >
              {m.de === "colibri" && (
                <img
                  src={colibriImg}
                  alt="Colibrí"
                  className="w-8 h-8 rounded-full mr-2 shadow-md"
                />
              )}

              <div
                className={`px-4 py-3 rounded-2xl max-w-[85%] transition-all shadow-md ${m.de === "colibri"
                  ? esError(m.texto)
                    ? "bg-red-800 text-white border border-red-700"
                    : "bg-gray-700 text-gray-100 border border-gray-600"
                  : "bg-emerald-600 text-white"
                  }`}
              >
                <div className="whitespace-pre-wrap leading-relaxed text-sm">
                  {m.texto}
                </div>

                {m.de === "colibri" && !esError(m.texto) && (
                  <div className="mt-3 pt-2 border-t border-gray-600 space-y-2">
                    {m.fuentes?.length > 0 && (
                      <div className="text-xs text-gray-300">
                        <span className="font-semibold">📚 Fuentes:</span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {m.fuentes.map((fuente, i) => (
                            <span
                              key={i}
                              className="bg-emerald-700 text-white px-2 py-1 rounded-full text-xs border border-emerald-600"
                            >
                              {fuente}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {(m.documentosEncontrados > 0 || m.modoUsado) && (
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        {m.documentosEncontrados > 0 && (
                          <span>📊 {m.documentosEncontrados} fragmentos</span>
                        )}
                        <span>
                          {m.modoUsado === "estricto"
                            ? "🔒 Estricto"
                            : "🔍 Investigativo"}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {debeMostrarDescarga(m) && (
              <div className="flex justify-start ml-12 mt-2">
                <button
                  onClick={() =>
                    descargarRespuesta(
                      m.texto,
                      m.mensajeOriginal,
                      m.modoUsado,
                      m.documentosEncontrados,
                      m.fuentes
                    )
                  }
                  className="text-xs bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-full shadow-md transition-colors duration-200"
                >
                  📥 Descargar respuesta
                </button>
              </div>
            )}
          </div>
        ))}

        {cargando && (
          <div className="flex items-start space-x-3">
            <img
              src={colibriImg}
              alt="Colibrí"
              className="w-8 h-8 rounded-full mr-2 shadow-md"
            />
            <div className="bg-gray-700 border border-gray-600 px-4 py-3 rounded-2xl shadow-sm">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
              <div className="text-xs text-gray-300 mt-1">
                {modoEstricto ? "Buscando en documentos..." : "Investigando..."}
              </div>
            </div>
          </div>
        )}
      </div>



      {/* Input */}
      <div className="border-t border-gray-700 p-4 bg-gray-800 rounded-b-2xl">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 border border-gray-600 bg-gray-700 text-gray-100 rounded-full px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm placeholder-gray-400"
            placeholder={
              modoEstricto
                ? "💭 Pregunta sobre los documentos de aves..."
                : "🔍 Pregunta sobre aves de Caldas..."
            }
            disabled={cargando}
          />
          <button
            onClick={enviarMensaje}
            disabled={cargando || !input.trim()}
            className={`px-4 py-3 rounded-full transition-all duration-200 ${cargando
              ? "bg-gray-600 cursor-not-allowed"
              : modoEstricto
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
          >
            {cargando ? "⏳" : "➤"}
          </button>
        </div>
        <div className="text-xs text-gray-500 mt-2 text-center flex justify-between">
          <span>Enter para enviar</span>
          <span>•</span>
          <span>{API_URL}</span>
        </div>
      </div>
    </div>
  );
}
