#!/bin/bash
set -e

# Configuration
DOCKER_REGISTRY="${DOCKER_REGISTRY:-ghcr.io}"
DOCKER_REPO="${DOCKER_REPO:-srujan0798/ultra-dex}"
TAG="${TAG:-$(git rev-parse --short HEAD)}"

echo "Starting automated deployment..."

# Build the application
echo "Building application..."
./scripts/build.sh

# Build Docker image
echo "Building Docker image..."
docker build -t $DOCKER_REGISTRY/$DOCKER_REPO:$TAG .
docker tag $DOCKER_REGISTRY/$DOCKER_REPO:$TAG $DOCKER_REGISTRY/$DOCKER_REPO:latest

# Push Docker image
echo "Pushing Docker image..."
docker push $DOCKER_REGISTRY/$DOCKER_REPO:$TAG
docker push $DOCKER_REGISTRY/$DOCKER_REPO:latest

# Deploy (placeholder - customize based on your infrastructure)
echo "Deploying application..."
# Add your deployment commands here, e.g.:
# kubectl set image deployment/ultra-dex ultra-dex=$DOCKER_REGISTRY/$DOCKER_REPO:$TAG
# or
# docker-compose up -d

echo "Deployment completed successfully."
echo "Image: $DOCKER_REGISTRY/$DOCKER_REPO:$TAG"