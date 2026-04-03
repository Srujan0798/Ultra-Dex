#!/bin/bash
set -e

# Configuration
DOCKER_REGISTRY="${DOCKER_REGISTRY:-ghcr.io}"
DOCKER_REPO="${DOCKER_REPO:-srujan0798/ultra-dex}"
TAG="${TAG:-$(git rev-parse --short HEAD)}"

echo "Pushing Docker image..."

# Push Docker image
docker push $DOCKER_REGISTRY/$DOCKER_REPO:$TAG
docker push $DOCKER_REGISTRY/$DOCKER_REPO:latest

echo "Docker image pushed successfully: $DOCKER_REGISTRY/$DOCKER_REPO:$TAG"