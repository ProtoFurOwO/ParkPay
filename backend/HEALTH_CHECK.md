# 🏥 Health Check API - ParkPay

Sistema de monitoreo y diagnóstico del estado del servidor backend.

---

## 📋 Endpoints Disponibles

### 1. Health Check Completo
**URL:** `GET /api/health`

**Descripción:** Verifica el estado completo del sistema incluyendo base de datos, memoria, y servicios externos.

**Respuesta exitosa (200 OK):**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-20T10:30:00.000Z",
  "service": "ParkPay Backend API",
  "version": "1.0.0",
  "environment": "production",
  "responseTime": "45ms",
  "checks": {
    "system": {
      "status": "pass",
      "uptime": "2h 15m 30s",
      "uptimeSeconds": 8130,
      "nodeVersion": "v18.17.0",
      "platform": "linux",
      "pid": 1234
    },
    "memory": {
      "status": "pass",
      "heapUsed": "45.32 MB",
      "heapTotal": "85.50 MB",
      "rss": "120.75 MB",
      "percentageUsed": "52.98%"
    },
    "database": {
      "status": "pass",
      "responseTime": "12ms",
      "connected": true,
      "version": "PostgreSQL 15.3",
      "readWrite": "pass"
    },
    "environment": {
      "status": "pass",
      "databaseConfigured": true,
      "sendgridConfigured": true,
      "portConfigured": true,
      "nodeEnv": "production"
    },
    "externalServices": {
      "sendgrid": {
        "status": "configured",
        "emailFrom": "parkpay.soporte@gmail.com"
      },
      "frontend": {
        "url": "https://parkpay.vercel.app",
        "status": "external"
      },
      "database": {
        "provider": "Supabase PostgreSQL",
        "status": "connected"
      }
    }
  }
}
```

**Respuesta con problemas (503 Service Unavailable):**
```json
{
  "status": "degraded",
  "timestamp": "2025-10-20T10:30:00.000Z",
  "service": "ParkPay Backend API",
  "checks": {
    "database": {
      "status": "fail",
      "error": "Connection timeout",
      "connected": false
    }
  }
}
```

---

### 2. Health Check Simple
**URL:** `GET /api/health/simple`

**Descripción:** Verificación rápida del estado del servidor (sin checks de BD).

**Respuesta (200 OK):**
```json
{
  "status": "OK",
  "timestamp": "2025-10-20T10:30:00.000Z"
}
```

**Uso:** Ideal para load balancers que necesitan respuestas rápidas.

---

### 3. Liveness Probe
**URL:** `GET /api/health/live`

**Descripción:** Verifica si el servidor está vivo y respondiendo.

**Respuesta (200 OK):**
```json
{
  "status": "alive",
  "timestamp": "2025-10-20T10:30:00.000Z",
  "uptime": 8130.5
}
```

**Uso:** Para Kubernetes/Docker health checks (liveness probe).

---

### 4. Readiness Probe
**URL:** `GET /api/health/ready`

**Descripción:** Verifica si el servidor está listo para recibir tráfico (incluye check de BD).

**Respuesta exitosa (200 OK):**
```json
{
  "status": "ready",
  "timestamp": "2025-10-20T10:30:00.000Z"
}
```

**Respuesta no listo (503 Service Unavailable):**
```json
{
  "status": "not ready",
  "error": "Database connection failed",
  "timestamp": "2025-10-20T10:30:00.000Z"
}
```

**Uso:** Para Kubernetes/Docker health checks (readiness probe).

---

### 5. Health Check Legacy (Compatibilidad)
**URL:** `GET /health`

**Descripción:** Endpoint simple para compatibilidad con sistemas legacy.

**Respuesta (200 OK):**
```json
{
  "status": "OK",
  "message": "Server is running",
  "timestamp": "2025-10-20T10:30:00.000Z"
}
```

---

## 🎯 Casos de Uso

### 1. Monitoreo Continuo
```bash
# Curl
curl https://parkpay-backend-1ti1.onrender.com/api/health

# Con jq para formato bonito
curl -s https://parkpay-backend-1ti1.onrender.com/api/health | jq
```

### 2. Scripts de Monitoreo
```bash
#!/bin/bash
# check-health.sh

