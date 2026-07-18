#!/bin/bash

# ========================================
# ASISTENTE INTERACTIVO DE HOSTING
# Te ayuda a elegir y configurar el mejor
# ========================================

clear
echo "╔══════════════════════════════════════════╗"
echo "║   🌟 ASISTENTE DE HOSTING GRATIS       ║"
echo "║   LlevameQ - Elige el mejor hosting    ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# ========================================
# FUNCIÓN: RECOMENDACIÓN
# ========================================

function recomendar_hosting() {
    local proposito=$1
    local experiencia=$2
    local presupuesto=$3
    
    echo ""
    echo -e "${CYAN}📊 Analizando tus necesidades...${NC}"
    sleep 2
    
    echo ""
    echo "╔══════════════════════════════════════════╗"
    echo "║   🎯 RECOMENDACIÓN PERSONALIZADA       ║"
    echo "╚══════════════════════════════════════════╝"
    echo ""
    
    if [ "$proposito" == "produccion" ]; then
        echo -e "${GREEN}✅ RECOMENDACIÓN: RAILWAY${NC}"
        echo ""
        echo "Razones:"
        echo "  🚀 Perfecto para producción"
        echo "  💯 WebSockets funcionan excelente"
        echo "  🔄 No duerme, siempre activo"
        echo "  💾 PostgreSQL gratis incluida"
        echo "  ⚡ Setup en 2 minutos"
        echo ""
        return 1
        
    elif [ "$proposito" == "desarrollo" ]; then
        if [ "$presupuesto" == "0" ]; then
            echo -e "${GREEN}✅ RECOMENDACIÓN: RENDER.COM${NC}"
            echo ""
            echo "Razones:"
            echo "  🆓 100% gratis ilimitado"
            echo "  📚 Perfecto para desarrollo"
            echo "  ⏰ Dormir no es problema en dev"
            echo "  🔄 750 horas/mes"
            echo ""
            return 2
        else
            echo -e "${GREEN}✅ RECOMENDACIÓN: RAILWAY${NC}"
            echo ""
            echo "Razones:"
            echo "  🚀 Mejor experiencia de desarrollo"
            echo "  🔄 No duerme"
            echo "  💾 PostgreSQL incluida"
            echo "  💰 $5 gratis suficientes"
            echo ""
            return 1
        fi
        
    else  # demo
        echo -e "${GREEN}✅ RECOMENDACIÓN: RENDER.COM${NC}"
        echo ""
        echo "Razones:"
        echo "  🆓 Gratis ilimitado"
        echo "  🎨 Fácil de compartir"
        echo "  📱 Suficiente para demos"
        echo ""
        return 2
    fi
}

# ========================================
# PREGUNTAS
# ========================================

echo -e "${BLUE}¡Hola! Voy a ayudarte a elegir el mejor hosting para tu backend LlevameQ.${NC}"
echo ""
echo "Responde unas preguntas rápidas..."
echo ""
sleep 2

# Pregunta 1: Propósito
echo -e "${YELLOW}1. ¿Para qué vas a usar el backend?${NC}"
echo ""
echo "  1) Producción real (usuarios reales)"
echo "  2) Desarrollo y pruebas"
echo "  3) Demo o presentación"
echo ""
read -p "Elige (1/2/3): " proposito_num

case $proposito_num in
    1) proposito="produccion" ;;
    2) proposito="desarrollo" ;;
    3) proposito="demo" ;;
    *) proposito="produccion" ;;
esac

echo ""
sleep 1

# Pregunta 2: Experiencia
echo -e "${YELLOW}2. ¿Cuál es tu nivel técnico?${NC}"
echo ""
echo "  1) Principiante (quiero lo más fácil)"
echo "  2) Intermedio (manejo comandos básicos)"
echo "  3) Avanzado (soy desarrollador)"
echo ""
read -p "Elige (1/2/3): " experiencia_num

case $experiencia_num in
    1) experiencia="principiante" ;;
    2) experiencia="intermedio" ;;
    3) experiencia="avanzado" ;;
    *) experiencia="intermedio" ;;
esac

echo ""
sleep 1

