#!/bin/bash

# ========================================
# SCRIPT DE DEPLOYMENT A RAILWAY
# LlevameQ - Backend
# ========================================

echo "🚀 SUBIENDO BACKEND A RAILWAY"
echo "=============================="
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: No estás en la carpeta lleevameq-backend"
    echo "   Ejecuta: cd lleevameq-backend"
    exit 1
fi

echo "✅ Directorio correcto"
echo ""

# Verificar si Railway CLI está instalado
if ! command -v railway &> /dev/null; then
    echo "📦 Instalando Railway CLI..."
    npm install -g @railway/cli
    echo "✅ Railway CLI instalado"
else
    echo "✅ Railway CLI ya instalado"
fi
echo ""

# Login
echo "🔐 Abriendo login de Railway..."
echo "   (Se abrirá el navegador)"
railway login
echo "✅ Login completado"
echo ""

# Inicializar proyecto
echo "🎯 Inicializando proyecto..."
railway init
echo "✅ Proyecto inicializado"
echo ""

# Agregar PostgreSQL
echo "🐘 Agregando PostgreSQL..."
railway add
echo "✅ PostgreSQL agregado"
echo ""

# Configurar variables de entorno
echo "⚙️  Configurando variables de entorno..."
railway variables set JWT_SECRET="lleevameq_secret_super_seguro_2024_production"
railway variables set NODE_ENV="production"
railway variables set PORT="3000"
echo "✅ Variables configuradas"
echo ""

# Deploy
echo "🚀 Haciendo deploy..."
railway up
echo "✅ Deploy completado"
echo ""

# Obtener dominio
echo "🌐 Obteniendo URL pública..."
railway domain
echo ""

echo "=============================="
echo "✅ DEPLOYMENT COMPLETADO"
echo "=============================="
echo ""
echo "📋 SIGUIENTE PASO:"
echo "   1. Copia la URL que aparece arriba"
echo "   2. Actualiza App.tsx en ambas apps móviles"
echo "   3. Genera los APKs"
echo ""
echo "Ejemplo de URL:"
echo "https://lleevameq-production-xxxx.up.railway.app"
echo ""
