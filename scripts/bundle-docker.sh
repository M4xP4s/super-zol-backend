#!/bin/bash
set -e

# Bundle a service or job with Docker image build
# Usage: ./scripts/bundle-docker.sh <service-name>

SERVICE_NAME=$1

if [ -z "$SERVICE_NAME" ]; then
  echo "❌ Error: Service name is required"
  echo "Usage: ./scripts/bundle-docker.sh <service-name>"
  exit 1
fi

# Determine the type (service or job)
SERVICE_PATH="services/$SERVICE_NAME"
JOB_PATH="jobs/$SERVICE_NAME"

if [ -d "$SERVICE_PATH" ]; then
  PROJECT_PATH="$SERVICE_PATH"
  PROJECT_TYPE="service"
elif [ -d "$JOB_PATH" ]; then
  PROJECT_PATH="$JOB_PATH"
  PROJECT_TYPE="job"
else
  echo "❌ Error: Service or job '$SERVICE_NAME' not found"
  exit 1
fi

echo "🔨 Building $PROJECT_TYPE: $SERVICE_NAME"

# Step 1: Build with esbuild
echo "📦 Running esbuild compilation..."
pnpm nx build "$SERVICE_NAME" --configuration=production

if [ $? -ne 0 ]; then
  echo "❌ Build failed"
  exit 1
fi

echo "✅ Build completed: dist/$PROJECT_TYPE/$SERVICE_NAME"

# Step 2: Build Docker image if Dockerfile exists
DOCKERFILE_PATH="$PROJECT_PATH/Dockerfile"

if [ -f "$DOCKERFILE_PATH" ]; then
  IMAGE_NAME="${SERVICE_NAME}:latest"

  echo ""
  echo "🐳 Building Docker image: $IMAGE_NAME"

  docker build \
    -f "$DOCKERFILE_PATH" \
    -t "$IMAGE_NAME" \
    --build-arg NODE_ENV=production \
    .

  if [ $? -eq 0 ]; then
    echo "✅ Docker image built: $IMAGE_NAME"
    echo ""
    echo "📋 Image info:"
    docker images | grep "$SERVICE_NAME" | head -1
  else
    echo "❌ Docker image build failed"
    exit 1
  fi
else
  echo "ℹ️  No Dockerfile found for $SERVICE_NAME (skipping Docker build)"
  echo "   To add Docker support, create: $DOCKERFILE_PATH"
fi

echo ""
echo "✨ Bundle complete: $SERVICE_NAME"
