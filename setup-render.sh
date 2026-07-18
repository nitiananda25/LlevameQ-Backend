#!/bin/bash

# ========================================
# RENDER.COM SETUP AUTOMÁTICO
# Alternativa GRATIS a Railway
# ========================================

clear
echo "╔══════════════════════════════════════════╗"
echo "║   🎨 RENDER.COM - SETUP AUTOMÁTICO     ║"
echo "║   Hosting GRATIS alternativo            ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🎯 RENDER.COM - PLAN GRATIS${NC}"
echo ""
echo "✅ 750 horas/mes gratis (suficiente para 24/7)"
echo "✅ PostgreSQL incluida (90 días gratis, luego $7/mes)"
echo "✅ Deploy automático desde GitHub"
echo "✅ SSL/HTTPS gratis"
echo "✅ WebSockets soportados"
echo "⚠️  El servicio "duerme" después de 15 min inactivo"
echo "   (primer request toma 30-60 segundos en despertar)"
echo ""

echo -e "${YELLOW}NOTA: Render es ideal para desarrollo/pruebas${NC}"
echo -e "${YELLOW}Para producción 24/7, Railway es mejor opción${NC}"
echo ""
echo -e "${YELLOW}¿Continuar con Render? (y/n)${NC}"
read -r response

if [[ ! "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo "Deployment cancelado"
    exit 0
fi

# ========================================
# PREPARAR ARCHIVOS PARA RENDER
# ========================================

echo ""
echo -e "${BLUE}📝 Preparando archivos de configuración...${NC}"

# Crear render.yaml
cat > render.yaml << 'EOF'
services:
  - type: web
    name: lleevameq-backend
    env: node
    region: oregon
    plan: free
    buildCommand: npm install && npm run build
    startCommand: npm run start:prod
    healthCheckPath: /api/auth/health
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3000
      - key: JWT_SECRET
        generateValue: true
      - key: DATABASE_URL
        fromDatabase:
          name: lleevameq-db
          property: connectionString
      - key: CORS_ORIGIN
        value: "*"
      - key: TARIFA_BASE
        value: 3000
      - key: TARIFA_POR_KM
        value: 1500
      - key: TARIFA_POR_MINUTO
        value: 200
      - key: TARIFA_MINIMA
        value: 4000
      - key: RECARGO_NOCTURNO
        value: 20
      - key: RECARGO_HORA_PICO
        value: 30
      - key: MATCHING_RADIUS_KM
        value: 5

databases:
  - name: lleevameq-db
    plan: free
    databaseName: lleevameq
    user: lleevameq
EOF

echo -e "${GREEN}✅ render.yaml creado${NC}"

# Crear Dockerfile optimizado para Render
cat > Dockerfile << 'EOF'
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
EOF

echo -e "${GREEN}✅ Dockerfile creado${NC}"

# Crear .dockerignore
cat > .dockerignore << 'EOF'
node_modules
npm-debug.log
.env
.env.local
.git
.gitignore
README.md
dist
EOF

echo -e "${GREEN}✅ .dockerignore creado${NC}"

# ========================================
# INSTRUCCIONES MANUALES
# ========================================

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   📋 PASOS PARA DEPLOY EN RENDER       ║"
echo "╚══════════════════════════════════════════╝"
echo ""

echo -e "${BLUE}1. Crear cuenta en Render:${NC}"
echo "   https://render.com"
echo "   - Click 'Get Started'"
echo "   - Login con GitHub (recomendado)"
echo ""

echo -e "${BLUE}2. Subir código a GitHub:${NC}"
echo "   ${YELLOW}# Desde la carpeta lleevameq-backend${NC}"
echo "   git init"
echo "   git add ."
echo "   git commit -m 'Initial commit'"
echo "   git remote add origin https://github.com/TU_USUARIO/lleevameq-backend.git"
echo "   git push -u origin main"
echo ""

echo -e "${BLUE}3. Crear servicio en Render:${NC}"
echo "   - En Render Dashboard: 'New +' → 'Web Service'"
echo "   - Conectar tu repositorio GitHub"
echo "   - Seleccionar 'lleevameq-backend'"
echo "   - Render detectará render.yaml automáticamente"
echo "   - Click 'Apply'"
echo ""

echo -e "${BLUE}4. Esperar deployment (5-7 minutos):${NC}"
echo "   - Render construirá la imagen Docker"
echo "   - Instalará dependencias"
echo "   - Iniciará el servidor"
echo ""

echo -e "${BLUE}5. Obtener URL:${NC}"
echo "   - En el dashboard verás: https://lleevameq-backend.onrender.com"
echo "   - Esa es tu URL del backend"
echo ""

# ========================================
# SCRIPT ALTERNATIVO: DEPLOY DIRECTO
# ========================================

echo ""
echo -e "${YELLOW}📌 ALTERNATIVA: Deploy sin GitHub${NC}"
echo ""
echo "Render también permite deploy directo:"
echo ""
echo "1. Instalar Render CLI:"
echo "   npm install -g render-cli"
echo ""
echo "2. Login:"
echo "   render login"
echo ""
echo "3. Deploy:"
echo "   render deploy"
echo ""

# ========================================
# GUÍA DE MONITOREO
# ========================================

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   🔍 MONITOREO EN RENDER                ║"
echo "╚══════════════════════════════════════════╝"
echo ""

echo -e "${BLUE}Ver logs:${NC}"
echo "   - Dashboard → Tu servicio → Logs"
echo "   - Logs en tiempo real"
echo ""

echo -e "${BLUE}Estado del servicio:${NC}"
echo "   - Dashboard → Tu servicio → Events"
echo "   - Historial de deploys"
echo ""

echo -e "${BLUE}Métricas:${NC}"
echo "   - Dashboard → Tu servicio → Metrics"
echo "   - CPU, RAM, Requests"
echo ""

# ========================================
# COMPARACIÓN
# ========================================

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   ⚖️  RENDER VS RAILWAY                  ║"
echo "╚══════════════════════════════════════════╝"
echo ""

echo -e "${BLUE}RENDER:${NC}"
echo "  ✅ 750 horas/mes gratis"
echo "  ✅ Fácil setup con GitHub"
echo "  ⚠️  Servicio duerme (15 min inactivo)"
echo "  ⚠️  Primer request lento después de dormir"
echo "  ⚠️  PostgreSQL gratis solo 90 días"
echo ""

echo -e "${BLUE}RAILWAY (Recomendado):${NC}"
echo "  ✅ 500 horas/mes gratis ($5 USD)"
echo "  ✅ No duerme, siempre activo"
echo "  ✅ PostgreSQL gratis ilimitado"
echo "  ✅ WebSockets mejor soportados"
echo "  ✅ Deploy más rápido"
echo ""

# ========================================
# RESUMEN
# ========================================

echo ""
echo -e "${GREEN}✅ Archivos de configuración creados:${NC}"
echo "   - render.yaml"
echo "   - Dockerfile"
echo "   - .dockerignore"
echo ""

echo -e "${YELLOW}📱 Próximos pasos:${NC}"
echo "   1. Sube el código a GitHub"
echo "   2. Conecta Render con GitHub"
echo "   3. Deploy automático"
echo "   4. Copia la URL"
echo "   5. Actualiza las apps móviles"
echo ""

echo -e "${BLUE}💡 RECOMENDACIÓN:${NC}"
echo "   Para LlevameQ en producción, usa Railway"
echo "   Render es mejor para proyectos pequeños o demos"
echo ""
