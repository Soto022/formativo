import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtener __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno desde .env en la raíz del backend
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/ecoalas_db',
  JWT_SECRET: process.env.JWT_SECRET || 'supersecretoseguroparajwt',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '30d',
  
  // Orígenes permitidos para CORS. En producción, debería ser la URL del frontend.
  // Ejemplo: 'https://mi-dominio.com'
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000',

  OLLAMA_HOST: process.env.OLLAMA_HOST || 'http://localhost:11434',
  OLLAMA_MODEL: process.env.OLLAMA_MODEL || 'llama3:latest',
  
  // Directorios para los documentos del chatbot
  DOCS_SOURCE_DIR: path.join(process.cwd(), 'backend', 'documentos'), // Asegúrate que 'documentos' está en la raíz del backend
  CHUNKS_DIR: path.join(process.cwd(), 'backend', 'documentos_chunks'),
};

export default config;
