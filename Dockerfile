# Dockerfile (versión simple)
FROM node:20-alpine

WORKDIR /app

# Copiar archivos de package
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY . .

# Instalar Expo CLI globalmente
RUN npm install -g @expo/cli

# Exponer puerto
EXPOSE 3005

# Comando para iniciar la aplicación web
CMD ["npm", "run", "web:prod"]