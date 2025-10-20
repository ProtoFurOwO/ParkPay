# 📋 Documento de Integración de Servicios y Lógica de Negocios
## Sistema ParkPay - Gestión Inteligente de Estacionamiento

---

## � INFORMACIÓN DEL PROYECTO

### **Institución Educativa**
**Universidad Autónoma de Chiapas**  
Facultad de Ingeniería

### **Equipo de Desarrollo**
- **Jose Antonio Matuz Argueta** - Líder de Proyecto
- **Jonathan Antonio González Salinas** - Desarrollador
- **Ivan Armando Perez Gomez** - Desarrollador
- **Angel Daniel Manuel Torres** - Desarrollador
- **Josue Muñoz Silva** - Desarrollador

### **Información Académica**
- **Materia:** Desarrollo de Aplicaciones Web
- **Semestre:** Quinto Semestre
- **Carrera:** Ingeniería en Sistemas Computacionales
- **Fecha de Entrega:** Octubre 2025

---

## �🏗️ ARQUITECTURA DE CAPAS DEL SISTEMA

### **Resumen Ejecutivo**
ParkPay es un sistema de gestión de estacionamiento inteligente que implementa una arquitectura de 4 capas bien definidas, siguiendo principios de separación de responsabilidades y buenas prácticas de desarrollo web moderno.

---

## 1️⃣ CAPA DE PRESENTACIÓN (Frontend)
**Tecnologías:** HTML5, CSS3, JavaScript Vanilla

### **1.1 Componentes Principales**

#### **Módulo de Autenticación (`index.html`, `auth.js`)**
- **Funcionalidad:** Gestión de acceso al sistema
- **Características:**
  - Login de usuarios registrados
  - Registro de nuevos usuarios con validación
  - Recuperación de contraseñas vía email
  - Validación de contraseñas fuertes:
    * Mínimo 6 caracteres
    * Al menos 1 letra mayúscula
    * Al menos 1 número
  - Feedback visual en tiempo real

#### **Módulo de Gestión de Estacionamiento (`estacionamiento.html`, `parking.js`)**
- **Funcionalidad:** Selección y reserva de lugares
- **Características:**
  - Visualización de cajones disponibles/ocupados
  - Renderizado dinámico de espacios
  - Selección de ubicación con estado visual
  - Cálculo de tarifas en tiempo real
  - Generación de códigos QR para tickets

#### **Dashboard de Usuario (`inicio.html`)**
- **Funcionalidad:** Centro de control para el cliente
- **Características:**
  - Vista de reservas activas
  - Historial de estacionamientos
  - Gestión de vehículos registrados
  - Control de tiempo de estancia
  - Opción de extensión de tiempo
  - Botón de pánico para finalizar estancia

#### **Panel de Administración (`admin.html`, `admin-panel.js`)**
- **Funcionalidad:** Gestión administrativa del sistema
- **Características:**
  - CRUD de cajones de estacionamiento
  - CRUD de tarifas por tipo de vehículo
  - Gestión de tickets activos
  - Visualización de estadísticas
  - Monitoreo de estancia

### **1.2 Estilos y Diseño Responsivo**
- **`styles.css`:** Estilos globales del sistema
- **Componentes UI:** Diseño moderno con gradientes y animaciones
- **Responsive Design:** Adaptable a dispositivos móviles y desktop
- **UX:** Interfaz intuitiva con feedback visual inmediato

---

## 2️⃣ CAPA DE LÓGICA DE NEGOCIO (Backend)
**Tecnologías:** Node.js, Express.js

### **2.1 Servidor Core (`server.js`)**
```javascript
Configuración:
- Express Framework
- CORS para comunicación frontend-backend
- Body Parser para JSON
- Puerto: 3000 (desarrollo) / Variable entorno (producción)
- Despliegue: Render.com
```

### **2.2 Servicios de Autenticación (`routes/auth.js`)**

#### **Endpoints Implementados:**

**POST `/api/auth/register`**
- **Función:** Registro de nuevos usuarios
- **Lógica de Negocio:**
  1. Validación de datos de entrada
  2. Verificación de email único
  3. Hash de contraseña con bcrypt (10 rounds)
  4. Creación de usuario en BD
  5. Registro de vehículo asociado
  6. Retorno de datos de usuario creado

**POST `/api/auth/login`**
- **Función:** Autenticación de usuarios
- **Lógica de Negocio:**
  1. Búsqueda de usuario por email
  2. Verificación de contraseña con bcrypt
  3. Carga de vehículos asociados
  4. Generación de sesión
  5. Retorno de datos completos del usuario

