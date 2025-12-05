import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";
import path from "path";

// Importaciones para Swagger UI (requiere 'npm install swagger-ui-express swagger-jsdoc')
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerOptions from './swagger.js'; // Importar las opciones de Swagger

// Importaciones de la nueva arquitectura
import conectarDB from './bd/conexion.js';
import config from './configuracion/index.js';
import autenticacionRutas from './rutas/autenticacion.js';
import aveRutas from './rutas/ave.js'; // Importar las rutas de aves
import familiaRutas from './rutas/familia.js'; // Importar las rutas de familias
import rutaRutas from './rutas/ruta.js'; // Importar las rutas de rutas
import avistamientoRutas from './rutas/avistamiento.js'; // Importar las rutas de avistamientos
import semilleroRutas from './rutas/semillero.js'; // Importar las rutas del semillero
import { router as chatbotRutas, inicializarChatbotServicio } from './rutas/chat.js'; // Importar el router del chatbot y su inicializador

import logger from './configuracion/logger.js'; // Importar nuestro logger
import { UPLOADS_DIR } from './utilidades/manejadorArchivos.js'; // Importar el directorio de subidas
import { notFound, errorHandler } from './intermedios/manejoErrores.js'; // Importar middlewares de error

const app = express();

// Conectar a la base de datos
conectarDB();

// Configuracion de CORS para produccion
const whiteList = config.CORS_ORIGIN ? config.CORS_ORIGIN.split(',') : [];

const corsOptions = {
  origin: (origin, callback) => {
    // En desarrollo, o si el origen esta en la lista blanca, permitir
    if (process.env.NODE_ENV !== 'production' || !origin || whiteList.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
};

app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));

// Servir archivos estaticos de subidas
// La URL para acceder a estos archivos sera /uploads/nombre_del_archivo.jpg
app.use('/uploads', express.static(UPLOADS_DIR));

// Inicializar Swagger-jsdoc
const swaggerSpec = swaggerJsdoc(swaggerOptions);

// RUTAS
// Ruta de documentacion Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/autenticacion', autenticacionRutas);
app.use('/api/aves', aveRutas); // Usar las rutas de aves
app.use('/api/familias', familiaRutas); // Usar las rutas de familias
app.use('/api/rutas', rutaRutas); // Usar las rutas de rutas
app.use('/api/avistamientos', avistamientoRutas); // Usar las rutas de avistamientos
app.use('/api/semillero', semilleroRutas); // Usar las rutas del semillero
if (config.CHATBOT_ENABLED) {
  app.use('/api/documentos', chatbotRutas); // Usar el router del chatbot
}

// Ruta de bienvenida
app.get('/', (req, res) => {
  res.send('API de EcoAlas - Bienvenido!');
});

// Middleware para manejo de errores (DEBE IR DESPUES DE TODAS LAS RUTAS)
app.use(notFound);
app.use(errorHandler);

// Iniciar servidor
app.listen(config.PORT, async () => {
  // Inicializar el servicio del chatbot despues de que el servidor este escuchando
  if (config.CHATBOT_ENABLED) {
    await inicializarChatbotServicio(); 
  } else {
    logger.info('Chatbot deshabilitado (CHATBOT_ENABLED=false)');
  }
  
  logger.info(`Servidor EcoAlas ejecutandose en http://localhost:${config.PORT}`);
  logger.info(`Documentacion API disponible en http://localhost:${config.PORT}/api-docs`);
});
