#!/bin/bash
set -e

echo "Building all components..."

# Install dependencies
npm ci

# Build core components
echo "Building core..."
npm run build:core

# Build dashboard
echo "Building dashboard..."
npm run build:dashboard

# Build docs
echo "Building docs..."
npm run build:docs

echo "Build completed successfully."