# Stage 1: Build
FROM node:20-alpine as builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

# Add a custom nginx.conf to handle SPA routing (redirect 404 to index.html)
# We can inline a simple config or create a separate file. 
# For simplicity in this tool usage, we'll write a simple default conf.
RUN echo 'server { \
    listen 8080; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Cloud Run expects the container to listen on $PORT, typically 8080
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
