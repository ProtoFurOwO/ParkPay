# 🚗🏍️⚡ Sistema de Filtrado Inteligente por Tipo de Vehículo

## 📋 Descripción del Cambio

Se agregó un nuevo campo `tipo` a la tabla `Vehiculos` para almacenar el tipo de vehículo (Automóvil, Motocicleta, Eléctrico). Ahora el sistema filtra automáticamente los cajones disponibles según el tipo de vehículo del usuario.

---

## 🗄️ Cambios en la Base de Datos

### ✅ Nueva Estructura de `Vehiculos`:
```sql
CREATE TABLE Vehiculos (
  id_vehiculo SERIAL PRIMARY KEY,
  id_usuario INT NOT NULL,
  placa VARCHAR(10) NOT NULL UNIQUE,
  marca VARCHAR(50),
  modelo VARCHAR(50),
  color VARCHAR(30),
  tipo tipo_vehiculo_enum NOT NULL,  -- ← NUEVO CAMPO
  CONSTRAINT fk_vehiculo_usuario
    FOREIGN KEY (id_usuario)
    REFERENCES Usuarios(id_usuario)
    ON DELETE CASCADE
);
```

### 📊 Tipos de Vehículos (ENUM):
```sql
CREATE TYPE tipo_vehiculo_enum AS ENUM ('Automóvil', 'Motocicleta', 'Eléctrico');
```

### 📊 Tipos de Cajones (ENUM):
```sql
CREATE TYPE tipo_cajon_enum AS ENUM ('Automóvil', 'Motocicleta', 'Eléctrico', 'Discapacitado');
```

---

## 🎯 Reglas de Compatibilidad

### 1️⃣ Motocicletas 🏍️
- **Solo pueden usar cajones de tipo:** `Motocicleta`
- **No pueden usar:** Automóvil, Eléctrico, Discapacitado
- **Razón:** Espacios más pequeños y tarifas especiales

### 2️⃣ Automóviles 🚗
- **Pueden usar cajones de tipo:** `Automóvil`, `Discapacitado`
- **No pueden usar:** Motocicleta (muy pequeños), Eléctrico (reservados para vehículos eléctricos)
- **Razón:** Compatibilidad de tamaño

### 3️⃣ Vehículos Eléctricos ⚡
- **Pueden usar cajones de tipo:** `Eléctrico`, `Automóvil`, `Discapacitado`
- **No pueden usar:** Motocicleta (muy pequeños)
- **Razón:** Máxima flexibilidad + acceso a estaciones de carga

---

## 🔄 Flujo de Usuario

### 1. Registro
```
Usuario se registra
       ↓
Selecciona tipo de vehículo:
   • 🚗 Automóvil
   • 🏍️ Motocicleta
   • ⚡ Eléctrico
       ↓
Se guarda en BD con tipo
```

### 2. Login
```
Usuario inicia sesión
       ↓
Backend retorna datos del vehículo
(incluye campo "tipo")
       ↓
Se guarda en localStorage
```

### 3. Visualización del Mapa
```
Página carga cajones disponibles
       ↓
JavaScript lee tipo de vehículo del usuario
       ↓
Función esCajonCompatible() filtra cajones
       ↓
MUESTRA:
   ✅ Verde = Compatible y disponible
   🔴 Rojo = Ocupado
   🟦 Azul = Seleccionado
   ⚫ Gris + 🚫 = Disponible pero NO compatible
```

---

## 💻 Código Implementado

### Frontend: `index.html`
```html
<!-- Nuevo campo en formulario de registro -->
<div class="form-group">
    <label for="regTipoVehiculo">Tipo de Vehículo *</label>
    <select id="regTipoVehiculo" required class="form-select">
        <option value="">Selecciona el tipo</option>
        <option value="Automóvil">🚗 Automóvil</option>
        <option value="Motocicleta">🏍️ Motocicleta</option>
        <option value="Eléctrico">⚡ Eléctrico</option>
    </select>
</div>
```

### Frontend: `js/auth.js`
```javascript
// Al registrarse, se envía el tipo de vehículo
const tipoVehiculo = document.getElementById('regTipoVehiculo').value;

await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    body: JSON.stringify({
        nombre, apellido, email, password,
        tipo: tipoVehiculo,  // ← Nuevo campo
        placa, marca, modelo, color
    })
});
```

