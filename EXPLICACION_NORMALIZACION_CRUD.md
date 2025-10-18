# 📚 Explicación Técnica - Sistema ParkPay
## Normalización de Base de Datos y Operaciones CRUD

---

## 🎯 1. NORMALIZACIÓN DE LA BASE DE DATOS

### ¿Qué es la Normalización?
La normalización es el proceso de organizar los datos en una base de datos para:
- **Eliminar redundancia** (datos repetidos)
- **Garantizar integridad** (datos consistentes)
- **Facilitar mantenimiento** (cambios sin afectar todo el sistema)

---

### 📊 Estructura de Nuestra Base de Datos

```
Usuarios (1) ──────< Vehículos (N)
    │
    │ (1)
    │
    ▼ (N)
TicketsEstancia ───> (N) CajonesEstacionamiento (N) <─── (N) Tarifas (1)
```

---

### ✅ Primera Forma Normal (1NF)

**Regla:** Cada columna debe contener valores atómicos (no divisibles).

**Cumplimiento en ParkPay:**

| ❌ INCORRECTO | ✅ CORRECTO (Nuestra BD) |
|--------------|------------------------|
| `nombre_completo: "Juan Pérez García"` | `nombre: "Juan"`<br>`apellido: "Pérez"` |
| `ubicacion: "Piso A, Cajón 15"` | `ubicacion_piso: "A"`<br>`numero_cajon: "A-15"` |

**Tabla Usuarios:**
```sql
CREATE TABLE Usuarios (
  id_usuario SERIAL PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL,          -- ✅ Atómico
  apellido VARCHAR(50) NOT NULL,        -- ✅ Atómico
  email VARCHAR(100) NOT NULL UNIQUE,   -- ✅ Atómico
  password_hash VARCHAR(255) NOT NULL,  -- ✅ Atómico
  es_admin BOOLEAN DEFAULT FALSE        -- ✅ Atómico
);
```

---

### ✅ Segunda Forma Normal (2NF)

**Regla:** Cumple 1NF + No hay dependencias parciales (todos los atributos no clave dependen de la clave primaria completa).

**Cumplimiento en ParkPay:**

**Problema evitado:**
Si tuviéramos una tabla con clave compuesta y datos que solo dependan de parte de ella.

❌ **Diseño INCORRECTO:**
```sql
Tickets (id_ticket, id_usuario, nombre_usuario, email_usuario, placa)
-- nombre_usuario y email_usuario solo dependen de id_usuario, no de id_ticket
```

✅ **Nuestro diseño CORRECTO:**
```sql
-- Tabla Usuarios (datos del usuario)
Usuarios (id_usuario, nombre, apellido, email)

-- Tabla TicketsEstancia (solo referencia al usuario)
TicketsEstancia (id_ticket, id_usuario [FK], ...)
```

**No hay dependencias parciales** porque cada tabla tiene su propia clave primaria simple (`id_usuario`, `id_ticket`, etc.).

---

### ✅ Tercera Forma Normal (3NF)

**Regla:** Cumple 2NF + No hay dependencias transitivas (ningún atributo no clave depende de otro atributo no clave).

**Cumplimiento en ParkPay:**

**Problema evitado:**
Si el costo por hora estuviera dentro de `CajonesEstacionamiento`:

❌ **Diseño INCORRECTO:**
```sql
CajonesEstacionamiento (
  id_cajon,
  numero_cajon,
  costo_por_hora,     -- ⚠️ Dependencia transitiva
  moneda              -- ⚠️ Depende de costo_por_hora
)
-- Si 100 cajones tienen la misma tarifa, se repite 100 veces
```

✅ **Nuestro diseño CORRECTO:**
```sql
-- Tabla Tarifas (esquemas de precios independientes)
Tarifas (
  id_tarifa PRIMARY KEY,
  costo_por_hora
)

-- Tabla CajonesEstacionamiento (solo referencia a tarifa)
CajonesEstacionamiento (
  id_cajon PRIMARY KEY,
  numero_cajon,
  id_tarifa [FK] → Tarifas  -- ✅ Solo una referencia
)
```

**Ventajas:**
- Cambiar el precio de una tarifa **actualiza automáticamente** todos los cajones que la usan
- **Sin redundancia**: Una tarifa de $25/hora se guarda UNA vez, aunque la usen 30 cajones
- **Integridad**: No puedes tener cajones con diferentes precios "por error"

---

## 🔧 2. OPERACIONES CRUD COMPLETAS

