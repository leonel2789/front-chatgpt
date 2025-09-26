# Use Node.js 20 (required for Expo)
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build for production
RUN npx expo export -p web --output-dir dist

# Install serve to host static files
RUN npm install -g serve

# Expose port
EXPOSE 5137

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5137 || exit 1

# Serve the built application
CMD ["serve", "-s", "dist", "-l", "5137"]