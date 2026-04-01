#!/bin/bash
set -euo pipefail

REPO="vissong/anchor"
FORMULA="Formula/ianchor.rb"

# Read version from package.json
VERSION=$(node -p "require('./package.json').version")
TAG="v${VERSION}"

echo "==> Publishing ianchor ${TAG}"

# 1. Ensure working tree is clean
if [ -n "$(git status --porcelain)" ]; then
  echo "Error: working tree is not clean. Commit or stash changes first."
  exit 1
fi

# 2. Ensure we're on main and up to date
BRANCH=$(git branch --show-current)
if [ "$BRANCH" != "main" ]; then
  echo "Error: not on main branch (current: ${BRANCH})"
  exit 1
fi

# 3. Run tests
echo "==> Running tests..."
npm test

# 4. Delete old tag if exists (local + remote)
if git tag -l | grep -q "^${TAG}$"; then
  echo "==> Removing old tag ${TAG}..."
  git tag -d "$TAG"
  git push origin ":refs/tags/${TAG}" 2>/dev/null || true
fi

# 5. Push latest code
echo "==> Pushing to origin..."
git push origin main

# 6. Create tag and push
echo "==> Creating tag ${TAG}..."
git tag "$TAG"
git push origin "$TAG"

# 7. Create GitHub release
echo "==> Creating GitHub release..."
gh release create "$TAG" --title "$TAG" --notes "Release ${TAG}" 2>/dev/null || \
  echo "  Release already exists or gh not available, skipping."

# 8. Calculate sha256 from the tarball
echo "==> Calculating sha256..."
TARBALL_URL="https://github.com/${REPO}/archive/refs/tags/${TAG}.tar.gz"
SHA256=$(curl -sL "$TARBALL_URL" | shasum -a 256 | awk '{print $1}')
echo "  sha256: ${SHA256}"

# 9. Update Formula
echo "==> Updating ${FORMULA}..."
sed -i '' "s|url \".*\"|url \"${TARBALL_URL}\"|" "$FORMULA"
sed -i '' "s|sha256 \".*\"|sha256 \"${SHA256}\"|" "$FORMULA"

# 10. Commit and push Formula update
if [ -n "$(git diff --name-only "$FORMULA")" ]; then
  git add "$FORMULA"
  git commit -m "chore: update formula for ${TAG}"
  git push origin main
  echo "==> Formula updated and pushed."
else
  echo "==> Formula already up to date."
fi

echo ""
echo "Done! Users can install with:"
echo "  brew tap vissong/anchor https://github.com/vissong/anchor"
echo "  brew install ianchor"