### **C**reate (Crear)

#### 📝 Crear Nuevo Cajón
```javascript
// Endpoint: POST /api/admin/cajones
{
  "numero_cajon": "A-16",
  "ubicacion_piso": "A",
  "tipo": "Normal",
  "id_tarifa": 1
}
```

**SQL generado:**
```sql
INSERT INTO CajonesEstacionamiento 
  (numero_cajon, ubicacion_piso, tipo, estado, id_tarifa)
VALUES 
  ('A-16', 'A', 'Normal', 'Disponible', 1);
```

**Demostración de Normalización:**
- ✅ El `id_tarifa` hace referencia a la tabla `Tarifas`
- ✅ Si la tarifa #1 es $25/hora, el cajón hereda ese precio
- ✅ No se duplica el costo en cada cajón

---

#### 💰 Crear Nueva Tarifa
```javascript
// Endpoint: POST /api/admin/tarifas
{
  "costo_por_hora": 30.00
}
```

**SQL generado:**
```sql
INSERT INTO Tarifas (costo_por_hora)
VALUES (30.00);
```

**Uso posterior:**
```sql
-- Asignar cajones premium con esta tarifa
UPDATE CajonesEstacionamiento
SET id_tarifa = 2  -- La nueva tarifa de $30
WHERE tipo = 'Eléctrico';
```

---

### **R**ead (Leer)

#### 📋 Listar Todos los Cajones con su Tarifa
```javascript
// Endpoint: GET /api/admin/cajones
```

**SQL con JOIN (demuestra normalización):**
```sql
SELECT 
  c.id_cajon,
  c.numero_cajon,
  c.ubicacion_piso,
  c.tipo,
  c.estado,
  t.costo_por_hora,     -- ✅ Viene de tabla Tarifas
  c.id_tarifa
FROM CajonesEstacionamiento c
INNER JOIN Tarifas t ON c.id_tarifa = t.id_tarifa
ORDER BY c.numero_cajon;
```

**Resultado:**
```json
[
  {
    "id_cajon": 1,
    "numero_cajon": "A-01",
    "ubicacion_piso": "A",
    "tipo": "Normal",
    "estado": "Ocupado",
    "costo_por_hora": "25.00",  // ← Viene de Tarifas
    "id_tarifa": 1
  },
  ...
]
```

**Sin normalización necesitarías:**
```sql
-- ❌ Repetir el costo 30 veces (uno por cada cajón)
SELECT id_cajon, numero_cajon, costo_por_hora
FROM Cajones_SinNormalizar;  -- costo_por_hora repetido 30 veces
```

---

#### 🎫 Listar Tickets con Información Relacionada
```javascript
// Endpoint: GET /api/admin/tickets
```

**SQL con múltiples JOINs:**
```sql
SELECT 
  t.id_ticket,
  t.codigo_acceso,
  t.fecha_entrada,
  t.fecha_salida,
  t.horas_estimadas,
  t.monto_total,
  t.estado,
  u.nombre,              -- ✅ Usuario
  u.apellido,
  u.email,
  v.placa,               -- ✅ Vehículo
  c.numero_cajon,        -- ✅ Cajón
  c.ubicacion_piso
FROM TicketsEstancia t
INNER JOIN Usuarios u ON t.id_usuario = u.id_usuario
INNER JOIN Vehiculos v ON t.id_vehiculo = v.id_vehiculo
INNER JOIN CajonesEstacionamiento c ON t.id_cajon = c.id_cajon
ORDER BY t.fecha_entrada DESC;
```

**Demuestra:**
- ✅ **Integridad Referencial**: Solo puedes crear tickets para usuarios, vehículos y cajones que existen
- ✅ **Sin Redundancia**: El email del usuario se guarda UNA vez en `Usuarios`, no en cada ticket
- ✅ **Consistencia**: Si cambias el email del usuario, se refleja en todos sus tickets

---

### **U**pdate (Actualizar)

#### 🔄 Cambiar Estado de un Cajón
```javascript
// Endpoint: PUT /api/admin/cajones/:id
{
  "estado": "Mantenimiento"
}
```

**SQL generado:**
```sql
UPDATE CajonesEstacionamiento
SET estado = 'Mantenimiento'
WHERE id_cajon = 5;
```

**Casos de uso:**
- Admin pone cajón en mantenimiento manualmente
- Sistema libera cajón cuando ticket se finaliza
- Reserva un cajón para clientes VIP

---

