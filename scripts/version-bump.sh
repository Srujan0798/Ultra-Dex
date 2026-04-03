#!/bin/bash
set -e

# Version bump script with tagging
VERSION_TYPE="${1:-patch}"

echo "Bumping version ($VERSION_TYPE)..."

# Bump version
npm version $VERSION_TYPE --no-git-tag-version

# Get new version
VERSION=$(node -p "require('./package.json').version")

# Commit changes
git add package.json package-lock.json
git commit -m "chore: bump version to $VERSION"

# Create tag
git tag "v$VERSION"

echo "Version bumped to $VERSION and tagged as v$VERSION"