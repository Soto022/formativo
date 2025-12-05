# Formativo / EcoAlas

Proyecto dividido en dos partes:
- `frontend/`: app React con Vite.
- `backend/`: API Express/Mongo.

## Requisitos
- Node 18+ (necesario para backend) y npm 9+.
- MongoDB local si quieres datos reales.

## Instalacion
En cada carpeta:
1. `cd frontend && npm install`
2. `cd backend && npm install`

Configura tus variables de entorno (hay `.env.example` en cada carpeta):
- `frontend/.env` con `VITE_API_URL` apuntando al backend.
- `backend/.env` con MongoDB, JWT y CORS.

## Ejecucion
- Frontend desarrollo: `npm run dev` (puerto 5173).
- Backend desarrollo: `npm run dev` (requiere `backend/.env`).
- Backend produccion: `npm start`.
- Build frontend: `npm run build`.

Variables de entorno usadas por el backend (`backend/.env`):
- `PORT` (por defecto 5000)
- `MONGO_URI`
- `JWT_SECRET`
- `JWT_EXPIRE` (por defecto 30d)
- `CORS_ORIGIN` (URLs separadas por comas)
- `OLLAMA_HOST`, `OLLAMA_MODEL` (solo si usas el chatbot)

## Notas
- No ejecutes `npm install` en la raiz del repo: no hay `package.json` ahi.
- Se elimino el `package-lock.json` vacio de la raiz para evitar el error de falta de `package.json`.

## Despliegue
- Frontend: en `frontend/` ejecuta `npm run build` y sirve el contenido de `dist/` (Nginx/Apache/Netlify/Vercel). Define `VITE_API_URL` apuntando al backend.
- Backend: en `backend/` define `.env` (usa `.env.example`), instala deps y corre `npm start` (Node 18+). Ajusta `CORS_ORIGIN` a la URL publica del frontend.
- Base de datos: requiere MongoDB accesible desde el backend (`MONGO_URI`).
- Admin: registra un usuario y en Mongo cambia su `rol` a `admin` para acceder a la gestion protegida.