**POST `/api/auth/recuperar-password`**
- **Función:** Inicio de proceso de recuperación
- **Lógica de Negocio:**
  1. Validación de existencia del email
  2. Generación de token único y seguro
  3. Almacenamiento de token con expiración (1 hora)
  4. Envío de email con enlace de recuperación
  5. Confirmación al usuario

**POST `/api/auth/validar-token`**
- **Función:** Verificación de token de recuperación
- **Lógica de Negocio:**
  1. Búsqueda de token en BD
  2. Verificación de expiración temporal
  3. Validación de que no ha sido usado
  4. Retorno de estado de validez

**POST `/api/auth/cambiar-password`**
- **Función:** Actualización de contraseña
- **Lógica de Negocio:**
  1. Validación del token
  2. Verificación de fortaleza de nueva contraseña
  3. Hash de nueva contraseña
  4. Actualización en BD
  5. Marcado de token como usado
  6. Confirmación de cambio exitoso

### **2.3 Servicios de Gestión de Cajones (`routes/cajones.js`)**

#### **Endpoints Implementados:**

**GET `/api/cajones`**
- **Función:** Obtener todos los cajones
- **Lógica de Negocio:**
  1. Query a BD con filtros opcionales
  2. Cálculo de estado (disponible/ocupado)
  3. Ordenamiento por ubicación
  4. Retorno de lista completa

**GET `/api/cajones/disponibles`**
- **Función:** Listar cajones libres para reserva
- **Lógica de Negocio:**
  1. Filtrado por estado 'DISPONIBLE'
  2. Agrupación por tipo de vehículo
  3. Ordenamiento por ubicación/número
  4. Cache temporal para optimización

**POST `/api/cajones/reservar`**
- **Función:** Reservar un cajón específico
- **Lógica de Negocio:**
  1. Verificación de disponibilidad en tiempo real
  2. Bloqueo temporal para evitar doble reserva
  3. Cálculo de tarifa según tipo y duración
  4. Creación de ticket de estacionamiento
  5. Actualización de estado del cajón
  6. Generación de código QR único
  7. Registro de hora de entrada
  8. Retorno de confirmación con detalles

**GET `/api/cajones/:id/estado`**
- **Función:** Consultar estado de cajón específico
- **Lógica de Negocio:**
  1. Búsqueda por ID
  2. Verificación de ticket activo
  3. Cálculo de tiempo transcurrido
  4. Cálculo de costo actual
  5. Retorno de información completa

### **2.4 Servicios de Tickets (`routes/tickets.js`)**

#### **Endpoints Implementados:**

**POST `/api/tickets/crear`**
- **Función:** Generar nuevo ticket de estacionamiento
- **Lógica de Negocio:**
  1. Validación de datos de usuario y vehículo
  2. Verificación de disponibilidad del cajón
  3. Cálculo de tarifa inicial
  4. Creación de registro en BD
  5. Generación de código QR único
  6. Actualización de estado del cajón
  7. Envío de confirmación al usuario

**GET `/api/tickets/activos/:usuario_id`**
- **Función:** Listar tickets activos del usuario
- **Lógica de Negocio:**
  1. Búsqueda por ID de usuario
  2. Filtrado por estado 'ACTIVO'
  3. Cálculo de tiempo transcurrido
  4. Cálculo de monto actual
  5. Ordenamiento por fecha de entrada
  6. Retorno de lista con detalles

**POST `/api/tickets/:id/finalizar`**
- **Función:** Cerrar ticket y liberar cajón
- **Lógica de Negocio:**
  1. Verificación de existencia del ticket
  2. Cálculo de tiempo total de estancia
  3. Cálculo de monto final a pagar
  4. Actualización de estado a 'FINALIZADO'
  5. Liberación del cajón (estado DISPONIBLE)
  6. Registro de hora de salida
  7. Generación de resumen de pago
  8. Retorno de ticket finalizado

**POST `/api/tickets/:id/extender`**
- **Función:** Extender tiempo de estacionamiento
- **Lógica de Negocio:**
  1. Validación de ticket activo
  2. Adición de tiempo extra (10 minutos)
  3. Recalculo de monto
  4. Actualización de hora de salida estimada
  5. Confirmación al usuario

**GET `/api/tickets/:id/calcular-monto`**
- **Función:** Calcular monto en tiempo real
- **Lógica de Negocio:**
  1. Obtención de hora de entrada
  2. Cálculo de tiempo transcurrido
  3. Consulta de tarifa según tipo de vehículo
  4. Aplicación de reglas de redondeo
  5. Cálculo de monto total
  6. Retorno de desglose detallado

