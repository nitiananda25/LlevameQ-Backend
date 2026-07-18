#!/bin/bash

# ========================================
# OPTIMIZAR DOMINIO RAILWAY
# Mejora tu URL actual de Railway
# ========================================

clear
echo "╔══════════════════════════════════════════╗"
echo "║   🌐 OPTIMIZAR DOMINIO RAILWAY         ║"
echo "║   Mejora tu URL actual                  ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Debes ejecutar este script desde lleevameq-backend/${NC}"
    exit 1
fi

# Verificar Railway CLI
if ! command -v railway &> /dev/null; then
    echo -e "${RED}❌ Railway CLI no instalado${NC}"
    echo "Instalar: npm install -g @railway/cli"
    exit 1
fi

echo -e "${BLUE}🎯 Este script te ayuda a:${NC}"
echo "1. Ver tu URL actual"
echo "2. Generar nuevo dominio (más corto)"
echo "3. Configurar dominio personalizado"
echo "4. Optimizar para apps móviles"
echo ""

# ========================================
# PASO 1: VER URL ACTUAL
# ========================================

echo ""
echo -e "${BLUE}📊 PASO 1: URL actual de tu backend${NC}"
echo ""

CURRENT_URL=$(railway domain 2>/dev/null | grep "https://" | tail -1 | tr -d ' ')

if [ -z "$CURRENT_URL" ]; then
    echo -e "${YELLOW}⚠️  No se pudo obtener la URL automáticamente${NC}"
    echo ""
    echo "Ejecuta manualmente:"
    echo "  railway domain"
    echo ""
    exit 1
fi

echo -e "${GREEN}Tu URL actual:${NC}"
echo "  $CURRENT_URL"
echo ""

# Analizar la URL
URL_LENGTH=${#CURRENT_URL}
if [ $URL_LENGTH -gt 60 ]; then
    echo -e "${YELLOW}⚠️  URL un poco larga (${URL_LENGTH} caracteres)${NC}"
    echo -e "${YELLOW}   Puedes generar una más corta${NC}"
else
    echo -e "${GREEN}✅ URL de longitud adecuada${NC}"
fi

echo ""
sleep 2

# ========================================
# PASO 2: OPCIONES
# ========================================

echo ""
echo -e "${BLUE}🔧 ¿Qué quieres hacer?${NC}"
echo ""
echo "1) Usar URL actual (está bien así)"
echo "2) Generar nuevo dominio Railway (más corto)"
echo "3) Configurar dominio personalizado (si tienes uno)"
echo "4) Ver información para apps móviles"
echo "5) Salir"
echo ""
read -p "Elige una opción (1-5): " opcion

case $opcion in
    1)
        # Opción 1: Mantener actual
        echo ""
        echo -e "${GREEN}✅ Perfecto, tu URL actual está bien${NC}"
        echo ""
        echo -e "${CYAN}📱 Para tus apps móviles, usa:${NC}"
        echo ""
        echo "const API_URL = '$CURRENT_URL/api';"
        echo "const WS_URL = '$CURRENT_URL';"
        echo ""
        ;;
        
    2)
        # Opción 2: Generar nuevo
        echo ""
        echo -e "${YELLOW}🔄 Generando nuevo dominio...${NC}"
        echo ""
        
        railway domain --generate
        
        sleep 2
        NEW_URL=$(railway domain 2>/dev/null | grep "https://" | tail -1 | tr -d ' ')
        
        if [ ! -z "$NEW_URL" ]; then
            echo ""
            echo -e "${GREEN}✅ Nuevo dominio generado:${NC}"
            echo "  $NEW_URL"
            echo ""
            echo -e "${YELLOW}⚠️  IMPORTANTE: Actualiza las apps móviles con esta nueva URL${NC}"
            echo ""
            echo "const API_URL = '$NEW_URL/api';"
            echo "const WS_URL = '$NEW_URL';"
        else
            echo -e "${RED}❌ Error generando nuevo dominio${NC}"
        fi
        ;;
        
    3)
        # Opción 3: Dominio personalizado
        echo ""
        echo -e "${CYAN}🌐 CONFIGURAR DOMINIO PERSONALIZADO${NC}"
        echo ""
        echo "Para usar un dominio propio (ej: api.lleevameq.com):"
        echo ""
        echo "1. Compra un dominio (.com, .co, etc)"
        echo "2. En tu proveedor DNS, crea un CNAME:"
        echo ""
        echo "   Tipo: CNAME"
        echo "   Nombre: api"
        echo "   Valor: $CURRENT_URL (sin https://)"
        echo ""
        echo "3. En Railway Dashboard:"
        echo "   Settings → Domains → Add Custom Domain"
        echo ""
        echo "4. Ingresa: api.tudominio.com"
        echo ""
        echo "5. Railway configurará SSL automáticamente"
        echo ""
        echo -e "${YELLOW}¿Tienes un dominio listo para configurar? (y/n)${NC}"
        read -r tiene_dominio
        
        if [[ "$tiene_dominio" =~ ^([yY][eE][sS]|[yY])$ ]]; then
            echo ""
            read -p "Ingresa tu dominio (ej: api.lleevameq.com): " custom_domain
            
            if [ ! -z "$custom_domain" ]; then
                echo ""
                echo -e "${YELLOW}Para configurar ${custom_domain}:${NC}"
                echo ""
                echo "1. En tu DNS:"
                echo "   CNAME $custom_domain → ${CURRENT_URL#https://}"
                echo ""
                echo "2. Luego ejecuta:"
                echo "   railway domain add $custom_domain"
                echo ""
            fi
        fi
        ;;
        
    4)
        # Opción 4: Info para apps
        echo ""
        echo -e "${CYAN}📱 CONFIGURACIÓN PARA APPS MÓVILES${NC}"
        echo ""
        echo -e "${GREEN}Copia y pega esto en App.tsx de ambas apps (línea 23):${NC}"
        echo ""
        echo "// ========== PRODUCCIÓN =========="
        echo "const API_URL = '$CURRENT_URL/api';"
        echo "const WS_URL = '$CURRENT_URL';"
        echo ""
        echo -e "${YELLOW}Archivos a editar:${NC}"
        echo "  - lleevameq-passenger-app/App.tsx (línea 23)"
        echo "  - lleevameq-driver-app/App.tsx (línea 23)"
        echo ""
        echo -e "${YELLOW}Después:${NC}"
        echo "  - Genera APKs nuevos"
        echo "  - Instala en celulares"
        echo "  - ¡Listo!"
        echo ""
        ;;
        
    5)
        # Salir
        echo ""
        echo "👋 Hasta luego"
        exit 0
        ;;
        
    *)
        echo ""
        echo -e "${RED}Opción inválida${NC}"
        exit 1
        ;;
