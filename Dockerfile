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
EXPOSE 5173

# Comando para iniciar la aplicación web
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]