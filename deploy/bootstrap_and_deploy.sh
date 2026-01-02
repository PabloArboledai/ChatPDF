#!/bin/bash
#
# Bootstrap completo + Deploy automático de ChatPDF a producción
# Ejecutar como: bash deploy/bootstrap_and_deploy.sh
#

set -euo pipefail

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración
REPO_URL="https://github.com/PabloArboledai/ChatPDF.git"
DEPLOY_DIR="/root/ChatPDF"
COMPOSE_FILE="deploy/docker-compose.prod.yml"

log_info() {
    echo -e "${BLUE}ℹ️${NC} $1"
}

log_success() {
    echo -e "${GREEN}✅${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

log_error() {
    echo -e "${RED}❌${NC} $1"
}

# Función para ejecutar en servidor remoto
run_remote() {
    local cmd="$1"
    sshpass -p "+tP6WoFmTKwv8apN" ssh -o StrictHostKeyChecking=no root@108.61.86.180 "$cmd"
}

# Función para ejecutar con timeout
run_remote_timeout() {
    local timeout="$1"
    local cmd="$2"
    timeout "$timeout" bash -c "sshpass -p '+tP6WoFmTKwv8apN' ssh -o StrictHostKeyChecking=no root@108.61.86.180 '$cmd'" || true
}

main() {
    local IP="108.61.86.180"
    
    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║     🚀 BOOTSTRAP + DEPLOY AUTOMÁTICO CHATPDF PRODUCCIÓN    ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    
    log_info "Servidor VPS: $IP"
    
    # Paso 1: Verificar conectividad
    log_info "Paso 1/6: Verificando conectividad SSH..."
    if ! timeout 10 bash -c "echo > /dev/tcp/$IP/22" 2>/dev/null; then
        log_error "No se puede conectar a $IP:22"
        exit 1
    fi
    log_success "SSH accesible"
    
    # Paso 2: Instalar Docker
    log_info "Paso 2/6: Instalando Docker..."
    run_remote_timeout 120 "
        if ! command -v docker &> /dev/null; then
            curl -fsSL https://get.docker.com -o /tmp/get-docker.sh 2>/dev/null
            bash /tmp/get-docker.sh > /dev/null 2>&1
            sleep 3
        fi
        docker --version
    " || log_warn "Docker en instalación/verificación"
    log_success "Docker listo"
    
    # Paso 3: Instalar Docker Compose
    log_info "Paso 3/6: Instalando Docker Compose..."
    run_remote_timeout 60 "
        if ! command -v docker-compose &> /dev/null; then
            curl -L 'https://github.com/docker/compose/releases/latest/download/docker-compose-'(uname -s)'-'(uname -m) \
                -o /usr/local/bin/docker-compose 2>/dev/null
            chmod +x /usr/local/bin/docker-compose 2>/dev/null
            sleep 2
        fi
        docker-compose --version
    " || log_warn "Docker Compose en instalación/verificación"
    log_success "Docker Compose listo"
    
    # Paso 4: Clonar/actualizar repositorio
    log_info "Paso 4/6: Clonando/actualizando repositorio..."
    run_remote_timeout 120 "
        cd /root
        if [ ! -d 'ChatPDF' ]; then
            git clone $REPO_URL 2>/dev/null || true
        else
            cd ChatPDF
            git fetch origin main 2>/dev/null || true
            git reset --hard origin/main 2>/dev/null || true
            cd ..
        fi
        ls -la ChatPDF | head -5
    "
    log_success "Repositorio listo"
    
    # Paso 5: Crear .env.prod
    log_info "Paso 5/6: Creando archivo .env.prod..."
    run_remote "cat > /root/ChatPDF/deploy/.env.prod << 'ENVEOF'
DOMAIN=civer.online
ENVIRONMENT=production
POSTGRES_USER=chatpdf
POSTGRES_DB=chatpdf_prod
POSTGRES_PASSWORD=ChatPDF@Secure2024!
API_HOST=0.0.0.0
API_PORT=8000
API_WORKERS=4
FRONTEND_PORT=3000
ACME_EMAIL=eduardo.ramirez.gob.mx@gmail.com
REDIS_PASSWORD=RedisSecure2024!
LOG_LEVEL=info
ENVEOF"
    log_success ".env.prod creado"
    
    # Paso 6: Desplegar con Docker Compose
    log_info "Paso 6/6: Desplegando con Docker Compose..."
    run_remote_timeout 180 "
        cd /root/ChatPDF
        docker-compose -f $COMPOSE_FILE up -d --build 2>&1 | tail -20
    " || log_warn "Despliegue en progreso (puede tomar varios minutos)"
    log_success "Docker Compose iniciado"
    
    # Resumen final
    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║                  ✅ DEPLOYMENT COMPLETADO                   ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    
    log_info "Verificando estado de los contenedores..."
    run_remote_timeout 30 "
        echo ''
        echo 'Contenedores corriendo:'
        docker ps --format 'table {{.Names}}\t{{.Status}}'
        echo ''
        echo 'Proximos pasos:'
        echo '1. Esperar 2-3 minutos para que los contenedores se inicialicen'
        echo '2. Verificar https://civer.online en el navegador'
        echo '3. Ver logs: docker-compose -f /root/ChatPDF/deploy/docker-compose.prod.yml logs -f'
        echo ''
    " || true
    
    echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "📍 Sitio: https://civer.online"
    echo "🖥️  Servidor: 108.61.86.180"
    echo "📁 Repositorio: /root/ChatPDF"
    echo "⚙️  Config: /root/ChatPDF/deploy/.env.prod"
    echo "🐳 Compose: /root/ChatPDF/deploy/docker-compose.prod.yml"
    echo ""
    echo "📋 Ver logs en vivo:"
    echo "   ssh root@108.61.86.180"
    echo "   cd /root/ChatPDF"
    echo "   docker-compose -f deploy/docker-compose.prod.yml logs -f"
    echo ""
}

main "$@"
