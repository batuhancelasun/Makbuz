# Multi-stage build for Makbuz
# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder

# Install canvas dependencies for PWA icon generation
RUN apk add --no-cache \
    build-base \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev

WORKDIR /frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# Stage 2: Production image with Python backend
FROM python:3.11-slim

WORKDIR /app

# Install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application
COPY backend/app/ ./app/

# Copy built frontend from previous stage
COPY --from=frontend-builder /frontend/dist /app/static

# Create data directory for SQLite
RUN mkdir -p /app/data && chmod 777 /app/data

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/categories')" || exit 1

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

