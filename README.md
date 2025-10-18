# 🚗 ParkPay - Sistema de Estacionamiento

Sistema completo de gestión de estacionamiento con frontend y backend integrado, desplegado en la nube.

## 🎯 Características

- ✅ Login y registro de usuarios
- ✅ Registro de vehículos (placa, marca, modelo, color)
- ✅ Visualización de 2 pisos (A y B) con 15 lugares cada uno
- ✅ Selección interactiva de cajones
- ✅ Cálculo automático de tarifas por hora
- ✅ Sistema de tickets con código de acceso
- ✅ Base de datos PostgreSQL en la nube (Supabase)
- ✅ Backend desplegado en Render
- ✅ Interfaz moderna y responsiva

## 🌐 Demo en Vivo

- **Frontend**: [URL pendiente de deploy]
- **Backend API**: [URL pendiente de deploy]

## 📖 Uso

1. **Registro**: 
   - Crea tu cuenta con nombre, apellido, email y contraseña
   - Registra tu vehículo con al menos la placa

2. **Login**:
   - Ingresa con tu email y contraseña

3. **Seleccionar Lugar**:
   - Elige un cajón disponible (verde) de los pisos A o B
   - Selecciona las horas estimadas
   - El sistema calculará automáticamente el costo
   - Haz clic en "Pagar y Ocupar Lugar"

4. **Confirmación**:
   - Recibirás un código de acceso único
   - El cajón se marcará como ocupado

## 🗂️ Estructura del Proyecto

```
ParkPay/
├── backend/
│   ├── config/
│   │   └── database.js          # Configuración de PostgreSQL + Supabase
│   ├── routes/
│   │   ├── auth.js              # Login y registro
│   │   ├── cajones.js           # Gestión de cajones
│   │   ├── tickets.js           # Gestión de tickets
│   │   └── usuarios.js          # Gestión de usuarios
│   ├── .env                     # Variables de entorno (no incluido)
│   ├── server.js                # Servidor Express
│   └── package.json             # Dependencias
├── css/
│   └── styles.css               # Estilos de la aplicación
├── js/
│   ├── auth.js                  # Lógica de autenticación
│   └── parking.js               # Lógica del estacionamiento
├── index.html                   # Página de login/registro
├── estacionamiento.html         # Página principal del estacionamiento
├── admin.html                   # Panel de administración
└── README.md                    # Este archivo
```

## 🔌 API Endpoints

### Autenticación
- `POST /api/auth/register` - Registrar usuario y vehículo
- `POST /api/auth/login` - Iniciar sesión

### Cajones
- `GET /api/cajones` - Obtener todos los cajones
- `GET /api/cajones/piso/:piso` - Obtener cajones por piso
- `PATCH /api/cajones/:id/estado` - Actualizar estado de cajón

### Tickets
- `POST /api/tickets` - Crear nuevo ticket
- `GET /api/tickets/usuario/:id` - Obtener tickets de usuario
- `PATCH /api/tickets/:id/finalizar` - Finalizar ticket
- `POST /api/tickets/calcular-costo` - Calcular costo estimado

### Usuarios
- `GET /api/usuarios/:id/vehiculos` - Obtener vehículos de usuario
- `POST /api/usuarios/:id/vehiculos` - Agregar nuevo vehículo

### Sincronización (Nuevo)
- `POST /api/sync/sync` - Sincronizar estados de cajones con tickets
- `GET /api/sync/status` - Obtener resumen del estado actual

## 🎨 Colores y Leyenda

- 🟢 **Verde** - Cajón disponible
- 🔴 **Rojo** - Cajón ocupado
- 🔵 **Azul** - Cajón seleccionado

## 🛠️ Tecnologías

### Frontend
- HTML5
- CSS3 (con variables CSS)
- JavaScript vanilla
- Fetch API

### Backend
- Node.js
- Express.js
- PostgreSQL (Supabase)
- bcryptjs (encriptación de contraseñas)
- dotenv (variables de entorno)

### Infraestructura
- **Base de Datos**: Supabase (PostgreSQL en la nube)
- **Backend**: Render (servidor Node.js)
- **Frontend**: Netlify/Vercel (hosting estático)

## ⚙️ Configuración de la Base de Datos

### Tarifas por Defecto
- Tarifa Normal: $25.00/hora
- Tarifa Premium: $35.00/hora
- Tarifa Económica: $20.00/hora

### Distribución de Cajones
- **Piso A**: 15 lugares (A-01 a A-15)
- **Piso B**: 15 lugares (B-01 a B-15)
- **Total**: 30 lugares

### Tipos de Cajones
- Normal: Cajones estándar
- Discapacitado: Con accesibilidad ♿
- Motocicleta: Para motos 🏍️
- Eléctrico: Con carga eléctrica ⚡

## 🐛 Solución de Problemas

### La página no carga los cajones
- Verifica que el backend esté desplegado y funcionando
- Abre la consola del navegador (F12) para ver errores
- Verifica que la URL de la API sea correcta

### Error de CORS
- El servidor tiene CORS habilitado para dominios autorizados
- Si estás en desarrollo local, contacta al administrador

## 📝 Notas

- Los usuarios registrados pueden tener múltiples vehículos
- Los cajones se liberan automáticamente al finalizar el ticket
- El cálculo de horas se redondea hacia arriba
- Los códigos de acceso son únicos y no se repiten
- El backend en Render (plan gratuito) se duerme después de 15 min de inactividad
  - Se reactiva automáticamente en ~30 segundos con la primera petición

## 👨‍💻 Contribuir

Este es un proyecto educativo. Si encuentras algún bug o tienes sugerencias, siéntete libre de abrir un issue.

## 📄 Licencia

MIT License - Libre para uso educativo y personal

---

¡Disfruta usando ParkPay! 🚗💨
