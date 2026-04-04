#!/bin/bash
set -euo pipefail

# Usage: ./scripts/tag.sh [patch|minor|major]
# Default: patch

BUMP="${1:-patch}"
CURRENT=$(node -p "require('./package.json').version")

# Ensure we're on main
BRANCH=$(git branch --show-current)
if [ "$BRANCH" != "main" ]; then
  echo "Error: not on main branch (current: ${BRANCH})"
  exit 1
fi

# Ensure working tree is clean
if [ -n "$(git status --porcelain)" ]; then
  echo "Error: working tree is not clean. Commit or stash changes first."
  exit 1
fi

# Bump version
npm version "$BUMP" --no-git-tag-version > /dev/null
VERSION=$(node -p "require('./package.json').version")
TAG="v${VERSION}"

echo "==> ${CURRENT} -> ${VERSION} (${BUMP})"

# Commit version bump
git add package.json
git commit -m "chore: bump version to ${TAG}"

# Delete old tag if exists
if git tag -l | grep -q "^${TAG}$"; then
  echo "==> Removing old tag ${TAG}..."
  git tag -d "$TAG"
  git push origin ":refs/tags/${TAG}" 2>/dev/null || true
fi

# Push code, create and push tag
echo "==> Pushing to origin..."
git push origin main

echo "==> Creating tag ${TAG}..."
git tag "$TAG"
git push origin "$TAG"

echo "==> Done! ${TAG} pushed. GitHub Actions will handle the release."
