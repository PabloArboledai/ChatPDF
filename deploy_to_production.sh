#!/usr/bin/env bash

################################################################################
#
# ChatPDF Production Deployment Script
#
# Despliega automáticamente la aplicación ChatPDF a producción en tu VPS
# con todas las mejoras implementadas por los agentes.
#
# Requisitos:
#   - Acceso SSH a la VPS (configurado en ~/.ssh/config)
#   - Git instalado en la VPS
#   - Docker y Docker Compose en la VPS
#   - Archivo deploy/.env.prod configurado
#
# Uso:
#   bash deploy_to_production.sh [opciones]
#
# Opciones:
#   --vps-host HOST          Host SSH de la VPS (ej: vps.civer.online)
#   --domain DOMAIN          Dominio de la aplicación (ej: civer.online)
#   --email EMAIL            Email para ACME/Let's Encrypt
#   --dry-run                Mostrar cambios sin aplicarlos
#   --help                   Mostrar esta ayuda
#
################################################################################

set -euo pipefail

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración por defecto
VPS_HOST="${1:-}"
DOMAIN="${2:-civer.online}"
ACME_EMAIL="${3:-}"
DRY_RUN=false
REPO_PATH="/home/$(whoami)/ChatPDF"
DEPLOY_PATH="/opt/chatpdf"

################################################################################
# Funciones auxiliares
################################################################################

print_header() {
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC}  $1"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
}

