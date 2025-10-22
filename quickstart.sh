#!/bin/bash

# Quick Start script for OWASP Demo on GCP
# This is an interactive wizard that guides you through the deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

clear

cat << "EOF"
   ____  _       _____   _____ _____  
  / __ \| |     / /   | / ____|  __ \ 
 | |  | | |    / / /| || (___ | |__) |
 | |  | | |   / / ___ | \___ \|  ___/ 
 | |__| | |  / / /  | | ____) | |     
  \____/|_| /_/_/   |_||_____/|_|     
                                       
  Vulnerabilities Demo - Quick Start
EOF

echo ""
echo -e "${BLUE}=== Bienvenido al asistente de despliegue ===${NC}"
echo ""
echo "Este asistente te guiará paso a paso para:"
echo "  1. Configurar tu proyecto de Google Cloud"
echo "  2. Crear la infraestructura necesaria"
echo "  3. Desplegar la aplicación"
echo "  4. Configurar la base de datos"
echo ""
echo -e "${YELLOW}Requisitos previos:${NC}"
echo "  ✓ Cuenta de GCP con facturación habilitada"
echo "  ✓ gcloud CLI instalado y autenticado"
echo "  ✓ Proyecto de GCP creado"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ Error: gcloud CLI no está instalado${NC}"
    echo ""
    echo "Por favor instálalo desde: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

echo -e "${GREEN}✓ gcloud CLI detectado${NC}"
echo ""

# Check authentication
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &> /dev/null; then
    echo -e "${YELLOW}⚠️  No estás autenticado en gcloud${NC}"
    echo "Ejecutando: gcloud auth login"
    gcloud auth login
fi

CURRENT_ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -n1)
echo -e "${GREEN}✓ Autenticado como: $CURRENT_ACCOUNT${NC}"
echo ""

# Get or set project
CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null || echo "")

if [ -z "$CURRENT_PROJECT" ]; then
    echo -e "${YELLOW}No hay un proyecto configurado.${NC}"
    echo ""
    echo "Tus proyectos disponibles:"
    gcloud projects list --format="table(projectId,name,projectNumber)"
    echo ""
    echo "Ingresa el Project ID que deseas usar:"
    read -r PROJECT_ID
    gcloud config set project "$PROJECT_ID"
else
    echo -e "${GREEN}Proyecto actual: $CURRENT_PROJECT${NC}"
    echo ""
    echo "¿Deseas usar este proyecto? (Y/n):"
    read -r USE_CURRENT
    
    if [ "$USE_CURRENT" = "n" ] || [ "$USE_CURRENT" = "N" ]; then
        echo "Ingresa el Project ID que deseas usar:"
        read -r PROJECT_ID
        gcloud config set project "$PROJECT_ID"
    else
        PROJECT_ID="$CURRENT_PROJECT"
    fi
fi

echo ""
echo -e "${BLUE}=== Proyecto seleccionado: ${GREEN}$PROJECT_ID${NC}"
echo ""

# Check if already configured
if [ -f "gcp-config.env" ]; then
    echo -e "${YELLOW}⚠️  Detectada configuración previa (gcp-config.env)${NC}"
    echo ""
    echo "Opciones:"
    echo "  1) Usar configuración existente"
    echo "  2) Reconfigurar desde cero (eliminará recursos existentes)"
    echo "  3) Cancelar"
    echo ""
    echo "Selecciona una opción (1-3):"
    read -r CONFIG_OPTION
    
    case $CONFIG_OPTION in
        1)
            echo -e "${GREEN}Usando configuración existente${NC}"
            source gcp-config.env
            ;;
        2)
            echo -e "${YELLOW}Reconfigurando...${NC}"
            mv gcp-config.env gcp-config.env.backup
            ;;
        3)
            echo "Cancelado."
            exit 0
            ;;
        *)
            echo -e "${RED}Opción inválida${NC}"
            exit 1
            ;;
    esac
fi

echo ""
echo -e "${BLUE}=== Pasos del despliegue ===${NC}"
echo ""

PS3="Selecciona una opción: "
options=(
    "Configuración completa (Setup + Deploy + Migrations)"
    "Solo configurar infraestructura (Setup)"
    "Solo desplegar aplicación (Deploy)"
    "Solo ejecutar migraciones (Migrations)"
    "Ver URLs de servicios"
    "Ver logs"
    "Eliminar todo (Cleanup)"
    "Salir"
)

