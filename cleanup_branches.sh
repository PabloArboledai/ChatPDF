#!/usr/bin/env bash

################################################################################
#
# ChatPDF Repository Branch Cleanup Script
#
# Limpia automáticamente branches obsoletos del repositorio después de
# múltiples sesiones de agentes de Copilot.
#
# Requisitos:
#   - Git instalado
#   - Acceso al repositorio remoto
#
# Uso:
#   bash cleanup_branches.sh [opciones]
#
# Opciones:
#   --dry-run          Mostrar cambios sin ejecutarlos
#   --force            Eliminar branches sin preguntar
#   --keep-all         No eliminar nada, solo mostrar branches
#   --help             Mostrar esta ayuda
#
################################################################################

set -euo pipefail

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Opciones
DRY_RUN=false
FORCE=false
KEEP_ALL=false

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
    head -30 "$0" | tail -22
}

################################################################################
# Procesamiento de opciones
################################################################################

while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        --keep-all)
            KEEP_ALL=true
            shift
            ;;
        --help|-h)
            show_help
            exit 0
            ;;
        *)
            print_error "Opción desconocida: $1"
            show_help
            exit 1
            ;;
    esac
done

################################################################################
# Verificación
################################################################################

print_header "🧹 LIMPIEZA DE BRANCHES DEL REPOSITORIO"

if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_error "No se encuentra un repositorio Git"
    exit 1
fi
print_success "Repositorio Git detectado"

print_section "Análisis de branches"

# Obtener rama actual
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
print_info "Rama actual: $CURRENT_BRANCH"

# Actualizar referencias remotas
print_info "Actualizando referencias remotas..."
git fetch origin -p

# Listar branches locales
LOCAL_BRANCHES=$(git branch -l)
print_info "Branches locales:"
echo "$LOCAL_BRANCHES" | sed 's/^/  /'

# Listar branches remotos
print_info "Branches remotos:"
REMOTE_BRANCHES=$(git branch -r | grep -v "origin/HEAD")
echo "$REMOTE_BRANCHES" | sed 's/^/  /'

################################################################################
# Identificar branches para eliminar
################################################################################

print_section "Identificando branches obsoletos"

# Branches creados por agentes de Copilot que deberían ser eliminados
BRANCHES_TO_DELETE=""
PROTECTED_BRANCHES=("main" "master" "develop" "staging")

# Buscar branches de copilot/*
COPILOT_BRANCHES=$(git branch -a | grep -E "copilot/|remotes/origin/copilot/" | sort -u || true)

if [[ -z "$COPILOT_BRANCHES" ]]; then
    print_success "No hay branches de copilot para limpiar"
else
    print_info "Branches de copilot encontrados:"
    echo "$COPILOT_BRANCHES" | sed 's/^/  /'
    
    # Procesar cada branch
    while IFS= read -r branch; do
        # Limpiar nombre del branch
        clean_branch=$(echo "$branch" | sed 's|remotes/||; s|origin/||')
        
        # Verificar si está en protegidos
        if [[ " ${PROTECTED_BRANCHES[@]} " =~ " ${clean_branch} " ]]; then
            print_warning "Protegido: $clean_branch (no se eliminará)"
            continue
        fi
        
        # Verificar si hay diferencias con main
        if git merge-base --is-ancestor "$clean_branch" main 2>/dev/null; then
            BRANCHES_TO_DELETE="$BRANCHES_TO_DELETE $clean_branch"
            print_info "Candidato para eliminar: $clean_branch"
        else
            print_warning "No fusionado en main (se conservará): $clean_branch"
        fi
    done <<< "$COPILOT_BRANCHES"
fi

################################################################################
# Resumir cambios
################################################################################

print_section "Resumen de cambios"

if [[ -z "$BRANCHES_TO_DELETE" ]]; then
    print_success "No hay branches para eliminar"
    exit 0
fi

BRANCH_COUNT=$(echo "$BRANCHES_TO_DELETE" | wc -w)
echo -e "\n${YELLOW}Se eliminarán $BRANCH_COUNT branches:${NC}"
echo "$BRANCHES_TO_DELETE" | tr ' ' '\n' | grep -v "^$" | sed 's/^/  - /'

if [[ "$DRY_RUN" == "true" ]]; then
    print_warning "[DRY RUN] Los cambios anteriores NO se ejecutarán"
    exit 0
fi

if [[ "$KEEP_ALL" == "true" ]]; then
    print_info "Modo --keep-all activo: no se eliminarán branches"
    exit 0
fi

################################################################################
# Confirmación y eliminación
################################################################################

if [[ "$FORCE" != "true" ]]; then
    echo ""
    read -p "¿Deseas eliminar estos branches? (s/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        print_warning "Operación cancelada"
        exit 0
    fi
fi

print_section "Eliminando branches"

for branch in $BRANCHES_TO_DELETE; do
    # Eliminar rama local
    if git show-ref --verify --quiet "refs/heads/$branch"; then
        print_info "Eliminando rama local: $branch"
        git branch -d "$branch" || git branch -D "$branch"
        print_success "Eliminada: $branch"
    fi
    
    # Eliminar rama remota
    if git show-ref --verify --quiet "refs/remotes/origin/$branch"; then
        print_info "Eliminando rama remota: origin/$branch"
        git push origin --delete "$branch" || true
        print_success "Eliminada en remoto: $branch"
    fi
done

################################################################################
# Verificación final
################################################################################

print_section "Verificación final"

print_info "Branches locales restantes:"
git branch -l | sed 's/^/  /'

print_info "Branches remotos restantes:"
git branch -r | grep -v "origin/HEAD" | sed 's/^/  /'

################################################################################
# Resumen
################################################################################

print_section "Resumen de limpieza"

cat << SUMMARY

${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}
${GREEN}║${NC}           ✓ LIMPIEZA DE BRANCHES COMPLETADA                ${GREEN}║${NC}
${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}

Estadísticas:
  - Branches eliminados: $BRANCH_COUNT
  - Rama actual: $CURRENT_BRANCH
  - Estado: Repositorio limpio

Próximas acciones:
  1. Verifica que solo quedan branches principales:
     ${BLUE}git branch -a${NC}
  
  2. Si necesitas recuperar un branch eliminado:
     ${BLUE}git reflog${NC}
  
  3. Para ver cambios pendientes:
     ${BLUE}git status${NC}

SUMMARY

print_success "Limpieza finalizada"
