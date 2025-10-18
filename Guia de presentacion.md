## 📝 5. GUÍA COMPLETA PARA PRESENTACIÓN

### 🎯 Estructura Recomendada (15-20 minutos)

```
┌────────────────────────────────────────────────────────────────┐
│           CRONOGRAMA DE PRESENTACIÓN                           │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│ ⏱️ MINUTO 0-2: INTRODUCCIÓN                                    │
│   "Hoy presentaré ParkPay, un sistema de gestión de           │
│   estacionamiento con arquitectura de 3 capas y base de       │
│   datos normalizada en 3NF"                                    │
│                                                                │
│ ⏱️ MINUTO 2-5: ARQUITECTURA DEL SISTEMA                        │
│   • Mostrar diagrama de componentes                           │
│   • Explicar las 3 capas                                      │
│   • Mencionar tecnologías usadas                              │
│                                                                │
│ ⏱️ MINUTO 5-8: NORMALIZACIÓN DE BASE DE DATOS                  │
│   • Explicar 1NF, 2NF, 3NF con ejemplos del proyecto          │
│   • Mostrar tabla Tarifas separada (clave de 3NF)             │
│   • Demostrar ventaja: cambiar 1 tarifa = actualizar N cajones│
│                                                                │
│ ⏱️ MINUTO 8-14: DEMOSTRACIÓN CRUD EN VIVO                      │
│   • Login como usuario → pagar cajón                          │
│   • Verificar en BD que cajón cambió a "Ocupado"              │
│   • Login como admin → ver panel                              │
│   • CREATE: Crear nueva tarifa                                │
│   • READ: Ver cajones con tarifas                             │
│   • UPDATE: Editar tipo/tarifa de cajón                       │
│   • DELETE: Intentar eliminar tarifa en uso (error esperado)  │
│   • UPDATE: Finalizar ticket → cajón a "Disponible"           │
│                                                                │
│ ⏱️ MINUTO 14-16: CARACTERÍSTICAS TÉCNICAS                      │
│   • Transacciones ACID                                        │
│   • Integridad referencial                                    │
│   • Seguridad (bcrypt, prepared statements)                   │
│                                                                │
│ ⏱️ MINUTO 16-18: PREGUNTAS Y RESPUESTAS                        │
│                                                                │
│ ⏱️ MINUTO 18-20: CONCLUSIONES                                  │
│   "El sistema demuestra correcta aplicación de normalización, │
│   implementación completa de CRUD y arquitectura en capas"    │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

### 🗣️ Script Detallado de Presentación

#### **SLIDE 1: INTRODUCCIÓN (2 min)**

**Decir:**
> "Buenos días/tardes. Hoy presentaré **ParkPay**, un sistema integral de gestión de estacionamientos desarrollado con arquitectura de **3 capas** y una base de datos normalizada en **Tercera Forma Normal**."

> "El proyecto implementa **CRUD completo** en todas las entidades, demostrando las ventajas de la normalización de bases de datos y la separación en capas."

**Mostrar:** Pantalla principal de login del sistema.

---

#### **SLIDE 2: ARQUITECTURA DEL SISTEMA (3 min)**

**Decir:**
> "El sistema está dividido en **3 capas independientes**:"

> **1. Capa de Presentación (Frontend):**
> - HTML5, CSS3, JavaScript ES6+
> - 3 interfaces: Login de usuarios, selección de cajones, y panel administrativo
> - Validación del lado del cliente
> - Comunicación con backend vía API REST

> **2. Capa de Lógica de Negocio (Backend):**
> - Node.js con Express.js
> - 4 módulos principales: Autenticación, Cajones, Tickets, y Admin
> - Manejo de transacciones
> - Seguridad con bcrypt para contraseñas

> **3. Capa de Datos (Base de Datos):**
> - PostgreSQL 14+
> - 5 tablas principales: Usuarios, Vehículos, Cajones, Tickets, Tarifas
> - Integridad referencial con Foreign Keys
> - Constraints y validaciones

**Mostrar:** Diagrama de componentes UML del documento.

**Decir:**
> "Esta separación permite **mantenibilidad** (cambios aislados por capa), **escalabilidad** (cada capa puede crecer independientemente), y **reutilización** (la API puede usarse desde web, móvil o escritorio)."

---

#### **SLIDE 3: NORMALIZACIÓN - PRIMERA FORMA NORMAL (1NF)** (1 min)

**Decir:**
> "La base de datos cumple con **1NF** porque todos los valores son **atómicos** (no divisibles)."

**Ejemplo en pantalla:**

```
❌ INCORRECTO (valores compuestos):
┌──────────────────┬────────────────────┐
│ nombre_completo  │ ubicacion          │
├──────────────────┼────────────────────┤
│ Juan Pérez García│ Piso A, Cajón 15   │
└──────────────────┴────────────────────┘

