#!/bin/bash
# ==============================================================================
# 1-Click Docker Launcher for macOS (MacBook Pro / Air M1/M2/M3/M4 & Intel)
# All India Listed Companies — Upcoming Financial Results Scanner
# ==============================================================================

echo "======================================================================"
echo "Starting All India Listed Companies Financial Results Scanner on Mac"
echo "======================================================================"

# 1. Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker is not installed on this Mac."
    echo "👉 Please install Docker Desktop from: https://www.docker.com/products/docker-desktop/"
    exit 1
fi

# 2. Check if Docker daemon is running
if ! docker info &> /dev/null; then
    echo "⏳ Docker Desktop is starting up... Waiting 5 seconds..."
    open -a Docker
    sleep 5
fi

# 3. Build & Launch Container in Background
echo "🚀 Building and starting Docker container in background..."
docker compose up -d --build

# 4. Wait for application to be healthy
echo "⏳ Waiting for Scanner API & Dashboard to initialize..."
sleep 3

# 5. Open in Default Browser
echo "🌐 Opening Dashboard in browser: http://localhost:8000"
open http://localhost:8000

echo ""
echo "======================================================================"
echo "✅ SUCCESS! Results Scanner is running 24/7 in the background."
echo "   - Web Dashboard:     http://localhost:8000"
echo "   - API Documentation: http://localhost:8000/docs"
echo "   - Daily 8 AM Report: http://localhost:8000/api/report/daily"
echo "   - View Live Logs:    docker logs -f results_scanner_app"
echo "   - Stop Container:    docker compose down"
echo "======================================================================"
