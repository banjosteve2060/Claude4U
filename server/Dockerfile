# Ava Backend - Dockerfile
# Collaboration API + WebSocket Server

FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (use npm ci if lock file exists, otherwise npm install)
RUN npm ci --omit=dev 2>/dev/null || npm install --omit=dev

# Copy source code
COPY . .

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget -q --spider http://localhost:3001/health || exit 1

# Start the server
CMD ["node", "server.js"]