✅ CORRECTO (valores atómicos):
┌─────────┬──────────┬───────┬──────────────┐
│ nombre  │ apellido │ piso  │ numero_cajon │
├─────────┼──────────┼───────┼──────────────┤
│ Juan    │ Pérez    │ A     │ A-15         │
└─────────┴──────────┴───────┴──────────────┘
```

---

#### **SLIDE 4: NORMALIZACIÓN - SEGUNDA FORMA NORMAL (2NF)** (1 min)

**Decir:**
> "Cumple **2NF** porque no hay **dependencias parciales**. Todos los atributos dependen completamente de la clave primaria."

**Ejemplo:**

```
❌ INCORRECTO (dependencia parcial):
TicketsEstancia (id_ticket, id_usuario, nombre_usuario, email)
                                        ↑____________↑
                      Dependen solo de id_usuario, no de id_ticket

✅ CORRECTO (sin dependencias parciales):
Usuarios (id_usuario, nombre, email)
TicketsEstancia (id_ticket, id_usuario [FK], ...)
                             ↑
                    Solo referencia, no datos duplicados
```

---

#### **SLIDE 5: NORMALIZACIÓN - TERCERA FORMA NORMAL (3NF) ⭐** (2 min)

**Decir:**
> "La **clave de la normalización** está en la **3NF**: no hay **dependencias transitivas**."

> "Esto se logró separando las **Tarifas** de los **Cajones**."

**Mostrar diagrama:**

```
❌ SIN NORMALIZACIÓN (redundancia):
┌─────────────────────────────────────────┐
│      CajonesEstacionamiento             │
├─────────────────────────────────────────┤
│ A-01 | Normal | $25.00 | Disponible    │
│ A-02 | Normal | $25.00 | Ocupado       │
│ A-03 | Normal | $25.00 | Disponible    │
│ ...  | ...    | $25.00 | ...           │← $25 repetido 30 veces
└─────────────────────────────────────────┘

Problema: Si cambio el precio a $30, tengo que actualizar 30 filas.


✅ CON NORMALIZACIÓN (sin redundancia):

┌────────────────┐         ┌──────────────────────┐
│    Tarifas     │         │ CajonesEstacionam... │
├────────────────┤         ├──────────────────────┤
│ id=1 | $25.00  │←───────│ A-01 | id_tarifa=1   │
└────────────────┘    N:1  │ A-02 | id_tarifa=1   │
                            │ A-03 | id_tarifa=1   │
                            │ ...  | id_tarifa=1   │
                            └──────────────────────┘

Ventaja: Cambio 1 fila (Tarifas) y afecta automáticamente a 30 cajones.
```

**Decir:**
> "Esta es la **ventaja principal** de la normalización: **un cambio, múltiples efectos**. Sin redundancia, sin inconsistencias."

---

#### **SLIDE 6-12: DEMOSTRACIÓN EN VIVO - CRUD COMPLETO** (6 min)

**Decir:**
> "Ahora demostraré el **CRUD completo** en acción."

---

##### **6.1 CREATE - Pago de Usuario** (1 min)

**Hacer en vivo:**
1. Abrir `index.html`
2. Login con usuario existente
3. Seleccionar cajón verde (ej: A-10)
4. Ingresar 2 horas → mostrar que calcula $50.00
5. Click en "Pagar y Ocupar"
6. Mostrar código de acceso generado

**Decir mientras haces:**
> "El usuario selecciona un cajón **disponible** (verde), ingresa las horas, y el sistema calcula automáticamente el costo. Al confirmar, se crea un **ticket** en la base de datos."

**Abrir pgAdmin y ejecutar:**
```sql
SELECT * FROM TicketsEstancia ORDER BY id_ticket DESC LIMIT 1;
```

**Mostrar resultado:**
```
id_ticket | codigo_acceso | estado | monto_total | id_cajon
----------|---------------|--------|-------------|----------
    15    |    482937     | ACTIVO |    50.00    |    10
