import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolver __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno desde .env en la raiz del backend
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI || 'mongodb+srv://Admin:JDJA2868022@cluster0.nh1qlyw.mongodb.net/?appName=Cluster0',
  JWT_SECRET: process.env.JWT_SECRET || 'supersecretoseguroparajwt',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '30d',

  // Origenes permitidos para CORS. En produccion, deberia ser la URL del frontend.
  // Ejemplo: 'https://mi-dominio.com'
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000',

  OLLAMA_HOST: process.env.OLLAMA_HOST || 'http://localhost:11434',
  OLLAMA_MODEL: process.env.OLLAMA_MODEL || 'llama3:latest',
  CHATBOT_ENABLED: process.env.CHATBOT_ENABLED === 'false' ? false : true,

  // Directorios para los documentos del chatbot (relativos al backend)
  DOCS_SOURCE_DIR: path.resolve(__dirname, '../../documentos'),
  CHUNKS_DIR: path.resolve(__dirname, '../../documentos_chunks'),
};

export default config;
