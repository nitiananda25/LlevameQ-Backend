# 🚗 LlevameQ Backend - API Completa

Backend completo y funcional para LlevameQ, sistema de transporte tipo DiDi para Quibdó, Chocó.

## ✅ LO QUE ESTÁ INCLUIDO

### 🔥 Funcionalidades Core
- ✅ **Autenticación JWT completa** (registro, login, protección de rutas)
- ✅ **Sistema de usuarios** (pasajeros y conductores)
- ✅ **Sistema de viajes completo** (CRUD, estados, historial)
- ✅ **Matching automático** (busca conductores cercanos en radio de 5km)
- ✅ **Cálculo de tarifas** (distancia + tiempo + recargos)
- ✅ **WebSockets en tiempo real** (tracking GPS, notificaciones)
- ✅ **Sistema de calificaciones** (5 estrellas, comentarios)
- ✅ **Gestión de conductores** (online/offline, ubicación en tiempo real)

### 📊 Base de Datos
- PostgreSQL con TypeORM
- 2 entidades principales: `Users` y `Rides`
- Relaciones bien definidas
- Sync automático (desarrollo)

## 🚀 INICIO RÁPIDO

### Requisitos

- Node.js 20 LTS o superior
- npm 10 o superior

### 1. Instalar Dependencias

```bash
npm install
```

### 2. Configurar Base de Datos

**Opción A: PostgreSQL con Docker** (Recomendado)

```bash
docker run --name lleevameq-postgres \
  -e POSTGRES_USER=lleevameq \
  -e POSTGRES_PASSWORD=lleevameq123 \
  -e POSTGRES_DB=lleevameq \
  -p 5432:5432 \
  -d postgres:14
```

**Opción B: PostgreSQL Local**

Instala PostgreSQL y crea la base de datos:

```sql
CREATE DATABASE lleevameq;
CREATE USER lleevameq WITH PASSWORD 'lleevameq123';
GRANT ALL PRIVILEGES ON DATABASE lleevameq TO lleevameq;
```

### 3. Configurar Variables de Entorno

```bash
cp .env.example .env
```

Edita `.env` con tus valores (o deja los defaults para desarrollo)

### 4. Iniciar el Servidor

```bash
# Modo desarrollo (con hot reload)
npm run start:dev

# Deberías ver:
# ╔══════════════════════════════════════════╗
# ║   🚗 LLEEVAMEQ BACKEND - RUNNING         ║
# ╠══════════════════════════════════════════╣
# ║   Port: 3000                             ║
# ║   API: http://localhost:3000/api         ║
# ╚══════════════════════════════════════════╝
```

¡Listo! El backend está funcionando en `http://localhost:3000`

---

## 📡 ENDPOINTS DISPONIBLES

### Autenticación

```
POST   /api/auth/register    - Registrar nuevo usuario
POST   /api/auth/login       - Login (retorna JWT)
GET    /api/auth/profile     - Obtener perfil (requiere auth)
GET    /api/auth/health      - Health check
```

### Usuarios

```
GET    /api/users/me         - Mi perfil
PATCH  /api/users/me         - Actualizar perfil
POST   /api/users/driver/status  - Cambiar estado (online/offline)
POST   /api/users/location   - Actualizar ubicación
GET    /api/users/driver/stats  - Estadísticas del conductor
```

### Viajes

```
POST   /api/rides            - Crear nuevo viaje
GET    /api/rides            - Obtener mis viajes
GET    /api/rides/:id        - Detalles de viaje
GET    /api/rides/:id/drivers  - Buscar conductores disponibles
POST   /api/rides/:id/assign  - Asignar conductor (conductor)
POST   /api/rides/:id/start   - Iniciar viaje (conductor)
POST   /api/rides/:id/complete  - Completar viaje (conductor)
POST   /api/rides/:id/cancel  - Cancelar viaje
POST   /api/rides/:id/rate    - Calificar viaje
```

---

## 🧪 PROBAR EL BACKEND