```

**Decir:**
> "✅ **CREATE exitoso**: Se creó el ticket #15 en estado ACTIVO."

---

##### **6.2 READ - Verificar Cajón Ocupado** (30 seg)

**Hacer:**
Volver a la página de estacionamiento y mostrar que el cajón A-10 ahora está **rojo** (ocupado).

**En pgAdmin:**
```sql
SELECT numero_cajon, estado FROM CajonesEstacionamiento WHERE id_cajon = 10;
```

**Resultado:**
```
numero_cajon | estado
-------------|--------
    A-10     | Ocupado
```

**Decir:**
> "✅ **READ verificado**: El cajón cambió de 'Disponible' a 'Ocupado'. La interfaz y la BD están sincronizadas."

---

##### **6.3 ADMIN - CREATE Tarifa** (1 min)

**Hacer:**
1. Abrir `admin.html` en nueva pestaña
2. Login como admin
3. Ir a pestaña "💵 Tarifas"
4. Click en "Crear Nueva Tarifa"
5. Llenar: Descripción = "VIP", Costo = 100.00
6. Guardar

**Decir:**
> "Como administrador, puedo crear nuevas tarifas. Esta tarifa 'VIP' costará $100 por hora."

**En pgAdmin:**
```sql
SELECT * FROM Tarifas ORDER BY id_tarifa DESC LIMIT 1;
```

**Resultado:**
```
id_tarifa | descripcion | costo_por_hora
----------|-------------|----------------
    3     |     VIP     |    100.00
```

**Decir:**
> "✅ **CREATE exitoso**: Tarifa VIP creada."

---

##### **6.4 ADMIN - UPDATE Cajón (Cambiar Tipo y Tarifa)** (1.5 min)

**Hacer:**
1. En panel admin, ir a "🅿️ Cajones"
2. Buscar cajón A-05 (disponible)
3. Click en "✏️ Editar"
4. Cambiar:
   - Tipo: "Eléctrico"
   - Tarifa: "VIP ($100.00/hora)"
5. Guardar

**Decir mientras haces:**
> "Voy a convertir el cajón A-05 en un **cajón eléctrico con tarifa VIP**. Esto demuestra el **UPDATE** completo."

**En pgAdmin:**
```sql
SELECT 
  c.numero_cajon, 
  c.tipo, 
  t.descripcion AS tarifa, 
  t.costo_por_hora
FROM CajonesEstacionamiento c
JOIN Tarifas t ON c.id_tarifa = t.id_tarifa
WHERE c.numero_cajon = 'A-05';
```

**Resultado:**
```
numero_cajon | tipo       | tarifa | costo_por_hora
-------------|------------|--------|----------------
    A-05     | Eléctrico  |  VIP   |    100.00
```

**Decir:**
> "✅ **UPDATE exitoso**: Cajón A-05 ahora es Eléctrico con tarifa VIP. Noten que el cajón **no guarda '$100'**, guarda **id_tarifa=3** (referencia). Esto es **normalización 3NF** en acción."

---

##### **6.5 ADMIN - UPDATE Tarifa (Efecto en Cascada)** (1 min)

**Hacer:**
1. En panel admin, pestaña "💵 Tarifas"
2. Click en "✏️ Editar" de tarifa "Normal" ($25)
3. Cambiar costo a $30.00
4. Guardar

**Decir:**
> "Ahora cambiaré la tarifa Normal de $25 a $30. Esto debería afectar TODOS los cajones que usan esa tarifa."

**En pgAdmin:**
```sql
-- Ver cuántos cajones usan tarifa Normal
SELECT COUNT(*) AS cajones_afectados 
FROM CajonesEstacionamiento 
WHERE id_tarifa = 1;

