#!/bin/bash

# QA Buddy - Docker Startup Script
# This script builds and starts the QA Buddy application using Docker Compose

set -e

echo "🚀 Starting QA Buddy with Docker..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose > /dev/null 2>&1; then
    echo "❌ docker-compose is not installed. Please install Docker Compose and try again."
    exit 1
fi

# Build and start the application
echo "📦 Building and starting QA Buddy..."
docker-compose up --build -d

# Wait for health check
echo "⏳ Waiting for application to be ready..."
timeout=60
counter=0

while [ $counter -lt $timeout ]; do
    if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
        echo "✅ QA Buddy is ready!"
        echo "🌐 Application URL: http://localhost:3000"
        echo ""
        echo "📋 Useful commands:"
        echo "  View logs:     docker-compose logs -f"
        echo "  Stop app:      docker-compose down"
        echo "  Restart app:   docker-compose restart"
        echo "  Update app:    docker-compose up --build -d"
        echo ""
        exit 0
    fi
    
    sleep 2
    counter=$((counter + 2))
    echo "Still waiting... ($counter/$timeout seconds)"
done

echo "⚠️  Application may still be starting. Check logs with: docker-compose logs -f"
echo "🌐 Try accessing: http://localhost:3000"