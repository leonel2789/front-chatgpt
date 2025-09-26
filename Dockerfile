# Dockerfile (versión simple)
FROM node:18-alpine

# Instalar wget para healthcheck
RUN apk add --no-cache wget

WORKDIR /app

# Copiar archivos de package
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY . .

# Instalar dependencias
RUN npm install

# Variables de entorno para Expo
ENV EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
ENV EXPO_USE_HTTPS=false

# Exponer puerto
EXPOSE 5137

# Healthcheck para Coolify
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5137 || exit 1

# Comando para iniciar la aplicación web
CMD ["npx", "expo", "start", "--web", "--port", "5137"]