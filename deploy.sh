#!/bin/bash
set -e

# =============================================================================
# Deploy script for Digimon UP Companion
# 
# Runs tests inside Docker, builds the production image, pushes to the
# private registry, and restarts the container on the remote server via SSH.
#
# Usage: ./deploy.sh [--skip-tests]
#
# Requirements:
#   - Docker with buildx support
#   - SSH access to the deployment server
#   - Access to registry.branpg.net
# =============================================================================

IMAGE="registry.branpg.net/digimonup:current"
REMOTE_HOST="branpg.net"
REMOTE_USER="deploy"
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
command -v ssh >/dev/null 2>&1 || error "SSH is not available"

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

# --- Deploy on remote server ---
info "Deploying on remote server ($REMOTE_USER@$REMOTE_HOST)..."
ssh "$REMOTE_USER@$REMOTE_HOST" << EOF
  cd $COMPOSE_DIR
  docker pull $IMAGE
  docker compose up -d --force-recreate
EOF

info "Deploy complete! 🎉"
echo "  → https://digimonup.branpg.net"
