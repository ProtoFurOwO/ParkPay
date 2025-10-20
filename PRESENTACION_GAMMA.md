# ParkPay - Sistema de Gestión de Estacionamiento Inteligente

Universidad Autónoma de Chiapas
Jose Antonio Matuz Argueta y equipo

---

# Sobre el Proyecto

## Equipo de Desarrollo
- Jose Antonio Matuz Argueta
- Jonathan Antonio González Salinas
- Ivan Armando Perez Gomez
- Angel Daniel Manuel Torres
- Josue Muñoz Silva

## Universidad
Universidad Autónoma de Chiapas
Ingeniería en Sistemas Computacionales

---

# Arquitectura del Sistema

## Stack Tecnológico
- Frontend: HTML5, CSS3, JavaScript
- Backend: Node.js + Express
- Base de Datos: PostgreSQL (Supabase)
- Despliegue: Vercel + Render

---

# Capa de Presentación

## Frontend - Interfaz de Usuario

### Módulos Principales
1. Sistema de Autenticación
2. Dashboard de Usuario
3. Gestión de Estacionamiento
4. Panel Administrativo

### Características
- Diseño responsivo
- Validación en tiempo real
- Interfaz intuitiva

---

# Autenticación Segura

## Funcionalidades Implementadas

### Login y Registro
- Validación de contraseñas fuertes
- Hash con bcrypt (10 rounds)
- Verificación de emails únicos

### Recuperación de Contraseñas
- Tokens seguros con expiración
- Envío de emails con SendGrid
- Proceso de validación robusto

---

# Capa de Lógica de Negocio

## Backend - Node.js + Express

### Servicios Principales
1. Autenticación (auth.js)
2. Gestión de Cajones (cajones.js)
3. Sistema de Tickets (tickets.js)
4. Panel Administrativo (admin.js)

---

# Endpoints de Autenticación

## API RESTful

### POST /api/auth/register
Registro de nuevos usuarios con validación

### POST /api/auth/login
Autenticación con bcrypt

### POST /api/auth/recuperar-password
Sistema de recuperación seguro

---

# Gestión de Estacionamiento

## Endpoints de Cajones

### GET /api/cajones/disponibles
Lista espacios libres en tiempo real

### POST /api/cajones/reservar
Reserva con bloqueo temporal

### GET /api/cajones/:id/estado
Estado actual del cajón

---

# Sistema de Tickets

## Ciclo de Vida del Ticket

### Creación
- Validación de disponibilidad
- Cálculo de tarifas
- Generación de QR único

### Gestión
- Monitoreo en tiempo real
- Cálculo de costos
- Extensión de tiempo

### Finalización
- Cierre automático
- Liberación de cajón
- Resumen de pago

---

# Servicios Externos

## Integraciones

### SendGrid
- Emails de recuperación
- Notificaciones automáticas
- Templates profesionales

### Servicios Cloud
- Vercel (Frontend)
- Render (Backend)
- Supabase (Base de Datos)

---

# Base de Datos

## Modelo de Datos PostgreSQL

### Tablas Principales
1. usuarios
2. vehiculos
3. cajones
4. tickets
5. tarifas
6. password_recovery_tokens

---

# Usuarios y Vehículos

## Estructura de Datos

### Tabla: usuarios
- Información personal
- Credenciales hasheadas
- Fecha de registro

### Tabla: vehiculos
- Tipo (AUTO, MOTO, CAMIONETA)
- Placa única
- Marca, modelo, color

---

# Cajones y Tickets

## Gestión de Espacios

### Tabla: cajones
- Número y ubicación
- Tipo de vehículo
- Estados: DISPONIBLE, OCUPADO, MANTENIMIENTO

### Tabla: tickets
- Relación con usuario y vehículo
- Tiempos de entrada/salida
- Monto y código QR

---

# Proceso de Registro

## Flujo Completo

1. Usuario ingresa datos
2. Validación de contraseña fuerte
3. Hash con bcrypt
4. Inserción en BD
5. Registro de vehículo
6. Confirmación y login automático

---

# Proceso de Reserva

## Flujo de Estacionamiento

1. Consulta de cajones disponibles
2. Selección de espacio
3. Verificación en tiempo real
4. Cálculo de tarifa
5. Creación de ticket
6. Generación de QR
7. Confirmación al usuario

---

# Recuperación de Contraseña

## Proceso Seguro

1. Usuario solicita recuperación
2. Generación de token único
3. Envío de email con enlace
4. Validación de token
5. Ingreso de nueva contraseña
6. Hash y actualización en BD
7. Confirmación exitosa

---

# Seguridad Implementada

## Medidas de Protección

### Autenticación
- Bcrypt para contraseñas
- Tokens expirables
- Validación fuerte

### Comunicación
- HTTPS obligatorio
- CORS configurado
- Headers de seguridad

### Base de Datos
- Queries parametrizadas
- Connection pooling
- Backups automáticos

---

# Arquitectura Escalable

## Despliegue Cloud

### Frontend
- Vercel con CDN global
- Auto-scaling
- Deploy automático

### Backend
- Render con auto-restart
- Health checks
- Variables de entorno seguras

### Base de Datos
- Supabase managed PostgreSQL
- Respaldos automáticos
- Connection pooling

---

# Características Destacadas

## Innovaciones del Sistema

✅ Validación de contraseñas fuertes
✅ Recuperación por email profesional
✅ Cálculo de tarifas en tiempo real
✅ Generación de códigos QR
✅ Dashboard interactivo
✅ Panel administrativo completo
✅ Arquitectura de microservicios

---

# Tecnologías Utilizadas

## Stack Completo

### Frontend
HTML5, CSS3, JavaScript ES6+

### Backend
Node.js 18.x, Express 4.18.x, bcrypt 5.1.x

### Base de Datos
PostgreSQL 15.x, Supabase

### Servicios
SendGrid, Vercel, Render

---

# Logros del Proyecto

## Resultados Exitosos

✅ Sistema funcional completo
✅ Autenticación robusta
✅ Gestión de estacionamiento eficiente
✅ Integración con servicios externos
✅ Código modular y mantenible
✅ Despliegue en producción
✅ Interfaz intuitiva

---

# Mejoras Futuras

## Roadmap de Desarrollo

🔄 Implementación de JWT
📱 Progressive Web App (PWA)
💳 Integración con Stripe
📊 Dashboard de analíticas
🔔 Notificaciones en tiempo real
📱 App móvil nativa
🤖 Reconocimiento de placas

---

# Demo en Vivo

## URLs del Proyecto

🌐 Frontend: parkpay.vercel.app
🔧 Backend: parkpay-backend-1ti1.onrender.com
💾 Repositorio: github.com/ProtoFurOwO/ParkPay

---

# Conclusión

## ParkPay - Sistema Inteligente

Un sistema completo de gestión de estacionamiento que implementa:
- Arquitectura de capas moderna
- Seguridad robusta
- Integración cloud
- Experiencia de usuario excepcional

Universidad Autónoma de Chiapas
Octubre 2025

---

# ¿Preguntas?

Equipo ParkPay
Universidad Autónoma de Chiapas

github.com/ProtoFurOwO/ParkPay