# --- Etapa de Build ---
# Usamos una imagen de Node para construir el proyecto de Vite
FROM node:18 AS builder

# Establecemos el directorio de trabajo
WORKDIR /app

# Copiamos los archivos de manifiesto y el lockfile
COPY package*.json ./

# Instalamos las dependencias
RUN npm install

# Copiamos todo el código fuente del frontend
COPY . .

# Ejecutamos el comando de build corregido
# Esto generará la carpeta 'dist' con los archivos estáticos
RUN npm install && node ./node_modules/vite/bin/vite.js build

# --- Etapa Final de Producción ---
# Usamos una imagen oficial y muy ligera de Nginx
FROM nginx:stable-alpine

# Copiamos la configuración personalizada de Nginx que creamos
# Esto es crucial para que las rutas de React (React Router) funcionen
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiamos los archivos estáticos construidos en la etapa anterior
# desde la carpeta 'dist' del builder a la carpeta html de Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Exponemos el puerto 80, que es el puerto por defecto de Nginx
EXPOSE 80

# El comando por defecto de la imagen de Nginx se encargará de iniciar el servidor
CMD ["nginx", "-g", "daemon off;"]
