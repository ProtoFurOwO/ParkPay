# 🚗 ParkPay - Sistema de Estacionamiento

Sistema completo de gestión de estacionamiento con frontend y backend integrado.

## 🎯 Características

- ✅ Login y registro de usuarios
- ✅ Registro de vehículos (placa, marca, modelo, color)
- ✅ Visualización de 2 pisos (A y B) con 15 lugares cada uno
- ✅ Selección interactiva de cajones
- ✅ Cálculo automático de tarifas por hora
- ✅ Sistema de tickets con código de acceso
- ✅ Base de datos PostgreSQL
- ✅ Interfaz moderna y responsiva

## 📋 Requisitos Previos

- Node.js (versión 14 o superior)
- PostgreSQL (versión 12 o superior)
- Navegador web moderno

## 🚀 Instalación Rápida

### 1. Configurar Base de Datos

1. Abre pgAdmin o psql
2. Ejecuta el archivo `c:\masm\BIN\base postgre.sql` para crear la estructura
3. Ejecuta el archivo `backend\init_db.sql` para insertar los datos iniciales (tarifas y cajones)

### 2. Configurar Backend

1. Ve a la carpeta `backend`
2. Edita el archivo `.env` con tus credenciales de PostgreSQL:
   ```
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=park_pay_db
   DB_USER=postgres
   DB_PASSWORD=tu_password_aqui
   PORT=3000
   ```

### 3. Instalar Dependencias

Abre una terminal en la carpeta `backend` y ejecuta:
```bash
npm install
```

### 4. Iniciar la Aplicación

#### Opción 1: Usando los archivos .bat (Recomendado)

1. Doble clic en `INICIAR_SERVIDOR.bat` - Esto iniciará el backend
2. Doble clic en `ABRIR_APP.bat` - Esto abrirá la aplicación en tu navegador

#### Opción 2: Manual

Terminal 1 - Iniciar servidor:
```bash
cd backend
node server.js
```

Terminal 2 - Abrir aplicación:
```bash
# Simplemente abre index.html en tu navegador
start index.html
```

## 📖 Uso

### Primer Uso

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
PP/
├── backend/
│   ├── config/
│   │   └── database.js          # Configuración de PostgreSQL
│   ├── routes/
│   │   ├── auth.js              # Login y registro
│   │   ├── cajones.js           # Gestión de cajones
│   │   ├── tickets.js           # Gestión de tickets
│   │   └── usuarios.js          # Gestión de usuarios
│   ├── .env                     # Variables de entorno
│   ├── server.js                # Servidor Express
│   ├── package.json             # Dependencias
│   └── init_db.sql              # Datos iniciales
├── css/
│   └── styles.css               # Estilos de la aplicación
├── js/
│   ├── auth.js                  # Lógica de autenticación
│   └── parking.js               # Lógica del estacionamiento
├── index.html                   # Página de login/registro
├── estacionamiento.html         # Página principal
├── INICIAR_SERVIDOR.bat         # Script para iniciar backend
├── ABRIR_APP.bat                # Script para abrir app
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
- PostgreSQL
- bcryptjs (encriptación de contraseñas)
- dotenv (variables de entorno)

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

### El servidor no inicia
- Verifica que Node.js esté instalado: `node --version`
- Verifica que las dependencias estén instaladas: `npm install`
- Revisa que PostgreSQL esté corriendo

### Error de conexión a la base de datos
- Verifica las credenciales en `backend/.env`
- Asegúrate de que PostgreSQL esté corriendo
- Verifica que la base de datos `park_pay_db` exista

### La página no carga los cajones
- Verifica que el servidor backend esté corriendo en http://localhost:3000
- Abre la consola del navegador (F12) para ver errores
- Verifica que los datos estén insertados con `init_db.sql`

### Error de CORS
- El servidor ya tiene CORS habilitado
- Asegúrate de abrir la app desde el mismo dominio (localhost)

## 📝 Notas

- Los usuarios registrados pueden tener múltiples vehículos
- Los cajones se liberan automáticamente al finalizar el ticket
- El cálculo de horas se redondea hacia arriba
- Los códigos de acceso son únicos y no se repiten

## 👨‍💻 Desarrollo

Para modo desarrollo con auto-reload:
```bash
cd backend
npm run dev
```

## 📄 Licencia

MIT License - Libre para uso educativo y personal

---

¡Disfruta usando ParkPay! 🚗💨