# Pregunta 3: Presupuesto
echo -e "${YELLOW}3. ¿Tienes presupuesto para hosting?${NC}"
echo ""
echo "  1) Quiero 100% gratis"
echo "  2) Puedo pagar ~$5-10/mes si vale la pena"
echo "  3) Presupuesto flexible"
echo ""
read -p "Elige (1/2/3): " presupuesto_num

case $presupuesto_num in
    1) presupuesto="0" ;;
    2) presupuesto="5-10" ;;
    3) presupuesto="flexible" ;;
    *) presupuesto="0" ;;
esac

# ========================================
# RECOMENDACIÓN
# ========================================

recomendar_hosting "$proposito" "$experiencia" "$presupuesto"
hosting_recomendado=$?

echo ""
sleep 2

# ========================================
# COMPARACIÓN
# ========================================

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   📊 COMPARACIÓN RÁPIDA                 ║"
echo "╚══════════════════════════════════════════╝"
echo ""

echo -e "${BLUE}RAILWAY:${NC}"
echo "  ✅ $5/mes gratis (500 horas)"
echo "  ✅ PostgreSQL gratis incluida"
echo "  ✅ No duerme"
echo "  ✅ WebSockets perfectos"
echo "  ⏱️  Setup: 2 minutos"
echo ""

echo -e "${BLUE}RENDER.COM:${NC}"
echo "  ✅ 750 horas/mes gratis"
echo "  ⚠️  Duerme después de 15 min"
echo "  ⚠️  PostgreSQL 90 días gratis"
echo "  ✅ WebSockets OK"
echo "  ⏱️  Setup: 10 minutos"
echo ""

echo -e "${BLUE}FLY.IO:${NC}"
echo "  ✅ 3 VMs gratis"
echo "  ⚠️  Requiere tarjeta"
echo "  ✅ PostgreSQL incluida"
echo "  ⚠️  Setup complejo"
echo "  ⏱️  Setup: 30 minutos"
echo ""

# ========================================
# DECISIÓN FINAL
# ========================================

echo ""
echo -e "${YELLOW}¿Quieres continuar con la recomendación? (y/n)${NC}"
read -p "Respuesta: " continuar

if [[ ! "$continuar" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo ""
    echo -e "${YELLOW}Puedes ejecutar manualmente:${NC}"
    echo "  Railway:    ./setup-railway-completo.sh"
    echo "  Render:     ./setup-render.sh"
    echo ""
    exit 0
fi

# ========================================
# EJECUTAR SETUP
# ========================================

echo ""
echo -e "${GREEN}🚀 Iniciando setup automático...${NC}"
echo ""
sleep 2

if [ $hosting_recomendado -eq 1 ]; then
    # Railway
    if [ -f "./setup-railway-completo.sh" ]; then
        chmod +x ./setup-railway-completo.sh
        ./setup-railway-completo.sh
    else
        echo -e "${RED}❌ Error: No se encuentra setup-railway-completo.sh${NC}"
        echo "Debes ejecutar este script desde: lleevameq-backend/"
        exit 1
    fi
    
elif [ $hosting_recomendado -eq 2 ]; then
    # Render
    if [ -f "./setup-render.sh" ]; then
        chmod +x ./setup-render.sh
        ./setup-render.sh
    else
        echo -e "${RED}❌ Error: No se encuentra setup-render.sh${NC}"
        echo "Debes ejecutar este script desde: lleevameq-backend/"
        exit 1
    fi
    
else
    echo -e "${RED}❌ Error inesperado${NC}"
    exit 1
fi

# ========================================
# RESUMEN FINAL
# ========================================

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   ✅ PROCESO COMPLETADO                 ║"
echo "╚══════════════════════════════════════════╝"
echo ""

echo -e "${GREEN}🎉 ¡Tu backend está en la nube!${NC}"
echo ""
echo -e "${BLUE}📋 Próximos pasos:${NC}"
echo "  1. Copia la URL del backend"
echo "  2. Actualiza App.tsx en las apps móviles"
echo "  3. Genera los APKs"
echo "  4. ¡A probar!"
echo ""

echo -e "${YELLOW}💡 Tip: Guarda la URL en un lugar seguro${NC}"
echo ""