esac

# ========================================
# VERIFICAR BACKEND
# ========================================

echo ""
echo -e "${BLUE}🔍 Verificando que el backend responde...${NC}"
echo ""

HEALTH_CHECK=$(curl -s "${CURRENT_URL}/api/auth/health" 2>/dev/null)

if [[ $HEALTH_CHECK == *"ok"* ]]; then
    echo -e "${GREEN}✅ Backend funcionando correctamente${NC}"
    echo "   Health check: OK"
else
    echo -e "${YELLOW}⚠️  Backend no responde o aún iniciando${NC}"
    echo "   Prueba manualmente: ${CURRENT_URL}/api/auth/health"
fi

# ========================================
# INFORMACIÓN ADICIONAL
# ========================================

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   📊 INFORMACIÓN ADICIONAL              ║"
echo "╚══════════════════════════════════════════╝"
echo ""

echo -e "${BLUE}🌐 Tu backend está en:${NC}"
echo "  $CURRENT_URL"
echo ""

echo -e "${BLUE}📊 Endpoints disponibles:${NC}"
echo "  $CURRENT_URL/api/auth/health"
echo "  $CURRENT_URL/api/auth/login"
echo "  $CURRENT_URL/api/auth/register"
echo "  $CURRENT_URL/api/rides"
echo ""

echo -e "${BLUE}🔧 Comandos útiles:${NC}"
echo "  railway domain              # Ver dominio actual"
echo "  railway domain --generate   # Generar nuevo"
echo "  railway logs                # Ver logs"
echo "  railway status              # Estado del proyecto"
echo ""

echo -e "${BLUE}💡 Tips:${NC}"
echo "  • El dominio Railway es perfecto para apps móviles"
echo "  • SSL/HTTPS ya está configurado"
echo "  • No necesitas dominio propio para empezar"
echo "  • Cuando crezcas, ahí sí compra uno"
echo ""

echo -e "${GREEN}✅ ¡Listo!${NC}"
echo ""
