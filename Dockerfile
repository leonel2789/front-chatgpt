# Dockerfile (versión simple)
FROM node:20-alpine

WORKDIR /app

# Copiar archivos de package
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY . .


# Exponer puerto
EXPOSE 80

# Comando para iniciar la aplicación web
CMD ["npm", "run", "dev"]