#### 💵 Actualizar Tarifa (Afecta múltiples cajones)
```javascript
// Endpoint: PUT /api/admin/tarifas/:id
{
  "costo_por_hora": 28.00
}
```

**SQL generado:**
```sql
UPDATE Tarifas
SET costo_por_hora = 28.00
WHERE id_tarifa = 1;
```

**Poder de la Normalización:**
```sql
-- Verificar cuántos cajones se afectan
SELECT COUNT(*) FROM CajonesEstacionamiento
WHERE id_tarifa = 1;
-- Resultado: 20 cajones

-- ✅ Con UNA actualización, cambias el precio de 20 cajones
-- ❌ Sin normalización: tendrías que actualizar 20 filas
```

---

#### ✅ Finalizar Ticket (Liberar Cajón)
```javascript
// Endpoint: PUT /api/admin/tickets/:id/finalizar
{
  "monto_cobrado": 150.00
}
```

**SQL con TRANSACCIÓN (garantiza consistencia):**
```sql
BEGIN;

-- 1. Finalizar ticket
UPDATE TicketsEstancia
SET 
  estado = 'FINALIZADO',
  fecha_salida = NOW(),
  monto_cobrado = 150.00
WHERE id_ticket = 10;

-- 2. Liberar cajón automáticamente
UPDATE CajonesEstacionamiento
SET estado = 'Disponible'
WHERE id_cajon = (
  SELECT id_cajon FROM TicketsEstancia WHERE id_ticket = 10
);

COMMIT;
```

**Demuestra:**
- ✅ **Atomicidad**: O se ejecutan ambas operaciones o ninguna
- ✅ **Integridad**: El cajón siempre queda en estado correcto

---

### **D**elete (Eliminar)

#### 🗑️ Eliminar Ticket (Libera Cajón)
```javascript
// Endpoint: DELETE /api/admin/tickets/:id
```

**SQL con lógica de negocio:**
```sql
BEGIN;

-- 1. Obtener el cajón asociado
SELECT id_cajon INTO @cajon_id
FROM TicketsEstancia
WHERE id_ticket = 10;

-- 2. Eliminar el ticket
DELETE FROM TicketsEstancia
WHERE id_ticket = 10;

-- 3. Liberar el cajón
UPDATE CajonesEstacionamiento
SET estado = 'Disponible'
WHERE id_cajon = @cajon_id;

COMMIT;
```

---

#### ⚠️ Eliminar Tarifa (Con protección de integridad)
```javascript
// Endpoint: DELETE /api/admin/tarifas/:id
```

**SQL con verificación:**
```sql
-- Primero verificar si hay cajones usando esta tarifa
SELECT COUNT(*) FROM CajonesEstacionamiento
WHERE id_tarifa = 2;

-- Si COUNT(*) = 0:
DELETE FROM Tarifas WHERE id_tarifa = 2;

-- Si COUNT(*) > 0:
-- ❌ ERROR: "No puedes eliminar una tarifa en uso"
```

**Código del backend:**
```javascript
// Verificar integridad referencial
const checkUsage = await pool.query(
  'SELECT COUNT(*) FROM CajonesEstacionamiento WHERE id_tarifa = $1',
  [id]
);

if (checkUsage.rows[0].count > 0) {
  return res.status(400).json({
    success: false,
    message: `No puedes eliminar esta tarifa. ${checkUsage.rows[0].count} cajones la están usando.`
  });
}

// Solo elimina si no está en uso
await pool.query('DELETE FROM Tarifas WHERE id_tarifa = $1', [id]);
```

**Demuestra:**
- ✅ **Integridad Referencial**: No puedes dejar cajones sin tarifa
- ✅ **Prevención de Errores**: El sistema protege la consistencia de datos

---

## 🎓 3. VENTAJAS DE LA NORMALIZACIÓN DEMOSTRADAS

### Escenario 1: Cambio de Precio
**Sin Normalización (Redundancia):**
```sql
-- Tienes que actualizar 20 cajones uno por uno
UPDATE Cajones SET costo_por_hora = 30.00 WHERE numero_cajon = 'A-01';
UPDATE Cajones SET costo_por_hora = 30.00 WHERE numero_cajon = 'A-02';
-- ... 18 veces más
-- ⚠️ Riesgo: olvidar uno, crear inconsistencias
```

**Con Normalización (Nuestro sistema):**
```sql
-- Una sola actualización afecta a todos
UPDATE Tarifas SET costo_por_hora = 30.00 WHERE id_tarifa = 1;
-- ✅ 20 cajones actualizados automáticamente
```