-- Ver el nuevo precio
SELECT c.numero_cajon, t.costo_por_hora
FROM CajonesEstacionamiento c
JOIN Tarifas t ON c.id_tarifa = t.id_tarifa
WHERE t.id_tarifa = 1
LIMIT 5;
```

**Resultado:**
```
cajones_afectados: 28

numero_cajon | costo_por_hora
-------------|----------------
    A-01     |    30.00
    A-02     |    30.00
    A-03     |    30.00
    ...
```

**Decir:**
> "✅ **Normalización demostrada**: Con **1 UPDATE** en la tabla Tarifas, actualicé automáticamente **28 cajones**. Sin redundancia, sin inconsistencias."

---

##### **6.6 ADMIN - DELETE con Integridad Referencial** (1 min)

**Hacer:**
1. En panel admin, pestaña "💵 Tarifas"
2. Intentar eliminar tarifa "Normal" (que está en uso)
3. Mostrar mensaje de error

**Decir:**
> "Ahora intentaré eliminar la tarifa Normal que está siendo usada por 28 cajones."

**Resultado esperado:**
```
❌ Error: No puedes eliminar esta tarifa. 28 cajones la están usando.
```

**Decir:**
> "✅ **Integridad Referencial protegida**: El sistema impide eliminar una tarifa en uso. Esto evita **datos huérfanos** (cajones sin tarifa)."

**Hacer:**
Eliminar la tarifa "VIP" (que solo la usa A-05 si lo quieres demostrar, o crear una tarifa dummy que no use nadie)

**Decir:**
> "En cambio, si elimino una tarifa que NO está en uso, sí se permite."

---

##### **6.7 ADMIN - DELETE Ticket (Liberar Cajón)** (1 min)

**Hacer:**
1. En panel admin, pestaña "🎫 Tickets"
2. Buscar ticket activo (ej: el ticket #15 que creamos)
3. Click en "🗑️ Eliminar"
4. Confirmar

**Decir:**
> "Si elimino un ticket activo, el cajón debe liberarse automáticamente."

**En pgAdmin:**
```sql
-- Verificar que ticket fue eliminado
SELECT * FROM TicketsEstancia WHERE id_ticket = 15;
-- Resultado: 0 rows

-- Verificar que cajón quedó disponible
SELECT numero_cajon, estado FROM CajonesEstacionamiento WHERE id_cajon = 10;
```

**Resultado:**
```
numero_cajon | estado
-------------|------------
    A-10     | Disponible
```

**Decir:**
> "✅ **DELETE con efecto en cascada**: Al eliminar el ticket, el cajón A-10 volvió a 'Disponible'. Esto garantiza **consistencia de datos**."

---

##### **6.8 ADMIN - UPDATE Finalizar Ticket** (30 seg)

**Hacer:**
1. Crear otro ticket rápido como usuario
2. Como admin, ir a "🎫 Tickets"
3. Click en "✅ Finalizar" del ticket
4. Ingresar monto cobrado (ej: $50.00)

**Decir:**
> "Cuando un usuario sale del estacionamiento, el admin puede finalizar el ticket manualmente."

**En pgAdmin:**
```sql
SELECT estado, monto_cobrado FROM TicketsEstancia WHERE id_ticket = 16;
```

**Resultado:**
```
estado      | monto_cobrado
------------|---------------
FINALIZADO  |    50.00
```

**Decir:**
> "✅ **UPDATE de estado**: El ticket pasó de 'ACTIVO' a 'FINALIZADO' y el cajón quedó disponible."

---

#### **SLIDE 13: CARACTERÍSTICAS TÉCNICAS** (2 min)

**Decir:**
> "Más allá del CRUD, el sistema implementa características avanzadas:"

**1. Transacciones ACID:**
> "Al pagar un cajón, se ejecuta una **transacción atómica**: o se crea el ticket **Y** se ocupa el cajón, o **NO** pasa nada. Esto evita estados inconsistentes."

**Mostrar código (opcional):**
```javascript
// backend/routes/tickets.js
await client.query('BEGIN');
try {
  // Crear ticket
  await client.query('INSERT INTO TicketsEstancia...');
  // Ocupar cajón
  await client.query('UPDATE CajonesEstacionamiento...');
  await client.query('COMMIT'); // ✅ Todo exitoso
} catch (error) {
  await client.query('ROLLBACK'); // ❌ Revertir todo
}
```

**2. Integridad Referencial:**
> "Foreign Keys con `ON DELETE CASCADE` garantizan que si elimino un usuario, sus vehículos y tickets también se eliminan. No quedan datos huérfanos."

**3. Seguridad:**
> "Las contraseñas se almacenan **hasheadas con bcrypt** (10 rounds). Nunca en texto plano."

**Mostrar en pgAdmin:**
```sql
SELECT email, password_hash FROM Usuarios LIMIT 1;
```

**Resultado:**
```
email                | password_hash
---------------------|--------------------------------------
juan@example.com     | $2a$10$N9qo8uLOickgx2ZMRZoMye...
```

**Decir:**
> "Vean cómo la contraseña está hasheada. Incluso si alguien accede a la BD, no puede obtener las contraseñas reales."

**4. Prepared Statements:**
> "Todas las consultas usan **prepared statements** de PostgreSQL, previniendo **SQL injection**."

```javascript
// ❌ VULNERABLE:
const query = `SELECT * FROM Usuarios WHERE email = '${email}'`;

