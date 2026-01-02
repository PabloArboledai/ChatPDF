#!/bin/bash
#
# GESTOR DE PRODUCCIÓN - ChatPDF
# Conjunto de funciones útiles para administrar la instancia en producción
#
# Uso: source admin.sh   (en el servidor)
#

# Variables
SERVER_IP="108.61.86.180"
DEPLOY_DIR="/root/ChatPDF/deploy"
COMPOSE_FILE="docker-compose.prod.yml"

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ============================================================================
# FUNCIONES DE ESTADO
# ============================================================================

status() {
    echo -e "${BLUE}📊 ESTADO ACTUAL DEL DESPLIEGUE${NC}"
    echo "════════════════════════════════════════════════════════"
    cd $DEPLOY_DIR
    docker-compose -f $COMPOSE_FILE ps
    echo ""
    echo -e "${BLUE}📈 RECURSOS${NC}"
    docker stats --no-stream --format "table {{.Container}}\t{{.MemUsage}}\t{{.CPUPerc}}"
}

health() {
    echo -e "${BLUE}🏥 HEALTH CHECK${NC}"
    echo "════════════════════════════════════════════════════════"
    
    echo -n "🌐 Sitio (https://civer.online): "
    if curl -s -I https://civer.online 2>/dev/null | grep -q "200"; then
        echo -e "${GREEN}✅ OK${NC}"
    else
        echo -e "${RED}❌ ERROR${NC}"
    fi
    
    echo -n "⚙️  API (/health): "
    if docker-compose -f $COMPOSE_FILE exec -T api curl -s http://localhost:8000/health 2>/dev/null | grep -q "ok"; then
        echo -e "${GREEN}✅ OK${NC}"
    else
        echo -e "${RED}❌ ERROR${NC}"
    fi
    
    echo -n "🐘 Base de Datos: "
    if docker-compose -f $COMPOSE_FILE exec -T postgres pg_isready -U chatpdf -d chatpdf_prod > /dev/null 2>&1; then
        echo -e "${GREEN}✅ OK${NC}"
    else
        echo -e "${RED}❌ ERROR${NC}"
    fi
    
    echo -n "🔴 Redis: "
    if docker-compose -f $COMPOSE_FILE exec -T redis redis-cli ping > /dev/null 2>&1; then
        echo -e "${GREEN}✅ OK${NC}"
    else
        echo -e "${RED}❌ ERROR${NC}"
    fi
}

# ============================================================================
# FUNCIONES DE LOGS
# ============================================================================

logs() {
    local service=${1:-all}
    cd $DEPLOY_DIR
    
    case $service in
        api)
            echo -e "${BLUE}📋 LOGS API (últimas 50 líneas)${NC}"
            docker-compose -f $COMPOSE_FILE logs --tail=50 api
            ;;
        web)
            echo -e "${BLUE}📋 LOGS WEB (últimas 50 líneas)${NC}"
            docker-compose -f $COMPOSE_FILE logs --tail=50 web
            ;;
        db|postgres)
            echo -e "${BLUE}📋 LOGS BASE DE DATOS (últimas 50 líneas)${NC}"
            docker-compose -f $COMPOSE_FILE logs --tail=50 postgres
            ;;
        caddy)
            echo -e "${BLUE}📋 LOGS CADDY (últimas 50 líneas)${NC}"
            docker-compose -f $COMPOSE_FILE logs --tail=50 caddy
            ;;
        all)
            echo -e "${BLUE}📋 LOGS TODOS LOS SERVICIOS (últimas 30 líneas)${NC}"
            docker-compose -f $COMPOSE_FILE logs --tail=30
            ;;
        *)
            echo "Uso: logs [api|web|db|caddy|all]"
            ;;
    esac
}

logs_follow() {
    local service=${1:-all}
    cd $DEPLOY_DIR
    
    case $service in
        api)
            docker-compose -f $COMPOSE_FILE logs -f api
            ;;
        web)
            docker-compose -f $COMPOSE_FILE logs -f web
            ;;
        all)
            docker-compose -f $COMPOSE_FILE logs -f
            ;;
        *)
            echo "Uso: logs_follow [api|web|all]"
            ;;
    esac
}

# ============================================================================
# FUNCIONES DE CONTROL
# ============================================================================

