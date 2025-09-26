# Dockerfile (versión simple)
FROM node:18-alpine

WORKDIR /app

# Copiar archivos de package
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY . .

# Instalar Expo CLI globalmente
RUN npm install

# Exponer puerto
EXPOSE 5137

# Comando para iniciar la aplicación web
CMD ["npx", "expo", "start", "--port", "5137"]