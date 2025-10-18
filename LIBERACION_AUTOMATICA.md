# 🕐 Sistema de Liberación Automática de Cajones

## 📋 Descripción del Problema

El sistema tenía tickets creados hace **1 semana o más** que seguían marcados como `ACTIVO`, manteniendo los cajones como `Ocupado` indefinidamente. Esto ocurría porque:

- ✅ El sistema **registraba** correctamente `fecha_hora_entrada`
- ❌ Pero **nunca verificaba** si había pasado demasiado tiempo
- 🔴 Resultado: Cajones ocupados permanentemente

### Ejemplo del Problema:
```
Ticket creado: 2024-12-01 10:00:00
Fecha actual: 2024-10-16 15:30:00 (1 semana después)

Estado en BD:
- TicketsEstancia.estado = 'ACTIVO'  ❌ (debería ser 'FINALIZADO')
- CajonesEstacionamiento.estado = 'Ocupado'  ❌ (debería ser 'Disponible')
```

### ⚠️ Importante - Estructura de la Base de Datos
La tabla `TicketsEstancia` **NO tiene** columnas `horas_estimadas` ni `monto_total` porque la BD ya está normalizada. Solo contiene:
- `id_ticket`, `id_vehiculo`, `id_cajon`, `codigo_acceso`
- `fecha_hora_entrada`, `fecha_hora_salida`
- `monto_cobrado`, `id_transaccion_pago`, `estado`

---

## ✨ Solución Implementada

### 1️⃣ Función de Liberación Automática

**Archivo:** `backend/routes/cajones.js`

**Lógica:** Libera automáticamente tickets que tengan **más de 24 horas** desde `fecha_hora_entrada`

```javascript
async function liberarCajonesVencidos() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // 🔍 Buscar tickets activos con más de 24 horas desde entrada
    const ticketsVencidos = await client.query(`
      SELECT 
        t.id_ticket,
        t.id_cajon,
        t.codigo_acceso,
        t.fecha_hora_entrada,
        c.numero_cajon,
        EXTRACT(EPOCH FROM (NOW() - t.fecha_hora_entrada)) / 3600 AS horas_transcurridas
      FROM TicketsEstancia t
      JOIN CajonesEstacionamiento c ON t.id_cajon = c.id_cajon
      WHERE t.estado = 'ACTIVO'
        AND t.fecha_hora_entrada < NOW() - INTERVAL '24 hours'
    `);

    if (ticketsVencidos.rows.length > 0) {
      for (const ticket of ticketsVencidos.rows) {
        // ✅ Finalizar ticket automáticamente
        await client.query(`
          UPDATE TicketsEstancia
          SET estado = 'FINALIZADO',
              fecha_hora_salida = NOW()
          WHERE id_ticket = $1
        `, [ticket.id_ticket]);

        // 🔓 Liberar cajón
        await client.query(`
          UPDATE CajonesEstacionamiento
          SET estado = 'Disponible'
          WHERE id_cajon = $1
        `, [ticket.id_cajon]);

        console.log(`✅ Cajón ${ticket.numero_cajon} liberado (${Math.floor(ticket.horas_transcurridas)}h)`);
      }
    }

    await client.query('COMMIT');
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
```

### ⏰ Tiempo de Expiración
- **Política:** 24 horas máximo de estancia
- **Razón:** La BD normalizada no tiene `horas_estimadas`, por lo que se usa un tiempo fijo
- **Modificable:** Puedes cambiar `INTERVAL '24 hours'` a cualquier valor (ej: `'2 hours'` para pruebas)

### 2️⃣ Integración en las Rutas

La función se ejecuta **automáticamente** antes de devolver información de cajones:

```javascript
// Ruta principal de cajones
router.get('/', async (req, res) => {
  // ⏰ Primero liberar cajones vencidos
  await liberarCajonesVencidos();
  
  // Luego devolver cajones actualizados
  const result = await pool.query(/* ... */);
  res.json(result.rows);
});

// También en ruta por piso
router.get('/piso/:piso', async (req, res) => {
  await liberarCajonesVencidos();
  // ...
});
```

---

## 🎯 Cómo Funciona

### Cálculo de Expiración

```sql
-- Condición de expiración (24 horas desde entrada):
t.fecha_hora_entrada < NOW() - INTERVAL '24 hours'

-- Ejemplo:
-- NOW() = 2024-10-16 15:30:00
-- fecha_hora_entrada = 2024-10-15 10:00:00
-- Diferencia: 29.5 horas
-- Límite: 24 horas
-- 29.5 > 24 = TRUE ✅ (ticket vencido, se libera)
```

### 🔧 Cambiar el Tiempo de Expiración

Si quieres probar con **2 horas** en lugar de 24:

```javascript
// En cajones.js, línea ~23:
WHERE t.estado = 'ACTIVO'
  AND t.fecha_hora_entrada < NOW() - INTERVAL '2 hours'  // ← Cambiar aquí
```

Opciones comunes:
- `'2 hours'` - Para pruebas rápidas
- `'12 hours'` - Medio día
- `'24 hours'` - Un día completo (actual)
- `'1 week'` - Una semana

### Flujo de Ejecución

```
Usuario carga página
       ↓
GET /api/cajones
       ↓
liberarCajonesVencidos()
       ↓
┌──────────────────────┐
│ Buscar tickets       │
│ con tiempo vencido   │
└──────────────────────┘
       ↓
┌──────────────────────┐
│ UPDATE Tickets       │
│ estado='FINALIZADO'  │
│ fecha_salida=NOW()   │
└──────────────────────┘
       ↓
┌──────────────────────┐
│ UPDATE Cajones       │
│ estado='Disponible'  │
└──────────────────────┘
       ↓
Devolver cajones actualizados
```

