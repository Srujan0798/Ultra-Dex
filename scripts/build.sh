#!/bin/bash
set -e

echo "Building all components..."

# Install dependencies
npm install --legacy-peer-deps
npm --prefix apps/dashboard install --legacy-peer-deps --ignore-scripts
npm --prefix apps/docs-site install --legacy-peer-deps --ignore-scripts

# Build core components
echo "Building core..."
npm run build:core

# Build dashboard
echo "Building dashboard..."
npm --prefix apps/dashboard run build

# Build docs
echo "Building docs..."
npm --prefix apps/docs-site run build

echo "Build completed successfully."
