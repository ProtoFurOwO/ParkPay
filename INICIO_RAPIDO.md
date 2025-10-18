# 🚀 INICIO RÁPIDO - ParkPay

## ⚡ Pasos para Iniciar (5 minutos)

### 1️⃣ Configurar Base de Datos PostgreSQL

Abre **pgAdmin** o **psql** y ejecuta estos archivos en orden:

```sql
-- Paso 1: Crear la estructura
-- Ejecuta: c:\masm\BIN\base postgre.sql
-- Esto crea la base de datos park_pay_db y todas las tablas

-- Paso 2: Insertar datos iniciales
-- Conectate a park_pay_db
\c park_pay_db

-- Ejecuta: backend\init_db.sql
-- Esto inserta las tarifas y los 30 cajones (15 por piso)
```

**Verificación rápida:**
```sql
-- Deberías ver 30 cajones
SELECT COUNT(*) FROM CajonesEstacionamiento;

-- Deberías ver 3 tarifas
SELECT * FROM Tarifas;
```

### 2️⃣ Configurar Credenciales

Edita el archivo `backend\.env` con tu contraseña de PostgreSQL:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=park_pay_db
DB_USER=postgres
DB_PASSWORD=TU_PASSWORD_AQUI    ← CAMBIA ESTO
PORT=3000
```

### 3️⃣ Instalar Dependencias

Abre PowerShell o CMD en la carpeta PP y ejecuta:

```powershell
cd backend
npm install
```

Espera a que se instalen todas las dependencias (Express, PostgreSQL, bcrypt, etc.)

### 4️⃣ Iniciar Aplicación

**Opción A - Usando los scripts .bat (MÁS FÁCIL):**

1. Doble clic en `INICIAR_SERVIDOR.bat`
   - Verás: "Servidor corriendo en http://localhost:3000"
   - **NO cierres esta ventana**

2. Doble clic en `ABRIR_APP.bat`
   - Se abrirá tu navegador con la aplicación

**Opción B - Manual:**

Terminal 1 (Backend):
```powershell
cd backend
node server.js
```

Terminal 2 (Frontend):
```powershell
# Abre index.html en tu navegador
start index.html
```

### 5️⃣ Probar la Aplicación

1. **Registrarse:**
   - Nombre: Juan
   - Apellido: Pérez
   - Email: juan@test.com
   - Contraseña: 123456
   - Placa: ABC-123
   - (Opcional) Marca: Toyota
   - (Opcional) Modelo: Corolla
   - (Opcional) Color: Blanco

2. **Iniciar Sesión:**
   - Email: juan@test.com
   - Contraseña: 123456

3. **Seleccionar Lugar:**
   - Verás los pisos A y B con 15 lugares cada uno
   - Los cajones verdes están disponibles
   - Haz clic en uno disponible
   - Elige las horas (ejemplo: 2 horas)
   - Verás el costo calculado automáticamente
   - Haz clic en "Pagar y Ocupar Lugar"

4. **Confirmación:**
   - Verás tu código de acceso único
   - El cajón se pondrá rojo (ocupado)

## ✅ Verificar que Todo Funciona

### Verificar Backend:
Abre en tu navegador: http://localhost:3000

Deberías ver:
```json
{
  "message": "🚗 API ParkPay funcionando correctamente",
  "endpoints": {...}
}
```

### Verificar Base de Datos:
```sql
-- Ver cajones
SELECT numero_cajon, ubicacion_piso, tipo, estado 
FROM CajonesEstacionamiento 
ORDER BY ubicacion_piso, numero_cajon;

-- Ver usuarios registrados
SELECT id_usuario, nombre, apellido, email 
FROM Usuarios;

-- Ver tickets activos
SELECT * FROM TicketsEstancia WHERE estado = 'ACTIVO';
```

## 🎨 Vista Esperada

### Login/Registro:
- Pantalla oscura elegante
- Formularios con validación
- Cambio fluido entre login y registro

### Estacionamiento:
- **Piso A:** 15 cajones en cuadrícula 5x3
- **Piso B:** 15 cajones en cuadrícula 5x3
- Colores:
  - 🟢 Verde = Disponible
  - 🔴 Rojo = Ocupado
  - 🔵 Azul = Seleccionado
- Panel lateral con:
  - Info del vehículo
  - Formulario de reserva
  - Cálculo de costo en tiempo real

## 🐛 Si Algo Falla

### Error: "No se puede conectar al servidor"
```powershell
# Verifica que el backend esté corriendo
cd backend
node server.js
```

### Error: "Error de conexión a base de datos"
1. Verifica que PostgreSQL esté corriendo
2. Revisa el archivo `backend\.env`
3. Prueba la conexión en pgAdmin

### Los cajones no aparecen
```sql
-- Ejecuta esto en PostgreSQL
SELECT COUNT(*) FROM CajonesEstacionamiento;
-- Debe devolver 30
```

### No puedo registrarme
- Abre la consola del navegador (F12)
- Ve a la pestaña "Console"
- Busca errores en rojo
- Verifica que el backend esté corriendo

## 📊 Datos de Prueba

Si quieres datos de prueba rápidos:

```sql
-- Usuario de prueba
INSERT INTO Usuarios (nombre, apellido, email, password_hash) 
VALUES ('Test', 'User', 'test@test.com', '$2a$10$abcdefghijklmnopqrstuv');

-- Vehículo de prueba
INSERT INTO Vehiculos (id_usuario, placa, marca, modelo, color)
VALUES (1, 'TEST-123', 'Toyota', 'Corolla', 'Blanco');
```

## 🎯 Próximos Pasos

Una vez que todo funcione:
- ✅ Prueba ocupar varios cajones
- ✅ Prueba con diferentes pisos
- ✅ Verifica el cálculo de tarifas
- ✅ Revisa que los datos se guarden en la BD

## 📞 Comandos Útiles

```powershell
# Ver el servidor corriendo
netstat -ano | findstr :3000

# Matar proceso en puerto 3000 (si se quedó colgado)
# Busca el PID del comando anterior, luego:
taskkill /PID <numero_pid> /F

# Reinstalar dependencias
cd backend
rmdir /s node_modules
npm install
```

---

**¡Listo para arrancar! 🚗💨**

Si todo está bien configurado, en 5 minutos estarás viendo tu aplicación funcionando.