---

### Escenario 2: Reportes y Estadísticas
**Consulta: Ingresos totales por piso**
```sql
SELECT 
  c.ubicacion_piso AS piso,
  COUNT(t.id_ticket) AS total_tickets,
  SUM(t.monto_total) AS ingresos_totales,
  AVG(t.horas_estimadas) AS promedio_horas
FROM TicketsEstancia t
INNER JOIN CajonesEstacionamiento c ON t.id_cajon = c.id_cajon
WHERE t.estado = 'FINALIZADO'
GROUP BY c.ubicacion_piso;
```

**Resultado:**
```
piso | total_tickets | ingresos_totales | promedio_horas
-----|---------------|------------------|----------------
A    | 45            | 5625.00          | 5.2
B    | 38            | 4750.00          | 4.8
```

**Sin normalización sería imposible** hacer este tipo de análisis eficientemente.

---

## 📊 4. DIAGRAMA ENTIDAD-RELACIÓN

```
┌─────────────────┐         ┌──────────────────┐
│    Usuarios     │         │    Vehiculos     │
├─────────────────┤         ├──────────────────┤
│ id_usuario (PK) │────<───│ id_vehiculo (PK) │
│ nombre          │    1:N  │ id_usuario (FK)  │
│ apellido        │         │ placa            │
│ email           │         │ marca            │
│ password_hash   │         │ modelo           │
│ es_admin        │         │ color            │
└─────────────────┘         └──────────────────┘
        │                            │
        │ 1:N                        │ 1:N
        ▼                            ▼
┌──────────────────────────────────────────────┐
│           TicketsEstancia                    │
├──────────────────────────────────────────────┤
│ id_ticket (PK)                               │
│ id_usuario (FK) ──> Usuarios                 │
│ id_vehiculo (FK) ──> Vehiculos               │
│ id_cajon (FK) ──> CajonesEstacionamiento     │
│ codigo_acceso                                │
│ fecha_entrada                                │
│ fecha_salida                                 │
│ horas_estimadas                              │
│ monto_total                                  │
│ monto_cobrado                                │
│ estado                                       │
└──────────────────────────────────────────────┘
                    │
                    │ N:1
                    ▼
┌─────────────────────────────────┐      ┌──────────────┐
│  CajonesEstacionamiento         │      │   Tarifas    │
├─────────────────────────────────┤      ├──────────────┤
│ id_cajon (PK)                   │      │ id_tarifa(PK)│
│ numero_cajon                    │ N:1  │ costo_por_   │
│ ubicacion_piso                  │──>───│ hora         │
│ tipo                            │      └──────────────┘
│ estado                          │
│ id_tarifa (FK) ──> Tarifas      │
└─────────────────────────────────┘
```

---

## 🚀 5. CONCLUSIONES

### Normalización Alcanzada:
- ✅ **1NF**: Todos los valores son atómicos
- ✅ **2NF**: Sin dependencias parciales
- ✅ **3NF**: Tarifas separadas (sin dependencias transitivas)

### CRUD Implementado:
- ✅ **Create**: Cajones, Tarifas, Usuarios, Vehículos, Tickets
- ✅ **Read**: Listados con JOINs, estadísticas, búsquedas
- ✅ **Update**: Estados de cajones, tarifas, finalización de tickets
- ✅ **Delete**: Con verificación de integridad referencial

### Ventajas Demostradas:
1. **Sin Redundancia**: Una tarifa se guarda UNA vez
2. **Consistencia**: Cambios automáticos en cascada
3. **Integridad**: Protección contra datos huérfanos
4. **Mantenibilidad**: Fácil de modificar y extender
5. **Performance**: Consultas eficientes con índices en FK

---

## 📝 Para la Presentación

**Puntos clave a mencionar:**

1. **"Nuestra BD está en 3NF"**
   - Mostrar tabla Tarifas separada de Cajones
   - Explicar que evita redundancia

2. **"CRUD completo implementado"**
   - Demostrar crear/editar/eliminar desde panel admin
   - Mostrar protección al intentar eliminar tarifa en uso

3. **"Integridad Referencial"**
   - Mostrar que no puedes crear ticket sin usuario válido
   - Demostrar que al finalizar ticket, el cajón se libera automáticamente

4. **"Consultas eficientes"**
   - Mostrar JOIN que trae tarifa de cada cajón
   - Explicar que sin normalización tendrías que actualizar 30 filas en vez de 1

---

**¡Éxito en tu presentación! 🎓**