#!/bin/bash
# Script de despliegue automatizado para ChatPDF en civer.online
# Uso: ./deploy_to_production.sh

set -e  # Salir si hay error

echo "🚀 Iniciando despliegue de ChatPDF en civer.online..."
echo ""

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# 1. Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ] && [ ! -d "deploy" ]; then
    print_error "No estás en el directorio raíz del proyecto ChatPDF"
    exit 1
fi

print_success "Directorio correcto verificado"

# 2. Actualizar código desde GitHub
echo ""
echo "📥 Actualizando código desde GitHub..."
if git pull origin copilot/vscode-mjwwofkj-u6qx; then
    print_success "Código actualizado correctamente"
else
    print_error "Error al actualizar el código"
    echo "Intenta resolver conflictos con: git stash && git pull"
    exit 1
fi

# 3. Verificar que existe .env.prod
echo ""
echo "🔍 Verificando configuración..."
if [ ! -f "deploy/.env.prod" ]; then
    print_warning ".env.prod no existe, creándolo desde ejemplo..."
    if [ -f "deploy/.env.prod.example" ]; then
        cp deploy/.env.prod.example deploy/.env.prod
        print_warning "Por favor edita deploy/.env.prod con tus valores antes de continuar"
        echo "Necesitas configurar:"
        echo "  - DOMAIN=civer.online"
        echo "  - ACME_EMAIL=tu-email@ejemplo.com"
        echo "  - POSTGRES_PASSWORD=una-contraseña-segura"
        echo ""
        read -p "¿Has editado el archivo .env.prod? (s/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Ss]$ ]]; then
            print_error "Por favor edita deploy/.env.prod primero"
            exit 1
        fi
    else
        print_error "No se encuentra deploy/.env.prod.example"
        exit 1
    fi
fi

print_success "Configuración verificada"

# 4. Verificar Docker
echo ""
echo "🐳 Verificando Docker..."
if ! command -v docker &> /dev/null; then
    print_error "Docker no está instalado"
    echo "Instala Docker siguiendo: https://docs.docker.com/engine/install/"
    exit 1
fi

if ! docker ps &> /dev/null; then
    print_error "Docker no está corriendo o no tienes permisos"
    echo "Intenta: sudo usermod -aG docker $USER && newgrp docker"
    exit 1
fi

print_success "Docker está disponible"

# 5. Verificar espacio en disco
echo ""
echo "💾 Verificando espacio en disco..."
AVAILABLE_SPACE=$(df -h . | awk 'NR==2 {print $4}')
print_success "Espacio disponible: $AVAILABLE_SPACE"

# 6. Detener servicios antiguos (si existen)
echo ""
echo "🛑 Deteniendo servicios antiguos..."
cd deploy
docker compose -f docker-compose.prod.yml down 2>/dev/null || true
print_success "Servicios detenidos"

# 7. Construir y desplegar
echo ""
echo "🔨 Construyendo y desplegando servicios..."
echo "Esto puede tomar varios minutos..."
if docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build; then
    print_success "Servicios desplegados correctamente"
else
    print_error "Error al desplegar servicios"
    echo ""
    echo "Ver logs con:"
    echo "  docker compose -f deploy/docker-compose.prod.yml logs -f"
    exit 1
fi

# 8. Esperar a que los servicios estén listos
echo ""
echo "⏳ Esperando a que los servicios estén listos..."
sleep 10

# 9. Verificar estado de los servicios
echo ""
echo "🔍 Verificando estado de los servicios..."
docker compose -f docker-compose.prod.yml ps

# 10. Verificar salud de los servicios
echo ""
echo "🏥 Verificando salud de los servicios..."

# Verificar Web
if docker compose -f docker-compose.prod.yml ps web | grep -q "running"; then
    print_success "Servicio web está corriendo"
else
    print_error "Servicio web no está corriendo"
fi

# Verificar API
if docker compose -f docker-compose.prod.yml ps api | grep -q "running"; then
    print_success "Servicio API está corriendo"
else
    print_error "Servicio API no está corriendo"
fi

# Verificar Caddy
if docker compose -f docker-compose.prod.yml ps caddy | grep -q "running"; then
    print_success "Servicio Caddy (HTTPS) está corriendo"
else
    print_error "Servicio Caddy no está corriendo"
fi

# 11. Verificar conectividad
echo ""
echo "🌐 Verificando conectividad..."

# Verificar API interna
if docker compose -f docker-compose.prod.yml exec -T api curl -s http://localhost:8000/health > /dev/null 2>&1; then
    print_success "API responde correctamente"
else
    print_warning "API no responde (puede tomar unos segundos más)"
fi

# 12. Mostrar resumen
echo ""
echo "======================================"
echo "📊 RESUMEN DEL DESPLIEGUE"
echo "======================================"
echo ""
echo "Sitio web: https://civer.online"
echo ""
echo "Servicios desplegados:"
docker compose -f docker-compose.prod.yml ps --format "table {{.Service}}\t{{.Status}}\t{{.Ports}}"
echo ""

# 13. Instrucciones finales
echo "======================================"
echo "✅ DESPLIEGUE COMPLETADO"
echo "======================================"
echo ""
echo "🎯 Próximos pasos:"
echo ""
echo "1. Abre https://civer.online en tu navegador"
echo "2. Verifica que la página carga correctamente"
echo "3. Prueba las nuevas características:"
echo "   - Hero section con 3 tarjetas"
echo "   - Drag & drop de archivos"
echo "   - Auto-refresh en jobs"
echo "   - Animaciones de éxito"
echo ""
echo "📋 Ver guía de pruebas completa:"
echo "   https://github.com/PabloArboledai/ChatPDF/blob/copilot/vscode-mjwwofkj-u6qx/VISUAL_TEST_GUIDE.md"
echo ""
echo "📝 Ver logs en tiempo real:"
echo "   docker compose -f deploy/docker-compose.prod.yml logs -f"
echo ""
echo "🔄 Ver estado de servicios:"
echo "   docker compose -f deploy/docker-compose.prod.yml ps"
echo ""
echo "🛑 Detener servicios:"
echo "   docker compose -f deploy/docker-compose.prod.yml down"
echo ""
print_success "Todo listo! 🎉"
