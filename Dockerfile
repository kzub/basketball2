# Stage 1: Build frontend
FROM node:20-alpine AS build-front
WORKDIR /app/front
COPY front/package*.json ./
RUN npm install --legacy-peer-deps --loglevel verbose
COPY front/ ./
RUN npm run build

# Stage 2: Build backend dependencies
FROM node:20-alpine AS build-back
WORKDIR /app/back
COPY back/package*.json ./
# Install only production dependencies
RUN npm install --omit=dev --legacy-peer-deps --loglevel verbose

# Stage 3: Use (Runtime)
FROM node:20-alpine AS use
WORKDIR /app/back

# Create necessary directories
RUN mkdir -p /app/data /app/back/config

# Copy backend code
COPY back/ ./
# Copy backend dependencies from build-back stage
COPY --from=build-back /app/back/node_modules ./node_modules

# Link the config folder to the data folder so settings can be provided via volume
RUN rm -rf config/settings.json && ln -sf /app/data/settings.json config/settings.json

# Copy built frontend into the expected path relative to backend
COPY --from=build-front /app/front/dist /app/front/dist

ENV BASKET_MODE=prod
ENV NODE_ENV=production
ENV PORT=3001
ENV HOST=0.0.0.0
ENV SQLITE_FILENAME=/app/data/basket.db
ENV DOCKER_LOGS=true

# Healthcheck must use the dynamic PORT variable to avoid failing when port is overridden
HEALTHCHECK --interval=120s --timeout=5s --start-period=5s --retries=2 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:${PORT}/api/status || exit 1

# Start the application
CMD ["node", "server.js"]
