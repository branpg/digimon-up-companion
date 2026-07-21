#!/bin/bash
set -e

# =============================================================================
# Deploy script for Digimon UP Companion
# 
# Pulls latest code, runs tests inside Docker, builds the production image,
# pushes to the private registry, and recreates the container locally.
#
# Usage: ./deploy.sh [--skip-tests]
#
# Requirements:
#   - Docker with buildx support
#   - Access to registry.branpg.net
# =============================================================================

IMAGE="registry.branpg.net/digimonup:current"
COMPOSE_DIR="/opt/stacks/digimonup"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# --- Parse arguments ---
SKIP_TESTS=false
for arg in "$@"; do
  case $arg in
    --skip-tests) SKIP_TESTS=true ;;
    *) warn "Unknown argument: $arg" ;;
  esac
done

# --- Pre-flight checks ---
info "Running pre-flight checks..."
command -v docker >/dev/null 2>&1 || error "Docker is not installed"
command -v git >/dev/null 2>&1 || error "Git is not available"

# --- Pull latest changes ---
info "Pulling latest changes from remote..."
git pull || error "git pull failed. Resolve conflicts before deploying."

# --- Run tests inside Docker ---
if [ "$SKIP_TESTS" = false ]; then
  info "Running tests in Docker..."
  docker run --rm -w /app \
    -v "$(pwd)":/app \
    node:20-alpine \
    sh -c "npm ci && npm test" \
    || error "Tests failed. Fix them before deploying or use --skip-tests"
fi

# --- Build Docker image ---
info "Building Docker image: $IMAGE"
docker build -t "$IMAGE" .

# --- Push to registry ---
info "Pushing image to registry..."
docker push "$IMAGE"

# --- Deploy container ---
info "Deploying container..."
cd "$COMPOSE_DIR"
docker compose up -d --force-recreate

info "Deploy complete! 🎉"
echo "  → https://digimonup.branpg.net"