### 1. Registrar un Pasajero

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "pasajero@test.com",
    "password": "password123",
    "firstName": "Juan",
    "lastName": "Pérez",
    "phone": "3001234567",
    "role": "passenger"
  }'
```

### 2. Registrar un Conductor

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "conductor@test.com",
    "password": "password123",
    "firstName": "Carlos",
    "lastName": "Gómez",
    "phone": "3007654321",
    "role": "driver",
    "vehiclePlate": "ABC123",
    "vehicleModel": "Honda XR150",
    "vehicleColor": "Rojo",
    "licenseNumber": "12345678"
  }'
```

### 3. Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "pasajero@test.com",
    "password": "password123"
  }'

# Guarda el access_token que te retorna
```

### 4. Crear un Viaje

```bash
curl -X POST http://localhost:3000/api/rides \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_ACCESS_TOKEN" \
  -d '{
    "originLat": 5.6902,
    "originLng": -76.6589,
    "originAddress": "Parque Principal, Quibdó",
    "destinationLat": 5.6950,
    "destinationLng": -76.6600,
    "destinationAddress": "Terminal de Buses, Quibdó",
    "paymentMethod": "cash"
  }'
```

---

## 🌐 WEBSOCKETS

El backend incluye WebSocket para comunicación en tiempo real.

### Conectarse desde el Cliente

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

// Autenticarse
socket.emit('authenticate', { userId: 1 });

// Unirse a un viaje
socket.emit('join-ride', { rideId: 1 });

// Actualizar ubicación (conductor)
socket.emit('update-location', {
  lat: 5.6902,
  lng: -76.6589,
  rideId: 1
});

// Escuchar eventos
socket.on('location-updated', (data) => {
  console.log('Ubicación actualizada:', data);
});

socket.on('ride-status-changed', (data) => {
  console.log('Estado del viaje cambió:', data);
});

socket.on('new-ride-request', (data) => {
  console.log('Nueva solicitud de viaje:', data);
});
```

---

## 🧮 SISTEMA DE TARIFAS

El sistema calcula tarifas automáticamente basándose en:

```
Tarifa Base:       3,000 COP
Por kilómetro:     1,500 COP/km
Por minuto:        200 COP/min
Tarifa mínima:     4,000 COP

Recargos:
- Nocturno (22:00-06:00):  +20%
- Hora pico (7-9, 17-19):  +30%
```

Puedes configurar estas tarifas en el archivo `.env`

---

## 🔄 FLUJO COMPLETO DE UN VIAJE

```
1. Pasajero crea viaje
   └─> POST /api/rides
   └─> Estado: SEARCHING

2. Sistema busca conductores cercanos
   └─> Matching automático en radio de 5km
   └─> Notifica a conductores via WebSocket

3. Conductor acepta
   └─> POST /api/rides/:id/assign
   └─> Estado: DRIVER_ASSIGNED
   └─> Pasajero recibe notificación

4. Conductor llega al origen
   └─> POST /api/rides/:id/start
   └─> Estado: IN_PROGRESS

5. Durante el viaje
   └─> Conductor envía ubicación cada 5 seg (WebSocket)
   └─> Pasajero ve tracking en tiempo real

6. Llegan al destino
   └─> POST /api/rides/:id/complete
   └─> Estado: COMPLETED
   └─> Se procesa el pago

7. Calificaciones
   └─> POST /api/rides/:id/rate (ambos)
   └─> Se actualizan ratings promedio
```

---

## 🚀 DEPLOYMENT A RAILWAY

### 1. Crear cuenta en Railway.app

Visita: https://railway.app y crea una cuenta

### 2. Instalar Railway CLI

```bash
npm install -g @railway/cli
railway login
```

### 3. Crear proyecto

```bash
railway init
```

### 4. Agregar PostgreSQL

```bash
railway add postgresql
```

### 5. Configurar variables de entorno