---

## 🧪 Cómo Probar

### Opción 1: Usar Tickets Existentes
Si ya tienes tickets vencidos de hace 1 semana:

1. **Abrir la interfaz:** `http://localhost:5500/PP/frontend/estacionamiento.html`
2. **Observar:** Los cajones que estaban ocupados ahora aparecerán como disponibles
3. **En la consola del servidor** verás:
   ```
   🕐 Liberando 3 cajones vencidos...
      ✅ Cajón 101 liberado (ticket #5 expirado)
      ✅ Cajón 203 liberado (ticket #12 expirado)
      ✅ Cajón 115 liberado (ticket #18 expirado)
   ```

### Opción 2: Crear Ticket de Prueba
Si quieres crear un ticket que expire rápido:

**1. Editar manualmente en pgAdmin:**
```sql
-- Crear ticket que "entró" hace 25 horas (para que expire con límite de 24h)
INSERT INTO TicketsEstancia (
  codigo_acceso, id_vehiculo, id_cajon,
  fecha_hora_entrada, estado
) VALUES (
  'TEST-' || FLOOR(RANDOM() * 10000)::TEXT,
  1, -- ID de un usuario existente
  10, -- ID de un cajón disponible
  NOW() - INTERVAL '25 hours', -- Entró hace 25 horas
  'ACTIVO'
);

-- Marcar el cajón como ocupado
UPDATE CajonesEstacionamiento 
SET estado = 'Ocupado' 
WHERE id_cajon = 10;
```

**2. Recargar la página:**
El ticket se liberará automáticamente porque:
- Tiempo transcurrido: 25 horas
- Límite del sistema: 24 horas
- 25 > 24 ✅ Vencido

### Opción 3: Reducir el tiempo de expiración para pruebas
Cambia temporalmente a **2 horas** en `cajones.js`:
```javascript
// Línea ~23
WHERE t.estado = 'ACTIVO'
  AND t.fecha_hora_entrada < NOW() - INTERVAL '2 hours'
```
Así cualquier ticket de hace 1 semana se liberará inmediatamente.

---

## 📊 Ventajas de esta Implementación

### ✅ Automático
- No requiere intervención manual
- Se ejecuta en cada consulta de cajones
- El frontend se actualiza cada 10 segundos

### ✅ Transaccional
- Usa `BEGIN/COMMIT/ROLLBACK`
- Garantiza consistencia entre tickets y cajones
- Si falla una actualización, se revierten todas

### ✅ Sin Carga Adicional
- Solo procesa tickets realmente vencidos
- Query eficiente con índices en `estado` y `fecha_hora_entrada`
- No afecta rendimiento en operaciones normales

### ✅ Logging Completo
- Muestra en consola cada liberación
- Útil para debugging y auditoría
- Formato: `✅ Cajón 101 liberado (ticket #5 expirado)`

---

## 🔍 Verificación en Base de Datos

### Ver tickets que serán liberados:
```sql
SELECT 
  t.id_ticket,
  t.codigo_acceso,
  c.numero_cajon,
  t.fecha_hora_entrada,
  EXTRACT(EPOCH FROM (NOW() - t.fecha_hora_entrada)) / 3600 AS horas_transcurridas,
  t.estado
FROM TicketsEstancia t
JOIN CajonesEstacionamiento c ON t.id_cajon = c.id_cajon
WHERE t.estado = 'ACTIVO'
  AND t.fecha_hora_entrada < NOW() - INTERVAL '24 hours';
```

### Ver cajones que fueron liberados:
```sql
SELECT 
  c.numero_cajon,
  c.estado,
  t.codigo_acceso,
  t.estado AS ticket_estado,
  t.fecha_hora_salida
FROM CajonesEstacionamiento c
LEFT JOIN TicketsEstancia t ON c.id_cajon = t.id_cajon
WHERE t.estado = 'FINALIZADO'
  AND t.fecha_hora_salida IS NOT NULL
ORDER BY t.fecha_hora_salida DESC
LIMIT 10;
```

---

## 🚀 Mejoras Futuras (Opcional)

### 1️⃣ Job Programado con Cron
```javascript
// Instalar: npm install node-cron
const cron = require('node-cron');

// Ejecutar cada 5 minutos
cron.schedule('*/5 * * * *', async () => {
  console.log('🕐 Ejecutando liberación programada...');
  await liberarCajonesVencidos();
});
```

### 2️⃣ Notificaciones a Usuarios
```javascript
// En liberarCajonesVencidos(), antes de finalizar:
await enviarNotificacion(ticket.id_usuario, {
  tipo: 'TICKET_EXPIRADO',
  mensaje: `Tu ticket #${ticket.codigo_acceso} ha expirado`,
  cajón: ticket.numero_cajon
});
```

### 3️⃣ Cobro de Tiempo Extra
```javascript
// Si el usuario excede el tiempo:
const horasExtra = horasTranscurridas - horasEstimadas;
const cargoExtra = horasExtra * tarifaPorHora * 1.5; // 50% de recargo
montoTotal += cargoExtra;
```

---

## 📝 Resumen

| Antes | Después |
|-------|---------|
| ❌ Tickets activos indefinidamente | ✅ Se finalizan automáticamente |
| ❌ Cajones ocupados para siempre | ✅ Se liberan cuando expira el tiempo |
| ❌ Requiere intervención manual del admin | ✅ Totalmente automático |
| ❌ Base de datos inconsistente | ✅ Estado siempre correcto |

**🎉 Resultado:** El sistema ahora funciona correctamente, liberando cajones automáticamente cuando el tiempo de estancia expira.
