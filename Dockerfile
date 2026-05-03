# Stage 1: Build the React/Vite app
FROM node:20-alpine AS build
WORKDIR /app

# Accept the API key at build time so Vite can inline it
ARG VITE_GEMINI_API_KEY
ENV VITE_GEMINI_API_KEY=$VITE_GEMINI_API_KEY

COPY package*.json ./
RUN npm ci --prefer-offline

COPY . .
RUN npm run build

# Stage 2: Serve with Nginx on port 8080 (required by Cloud Run)
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
