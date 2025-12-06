import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";
import path from "path";

// Swagger
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerOptions from './swagger.js';

// Arquitectura
import conectarDB from './bd/conexion.js';
import config from './configuracion/index.js';
import autenticacionRutas from './rutas/autenticacion.js';
import aveRutas from './rutas/ave.js';
import familiaRutas from './rutas/familia.js';
import rutaRutas from './rutas/ruta.js';
import avistamientoRutas from './rutas/avistamiento.js';
import semilleroRutas from './rutas/semillero.js';
import { router as chatbotRutas, inicializarChatbotServicio } from './rutas/chat.js';

import logger from './configuracion/logger.js';
import { UPLOADS_DIR } from './utilidades/manejadorArchivos.js';
import { notFound, errorHandler } from './intermedios/manejoErrores.js';

const app = express();

// 🔌 Conexión BD
conectarDB();

/* ============================================================
   🚨 CORS — Configuración para Render + Netlify
   ============================================================ */

const PERMITIDOS = [
  "https://taupe-unicorn-0fa6f3.netlify.app", // Tu frontend Netlify
  "http://localhost:5173",                    // Desarrollo local
];

// CORS Configurado 100% funcional
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || PERMITIDOS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("No permitido por CORS: " + origin));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept"]
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));

// Archivos estáticos
app.use("/uploads", express.static(UPLOADS_DIR));

// Swagger
const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Rutas
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api/autenticacion", autenticacionRutas);
app.use("/api/aves", aveRutas);
app.use("/api/familias", familiaRutas);
app.use("/api/rutas", rutaRutas);
app.use("/api/avistamientos", avistamientoRutas);
app.use("/api/semillero", semilleroRutas);

if (config.CHATBOT_ENABLED) {
  app.use("/api/documentos", chatbotRutas);
}

// Ruta bienvenida
app.get("/", (req, res) => {
  res.send("API de EcoAlas - Bienvenido!");
});

// Middlewares errores
app.use(notFound);
app.use(errorHandler);

// Iniciar servidor
app.listen(config.PORT, async () => {
  if (config.CHATBOT_ENABLED) {
    await inicializarChatbotServicio();
  } else {
    logger.info("Chatbot deshabilitado (CHATBOT_ENABLED=false)");
  }

  logger.info(`Servidor EcoAlas ejecutándose en http://localhost:${config.PORT}`);
  logger.info(`Documentación API disponible en http://localhost:${config.PORT}/api-docs`);
});
