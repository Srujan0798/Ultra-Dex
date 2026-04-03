#!/bin/bash
set -e

# Configuration
DOCKER_REGISTRY="${DOCKER_REGISTRY:-ghcr.io}"
DOCKER_REPO="${DOCKER_REPO:-srujan0798/ultra-dex}"
TAG="${TAG:-$(git rev-parse --short HEAD)}"

echo "Building Docker image..."

# Build the application first
./scripts/build.sh

# Build Docker image
docker build -t $DOCKER_REGISTRY/$DOCKER_REPO:$TAG .
docker tag $DOCKER_REGISTRY/$DOCKER_REPO:$TAG $DOCKER_REGISTRY/$DOCKER_REPO:latest

echo "Docker image built successfully: $DOCKER_REGISTRY/$DOCKER_REPO:$TAG"