En el dashboard de Railway, agrega:
- `NODE_ENV=production`
- `JWT_SECRET=tu-secreto-super-seguro`
- (DATABASE_URL se configura automáticamente)

### 6. Deploy

```bash
railway up
```

¡Listo! Tu API estará disponible en una URL pública.

---

## 📊 ESTRUCTURA DEL PROYECTO

```
src/
├── main.ts                # Entry point
├── app.module.ts          # Módulo principal
│
├── auth/                  # Módulo de autenticación
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── auth.module.ts
│   ├── dto/
│   └── strategies/
│       └── jwt.strategy.ts
│
├── users/                 # Módulo de usuarios
│   ├── users.controller.ts
│   ├── users.service.ts
│   ├── users.module.ts
│   └── entities/
│       └── user.entity.ts
│
└── rides/                 # Módulo de viajes
    ├── rides.controller.ts
    ├── rides.service.ts
    ├── rides.module.ts
    ├── matching.service.ts    # Algoritmo de matching
    ├── rides.gateway.ts       # WebSockets
    └── entities/
        └── ride.entity.ts
```

---

## 🛠️ COMANDOS ÚTILES

```bash
# Desarrollo
npm run start:dev      # Inicia con hot-reload

# Producción
npm run build          # Compila TypeScript
npm run start:prod     # Inicia versión compilada

# Testing
npm run test           # Tests unitarios
npm run test:e2e       # Tests end-to-end
npm run test:cov       # Coverage

# Linting
npm run lint           # Revisar código
npm run format         # Formatear código
```

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Error: "Cannot connect to database"

```bash
# Verificar que PostgreSQL está corriendo
docker ps

# O si es local:
psql -U lleevameq -d lleevameq -c "SELECT 1"
```

### Error: "Port 3000 already in use"

```bash
# Matar proceso en el puerto
lsof -ti:3000 | xargs kill -9

# O cambiar puerto en .env
PORT=3001
```

### Error: "JWT must be provided"

Asegúrate de incluir el token en el header:
```
Authorization: Bearer TU_ACCESS_TOKEN
```

---

## 📝 VARIABLES DE ENTORNO

Todas las variables están en `.env.example`. Las más importantes:

```env
DATABASE_URL=          # Solo en producción (Railway)
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=lleevameq
DATABASE_PASSWORD=lleevameq123
DATABASE_NAME=lleevameq

JWT_SECRET=            # ⚠️ CAMBIAR en producción
JWT_EXPIRES_IN=7d

PORT=3000
NODE_ENV=development

MATCHING_RADIUS_KM=5   # Radio de búsqueda
MATCHING_TIMEOUT_SECONDS=30

TARIFA_BASE=3000
TARIFA_POR_KM=1500
TARIFA_POR_MINUTO=200
```

---

## 🎯 PRÓXIMOS PASOS

**Con este backend funcionando, ahora puedes:**

1. ✅ **Crear las apps móviles** (React Native)
2. ✅ **Conectar las apps** a esta API
3. ✅ **Implementar UI** para pasajeros y conductores
4. ✅ **Agregar mapas** (OpenStreetMap/Google Maps)
5. ✅ **Testear** el flujo completo

**El backend ya tiene TODO lo necesario:**
- Autenticación ✅
- Matching ✅
- Viajes ✅
- WebSockets ✅
- Tarifas ✅
- Calificaciones ✅

---

## 💪 ¡AHORA A CREAR LAS APPS!

El backend está **100% funcional**. Ahora necesitas:

1. **App React Native para pasajeros**
2. **App React Native para conductores**

Ambas se conectan a este backend via:
- HTTP (endpoints REST)
- WebSocket (tiempo real)

---

## 📞 SOPORTE

Si tienes dudas:
1. Revisa este README
2. Revisa los comentarios en el código
3. Prueba los endpoints con curl/Postman
4. Revisa los logs del servidor

---

**¡BACKEND COMPLETO Y FUNCIONANDO! 🎉**

Creado con ❤️ para Que - LlevameQ Quibdó, Chocó