### **2.5 Servicios de Administración (`routes/admin.js`)**

#### **Endpoints Implementados:**

**GET `/api/admin/stats`**
- **Función:** Obtener estadísticas del sistema
- **Lógica de Negocio:**
  1. Conteo de cajones totales
  2. Conteo de cajones ocupados/disponibles
  3. Cálculo de tasa de ocupación
  4. Suma de ingresos del día/mes
  5. Conteo de tickets activos
  6. Cálculo de tiempo promedio de estancia
  7. Retorno de dashboard completo

**PUT `/api/admin/cajones/:id`**
- **Función:** Actualizar configuración de cajón
- **Lógica de Negocio:**
  1. Validación de permisos de admin
  2. Verificación de que no esté ocupado
  3. Actualización de datos
  4. Registro de auditoría
  5. Confirmación de cambios

**PUT `/api/admin/tarifas/:id`**
- **Función:** Modificar tarifas del sistema
- **Lógica de Negocio:**
  1. Validación de permisos
  2. Verificación de formato de tarifa
  3. Actualización en BD
  4. Notificación a sistema de cálculo
  5. Registro de cambio en auditoría

---

## 3️⃣ CAPA DE SERVICIOS EXTERNOS
**Integraciones con servicios de terceros**

### **3.1 Servicio de Email (SendGrid)**

#### **Configuración:**
```javascript
API Key: Variable de entorno SENDGRID_API_KEY
Email Verificado: parkpay.soporte@gmail.com
```

#### **Funcionalidades Implementadas:**

**Email de Recuperación de Contraseña**
- **Trigger:** Usuario solicita recuperar contraseña
- **Proceso:**
  1. Generación de token único
  2. Construcción de URL con token
  3. Diseño de email HTML profesional
  4. Envío vía API de SendGrid
  5. Logging de resultado
- **Template:** Email con botón de acción y diseño responsivo
- **Seguridad:** Token expira en 1 hora

**Email de Confirmación de Registro**
- **Trigger:** Nuevo usuario se registra
- **Contenido:** Bienvenida y confirmación de cuenta

**Email de Notificación de Ticket**
- **Trigger:** Creación de nuevo ticket
- **Contenido:** Detalles de reserva y código QR

### **3.2 Servicio de Pago (Stripe - Preparado para implementación)**

#### **Estructura Preparada:**
```javascript
// Endpoint preparado en routes/pagos.js
POST /api/pagos/procesar
- Integración pendiente con Stripe API
- Estructura lista para recibir pagos
```

---

## 4️⃣ CAPA DE DATOS (PostgreSQL + Supabase)
**Base de Datos Relacional en la Nube**

### **4.1 Modelo de Datos**

#### **Tabla: usuarios**
```sql
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT true
);
```
**Propósito:** Almacenar información de clientes del sistema

#### **Tabla: vehiculos**
```sql
CREATE TABLE vehiculos (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id),
    tipo VARCHAR(20) CHECK (tipo IN ('AUTO', 'MOTO', 'CAMIONETA')),
    placa VARCHAR(20) UNIQUE NOT NULL,
    marca VARCHAR(50),
    modelo VARCHAR(50),
    color VARCHAR(30),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
**Propósito:** Registro de vehículos de los usuarios

#### **Tabla: cajones**
```sql
CREATE TABLE cajones (
    id SERIAL PRIMARY KEY,
    numero VARCHAR(10) UNIQUE NOT NULL,
    ubicacion VARCHAR(100),
    tipo_vehiculo VARCHAR(20),
    estado VARCHAR(20) DEFAULT 'DISPONIBLE',
    CHECK (estado IN ('DISPONIBLE', 'OCUPADO', 'MANTENIMIENTO'))
);
```
**Propósito:** Inventario de espacios de estacionamiento

#### **Tabla: tickets**
```sql
CREATE TABLE tickets (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id),
    vehiculo_id INTEGER REFERENCES vehiculos(id),
    cajon_id INTEGER REFERENCES cajones(id),
    hora_entrada TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    hora_salida TIMESTAMP,
    monto_total DECIMAL(10,2),
    estado VARCHAR(20) DEFAULT 'ACTIVO',
    codigo_qr TEXT,
    CHECK (estado IN ('ACTIVO', 'FINALIZADO', 'CANCELADO'))
);
```
**Propósito:** Registro de transacciones de estacionamiento

#### **Tabla: tarifas**
```sql
CREATE TABLE tarifas (
    id SERIAL PRIMARY KEY,
    tipo_vehiculo VARCHAR(20),
    precio_por_hora DECIMAL(10,2) NOT NULL,
    precio_por_minuto DECIMAL(10,2) GENERATED ALWAYS AS (precio_por_hora / 60) STORED
);
```
**Propósito:** Configuración de precios por tipo de vehículo

#### **Tabla: password_recovery_tokens**
```sql
CREATE TABLE password_recovery_tokens (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id),
    token VARCHAR(255) UNIQUE NOT NULL,
    fecha_expiracion TIMESTAMP NOT NULL,
    usado BOOLEAN DEFAULT false,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