RESPONSE=$(curl -s https://parkpay-backend-1ti1.onrender.com/api/health)
STATUS=$(echo $RESPONSE | jq -r '.status')

if [ "$STATUS" == "healthy" ]; then
  echo "✅ Sistema saludable"
  exit 0
else
  echo "❌ Sistema con problemas"
  echo $RESPONSE | jq
  exit 1
fi
```

### 3. Integración con Render
Render usa automáticamente `/health` para verificar el estado del servicio.

### 4. Pruebas Automatizadas
```javascript
// test/health.test.js
describe('Health Check', () => {
  it('should return healthy status', async () => {
    const response = await fetch('http://localhost:3000/api/health');
    const data = await response.json();
    
    expect(data.status).toBe('healthy');
    expect(data.checks.database.status).toBe('pass');
  });
});
```

---

## 📊 Estados del Sistema

### `healthy`
- ✅ Todos los checks pasaron
- ✅ Base de datos conectada
- ✅ Memoria dentro de límites
- ✅ Servicios externos configurados

### `degraded`
- ⚠️ Algunos checks fallaron
- ⚠️ Sistema funcional pero con limitaciones
- ⚠️ Puede haber problemas de rendimiento

### `unhealthy`
- ❌ Checks críticos fallaron
- ❌ Base de datos no disponible
- ❌ Sistema no operacional

---

## 🔧 Configuración en Render

### Health Check Path
```
Path: /health
Interval: 30 seconds
Timeout: 10 seconds
Unhealthy threshold: 3
Healthy threshold: 2
```

### Variables de Entorno Necesarias
```bash
DATABASE_URL=postgresql://...
SENDGRID_API_KEY=SG.xxx...
PORT=3000
NODE_ENV=production
```

---

## 📈 Métricas Monitoreadas

### Sistema
- ⏱️ **Uptime:** Tiempo que lleva corriendo el servidor
- 💻 **Node Version:** Versión de Node.js
- 🖥️ **Platform:** Sistema operativo
- 🆔 **PID:** Process ID

### Memoria
- 📊 **Heap Used:** Memoria heap en uso
- 📊 **Heap Total:** Total de memoria heap
- 📊 **RSS:** Resident Set Size
- 📊 **Percentage:** Porcentaje de uso

### Base de Datos
- 🔗 **Connection:** Estado de la conexión
- ⚡ **Response Time:** Tiempo de respuesta
- 📝 **Version:** Versión de PostgreSQL
- ✍️ **Read/Write:** Capacidad de lectura/escritura

### Servicios Externos
- 📧 **SendGrid:** Estado de configuración
- 🌐 **Frontend:** URL del frontend
- 💾 **Database Provider:** Proveedor de BD

---

## 🚨 Alertas y Monitoreo

### Condiciones de Alerta

**Crítico:**
- Base de datos desconectada
- Memoria > 90% utilizada
- Tiempo de respuesta > 5 segundos

**Advertencia:**
- Memoria > 75% utilizada
- Tiempo de respuesta > 2 segundos
- Servicios externos no configurados

**Info:**
- Sistema degradado pero funcional
- Uptime reiniciado recientemente

---

## 🧪 Testing

### Prueba Manual
```bash
# Health check completo
curl https://parkpay-backend-1ti1.onrender.com/api/health | jq

# Simple check
curl https://parkpay-backend-1ti1.onrender.com/api/health/simple

# Liveness
curl https://parkpay-backend-1ti1.onrender.com/api/health/live

# Readiness
curl https://parkpay-backend-1ti1.onrender.com/api/health/ready
```

### En el Navegador
```
https://parkpay-backend-1ti1.onrender.com/api/health
```

---

## 📝 Notas de Implementación

### Características
✅ No requiere autenticación (público)
✅ Respuesta rápida (< 100ms típicamente)
✅ Compatible con estándares de la industria
✅ Información detallada para debugging
✅ Múltiples endpoints para diferentes usos

### Seguridad
- ℹ️ No expone información sensible
- ℹ️ Stack traces solo en development
- ℹ️ Versiones de software visibles (normal en APIs)

---

## 🔗 URLs de Producción

**Backend:** https://parkpay-backend-1ti1.onrender.com  
**Health Check:** https://parkpay-backend-1ti1.onrender.com/api/health  
**Frontend:** https://parkpay.vercel.app

---

*Documentación generada para ParkPay Backend API*  
*Universidad Autónoma de Chiapas - Octubre 2025*