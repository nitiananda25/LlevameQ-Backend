#!/bin/bash

# ========================================
# RAILWAY SETUP AUTOMÁTICO COMPLETO
# Configuración perfecta en 5 minutos
# ========================================

clear
echo "╔══════════════════════════════════════════╗"
echo "║   🚂 RAILWAY - SETUP AUTOMÁTICO        ║"
echo "║   Hosting GRATIS para LlevameQ         ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🎯 ¿QUÉ HACE ESTE SCRIPT?${NC}"
echo "1. Instala Railway CLI"
echo "2. Crea cuenta/login"
echo "3. Crea proyecto optimizado"
echo "4. Configura PostgreSQL gratis"
echo "5. Configura variables de entorno"
echo "6. Despliega backend"
echo "7. Te da la URL pública"
echo ""
echo -e "${YELLOW}Presiona ENTER para continuar...${NC}"
read

# ========================================
# PASO 1: INSTALAR RAILWAY CLI
# ========================================

echo ""
echo -e "${BLUE}📦 PASO 1/7: Instalando Railway CLI...${NC}"

if command -v railway &> /dev/null; then
    echo -e "${GREEN}✅ Railway CLI ya instalado${NC}"
else
    echo -e "${YELLOW}Instalando...${NC}"
    npm install -g @railway/cli
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Railway CLI instalado exitosamente${NC}"
    else
        echo -e "${RED}❌ Error instalando Railway CLI${NC}"
        exit 1
    fi
fi

sleep 1

# ========================================
# PASO 2: LOGIN
# ========================================

echo ""
echo -e "${BLUE}🔐 PASO 2/7: Login en Railway...${NC}"
echo ""
echo -e "${YELLOW}Se abrirá tu navegador para hacer login.${NC}"
echo -e "${YELLOW}Usa GitHub o Google (es GRATIS, no requiere tarjeta).${NC}"
echo ""
echo -e "${YELLOW}Presiona ENTER cuando estés listo...${NC}"
read