**Propósito:** Gestión de recuperación de contraseñas

### **4.2 Connection Pool**
```javascript
Configuración:
- Host: Supabase PostgreSQL
- Pool Size: 10 conexiones
- Idle Timeout: 30 segundos
- Connection Timeout: 10 segundos
```

### **4.3 Índices y Optimización**
```sql
-- Índices para búsquedas frecuentes
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_vehiculos_placa ON vehiculos(placa);
CREATE INDEX idx_tickets_usuario ON tickets(usuario_id);
CREATE INDEX idx_tickets_estado ON tickets(estado);
CREATE INDEX idx_cajones_estado ON cajones(estado);
```

---

## 5️⃣ FLUJOS DE PROCESOS DE NEGOCIO

### **Proceso 1: Registro de Usuario Completo**
```
1. Usuario ingresa datos en formulario
   ↓
2. Frontend valida formato y fortaleza de contraseña
   ↓
3. Backend recibe petición POST /api/auth/register
   ↓
4. Validación de email único en BD
   ↓
5. Hash de contraseña con bcrypt
   ↓
6. Inserción en tabla usuarios
   ↓
7. Inserción en tabla vehiculos
   ↓
8. Commit de transacción
   ↓
9. Retorno de confirmación al frontend
   ↓
10. Redirección a dashboard
```

### **Proceso 2: Reserva de Estacionamiento**
```
1. Usuario consulta cajones disponibles
   ↓
2. Backend ejecuta query SELECT con filtros
   ↓
3. Frontend renderiza cajones en interfaz gráfica
   ↓
4. Usuario selecciona cajón y confirma
   ↓
5. Backend verifica disponibilidad en tiempo real
   ↓
6. Cálculo de tarifa según tipo de vehículo
   ↓
7. Creación de ticket en BD (BEGIN TRANSACTION)
   ↓
8. Actualización de estado del cajón a OCUPADO
   ↓
9. Generación de código QR único
   ↓
10. Commit de transacción
    ↓
11. Retorno de confirmación con QR
    ↓
12. Frontend muestra ticket generado
```

### **Proceso 3: Recuperación de Contraseña**
```
1. Usuario ingresa email en formulario de recuperación
   ↓
2. Backend busca usuario en BD
   ↓
3. Generación de token aleatorio único (crypto.randomBytes)
   ↓
4. Inserción en tabla password_recovery_tokens
   ↓
5. Construcción de email HTML con SendGrid template
   ↓
6. Envío de email vía SendGrid API
   ↓
7. Usuario recibe email y hace clic en enlace
   ↓
8. Frontend captura token de URL
   ↓
9. Backend valida token y expiración
   ↓
10. Usuario ingresa nueva contraseña
    ↓
11. Validación de fortaleza
    ↓
12. Hash de nueva contraseña
    ↓
13. Actualización en BD
    ↓
14. Marcado de token como usado
    ↓
15. Confirmación al usuario
```

### **Proceso 4: Finalización de Estancia**
```
1. Usuario presiona "Finalizar Estacionamiento"
   ↓
2. Frontend envía POST /api/tickets/:id/finalizar
   ↓
3. Backend obtiene hora de entrada del ticket
   ↓
4. Cálculo de tiempo total transcurrido
   ↓
5. Consulta de tarifa aplicable
   ↓
6. Cálculo de monto total a pagar
   ↓
7. Actualización de ticket (estado FINALIZADO)
   ↓
8. Liberación de cajón (estado DISPONIBLE)
   ↓
9. Generación de resumen de pago
   ↓
10. Retorno de información al frontend
    ↓
11. Redirección a página de pago
```

---

## 6️⃣ SEGURIDAD IMPLEMENTADA

### **6.1 Autenticación y Autorización**
- **Hashing de Contraseñas:** bcrypt con 10 salt rounds
- **Validación de Contraseñas Fuertes:** Regex patterns
- **Tokens de Recuperación:** Expirables y de un solo uso
- **Sanitización de Inputs:** Validación en frontend y backend

