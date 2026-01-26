# Stage 1: Build
FROM node:20-alpine as builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .
ARG VITE_GEMINI_API_KEY
RUN echo "VITE_GEMINI_API_KEY=$VITE_GEMINI_API_KEY" > .env
RUN npm run build

# Step 2: Run with Node (Backend Proxy)
FROM node:22-alpine

WORKDIR /app

# Copy package files for server dependencies
COPY package*.json ./
# Install ONLY production dependencies (this includes express/cors which are now in dependencies)
RUN npm install --omit=dev --legacy-peer-deps

# Copy built frontend
COPY --from=builder /app/dist ./dist

# Copy server code
COPY --from=builder /app/server ./server

# Expose port
ENV PORT=8080
EXPOSE 8080

# Start server
CMD ["node", "server/index.js"]