// ✅ SEGURO:
const query = 'SELECT * FROM Usuarios WHERE email = $1';
await pool.query(query, [email]);
```

---

#### **SLIDE 14: CONCLUSIONES** (1 min)

**Decir:**
> "En resumen, el proyecto **ParkPay** demuestra:"

> ✅ **Arquitectura en 3 Capas**: Presentación, Lógica, Datos
> - Separación de responsabilidades
> - Mantenibilidad y escalabilidad

> ✅ **Base de Datos Normalizada en 3NF**:
> - Sin redundancia de datos
> - Integridad referencial garantizada
> - Un cambio afecta múltiples registros automáticamente

> ✅ **CRUD Completo Implementado**:
> - CREATE: Usuarios, Tarifas, Tickets
> - READ: Listados con JOINs, estadísticas
> - UPDATE: Estados, tarifas, finalización de tickets
> - DELETE: Con protección de integridad

> ✅ **Características Técnicas Avanzadas**:
> - Transacciones ACID
> - Seguridad con bcrypt y prepared statements
> - API REST estándar

> "El sistema está listo para producción y puede escalar fácilmente agregando más pisos, tipos de cajones, o incluso múltiples estacionamientos."

---

#### **SLIDE 15: PREGUNTAS FRECUENTES** (Preparación)

**Profesor podría preguntar:**

**P: "¿Por qué separaste las Tarifas de los Cajones?"**
**R:** "Para cumplir con 3NF y evitar dependencias transitivas. Si el costo estuviera en Cajones, se repetiría 30 veces. Con Tarifas separadas, cambio 1 registro y afecto N cajones. Además, permite crear esquemas de precios flexibles (VIP, normal, descuentos, etc.)."

**P: "¿Qué pasa si dos usuarios intentan ocupar el mismo cajón al mismo tiempo?"**
**R:** "La transacción usa `SELECT ... FOR UPDATE` que crea un **lock** en el cajón. El segundo usuario recibe un error 'Cajón no disponible' porque el primero ya lo bloqueó. PostgreSQL maneja la concurrencia automáticamente."

**P: "¿Cómo garantizas que no haya SQLinjection?"**
**R:** "Uso **prepared statements** de `pg` (cliente PostgreSQL para Node.js). Los parámetros se envían separados de la query (`$1`, `$2`), por lo que nunca se concatenan strings directamente."

**P: "¿Por qué usaste bcrypt en lugar de otro hash?"**
**R:** "bcrypt es específico para contraseñas porque:
1. Es lento intencionalmente (protege contra ataques de fuerza bruta)
2. Incluye 'salt' automático (previene rainbow tables)
3. Es estándar de la industria"

**P: "¿El frontend y backend están separados?"**
**R:** "Sí, completamente. El frontend es HTML/CSS/JS estático que **consume una API REST**. Podría servirse desde Apache/Nginx mientras el backend corre en otro servidor. Incluso podría crear una app móvil que use la misma API."

**P: "¿Qué pasa si el servidor se cae mientras hay una transacción?"**
**R:** "PostgreSQL garantiza **durabilidad** (la D en ACID). Si la transacción hizo COMMIT, los cambios se guardan permanentemente. Si se cayó antes del COMMIT, automáticamente hace ROLLBACK y vuelve al estado anterior."

---

### 📊 Material de Apoyo Visual

**Tener listos:**
1. **Diagrama de componentes** impreso o en slide
2. **Capturas de pantalla**:
   - Interfaz de usuario
   - Panel de admin
   - Tablas en pgAdmin
3. **Código clave**:
   - Transacción en `tickets.js`
   - JOIN de cajones con tarifas
   - Validación de integridad en `admin.js`

---

### ✅ Checklist Pre-Presentación

```
☐ PostgreSQL corriendo
☐ Backend iniciado (node server.js)
☐ Navegador con pestañas abiertas:
  ☐ index.html
  ☐ estacionamiento.html
  ☐ admin.html