### **6.2 Comunicación Segura**
- **HTTPS:** Obligatorio en producción (Vercel/Render)
- **CORS Configurado:** Restricción de orígenes permitidos
- **Headers de Seguridad:** Configurados en Express

### **6.3 Base de Datos**
- **SQL Injection Prevention:** Uso de queries parametrizadas
- **Connection Pooling:** Gestión eficiente de conexiones
- **Backup Automático:** Supabase maneja respaldos

---

## 7️⃣ ESCALABILIDAD Y MANTENIBILIDAD

### **7.1 Arquitectura Escalable**
- **Separación de Capas:** Fácil mantenimiento y evolución
- **API RESTful:** Estándar de industria
- **Código Modular:** Servicios independientes

### **7.2 Despliegue Cloud**
- **Frontend:** Vercel (CDN global, auto-scaling)
- **Backend:** Render (auto-restart, health checks)
- **Database:** Supabase (managed PostgreSQL, backups)

### **7.3 Monitoreo**
- **Logs:** Console logs en desarrollo
- **Error Tracking:** Try-catch en endpoints críticos
- **Health Checks:** Endpoint /api/test

---

## 8️⃣ TECNOLOGÍAS UTILIZADAS

### **Frontend**
| Tecnología | Versión | Propósito |
|-----------|---------|-----------|
| HTML5 | - | Estructura de páginas |
| CSS3 | - | Estilos y diseño |
| JavaScript | ES6+ | Lógica del cliente |
| QRCode.js | 1.0.0 | Generación de códigos QR |

### **Backend**
| Tecnología | Versión | Propósito |
|-----------|---------|-----------|
| Node.js | 18.x | Runtime de JavaScript |
| Express.js | 4.18.x | Framework web |
| bcrypt | 5.1.x | Hash de contraseñas |
| pg | 8.11.x | Cliente PostgreSQL |
| @sendgrid/mail | 7.7.x | Envío de emails |
| cors | 2.8.x | Cross-Origin Resource Sharing |
| dotenv | 16.3.x | Variables de entorno |

### **Base de Datos**
| Tecnología | Versión | Propósito |
|-----------|---------|-----------|
| PostgreSQL | 15.x | Base de datos relacional |
| Supabase | - | Hosting y gestión de BD |

### **Servicios Externos**
| Servicio | Propósito |
|----------|-----------|
| SendGrid | Envío de emails transaccionales |
| Vercel | Hosting del frontend |
| Render | Hosting del backend |
| Supabase | Base de datos PostgreSQL |

---

## 9️⃣ CONCLUSIONES

### **Logros del Sistema**
✅ Arquitectura de capas bien definida y separada
✅ Sistema de autenticación robusto con recuperación de contraseña
✅ Gestión completa del ciclo de vida del estacionamiento
✅ Integración exitosa con servicios externos
✅ Base de datos relacional optimizada
✅ Interfaz de usuario intuitiva y responsiva
✅ Código modular y mantenible

### **Mejoras Futuras Sugeridas**
🔄 Implementación de JWT para sesiones sin estado
📱 Conversión a Progressive Web App (PWA)
💳 Integración completa con pasarela de pagos
📊 Dashboard de analíticas avanzadas
🔔 Sistema de notificaciones en tiempo real
📱 Aplicación móvil nativa (React Native)
🤖 Integración con sistemas de reconocimiento de placas

---

## 📝 INFORMACIÓN DEL EQUIPO

### **Universidad Autónoma de Chiapas**
**Facultad de Ingeniería - Ingeniería en Sistemas Computacionales**

### **Equipo de Desarrollo:**
| Nombre | Rol |
|--------|-----|
| Jose Antonio Matuz Argueta | Líder de Proyecto & Full Stack Developer |
| Jonathan Antonio González Salinas | Frontend Developer |
| Ivan Armando Perez Gomez | Backend Developer |
| Angel Daniel Manuel Torres | Database Administrator |
| Josue Muñoz Silva | QA & Testing |

### **Proyecto:**
- **Nombre:** ParkPay - Sistema de Gestión de Estacionamiento Inteligente
- **Fecha:** Octubre 2025
- **Stack Tecnológico:** JavaScript Full Stack (Node.js + Express + PostgreSQL)
- **Despliegue:** Cloud-Native (Vercel + Render + Supabase)

---

*Documento generado para presentación académica*  
*Quinto Semestre - Ingeniería en Sistemas Computacionales*  
*Universidad Autónoma de Chiapas © 2025*