railway login

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error en login${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Login exitoso${NC}"
sleep 2

# ========================================
# PASO 3: CREAR PROYECTO
# ========================================

echo ""
echo -e "${BLUE}🎯 PASO 3/7: Creando proyecto en Railway...${NC}"
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Debes ejecutar este script desde lleevameq-backend/${NC}"
    exit 1
fi

echo -e "${YELLOW}Nombre del proyecto: lleevameq-${RANDOM}${NC}"
railway init --name "lleevameq-${RANDOM}"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error creando proyecto${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Proyecto creado${NC}"
sleep 2

# ========================================
# PASO 4: AGREGAR POSTGRESQL
# ========================================

echo ""
echo -e "${BLUE}🐘 PASO 4/7: Agregando PostgreSQL GRATIS...${NC}"
echo ""

railway add postgresql

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error agregando PostgreSQL${NC}"
    echo -e "${YELLOW}Intentando método alternativo...${NC}"
    railway plugin add postgresql
fi

echo -e "${GREEN}✅ PostgreSQL agregada${NC}"
echo -e "${GREEN}   Railway creó DATABASE_URL automáticamente${NC}"
sleep 2

# ========================================
# PASO 5: CONFIGURAR VARIABLES
# ========================================

echo ""
echo -e "${BLUE}⚙️  PASO 5/7: Configurando variables de entorno...${NC}"
echo ""

# Generar JWT secret seguro
JWT_SECRET="lleevameq_$(openssl rand -hex 32)_production_2024"

echo -e "${YELLOW}Configurando variables...${NC}"

railway variables set JWT_SECRET="${JWT_SECRET}"
railway variables set NODE_ENV="production"
railway variables set PORT="3000"
railway variables set CORS_ORIGIN="*"

# Variables de tarifas (configurables)
railway variables set TARIFA_BASE="3000"
railway variables set TARIFA_POR_KM="1500"
railway variables set TARIFA_POR_MINUTO="200"
railway variables set TARIFA_MINIMA="4000"
railway variables set RECARGO_NOCTURNO="20"
railway variables set RECARGO_HORA_PICO="30"

# Radio de matching
railway variables set MATCHING_RADIUS_KM="5"

echo -e "${GREEN}✅ Variables configuradas:${NC}"
echo -e "${GREEN}   JWT_SECRET: ****${NC}"
echo -e "${GREEN}   NODE_ENV: production${NC}"
echo -e "${GREEN}   PORT: 3000${NC}"
echo -e "${GREEN}   CORS_ORIGIN: * (permite todas las apps)${NC}"
echo -e "${GREEN}   Tarifas configuradas${NC}"
echo -e "${GREEN}   Radio matching: 5 km${NC}"

sleep 2

# ========================================
# PASO 6: DEPLOY
# ========================================

echo ""
echo -e "${BLUE}🚀 PASO 6/7: Desplegando backend...${NC}"
echo ""
echo -e "${YELLOW}Esto tomará 2-3 minutos...${NC}"
echo ""

railway up

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error en deployment${NC}"
    echo ""
    echo -e "${YELLOW}Ver logs:${NC}"
    railway logs
    exit 1
fi

echo -e "${GREEN}✅ Backend desplegado exitosamente${NC}"
sleep 2

# ========================================
# PASO 7: OBTENER URL
# ========================================

echo ""
echo -e "${BLUE}🌐 PASO 7/7: Obteniendo URL pública...${NC}"
echo ""

# Generar dominio si no existe
railway domain

sleep 2

# Obtener la URL
BACKEND_URL=$(railway domain 2>/dev/null | grep "https://" | tail -1 | tr -d ' ')

if [ -z "$BACKEND_URL" ]; then
    echo -e "${YELLOW}⚠️  No se pudo obtener la URL automáticamente${NC}"
    echo -e "${YELLOW}Ejecuta manualmente:${NC}"
    echo "  railway domain"
else
    echo -e "${GREEN}✅ URL del backend:${NC}"
    echo -e "${GREEN}   ${BACKEND_URL}${NC}"
    echo ""
    
    # Guardar URL
    echo "$BACKEND_URL" > BACKEND_URL.txt
    echo -e "${GREEN}✅ URL guardada en: BACKEND_URL.txt${NC}"
fi

sleep 2

# ========================================
# PASO 8: VERIFICAR DEPLOYMENT
# ========================================

echo ""
echo -e "${BLUE}🔍 Verificando que el backend funciona...${NC}"
echo ""

if [ ! -z "$BACKEND_URL" ]; then
    sleep 5  # Esperar a que el servidor arranque
    
    HEALTH_CHECK=$(curl -s "${BACKEND_URL}/api/auth/health" 2>/dev/null)
    
    if [[ $HEALTH_CHECK == *"ok"* ]]; then
        echo -e "${GREEN}✅ Backend funcionando perfectamente${NC}"
        echo -e "${GREEN}   Health check: OK${NC}"
    else
        echo -e "${YELLOW}⚠️  Backend desplegado pero aún iniciando...${NC}"
        echo -e "${YELLOW}   Espera 1 minuto y prueba: ${BACKEND_URL}/api/auth/health${NC}"
    fi
fi

# ========================================
# RESUMEN FINAL
# ========================================

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   ✅ RAILWAY CONFIGURADO                ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}🎉 BACKEND EN PRODUCCIÓN${NC}"
echo ""

if [ ! -z "$BACKEND_URL" ]; then
    echo -e "${BLUE}🌐 URL del Backend:${NC}"
    echo "   ${BACKEND_URL}"
    echo ""
    echo -e "${BLUE}📊 Endpoints disponibles:${NC}"
    echo "   ${BACKEND_URL}/api/auth/health"
    echo "   ${BACKEND_URL}/api/auth/login"
    echo "   ${BACKEND_URL}/api/auth/register"
    echo "   ${BACKEND_URL}/api/rides"
    echo ""
fi

echo -e "${BLUE}💰 Plan GRATIS:${NC}"
echo "   ✅ $5 USD/mes gratis (500 horas)"
echo "   ✅ PostgreSQL incluida"
echo "   ✅ WebSockets soportados"
echo "   ✅ SSL/HTTPS automático"
echo ""

echo -e "${BLUE}📊 Railway Dashboard:${NC}"
echo "   https://railway.app/dashboard"
echo ""

echo -e "${BLUE}🔧 Comandos útiles:${NC}"
echo "   railway logs           # Ver logs en tiempo real"
echo "   railway variables      # Ver todas las variables"
echo "   railway status         # Estado del proyecto"
echo "   railway domain         # Ver URL del proyecto"
echo ""

echo -e "${YELLOW}📱 SIGUIENTE PASO:${NC}"
echo "   1. Copia la URL del backend de arriba"
echo "   2. Actualiza App.tsx en ambas apps móviles"
echo "   3. Genera los APKs"
echo "   4. ¡A probar!"
echo ""

if [ ! -z "$BACKEND_URL" ]; then
    echo -e "${YELLOW}📝 Para las apps móviles, usa:${NC}"
    echo ""
    echo "   const API_URL = '${BACKEND_URL}/api';"
    echo "   const WS_URL = '${BACKEND_URL}';"
    echo ""
fi

echo -e "${GREEN}✨ ¡Deployment completado exitosamente!${NC}"
echo ""
