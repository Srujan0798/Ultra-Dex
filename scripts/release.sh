#!/bin/bash
set -e

# Release automation script
VERSION_TYPE="${1:-minor}"

echo "Creating release ($VERSION_TYPE)..."

# Run tests before release
./scripts/test.sh

# Bump version and tag
./scripts/version-bump.sh $VERSION_TYPE

# Push to remote
git push origin main
git push origin --tags

# Publish to npm
npm publish

echo "Release completed successfully."