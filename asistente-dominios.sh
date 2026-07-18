#!/bin/bash

# ========================================
# ASISTENTE DE DECISIÓN: DOMINIOS
# Te ayuda a decidir si necesitas dominio
# ========================================

clear
echo "╔══════════════════════════════════════════╗"
echo "║   🌐 ASISTENTE DE DOMINIOS             ║"
echo "║   ¿Necesitas dominio personalizado?    ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Verificar Railway
if ! command -v railway &> /dev/null; then
    echo -e "${YELLOW}⚠️  Railway CLI no instalado${NC}"
    echo ""
    echo "Instala primero Railway:"
    echo "  npm install -g @railway/cli"
    echo ""
    exit 1
fi

echo -e "${BLUE}Voy a ayudarte a decidir si necesitas comprar un dominio.${NC}"
echo ""
echo "Responde estas preguntas rápidas..."
echo ""
sleep 2

# ========================================
# PREGUNTAS
# ========================================

# Pregunta 1: Estado actual
echo -e "${YELLOW}1. ¿Ya tienes tu backend en Railway/Render?${NC}"
echo ""
echo "  1) Sí, ya está funcionando"
echo "  2) No, aún no lo he desplegado"
echo ""
read -p "Respuesta (1/2): " tiene_backend

if [ "$tiene_backend" == "2" ]; then
    echo ""
    echo -e "${RED}❌ Primero despliega tu backend${NC}"
    echo ""
    echo "Ejecuta:"
    echo "  cd lleevameq-backend"
    echo "  ./setup-railway-completo.sh"
    echo ""
    exit 0
fi

echo ""
sleep 1

# Pregunta 2: Usuarios
echo -e "${YELLOW}2. ¿Ya tienes usuarios reales usando la app?${NC}"
echo ""
echo "  1) Sí, tengo usuarios activos"
echo "  2) No, aún estoy probando"
echo "  3) Estoy en proceso de lanzamiento"
echo ""
read -p "Respuesta (1/2/3): " tiene_usuarios

echo ""
sleep 1

# Pregunta 3: Presupuesto
echo -e "${YELLOW}3. ¿Tienes presupuesto para dominio?${NC}"
echo ""
echo "  1) Sí, puedo invertir $10-15/año"
echo "  2) Quiero mantenerlo 100% gratis"
echo "  3) Depende si vale la pena"
echo ""
read -p "Respuesta (1/2/3): " presupuesto

echo ""
sleep 1

# Pregunta 4: Prioridad
echo -e "${YELLOW}4. ¿Qué es más importante para ti ahora?${NC}"
echo ""
echo "  1) Imagen profesional y branding"
echo "  2) Ahorrar dinero y validar producto"
echo "  3) Ambos por igual"
echo ""
read -p "Respuesta (1/2/3): " prioridad

echo ""
sleep 1

# ========================================
# ANÁLISIS
# ========================================

echo ""
echo -e "${CYAN}📊 Analizando tus respuestas...${NC}"
sleep 2

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   🎯 RECOMENDACIÓN PERSONALIZADA       ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# Lógica de decisión
SCORE=0

# Usuarios activos suman puntos
if [ "$tiene_usuarios" == "1" ]; then
    SCORE=$((SCORE + 3))
fi

# Presupuesto disponible suma puntos
if [ "$presupuesto" == "1" ]; then
    SCORE=$((SCORE + 2))
fi

# Prioridad en branding suma puntos
if [ "$prioridad" == "1" ]; then
    SCORE=$((SCORE + 3))
fi

# Decisión basada en score
if [ $SCORE -ge 6 ]; then
    # COMPRAR DOMINIO
    echo -e "${GREEN}✅ RECOMENDACIÓN: COMPRAR DOMINIO${NC}"
    echo ""
    echo "Razones:"
    echo "  • Tienes usuarios activos"
    echo "  • Tienes presupuesto"
    echo "  • Priorizas profesionalismo"
    echo "  • Vale la pena la inversión"
    echo ""
    echo -e "${CYAN}💡 Sugerencia:${NC}"
    echo "  • Compra: lleevameq.com (~$10/año)"
    echo "  • Configura: api.lleevameq.com"
    echo "  • Mantén Railway como hosting"
    echo "  • Solo cambias la URL"
    echo ""
    
    OPCION_RECOMENDADA="comprar"
    
