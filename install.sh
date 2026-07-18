#!/bin/bash

# ==============================================
# INSTALACIÓN RÁPIDA - LLEEVAMEQ BACKEND
# ==============================================

echo "╔══════════════════════════════════════════╗"
echo "║   🚗 LLEEVAMEQ BACKEND SETUP             ║"
echo "║   Instalación automática                 ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# Verificar Node.js
echo "✓ Verificando Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado"
    echo "   Instala Node.js 20 LTS desde: https://nodejs.org"
    exit 1
fi

CURRENT_NODE_VERSION=$(node -v | sed 's/^v//')
REQUIRED_NODE_MAJOR=20
CURRENT_NODE_MAJOR=$(echo "$CURRENT_NODE_VERSION" | cut -d. -f1)

if [ "$CURRENT_NODE_MAJOR" -lt "$REQUIRED_NODE_MAJOR" ]; then
    echo "❌ Se requiere Node.js 20 LTS o superior"
    echo "   Versión actual: $(node --version)"
    exit 1
fi

echo "   Node.js $(node --version) ✅"

# Verificar npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm no está instalado"
    exit 1
fi
echo "   npm $(npm --version) ✅"

# Instalar dependencias
echo ""
echo "📦 Instalando dependencias..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Error instalando dependencias"
    exit 1
fi
echo "   Dependencias instaladas ✅"

# Crear archivo .env
echo ""
echo "🔧 Configurando variables de entorno..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "   Archivo .env creado ✅"
else
    echo "   Archivo .env ya existe ✅"
fi

# Verificar PostgreSQL
echo ""
echo "🐘 Verificando PostgreSQL..."
if command -v docker &> /dev/null; then
    echo "   Docker detectado ✅"
    echo ""
    echo "¿Quieres iniciar PostgreSQL con Docker? (s/n)"
    read -r response
    if [[ "$response" =~ ^([sS][iI]|[sS])$ ]]; then
        echo "   Iniciando PostgreSQL..."
        docker run --name lleevameq-postgres \
          -e POSTGRES_USER=lleevameq \
          -e POSTGRES_PASSWORD=lleevameq123 \
          -e POSTGRES_DB=lleevameq \
          -p 5432:5432 \
          -d postgres:14
        
        if [ $? -eq 0 ]; then
            echo "   PostgreSQL iniciado ✅"
            sleep 3
        else
            echo "   ⚠️  PostgreSQL ya está corriendo o error al iniciar"
        fi
    fi
else
    echo "   ⚠️  Docker no detectado"
    echo "   Asegúrate de tener PostgreSQL instalado y corriendo"
fi

# Resumen final
echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   ✅ INSTALACIÓN COMPLETA                ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "Próximos pasos:"
echo ""
echo "1. Revisa el archivo .env (opcional)"
echo "2. Inicia el servidor:"
echo "   npm run start:dev"
echo ""
echo "3. El backend estará en:"
echo "   http://localhost:3000/api"
echo ""
echo "4. Prueba el health check:"
echo "   curl http://localhost:3000/api/auth/health"
echo ""
echo "📖 Lee el README.md para más información"
echo ""
