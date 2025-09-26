# Use Node.js 20 (required for Expo)
FROM node:20-alpine

# Install serve globally first
RUN npm install -g serve

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Expose port
EXPOSE 5137

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5137 || exit 1

# Start the development server for web
CMD ["npm", "run", "web"]