elif [ $SCORE -ge 3 ]; then
    # CONSIDERAR OPCIONES
    echo -e "${YELLOW}⚠️  RECOMENDACIÓN: EVALUAR OPCIONES${NC}"
    echo ""
    echo "Situación:"
    echo "  • Estás en punto medio"
    echo "  • Podrías esperar un poco más"
    echo "  • O comprar dominio ahora"
    echo ""
    echo -e "${CYAN}💡 Opciones:${NC}"
    echo ""
    echo "A) Mantener Railway subdomain (gratis)"
    echo "   → Funciona perfecto"
    echo "   → Ahorras $10/año"
    echo "   → Puedes comprar después"
    echo ""
    echo "B) Comprar dominio ahora"
    echo "   → Más profesional"
    echo "   → Tu marca desde el inicio"
    echo "   → Inversión de $10/año"
    echo ""
    
    OPCION_RECOMENDADA="evaluar"
    
else
    # MANTENER RAILWAY
    echo -e "${GREEN}✅ RECOMENDACIÓN: USAR RAILWAY SUBDOMAIN${NC}"
    echo ""
    echo "Razones:"
    echo "  • Aún validando producto"
    echo "  • Prioridad en ahorro"
    echo "  • Railway subdomain es suficiente"
    echo "  • Puedes comprar dominio después"
    echo ""
    echo -e "${CYAN}💡 Tu URL actual es perfecta:${NC}"
    
    # Obtener URL actual
    CURRENT_URL=$(railway domain 2>/dev/null | grep "https://" | tail -1 | tr -d ' ')
    if [ ! -z "$CURRENT_URL" ]; then
        echo "  $CURRENT_URL"
    else
        echo "  https://lleevameq-production-xxxx.up.railway.app"
    fi
    echo ""
    echo "  ✅ Gratis forever"
    echo "  ✅ SSL incluido"
    echo "  ✅ Profesional suficiente"
    echo ""
    
    OPCION_RECOMENDADA="mantener"
fi

sleep 2

# ========================================
# SIGUIENTE PASO
# ========================================

echo ""
echo -e "${YELLOW}¿Qué quieres hacer?${NC}"
echo ""

if [ "$OPCION_RECOMENDADA" == "comprar" ]; then
    echo "1) Ver dónde comprar dominio"
    echo "2) Ver cómo configurarlo"
    echo "3) Ver URL actual de Railway"
    echo "4) Salir (decidir después)"
    
elif [ "$OPCION_RECOMENDADA" == "evaluar" ]; then
    echo "1) Más info sobre comprar dominio"
    echo "2) Más info sobre Railway subdomain"
    echo "3) Ver comparación completa"
    echo "4) Decidir después"
    
else
    echo "1) Ver mi URL actual de Railway"
    echo "2) Optimizar mi URL actual"
    echo "3) Info sobre dominios (por si acaso)"
    echo "4) Salir (ya está todo listo)"
fi

echo ""
read -p "Elige una opción (1/2/3/4): " accion

echo ""