restart() {
    local service=${1:-all}
    cd $DEPLOY_DIR
    
    if [ "$service" = "all" ]; then
        echo -e "${YELLOW}🔄 Reiniciando todos los servicios...${NC}"
        docker-compose -f $COMPOSE_FILE restart
    else
        echo -e "${YELLOW}🔄 Reiniciando $service...${NC}"
        docker-compose -f $COMPOSE_FILE restart $service
    fi
    
    sleep 2
    echo -e "${GREEN}✅ Reinicio completado${NC}"
    status
}

stop() {
    echo -e "${YELLOW}⏹️  Deteniendo todos los servicios...${NC}"
    cd $DEPLOY_DIR
    docker-compose -f $COMPOSE_FILE stop
    echo -e "${GREEN}✅ Servicios detenidos${NC}"
}

start() {
    echo -e "${YELLOW}▶️  Iniciando todos los servicios...${NC}"
    cd $DEPLOY_DIR
    docker-compose -f $COMPOSE_FILE up -d
    echo -e "${GREEN}✅ Servicios iniciados${NC}"
    sleep 3
    status
}

down() {
    echo -e "${RED}⚠️  ADVERTENCIA: Esto va a detener todos los servicios y eliminar la red${NC}"
    read -p "¿Está seguro? (s/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        cd $DEPLOY_DIR
        docker-compose -f $COMPOSE_FILE down
        echo -e "${GREEN}✅ Servicios detenidos y red removida${NC}"
    else
        echo "Cancelado"
    fi
}

# ============================================================================
# FUNCIONES DE ACTUALIZACIÓN
# ============================================================================

update() {
    echo -e "${BLUE}📥 Actualizando código desde GitHub...${NC}"
    cd /root/ChatPDF
    
    echo "Obteniendo cambios..."
    git fetch origin main
    
    echo "Sincronizando..."
    git reset --hard origin/main
    
    echo -e "${YELLOW}🔨 Reconstruyendo contenedores...${NC}"
    cd $DEPLOY_DIR
    docker-compose -f $COMPOSE_FILE up -d --build
    
    echo -e "${GREEN}✅ Actualización completada${NC}"
    sleep 3
    status
}

update_env() {
    echo -e "${YELLOW}⚙️  Actualizando variables de entorno...${NC}"
    cd $DEPLOY_DIR
    
    # Recargar variables
    export $(cat .env | xargs)
    
    echo -e "${YELLOW}🔄 Reiniciando servicios...${NC}"
    docker-compose -f $COMPOSE_FILE restart
    
    echo -e "${GREEN}✅ Variables actualizadas${NC}"
}

# ============================================================================
# FUNCIONES DE BASE DE DATOS
# ============================================================================

db_shell() {
    echo -e "${BLUE}🐘 Conectando a PostgreSQL...${NC}"
    cd $DEPLOY_DIR
    docker-compose -f $COMPOSE_FILE exec postgres psql -U chatpdf -d chatpdf_prod
}

db_backup() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="/root/chatpdf_backup_${timestamp}.sql"
    
    echo -e "${BLUE}💾 Haciendo backup de base de datos...${NC}"
    cd $DEPLOY_DIR
    
    docker-compose -f $COMPOSE_FILE exec -T postgres pg_dump -U chatpdf -d chatpdf_prod > $backup_file
    
    if [ -f "$backup_file" ]; then
        local size=$(du -h $backup_file | cut -f1)
        echo -e "${GREEN}✅ Backup completado${NC}"
        echo "Archivo: $backup_file (${size})"
    else
        echo -e "${RED}❌ Error en el backup${NC}"
    fi
}

db_stats() {
    echo -e "${BLUE}📊 Estadísticas de Base de Datos${NC}"
    cd $DEPLOY_DIR
    docker-compose -f $COMPOSE_FILE exec -T postgres psql -U chatpdf -d chatpdf_prod << EOF
-- Tamaño de la base de datos
SELECT pg_size_pretty(pg_database_size(current_database())) as "Tamaño BD";

-- Tabla con mayor tamaño
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 5;

-- Número de tablas
SELECT count(*) as "Total Tablas" FROM information_schema.tables WHERE table_schema = 'public';

-- Conexiones activas
SELECT count(*) as "Conexiones Activas" FROM pg_stat_activity;
EOF
}

# ============================================================================
# FUNCIONES DE LIMPIARZA
# ============================================================================