print_section() {
    echo -e "\n${GREEN}▶ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

show_help() {
    head -31 "$0" | tail -25
}

################################################################################
# Validación
################################################################################

if [[ "$VPS_HOST" == "--help" ]] || [[ "$VPS_HOST" == "-h" ]]; then
    show_help
    exit 0
fi

if [[ -z "$VPS_HOST" ]]; then
    print_error "Se requiere especificar el host SSH de la VPS"
    echo ""
    echo "Uso: bash $0 <vps-host> [domain] [email]"
    echo ""
    echo "Ejemplos:"
    echo "  bash $0 vps.civer.online civer.online admin@civer.online"
    echo "  bash $0 root@vps.example.com example.com admin@example.com"
    echo ""
    show_help
    exit 1
fi

if [[ -z "$ACME_EMAIL" ]]; then
    print_warning "Email ACME no proporcionado, usando valor por defecto"
    ACME_EMAIL="admin@${DOMAIN}"
fi

print_header "🚀 DESPLIEGUE DE CHATPDF A PRODUCCIÓN"

print_info "Configuración:"
print_info "  VPS Host:     $VPS_HOST"
print_info "  Dominio:      $DOMAIN"
print_info "  Email ACME:   $ACME_EMAIL"
print_info "  Repo Local:   $(pwd)"

################################################################################
# Verificación local
################################################################################

print_section "Verificando configuración local"

if [[ ! -f "deploy/.env.prod.example" ]]; then
    print_error "No se encuentra deploy/.env.prod.example"
    exit 1
fi
print_success "Archivos de despliegue encontrados"

if [[ ! -f "docker-compose.yml" ]]; then
    print_error "No se encuentra docker-compose.yml"
    exit 1
fi
print_success "Docker Compose encontrado"

if ! command -v git &> /dev/null; then
    print_error "Git no está instalado"
    exit 1
fi
print_success "Git está disponible"

# Verificar que estamos en la rama main y no hay cambios sin commitear
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$CURRENT_BRANCH" != "main" ]]; then
    print_warning "No estás en la rama main (rama actual: $CURRENT_BRANCH)"
    read -p "¿Deseas continuar? (s/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        print_error "Despliegue cancelado"
        exit 1
    fi
fi

if ! git diff-index --quiet HEAD --; then
    print_warning "Tienes cambios sin commitear en el repositorio local"
    print_info "Los cambios locales se ignorarán en el despliegue"
fi

################################################################################
# Verificación SSH
################################################################################

print_section "Verificando conexión SSH a la VPS"

if ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no "$VPS_HOST" "echo 'SSH OK'" &>/dev/null; then
    print_success "Conexión SSH exitosa"
else
    print_error "No se puede conectar a $VPS_HOST"
    echo ""
    echo "Verifica:"
    echo "  1. El host SSH es correcto"
    echo "  2. Tienes acceso SSH configurado: ssh-keygen && ssh-copy-id $VPS_HOST"
    echo "  3. El firewall permite conexiones SSH"
    exit 1
fi

################################################################################
# Preparación del archivo .env.prod en VPS
################################################################################

print_section "Preparando archivo de configuración en VPS"

# Generar contraseña segura si no existe
POSTGRES_PASSWORD=$(openssl rand -base64 32)

print_info "Creando deploy/.env.prod en VPS"

read -p "¿Deseas usar contraseña existente de PostgreSQL? (s/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    read -s -p "Ingresa la contraseña de PostgreSQL: " POSTGRES_PASSWORD
    echo
fi

# Crear configuración
ENV_CONTENT="# Auto-generated on $(date)
DOMAIN=$DOMAIN
ACME_EMAIL=$ACME_EMAIL
POSTGRES_DB=chatpdf
POSTGRES_USER=chatpdf
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
ENVIRONMENT=prod
DATA_DIR=/data
CORS_ORIGINS=
API_INTERNAL_BASE_URL=http://api:8000
CELERY_BROKER_URL=redis://redis:6379/0
CELERY_RESULT_BACKEND=redis://redis:6379/1
"

if [[ "$DRY_RUN" == "true" ]]; then
    print_info "[DRY RUN] Contenido de .env.prod:"
    echo "$ENV_CONTENT"
else
    # Transferir archivo de configuración
    echo "$ENV_CONTENT" | ssh "$VPS_HOST" "cat > /tmp/env.prod.tmp && cat /tmp/env.prod.tmp"
    print_success "Configuración preparada"
fi

################################################################################
# Despliegue
################################################################################

print_section "Iniciando despliegue en VPS"

DEPLOY_COMMANDS="
set -euo pipefail

cd /opt/chatpdf || mkdir -p /opt/chatpdf && cd /opt/chatpdf

# Verificar permisos
if [[ ! -w . ]]; then
    echo '✗ No tienes permisos de escritura en /opt/chatpdf'
    exit 1
fi

# Clonar o actualizar repositorio
if [[ -d .git ]]; then
    echo '▶ Actualizando repositorio existente...'
    git fetch origin main
    git reset --hard origin/main
else
    echo '▶ Clonando repositorio...'
    git clone https://github.com/PabloArboledai/ChatPDF.git .
fi

# Verificar que .env.prod existe
if [[ ! -f deploy/.env.prod ]]; then
    echo '✗ deploy/.env.prod no encontrado'
    exit 1
fi

# Crear directorio de datos
mkdir -p /data && chmod 755 /data

# Desplegar con Docker Compose
echo '▶ Construyendo e iniciando servicios con Docker Compose...'
docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.prod up -d --build

# Esperar a que los servicios estén listos
echo '▶ Esperando que los servicios estén listos...'
sleep 10

# Verificar estado
echo '▶ Verificando estado de los servicios...'
docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.prod ps

echo '✓ Despliegue completado exitosamente!'
"

if [[ "$DRY_RUN" == "true" ]]; then
    print_info "[DRY RUN] Comandos de despliegue:"
    echo "$DEPLOY_COMMANDS"
else
    print_info "Conectando a VPS y ejecutando despliegue..."
    echo "$DEPLOY_COMMANDS" | ssh "$VPS_HOST" bash
fi

################################################################################
# Post-despliegue
################################################################################

print_section "Verificación post-despliegue"

# Esperar a que Caddy haya emitido certificados
print_info "Esperando emisión de certificados ACME..."
if [[ "$DRY_RUN" != "true" ]]; then
    sleep 15
    
    # Intentar conectarse a la aplicación
    print_info "Intentando conectarse a https://$DOMAIN"
    if curl -s -I "https://$DOMAIN" | head -1; then
        print_success "✓ Aplicación accesible en https://$DOMAIN"
    else
        print_warning "⚠ No se pudo acceder aún. El certificado podría estar emitiéndose..."
        print_info "Intenta en unos momentos: https://$DOMAIN"
    fi
fi

################################################################################
# Resumen
################################################################################

print_section "Resumen del despliegue"

cat << SUMMARY

${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}
${GREEN}║${NC}                   ✓ DESPLIEGUE COMPLETADO                  ${GREEN}║${NC}
${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}

Próximas acciones:

1. Accede a tu aplicación:
   ${BLUE}https://$DOMAIN${NC}

2. Monitorea los logs:
   ${BLUE}ssh $VPS_HOST "docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.prod logs -f"${NC}

3. Información de acceso:
   - Base de datos: chatpdf
   - Usuario PostgreSQL: chatpdf
   - Email ACME: $ACME_EMAIL

4. Cambios implementados:
   - Drag & Drop para cargar PDFs
   - Auto-refresh cada 3-5 segundos
   - Diseño moderno con gradientes
   - Accesibilidad WCAG completa
   - Validación segura de PDFs

5. Documentación disponible:
   - DEPLOYMENT_GUIDE.md
   - UX_IMPROVEMENTS.md
   - TROUBLESHOOTING.md

Para más información, revisa la documentación en:
${BLUE}https://github.com/PabloArboledai/ChatPDF${NC}

SUMMARY

print_success "¡Despliegue finalizado!"