case $accion in
    1)
        if [ "$OPCION_RECOMENDADA" == "comprar" ]; then
            # Info de compra
            echo -e "${CYAN}🛒 DÓNDE COMPRAR DOMINIO:${NC}"
            echo ""
            echo "Recomendados:"
            echo ""
            echo "1. Namecheap (https://namecheap.com)"
            echo "   • Precio: ~$10/año"
            echo "   • Fácil de usar"
            echo "   • Buena reputación"
            echo ""
            echo "2. Cloudflare (https://cloudflare.com)"
            echo "   • Precio: ~$10/año (sin markup)"
            echo "   • Sin sobreprecio"
            echo "   • DNS incluido"
            echo ""
            echo "3. Porkbun (https://porkbun.com)"
            echo "   • Precio: ~$8-10/año"
            echo "   • Económico"
            echo "   • SSL gratis"
            echo ""
        else
            # Ver URL actual
            CURRENT_URL=$(railway domain 2>/dev/null | grep "https://" | tail -1 | tr -d ' ')
            echo -e "${CYAN}🌐 TU URL ACTUAL:${NC}"
            echo ""
            if [ ! -z "$CURRENT_URL" ]; then
                echo "  $CURRENT_URL"
                echo ""
                echo -e "${GREEN}Esta URL está PERFECTA para tu backend.${NC}"
                echo ""
                echo "Para apps móviles, usa:"
                echo "  const API_URL = '$CURRENT_URL/api';"
                echo "  const WS_URL = '$CURRENT_URL';"
            else
                echo "Ejecuta: railway domain"
            fi
        fi
        ;;
        
    2)
        if [ "$OPCION_RECOMENDADA" == "comprar" ]; then
            # Info de configuración
            echo -e "${CYAN}🔧 CÓMO CONFIGURAR:${NC}"
            echo ""
            echo "Lee la guía completa:"
            echo "  cat DOMINIO_PERSONALIZADO_GUIA.md"
            echo ""
            echo "O ejecuta el script:"
            echo "  ./optimizar-dominio.sh"
        else
            # Optimizar URL
            echo -e "${CYAN}🔧 OPTIMIZAR URL:${NC}"
            echo ""
            echo "Ejecuta:"
            echo "  ./optimizar-dominio.sh"
            echo ""
            echo "Opciones:"
            echo "  • Ver URL actual"
            echo "  • Generar URL más corta"
            echo "  • Configurar dominio propio"
        fi
        ;;
        
    3)
        # Documentación
        echo -e "${CYAN}📚 DOCUMENTACIÓN:${NC}"
        echo ""
        echo "Guías disponibles:"
        echo ""
        echo "  DOMINIOS_DECISION_RAPIDA.md  ← Inicio aquí"
        echo "  DOMINIOS_GRATIS_GUIA.md      ← Guía completa"
        echo "  DOMINIO_PERSONALIZADO_GUIA.md ← Si compras uno"
        echo ""
        ;;
        
    4)
        # Salir
        echo -e "${GREEN}👋 ¡Perfecto!${NC}"
        echo ""
        if [ "$OPCION_RECOMENDADA" == "mantener" ]; then
            echo "Tu URL Railway está lista para usar."
            echo "No necesitas hacer nada más."
        else
            echo "Puedes decidir sobre el dominio después."
            echo "Railway subdomain funciona perfectamente mientras tanto."
        fi
        echo ""
        exit 0
        ;;
        
    *)
        echo -e "${RED}Opción inválida${NC}"
        ;;
esac

# ========================================
# RESUMEN FINAL
# ========================================

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   📋 RESUMEN                            ║"
echo "╚══════════════════════════════════════════╝"
echo ""

if [ "$OPCION_RECOMENDADA" == "comprar" ]; then
    echo -e "${YELLOW}Siguiente paso sugerido:${NC}"
    echo "  1. Comprar lleevameq.com"
    echo "  2. Configurar DNS (CNAME)"
    echo "  3. Agregar en Railway"
    echo "  4. Actualizar apps"
    echo ""
    
elif [ "$OPCION_RECOMENDADA" == "evaluar" ]; then
    echo -e "${YELLOW}Siguiente paso sugerido:${NC}"
    echo "  1. Usar Railway subdomain por ahora"
    echo "  2. Validar con usuarios"
    echo "  3. Decidir en 1-2 meses"
    echo ""
    
else
    echo -e "${GREEN}¡Ya estás listo!${NC}"
    echo "  ✅ Railway subdomain funcionando"
    echo "  ✅ No necesitas dominio personalizado"
    echo "  ✅ Enfócate en conseguir usuarios"
    echo ""
fi

echo -e "${BLUE}💡 Recuerda:${NC}"
echo "  Railway subdomain es PERFECTO para empezar"
echo "  No gastes en dominio hasta validar el producto"
echo "  Cuando crezcas, ahí sí compra uno"
echo ""