☐ pgAdmin abierto con consultas preparadas
☐ Usuario de prueba creado
☐ Al menos 1 cajón disponible
☐ Audio/video funcionando (si es remoto)
☐ Documento de respaldo (este .md) abierto
```

---

### 🎤 Tips de Presentación

1. **Habla con confianza**: Has construido un sistema robusto y completo.

2. **Usa términos técnicos correctamente**:
   - "Transacción atómica"
   - "Integridad referencial"
   - "Prepared statements"
   - "Normalización en 3NF"

3. **Conecta teoría con práctica**:
   - No solo digas "está en 3NF", **demuéstralo** cambiando una tarifa.

4. **Maneja errores con naturalidad**:
   - Si algo falla: "Esto demuestra la validación del sistema funcionando correctamente"

5. **Interactúa con el profesor**:
   - "¿Quiere que demuestre alguna operación específica?"

6. **Cierra con impacto**:
   - "Este sistema puede escalar a múltiples estacionamientos, integrarse con pagos electrónicos, y generar reportes de ingresos por períodos. La arquitectura lo permite."

---

### 🏆 Puntos Extra para Impresionar

**Si tienes tiempo extra:**

1. **Mostrar un reporte SQL complejo:**
```sql
-- Ingresos totales por tipo de cajón
SELECT 
  c.tipo,
  COUNT(t.id_ticket) AS total_tickets,
  SUM(t.monto_cobrado) AS ingresos,
  AVG(t.horas_estimadas) AS promedio_horas
FROM TicketsEstancia t
JOIN CajonesEstacionamiento c ON t.id_cajon = c.id_cajon
WHERE t.estado = 'FINALIZADO'
GROUP BY c.tipo
ORDER BY ingresos DESC;
```

**Decir:** "Puedo generar reportes analíticos fácilmente gracias a la normalización."

2. **Mencionar escalabilidad:**
> "Si mañana quiero agregar un Piso C con 20 cajones más, solo ejecuto:
> ```sql
> INSERT INTO CajonesEstacionamiento (numero_cajon, ubicacion_piso, tipo, id_tarifa)
> VALUES ('C-01', 'C', 'Normal', 1), ...; -- 20 filas
> ```
> Y el sistema funciona sin cambios en el código."

3. **Hablar de mejoras futuras:**
> "Próximas versiones podrían incluir:
> - Integración con pasarelas de pago (Stripe, PayPal)
> - Sistema de reservas anticipadas
> - App móvil nativa (iOS/Android)
> - Dashboard de estadísticas en tiempo real con gráficos"

---

## 🎓 ¡ÉXITO EN TU PRESENTACIÓN!

**Recuerda:** Has construido un sistema profesional que demuestra dominio de:
- Bases de datos relacionales
- Normalización
- Arquitectura de software
- Desarrollo full-stack
- Seguridad
- Transacciones

**¡Con confianza y claridad, vas a sobresalir! 💪🚀**