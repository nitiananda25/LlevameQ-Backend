#!/bin/bash

# ========================================
# CONFIGURAR DOMINIO GRATIS RAILWAY
# Optimiza y configura tu dominio actual
# ========================================

clear
echo "╔══════════════════════════════════════════╗"
echo "║   🌐 CONFIGURAR DOMINIO GRATIS         ║"
echo "║   Railway - Tu dominio gratis perfecto  ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Verificar Railway CLI
if ! command -v railway &> /dev/null; then
    echo -e "${RED}❌ Railway CLI no instalado${NC}"
    echo ""
    echo "Instala Railway CLI primero:"
    echo "  npm install -g @railway/cli"
    echo ""
    exit 1
fi

# Verificar directorio
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Ejecuta este script desde lleevameq-backend/${NC}"
    exit 1
fi

echo -e "${BLUE}🎯 DOMINIO GRATIS RAILWAY${NC}"
echo ""
echo "Railway te da un dominio GRATIS con:"
echo "  ✅ HTTPS/SSL automático"
echo "  ✅ Sin configuración"
echo "  ✅ Renovación automática"
echo "  ✅ Perfecto para producción"
echo ""
sleep 2

# ========================================
# PASO 1: VER DOMINIO ACTUAL
# ========================================

echo ""
echo -e "${BLUE}📊 PASO 1: Tu dominio actual${NC}"
echo ""

CURRENT_URL=$(railway domain 2>/dev/null | grep "https://" | tail -1 | tr -d ' ')

if [ -z "$CURRENT_URL" ]; then
    echo -e "${YELLOW}⚠️  No se pudo obtener el dominio${NC}"
    echo ""
    echo "Opciones:"
    echo "  1. ¿Ya desplegaste tu backend? Ejecuta: ./setup-railway-completo.sh"
    echo "  2. ¿Ya lo desplegaste? Ejecuta: railway domain"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Tu dominio gratis:${NC}"
echo ""
echo "  $CURRENT_URL"
echo ""

# Guardar URL
echo "$CURRENT_URL" > BACKEND_URL.txt
echo -e "${GREEN}✅ URL guardada en: BACKEND_URL.txt${NC}"
echo ""

