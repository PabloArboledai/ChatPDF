#!/bin/bash
# Script para analizar y limpiar ramas del repositorio ChatPDF
# Uso: ./cleanup_branches.sh [--dry-run|--execute]

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Modo
DRY_RUN=true
if [ "$1" == "--execute" ]; then
    DRY_RUN=false
    print_warning "MODO EJECUCIÓN: Los cambios se aplicarán realmente"
    echo ""
    read -p "¿Estás seguro? (escribe 'SI' para continuar): " -r
    if [ "$REPLY" != "SI" ]; then
        print_error "Operación cancelada"
        exit 1
    fi
else
    print_info "MODO SIMULACIÓN: Solo se mostrarán los cambios propuestos"
    print_info "Usa --execute para aplicar los cambios realmente"
    echo ""
fi

# Obtener todas las ramas remotas
print_header "Analizando Ramas del Repositorio"

git fetch origin --prune

echo "📋 Ramas actuales en GitHub:"
echo ""

# Obtener todas las ramas
ALL_BRANCHES=$(git ls-remote --heads origin | awk '{print $2}' | sed 's|refs/heads/||')

# Rama actual
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
print_info "Rama actual: $CURRENT_BRANCH"
echo ""

# Analizar cada rama
declare -a MAIN_BRANCHES=()
declare -a COPILOT_BRANCHES=()
declare -a OTHER_BRANCHES=()

while IFS= read -r branch; do
    if [ "$branch" == "main" ] || [ "$branch" == "master" ]; then
        MAIN_BRANCHES+=("$branch")
    elif [[ $branch == copilot/* ]]; then
        COPILOT_BRANCHES+=("$branch")
    else
        OTHER_BRANCHES+=("$branch")
    fi
done <<< "$ALL_BRANCHES"

# Mostrar ramas principales
if [ ${#MAIN_BRANCHES[@]} -gt 0 ]; then
    print_success "Ramas Principales (NO se eliminarán):"
    for branch in "${MAIN_BRANCHES[@]}"; do
        echo "  ✓ $branch"
    done
    echo ""
fi

# Mostrar ramas de Copilot
if [ ${#COPILOT_BRANCHES[@]} -gt 0 ]; then
    print_warning "Ramas de Copilot (candidatas a eliminar):"
    for branch in "${COPILOT_BRANCHES[@]}"; do
        # Obtener último commit de la rama
        LAST_COMMIT=$(git log origin/$branch --oneline -1 2>/dev/null || echo "No disponible")
        
        if [ "$branch" == "$CURRENT_BRANCH" ]; then
            echo -e "  ${GREEN}⭐ $branch (ACTUAL - NO se eliminará)${NC}"
        else
            echo "  • $branch"
            echo "    └─ $LAST_COMMIT"
        fi
    done
    echo ""
fi

# Mostrar otras ramas
if [ ${#OTHER_BRANCHES[@]} -gt 0 ]; then
    print_info "Otras Ramas:"
    for branch in "${OTHER_BRANCHES[@]}"; do
        echo "  • $branch"
    done
    echo ""
fi

# Contar ramas a eliminar
declare -a TO_DELETE=()
for branch in "${COPILOT_BRANCHES[@]}"; do
    if [ "$branch" != "$CURRENT_BRANCH" ]; then
        TO_DELETE+=("$branch")
    fi
done

# Resumen
print_header "Resumen de Acciones Propuestas"

echo "Total de ramas: ${#ALL_BRANCHES[@]}"
echo "  - Principales (mantener): ${#MAIN_BRANCHES[@]}"
echo "  - Copilot (candidatas): ${#COPILOT_BRANCHES[@]}"
echo "  - Otras: ${#OTHER_BRANCHES[@]}"
echo ""
echo "Ramas a eliminar: ${#TO_DELETE[@]}"
echo ""

if [ ${#TO_DELETE[@]} -eq 0 ]; then
    print_success "No hay ramas para eliminar"
    exit 0
fi

# Mostrar ramas a eliminar
print_warning "Se eliminarán estas ramas:"
for branch in "${TO_DELETE[@]}"; do
    echo "  ✗ $branch"
done
echo ""

# Ejecutar o simular
if [ "$DRY_RUN" = true ]; then
    print_info "SIMULACIÓN: Para ejecutar realmente, usa: ./cleanup_branches.sh --execute"
    echo ""
    echo "Comandos que se ejecutarían:"
    for branch in "${TO_DELETE[@]}"; do
        echo "  git push origin --delete $branch"
    done
else
    print_header "Eliminando Ramas"
    
    SUCCESS_COUNT=0
    FAIL_COUNT=0
    
    for branch in "${TO_DELETE[@]}"; do
        echo -n "Eliminando $branch... "
        if git push origin --delete "$branch" > /dev/null 2>&1; then
            print_success "OK"
            ((SUCCESS_COUNT++))
        else
            print_error "FALLÓ"
            ((FAIL_COUNT++))
        fi
    done
    
    echo ""
    print_header "Resultado"
    print_success "Ramas eliminadas: $SUCCESS_COUNT"
    if [ $FAIL_COUNT -gt 0 ]; then
        print_error "Ramas que fallaron: $FAIL_COUNT"
    fi
fi

echo ""
print_header "Recomendaciones Finales"
echo ""
echo "1. Considera mergear tu rama actual a main:"
echo "   git checkout main"
echo "   git merge $CURRENT_BRANCH"
echo "   git push origin main"
echo ""
echo "2. Después del merge, puedes eliminar esta rama también:"
echo "   git push origin --delete $CURRENT_BRANCH"
echo ""
echo "3. En el futuro, trabaja siempre desde main:"
echo "   git checkout main"
echo "   git pull origin main"
echo ""
print_success "Análisis completado!"