### Backend: `routes/auth.js`
```javascript
// Recibir y validar el tipo de vehículo
const { nombre, apellido, email, password, tipo, placa, marca, modelo, color } = req.body;

// Validar tipo
const tiposValidos = ['Automóvil', 'Motocicleta', 'Eléctrico'];
if (!tiposValidos.includes(tipo)) {
    return res.status(400).json({ error: 'Tipo de vehículo inválido' });
}

// Guardar en BD con tipo
await client.query(
    'INSERT INTO Vehiculos (id_usuario, placa, marca, modelo, color, tipo) VALUES ($1, $2, $3, $4, $5, $6)',
    [usuario.id_usuario, placa, marca, modelo, color, tipo]
);
```

### Frontend: `js/parking.js` - Lógica de Compatibilidad
```javascript
// Función que determina si un cajón es compatible
function esCajonCompatible(tipoCajon, tipoVehiculo) {
    if (!tipoVehiculo) return false;
    
    // Motocicletas solo en cajones de motocicleta
    if (tipoVehiculo === 'Motocicleta') {
        return tipoCajon === 'Motocicleta';
    }
    
    // Automóviles en cajones normales o discapacitados
    if (tipoVehiculo === 'Automóvil') {
        return tipoCajon === 'Automóvil' || tipoCajon === 'Discapacitado';
    }
    
    // Eléctricos tienen más opciones
    if (tipoVehiculo === 'Eléctrico') {
        return tipoCajon === 'Eléctrico' || tipoCajon === 'Automóvil' || tipoCajon === 'Discapacitado';
    }
    
    return false;
}

// Al crear cajón, verificar compatibilidad
function createSpotElement(cajon) {
    const tipoVehiculoUsuario = vehiculos[0]?.tipo;
    const esCompatible = esCajonCompatible(cajon.tipo, tipoVehiculoUsuario);
    
    if (cajon.estado === 'Disponible' && !esCompatible) {
        spot.className = 'spot incompatible';  // ← Cajón gris con 🚫
        spot.style.cursor = 'not-allowed';
    }
}
```

### Frontend: `css/styles.css` - Estilos para Incompatible
```css
.spot.incompatible {
    background: linear-gradient(135deg, #64748b 0%, #475569 100%);
    cursor: not-allowed;
    opacity: 0.5;
    position: relative;
}

.spot.incompatible::after {
    content: '🚫';
    position: absolute;
    top: 5px;
    right: 5px;
    font-size: 1.2rem;
}
```

---

## 🧪 Cómo Probar

### Escenario 1: Usuario con Motocicleta 🏍️

1. **Registrar usuario:**
   - Tipo de vehículo: Motocicleta
   - Placa: MOTO-123

2. **Login y ver mapa:**
   - ✅ Cajones tipo "Motocicleta" en VERDE (seleccionables)
   - ⚫ Cajones tipo "Automóvil" en GRIS con 🚫 (no seleccionables)
   - ⚫ Cajones tipo "Eléctrico" en GRIS con 🚫
   - ⚫ Cajones tipo "Discapacitado" en GRIS con 🚫

3. **Intentar seleccionar cajón incompatible:**
   - Click en cajón gris → No pasa nada (cursor: not-allowed)

4. **Seleccionar cajón compatible:**
   - Click en cajón verde (Motocicleta) → Se selecciona
   - Formulario muestra tarifa de motocicleta

### Escenario 2: Usuario con Automóvil 🚗

1. **Registrar usuario:**
   - Tipo de vehículo: Automóvil
   - Placa: AUTO-456

2. **Login y ver mapa:**
   - ✅ Cajones tipo "Automóvil" en VERDE
   - ✅ Cajones tipo "Discapacitado" en VERDE
   - ⚫ Cajones tipo "Motocicleta" en GRIS con 🚫
   - ⚫ Cajones tipo "Eléctrico" en GRIS con 🚫

### Escenario 3: Usuario con Vehículo Eléctrico ⚡

1. **Registrar usuario:**
   - Tipo de vehículo: Eléctrico
   - Placa: ELEC-789

