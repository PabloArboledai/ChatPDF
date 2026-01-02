#!/bin/bash
set -euo pipefail

echo ">>> Starting remote deployment on VPS..."

export DEBIAN_FRONTEND=noninteractive

# 1. Install git and Docker (from Ubuntu repos to avoid 404s)
echo ">>> Installing git and docker..."
apt-get update -y
apt-get install -y git docker.io docker-compose-v2

# 2. Clone repo
echo ">>> Cloning repository..."
if [ -d "ChatPDF" ]; then
    echo "ChatPDF directory already exists. Removing it to start fresh..."
    rm -rf ChatPDF
fi
git clone https://github.com/PabloArboledai/ChatPDF.git
cd ChatPDF

# 3. Bootstrap
echo ">>> Running bootstrap..."
bash deploy/vps/bootstrap.sh

# 4. Configure .env.prod
echo ">>> Configuring .env.prod..."
cp deploy/.env.prod.example deploy/.env.prod

# Replace values
sed -i 's/DOMAIN=chatpdf.tudominio.com/DOMAIN=civer.online/g' deploy/.env.prod
sed -i 's/ACME_EMAIL=tu-email@tudominio.com/ACME_EMAIL=eduardo.ramirez.gob.mx@gmail.com/g' deploy/.env.prod

# Generate random DB password
DB_PASS=$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9')
sed -i "s/POSTGRES_PASSWORD=CAMBIA_ESTA_PASSWORD_LARGA/POSTGRES_PASSWORD=$DB_PASS/g" deploy/.env.prod

echo ">>> Configuration complete. .env.prod content (secrets redacted):"
grep -v "PASSWORD" deploy/.env.prod

# 5. Deploy
echo ">>> Running deploy.sh..."
bash deploy/vps/deploy.sh

echo ">>> Deployment finished successfully!"
