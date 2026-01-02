#!/usr/bin/env bash
set -euo pipefail

# Deploy ChatPDF production stack on a VPS.
# Assumes:
# - Repo is present on VPS
# - deploy/.env.prod exists
#
# Usage (run in repo root on VPS):
#   bash deploy/vps/deploy.sh

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

if [[ ! -f deploy/.env.prod ]]; then
  echo "Missing deploy/.env.prod. Create it from deploy/.env.prod.example" >&2
  exit 1
fi

# Pull latest code if repo has remote configured
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git pull --rebase || true
fi

# Build & run
exec docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.prod up -d --build