2. **Login y ver mapa:**
   - ✅ Cajones tipo "Eléctrico" en VERDE
   - ✅ Cajones tipo "Automóvil" en VERDE
   - ✅ Cajones tipo "Discapacitado" en VERDE
   - ⚫ Cajones tipo "Motocicleta" en GRIS con 🚫

---

## 🎨 Colores en el Mapa

| Estado | Color | Cursor | Puede Seleccionar |
|--------|-------|--------|-------------------|
| Disponible y Compatible | 🟢 Verde | pointer | ✅ Sí |
| Ocupado | 🔴 Rojo | not-allowed | ❌ No |
| Disponible pero Incompatible | ⚫ Gris + 🚫 | not-allowed | ❌ No |
| Seleccionado | 🔵 Azul | pointer | ✅ Sí (para deseleccionar) |

---

## 💡 Beneficios

### 1️⃣ **Tarificación Correcta**
- Cada tipo de vehículo paga su tarifa correspondiente
- No hay confusiones en cobros

### 2️⃣ **Uso Eficiente del Espacio**
- Motocicletas no ocupan espacios de autos
- Autos no pueden invadir espacios pequeños de motos

### 3️⃣ **Experiencia de Usuario Mejorada**
- Usuario solo ve opciones válidas
- No puede cometer errores de selección
- Interface intuitiva con colores y símbolos

### 4️⃣ **Cumplimiento de Regulaciones**
- Cajones para discapacitados controlados
- Espacios de carga eléctrica reservados para vehículos eléctricos

---

## 🔧 Migración de Datos Existentes

Si ya tienes usuarios registrados sin el campo `tipo`, necesitas:

```sql
-- Opción 1: Asignar tipo por defecto
UPDATE Vehiculos 
SET tipo = 'Automóvil'
WHERE tipo IS NULL;

-- Opción 2: Basado en cajones que han usado
UPDATE Vehiculos v
SET tipo = (
    SELECT CASE
        WHEN c.tipo = 'Motocicleta' THEN 'Motocicleta'
        WHEN c.tipo = 'Eléctrico' THEN 'Eléctrico'
        ELSE 'Automóvil'
    END
    FROM TicketsEstancia t
    JOIN CajonesEstacionamiento c ON t.id_cajon = c.id_cajon
    WHERE t.id_vehiculo = v.id_vehiculo
    LIMIT 1
)
WHERE v.tipo IS NULL;
```

---

## 📊 Consulta para Verificar Distribución

```sql
-- Ver cuántos vehículos de cada tipo hay registrados
SELECT 
    tipo,
    COUNT(*) as total_vehiculos
FROM Vehiculos
GROUP BY tipo
ORDER BY total_vehiculos DESC;

-- Ver cuántos cajones de cada tipo hay disponibles
SELECT 
    tipo,
    COUNT(*) as total_cajones,
    SUM(CASE WHEN estado = 'Disponible' THEN 1 ELSE 0 END) as disponibles,
    SUM(CASE WHEN estado = 'Ocupado' THEN 1 ELSE 0 END) as ocupados
FROM CajonesEstacionamiento
GROUP BY tipo
ORDER BY tipo;
```

---

## 🎯 Para Presentar al Profesor

### Demostración en Vivo:

1. **Registrar 3 usuarios diferentes:**
   - Usuario 1: Motocicleta (placa: MOTO-001)
   - Usuario 2: Automóvil (placa: AUTO-001)
   - Usuario 3: Eléctrico (placa: ELEC-001)

2. **Login con cada uno y mostrar:**
   - Cómo cambia el mapa según el tipo de vehículo
   - Cajones disponibles (verde) vs incompatibles (gris)
   - Información del vehículo en el panel lateral

3. **Explicar la lógica:**
   - Mostrar código de `esCajonCompatible()`
   - Mostrar query SQL con el campo `tipo`
   - Explicar beneficios de la normalización

4. **Probar restricciones:**
   - Intentar hacer click en cajón incompatible (no funciona)
   - Seleccionar cajón compatible y hacer "pago"
   - Mostrar que se cobra la tarifa correcta

¡Éxito! 🎉
