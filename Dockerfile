# Stage 1: Build the React app
FROM node:20-alpine AS build
WORKDIR /app
ARG VITE_GEMINI_API_KEY
ENV VITE_GEMINI_API_KEY=$VITE_GEMINI_API_KEY
COPY package*.json ./
RUN npm install
COPY . .
# We don't include .env in the build for security; 
# API keys should ideally be passed as environment variables or handled via backend.
# But for a simple static build, we'll build it.
RUN npm run build

# Stage 2: Serve the app with Nginx
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
