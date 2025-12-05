# Multi-stage build for CareSync

# Stage 1: Build React frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Backend server
FROM node:18-alpine
WORKDIR /app

# Install backend dependencies
COPY server/package*.json ./
RUN npm install --production

# Copy backend code
COPY server/ ./

# Copy built frontend
COPY --from=frontend-builder /app/client/build ./public

# Expose port
EXPOSE 3001

# Start server
CMD ["node", "index.js"]

