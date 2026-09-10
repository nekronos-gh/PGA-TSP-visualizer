# Stage 1: Build the React application
FROM node:20-slim AS build

WORKDIR /app

ARG CARTO_BASEMAPS_API_KEY
ENV VITE_CARTO_BASEMAPS_API_KEY $CARTO_BASEMAPS_API_KEY

ARG API_URL
ENV VITE_API_URL $API_URL

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code and build
COPY . .
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
