# --- Etapa de Build ---
# Usamos una imagen completa de Node.js para instalar dependencias
FROM node:18 AS builder

# Establecemos el directorio de trabajo dentro del contenedor
WORKDIR /usr/src/app

# Copiamos los archivos de manifiesto del proyecto
COPY package*.json ./

# Instalamos las dependencias de producción
RUN npm install --only=production

# Copiamos el resto del código fuente del backend
COPY . .

# --- Etapa Final de Producción ---
# Usamos una imagen más ligera y segura para la ejecución
FROM node:18-alpine

WORKDIR /usr/src/app

# Copiamos las dependencias instaladas y el código desde la etapa de 'builder'
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app .

# Exponemos el puerto en el que corre la aplicación. 
# Render detectará esto, pero es una buena práctica.
# Asegúrate que tu variable de entorno PORT en Render sea la correcta (usualmente 10000 por defecto en Render).
EXPOSE 5000

# El comando para arrancar la aplicación
CMD [ "npm", "start" ]