select opt in "${options[@]}"
do
    case $opt in
        "Configuración completa (Setup + Deploy + Migrations)")
            echo ""
            echo -e "${GREEN}=== Iniciando configuración completa ===${NC}"
            echo ""
            
            # Make scripts executable
            chmod +x scripts/*.sh
            
            # Step 1: Setup
            echo -e "${BLUE}Paso 1/3: Configurando GCP...${NC}"
            ./scripts/setup-gcp.sh
            
            echo ""
            echo -e "${BLUE}Paso 2/3: Desplegando aplicación...${NC}"
            ./scripts/deploy.sh
            
            echo ""
            echo -e "${BLUE}Paso 3/3: Ejecutando migraciones...${NC}"
            ./scripts/run-migrations.sh
            
            echo ""
            echo -e "${GREEN}✨ ¡Despliegue completo exitoso! ✨${NC}"
            echo ""
            
            # Show URLs
            source gcp-config.env
            FRONTEND_URL=$(gcloud run services describe "$SERVICE_NAME_FRONTEND" \
                --region="$REGION" \
                --project="$PROJECT_ID" \
                --format="value(status.url)" 2>/dev/null || echo "")
            
            if [ ! -z "$FRONTEND_URL" ]; then
                echo -e "${GREEN}🌐 Accede a tu aplicación en:${NC}"
                echo -e "   ${BLUE}$FRONTEND_URL${NC}"
            fi
            
            break
            ;;
        "Solo configurar infraestructura (Setup)")
            chmod +x scripts/*.sh
            ./scripts/setup-gcp.sh
            echo ""
            echo -e "${GREEN}✓ Configuración completada${NC}"
            ;;
        "Solo desplegar aplicación (Deploy)")
            if [ ! -f "gcp-config.env" ]; then
                echo -e "${RED}❌ Configuración no encontrada. Ejecuta 'Setup' primero.${NC}"
            else
                chmod +x scripts/*.sh
                ./scripts/deploy.sh
                echo ""
                echo -e "${GREEN}✓ Despliegue completado${NC}"
            fi
            ;;
        "Solo ejecutar migraciones (Migrations)")
            if [ ! -f "gcp-config.env" ]; then
                echo -e "${RED}❌ Configuración no encontrada. Ejecuta 'Setup' primero.${NC}"
            else
                chmod +x scripts/*.sh
                ./scripts/run-migrations.sh
                echo ""
                echo -e "${GREEN}✓ Migraciones completadas${NC}"
            fi
            ;;
        "Ver URLs de servicios")
            if [ ! -f "gcp-config.env" ]; then
                echo -e "${RED}❌ Configuración no encontrada.${NC}"
            else
                source gcp-config.env
                echo ""
                echo -e "${GREEN}URLs de servicios:${NC}"
                echo ""
                
                for service in "$SERVICE_NAME_FRONTEND" "$SERVICE_NAME_BACKEND" "$SERVICE_NAME_ATTACKER"; do
                    URL=$(gcloud run services describe "$service" \
                        --region="$REGION" \
                        --project="$PROJECT_ID" \
                        --format="value(status.url)" 2>/dev/null || echo "No desplegado")
                    echo -e "  ${YELLOW}$service:${NC}"
                    echo -e "    $URL"
                done
                echo ""
            fi
            ;;
        "Ver logs")
            if [ ! -f "gcp-config.env" ]; then
                echo -e "${RED}❌ Configuración no encontrada.${NC}"
            else
                source gcp-config.env
                echo ""
                echo "Selecciona el servicio:"
                echo "  1) Backend"
                echo "  2) Frontend"
                echo "  3) Attacker"
                read -r SERVICE_CHOICE
                
                case $SERVICE_CHOICE in
                    1) SERVICE="$SERVICE_NAME_BACKEND" ;;
                    2) SERVICE="$SERVICE_NAME_FRONTEND" ;;
                    3) SERVICE="$SERVICE_NAME_ATTACKER" ;;
                    *) echo "Opción inválida"; continue ;;
                esac
                
                echo ""
                echo -e "${GREEN}Logs de $SERVICE (últimas 50 líneas):${NC}"
                echo ""
                gcloud run logs read "$SERVICE" \
                    --region="$REGION" \
                    --project="$PROJECT_ID" \
                    --limit=50
            fi
            ;;
        "Eliminar todo (Cleanup)")
            chmod +x scripts/*.sh
            ./scripts/cleanup.sh
            echo ""
            echo -e "${GREEN}✓ Limpieza completada${NC}"
            ;;
        "Salir")
            echo ""
            echo -e "${GREEN}¡Hasta pronto!${NC}"
            break
            ;;
        *)
            echo -e "${RED}Opción inválida${NC}"
            ;;
    esac
    
    echo ""
    echo "---"
    echo ""
done

echo ""
echo -e "${BLUE}Documentación adicional:${NC}"
echo "  - Guía de despliegue: ${GREEN}DEPLOYMENT.md${NC}"
echo "  - README principal: ${GREEN}README.md${NC}"
echo "  - Terraform: ${GREEN}terraform/README.md${NC}"

