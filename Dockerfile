# Multi-Stage Cross-Platform Dockerfile (Mac M1/M2/M3/M4 & Intel, Linux, Windows)

# Stage 1: Build the React + Vite Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
# Use npm install to gracefully handle platform-specific native binaries (e.g. Rollup darwin-arm64)
RUN npm install

COPY frontend/ ./
RUN npm run build

# Stage 2: Production Python Backend
FROM python:3.11-slim AS production

# Set environment variables for IST time and clean unbuffered logging
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    HOST=0.0.0.0 \
    PORT=8000 \
    TZ=Asia/Kolkata

WORKDIR /app

# Install system dependencies (tzdata for accurate Asia/Kolkata 8:00 AM reports)
RUN apt-get update && apt-get install -y --no-install-recommends \
    tzdata \
    curl \
    && ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code, research data, and runtime launcher
COPY backend ./backend
COPY research ./research
COPY run_system.py ./

# Copy compiled static frontend assets from Stage 1 into frontend/dist
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Ensure persistent data directory exists
RUN mkdir -p /app/backend/data

# Expose default HTTP port
EXPOSE 8000

# Health check (dynamically evaluates the assigned PORT)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://127.0.0.1:${PORT:-8000}/api/health || exit 1

# Start the unified production server (serves REST API + React SPA + 24/7 Surveillance Engine)
CMD ["python", "run_system.py"]
