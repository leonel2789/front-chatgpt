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

# Construir la aplicación para web
RUN npm run build

# Exponer puerto
EXPOSE 3005

# Comando para servir los archivos estáticos
CMD ["npm", "run", "serve"]