cleanup() {
    echo -e "${YELLOW}🧹 Limpiando recursos no utilizados...${NC}"
    
    echo "Imágenes no utilizadas..."
    docker image prune -a -f --filter "until=72h"
    
    echo "Volúmenes no utilizados..."
    docker volume prune -f
    
    echo "Redes no utilizadas..."
    docker network prune -f
    
    echo -e "${GREEN}✅ Limpieza completada${NC}"
}

cleanup_deep() {
    echo -e "${RED}⚠️  ADVERTENCIA: Esto va a eliminar TODO (incluyendo datos)${NC}"
    read -p "¿Está COMPLETAMENTE seguro? (escriba 'SI' para continuar): " confirmation
    
    if [ "$confirmation" = "SI" ]; then
        docker system prune -a --volumes -f
        echo -e "${GREEN}✅ Limpieza profunda completada${NC}"
    else
        echo "Cancelado"
    fi
}

# ============================================================================
# FUNCIONES DE INFORMACIÓN
# ============================================================================

info() {
    echo -e "${BLUE}ℹ️  INFORMACIÓN DEL SERVIDOR${NC}"
    echo "════════════════════════════════════════════════════════"
    echo "IP:               108.61.86.180"
    echo "Hostname:         $(hostname)"
    echo "OS:               $(cat /etc/os-release | grep PRETTY_NAME)"
    echo "Kernel:           $(uname -r)"
    echo "Uptime:           $(uptime -p)"
    echo ""
    echo -e "${BLUE}💾 ALMACENAMIENTO${NC}"
    df -h | grep "^/dev/vda"
    echo ""
    echo -e "${BLUE}🐳 DOCKER${NC}"
    echo "Docker:           $(docker --version)"
    echo "Docker Compose:   $(docker-compose --version)"
    echo "Contenedores:     $(docker ps -q | wc -l)/$(docker ps -aq | wc -l)"
    echo "Imágenes:         $(docker images -q | wc -l)"
    echo "Volúmenes:        $(docker volume ls -q | wc -l)"
    echo ""
    echo -e "${BLUE}🌐 REDES${NC}"
    echo "Puertos:          "
    netstat -tlnp 2>/dev/null | grep -E ":(80|443)" | awk '{print "                  " $4 " -> " $7}'
}

help() {
    cat << EOF
${BLUE}╔════════════════════════════════════════════════════════════╗${NC}
${BLUE}║          GESTOR DE PRODUCCIÓN - ChatPDF                   ║${NC}
${BLUE}╚════════════════════════════════════════════════════════════╝${NC}

${GREEN}ESTADO Y MONITOREO:${NC}
  status              Mostrar estado actual de todos los servicios
  health              Ejecutar health check de todos los servicios
  info                Información del servidor

${GREEN}LOGS:${NC}
  logs [servicio]     Ver logs (api, web, db, caddy, all)
  logs_follow [srv]   Ver logs en tiempo real

${GREEN}CONTROL DE SERVICIOS:${NC}
  start               Iniciar todos los servicios
  stop                Detener todos los servicios
  restart [srv]       Reiniciar servicios (opcional especificar cual)
  down                Detener servicios y remover red

${GREEN}ACTUALIZACIONES:${NC}
  update              Actualizar código desde GitHub y redeploy
  update_env          Recargar variables de entorno

${GREEN}BASE DE DATOS:${NC}
  db_shell            Abrir shell de PostgreSQL
  db_backup           Hacer backup de la base de datos
  db_stats            Ver estadísticas de la base de datos

${GREEN}MANTENIMIENTO:${NC}
  cleanup             Limpiar recursos no utilizados
  cleanup_deep        Limpieza profunda (CUIDADO: elimina todo)

${GREEN}OTROS:${NC}
  help                Mostrar esta ayuda

${YELLOW}EJEMPLOS:${NC}
  logs api            Ver logs del API
  logs_follow web     Ver logs del frontend en tiempo real
  restart api         Reiniciar solo el servicio API
  update              Actualizar código y redeploy

${YELLOW}CONFIGURACIÓN:${NC}
  Archivo .env:       ${DEPLOY_DIR}/.env
  Docker Compose:     ${DEPLOY_DIR}/${COMPOSE_FILE}
  Repositorio:        /root/ChatPDF

${YELLOW}SITIO:${NC}
  https://civer.online

EOF
}

# ============================================================================
# MENÚ INTERACTIVO (si se ejecuta sin argumentos)
# ============================================================================

if [ "$#" -eq 0 ]; then
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║          GESTOR DE PRODUCCIÓN - ChatPDF                   ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    help
fi
