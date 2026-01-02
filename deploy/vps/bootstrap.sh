#!/usr/bin/env bash
set -euo pipefail

# Bootstraps a fresh Ubuntu VPS for ChatPDF production deployment.
# Usage (run on the VPS):
#   sudo bash deploy/vps/bootstrap.sh

if [[ $EUID -ne 0 ]]; then
  echo "Please run as root (sudo)." >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive

apt-get update -y
apt-get install -y --no-install-recommends \
  ca-certificates \
  curl \
  git \
  ufw

# Docker (official convenience script)
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi

# Enable docker compose plugin (installed with docker on Ubuntu via the script)
if ! docker compose version >/dev/null 2>&1; then
  echo "docker compose not found. Check Docker installation." >&2
  exit 1
fi

# Firewall: allow SSH + HTTP/HTTPS
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Helpful: create a non-root deploy user if missing
if ! id -u deploy >/dev/null 2>&1; then
  adduser --disabled-password --gecos "" deploy
  usermod -aG docker deploy
fi

echo "OK: VPS bootstrapped. Next steps:"
cat <<'EOF'
1) Log in as deploy user (recommended):
   su - deploy
2) Clone/pull the repo:
   git clone https://github.com/PabloArboledai/ChatPDF
   cd ChatPDF
3) Configure env:
   cp deploy/.env.prod.example deploy/.env.prod
   nano deploy/.env.prod
4) Deploy:
   docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.prod up -d --build
EOF
