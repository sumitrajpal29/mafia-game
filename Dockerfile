# Multi-stage Dockerfile for Mafia Game

# Stage 1: Build frontend
FROM node:18-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Setup backend
FROM node:18-alpine AS server-builder
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install
COPY server/ ./

# Stage 3: Final production image
FROM node:18-alpine

# Install git for version control
RUN apk add --no-cache git

WORKDIR /app

# Copy server
COPY --from=server-builder /app/server ./server

# Copy built frontend to server's public directory (if serving from backend)
COPY --from=client-builder /app/client/build ./server/public

# Install bash for better shell experience
RUN apk add --no-cache bash

# Expose ports
EXPOSE 3001 3000

# Default command
CMD ["sh"]