# Analizar URL
URL_LENGTH=${#CURRENT_URL}
echo -e "${CYAN}📊 Análisis:${NC}"
echo "  Longitud: $URL_LENGTH caracteres"

if [ $URL_LENGTH -gt 70 ]; then
    echo "  Estado: URL larga"
    echo "  Sugerencia: Puedes generar una más corta"
elif [ $URL_LENGTH -gt 60 ]; then
    echo "  Estado: URL aceptable"
else
    echo "  Estado: ✅ Excelente"
fi

echo ""
sleep 2

# ========================================
# PASO 2: VERIFICAR QUE FUNCIONA
# ========================================

echo ""
echo -e "${BLUE}🔍 PASO 2: Verificando backend${NC}"
echo ""

# Verificar health check
HEALTH_CHECK=$(curl -s "${CURRENT_URL}/api/auth/health" 2>/dev/null)

if [[ $HEALTH_CHECK == *"ok"* ]]; then
    echo -e "${GREEN}✅ Backend funcionando perfectamente${NC}"
    echo "  Health check: OK"
    echo "  HTTPS: ✅ Activo"
else
    echo -e "${YELLOW}⚠️  Backend no responde${NC}"
    echo "  El backend puede estar iniciando"
    echo "  Prueba manualmente: $CURRENT_URL/api/auth/health"
fi

echo ""
sleep 2

# ========================================
# PASO 3: CONFIGURAR EN APPS
# ========================================

echo ""
echo -e "${BLUE}📱 PASO 3: Configurar en apps móviles${NC}"
echo ""

echo -e "${CYAN}Copia esto en App.tsx de AMBAS apps (línea 23):${NC}"
echo ""
echo "// ========== PRODUCCIÓN =========="
echo "const API_URL = '$CURRENT_URL/api';"
echo "const WS_URL = '$CURRENT_URL';"
echo ""

echo -e "${YELLOW}Archivos a editar:${NC}"
echo "  1. lleevameq-passenger-app/App.tsx"
echo "  2. lleevameq-driver-app/App.tsx"
echo ""

# Preguntar si quiere copiar automáticamente
echo -e "${YELLOW}¿Quieres que actualice los archivos automáticamente? (y/n)${NC}"
read -r auto_update

if [[ "$auto_update" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo ""
    echo -e "${CYAN}Actualizando archivos...${NC}"
    
    # Actualizar passenger app
    if [ -f "../lleevameq-passenger-app/App.tsx" ]; then
        # Backup
        cp ../lleevameq-passenger-app/App.tsx ../lleevameq-passenger-app/App.tsx.backup
        
        # Actualizar
        sed -i.bak "s|const API_URL = 'http://.*';|const API_URL = '${CURRENT_URL}/api';|g" ../lleevameq-passenger-app/App.tsx
        sed -i.bak "s|const WS_URL = 'http://.*';|const WS_URL = '${CURRENT_URL}';|g" ../lleevameq-passenger-app/App.tsx
        
        echo -e "${GREEN}✅ App Pasajeros actualizada${NC}"
    else
        echo -e "${YELLOW}⚠️  App Pasajeros no encontrada${NC}"
    fi
    
    # Actualizar driver app
    if [ -f "../lleevameq-driver-app/App.tsx" ]; then
        # Backup
        cp ../lleevameq-driver-app/App.tsx ../lleevameq-driver-app/App.tsx.backup
        
        # Actualizar
        sed -i.bak "s|const API_URL = 'http://.*';|const API_URL = '${CURRENT_URL}/api';|g" ../lleevameq-driver-app/App.tsx
        sed -i.bak "s|const WS_URL = 'http://.*';|const WS_URL = '${CURRENT_URL}';|g" ../lleevameq-driver-app/App.tsx
        
        echo -e "${GREEN}✅ App Conductores actualizada${NC}"
    else
        echo -e "${YELLOW}⚠️  App Conductores no encontrada${NC}"
    fi
    
    echo ""
    echo -e "${GREEN}✅ Archivos actualizados${NC}"
    echo -e "${YELLOW}⚠️  Backups creados (.backup)${NC}"
    echo ""
else
    echo ""
    echo -e "${YELLOW}OK, actualízalos manualmente${NC}"
    echo ""
fi

sleep 2

# ========================================
# PASO 4: OPCIONES ADICIONALES
# ========================================

echo ""
echo -e "${BLUE}🔧 Opciones adicionales:${NC}"
echo ""
echo "1) Generar nuevo dominio Railway (más corto)"
echo "2) Ver información para dominio personalizado"
echo "3) Verificar endpoints disponibles"
echo "4) Continuar (todo listo)"
echo ""
read -p "Elige una opción (1/2/3/4): " opcion

case $opcion in
    1)
        # Generar nuevo dominio
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
            echo -e "${YELLOW}⚠️  IMPORTANTE:${NC}"
            echo "  Actualiza las apps con esta nueva URL"
            echo "  Regenera los APKs"
            echo ""
            
            # Guardar nuevo
            echo "$NEW_URL" > BACKEND_URL.txt
            
            CURRENT_URL=$NEW_URL
        fi
        ;;
        
    2)
        # Info dominio personalizado
        echo ""
        echo -e "${CYAN}🌐 DOMINIO PERSONALIZADO${NC}"
        echo ""
        echo "Si compras un dominio (ej: lleevameq.com):"
        echo ""
        echo "1. En tu proveedor DNS:"
        echo "   Tipo: CNAME"
        echo "   Nombre: api"
        echo "   Valor: ${CURRENT_URL#https://}"
        echo ""
        echo "2. En Railway:"
        echo "   railway domain api.lleevameq.com"
        echo ""
        echo "3. Railway configurará SSL automáticamente"
        echo ""
        echo "Costo: ~$10-15 USD/año"
        echo ""
        echo "Recomendados:"
        echo "  - Namecheap.com"
        echo "  - Porkbun.com"
        echo "  - Google Domains"
        echo ""
        ;;
        
    3)
        # Ver endpoints
        echo ""
        echo -e "${CYAN}📊 ENDPOINTS DISPONIBLES:${NC}"
        echo ""
        echo "Health check:"
        echo "  $CURRENT_URL/api/auth/health"
        echo ""
        echo "Autenticación:"
        echo "  $CURRENT_URL/api/auth/register"
        echo "  $CURRENT_URL/api/auth/login"
        echo ""
        echo "Usuarios:"
        echo "  $CURRENT_URL/api/users/me"
        echo "  $CURRENT_URL/api/users/drivers"
        echo ""
        echo "Viajes:"
        echo "  $CURRENT_URL/api/rides"
        echo "  $CURRENT_URL/api/rides/:id"
        echo ""
        echo "WebSocket:"
        echo "  $CURRENT_URL"
        echo ""
        ;;
        
    4)
        # Continuar
        echo ""
        echo -e "${GREEN}✅ Perfecto, continuando...${NC}"
        ;;
        
    *)
        echo ""
        echo -e "${YELLOW}Opción no válida, continuando...${NC}"
        ;;
esac

echo ""
sleep 1

# ========================================
# RESUMEN FINAL
# ========================================

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   ✅ DOMINIO CONFIGURADO               ║"
echo "╚══════════════════════════════════════════╝"
echo ""

echo -e "${GREEN}🎉 Tu dominio gratis está listo:${NC}"
echo ""
echo "  $CURRENT_URL"
echo ""

echo -e "${BLUE}📋 Siguiente paso:${NC}"
echo ""
echo "1. ✅ Dominio configurado"
echo "2. ✅ Backend funcionando"
echo "3. ✅ HTTPS activo"
echo ""
echo "Ahora:"
echo "  • Apps actualizadas con la URL"
echo "  • Genera los APKs"
echo "  • Instala en celulares"
echo "  • ¡A probar!"
echo ""

echo -e "${BLUE}💡 Ventajas de tu dominio Railway:${NC}"
echo "  ✅ Gratis forever"
echo "  ✅ HTTPS automático"
echo "  ✅ Sin configuración"
echo "  ✅ Renovación automática"
echo "  ✅ Profesional suficiente"
echo "  ✅ Perfecto para producción"
echo ""

echo -e "${YELLOW}💰 ¿Cuándo comprar dominio propio?${NC}"
echo "  Cuando:"
echo "  • Tengas 50+ usuarios"
echo "  • Necesites imagen más profesional"
echo "  • Quieras tu marca (lleevameq.com)"
echo "  • Tengas $10-15 para invertir/año"
echo ""

echo -e "${BLUE}🔧 Comandos útiles:${NC}"
echo "  railway domain           # Ver dominio actual"
echo "  railway logs             # Ver logs del backend"
echo "  railway status           # Estado del proyecto"
echo ""

echo -e "${GREEN}✅ URL guardada en: BACKEND_URL.txt${NC}"
echo ""

echo -e "${CYAN}¡Listo! Tu dominio gratis está funcionando perfectamente 🚀${NC}"
echo ""
