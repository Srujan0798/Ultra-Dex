#!/bin/bash
set -e

echo "Running comprehensive tests..."

# Install dependencies if needed
npm ci

# Run linting
echo "Running lint..."
npm run lint

# Run type checking
echo "Running typecheck..."
npm run typecheck

# Run unit tests
echo "Running unit tests..."
npm run test:unit

# Run integration tests
echo "Running integration tests..."
npm run test:integration

# Run CLI tests
echo "Running CLI tests..."
npm run test:cli

# Run performance tests
echo "Running performance tests..."
npm run test:performance

# Run smoke tests
echo "Running smoke tests..."
npm run test:push:smoke

echo "All tests passed successfully."