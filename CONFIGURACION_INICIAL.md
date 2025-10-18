# 📦 CONFIGURACIÓN INICIAL - ParkPay

## ⚠️ IMPORTANTE: Instalar Node.js primero

Antes de iniciar, necesitas tener Node.js instalado.

### 🔽 Descargar e Instalar Node.js

1. Ve a: https://nodejs.org/
2. Descarga la versión **LTS** (Long Term Support) - Recomendada
3. Ejecuta el instalador y sigue los pasos:
   - ✅ Acepta los términos
   - ✅ Instala en la ubicación predeterminada
   - ✅ **IMPORTANTE**: Marca la opción "Automatically install necessary tools"
4. Reinicia tu computadora después de la instalación

### ✅ Verificar Instalación de Node.js

Abre PowerShell o CMD y ejecuta:

```powershell
node --version
# Debe mostrar algo como: v18.17.0 o similar

npm --version
# Debe mostrar algo como: 9.6.7 o similar
```

Si ves las versiones, ¡Node.js está instalado correctamente! 🎉

---

## 📋 Pasos de Configuración

### 1️⃣ Instalar PostgreSQL (Si no lo tienes)

1. Descarga PostgreSQL: https://www.postgresql.org/download/windows/
2. Durante la instalación:
   - Anota la contraseña del usuario `postgres`
   - Puerto predeterminado: `5432`
   - Instala pgAdmin 4 (incluido)

### 2️⃣ Crear Base de Datos

Opción A - Usando pgAdmin:
1. Abre pgAdmin 4
2. Click derecho en "Databases" → "Create" → "Database"
3. Nombre: `park_pay_db`
4. Click en "Save"
5. Abre Query Tool y ejecuta el contenido de:
   - `c:\masm\BIN\base postgre.sql`
6. Luego ejecuta:
   - `backend\init_db.sql`

Opción B - Usando psql (línea de comandos):
```bash
# Conectarse a PostgreSQL
psql -U postgres

# En psql, ejecuta:
\i 'c:/masm/BIN/base postgre.sql'
\c park_pay_db
\i 'backend/init_db.sql'
```

### 3️⃣ Configurar Variables de Entorno

Edita el archivo `backend\.env`:

```env
# Configuración de la base de datos PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=park_pay_db
DB_USER=postgres
DB_PASSWORD=TU_PASSWORD_AQUI    ← ⚠️ CAMBIA ESTO

# Puerto del servidor
PORT=3000
```

**IMPORTANTE**: Reemplaza `TU_PASSWORD_AQUI` con la contraseña que pusiste al instalar PostgreSQL.

### 4️⃣ Instalar Dependencias del Proyecto

Abre PowerShell o CMD en la carpeta del proyecto:

```powershell
# Navega a la carpeta backend
cd "c:\Users\alarf\OneDrive\Documentos\Quinto Semestre\Quinto Semestre Codes\PP\backend"

# Instala las dependencias
npm install
```

Esto instalará:
- ✅ Express (servidor web)
- ✅ pg (PostgreSQL client)
- ✅ cors (manejo de CORS)
- ✅ bcryptjs (encriptación)
- ✅ dotenv (variables de entorno)
- ✅ nodemon (desarrollo)

**Tiempo estimado**: 1-2 minutos

### 5️⃣ Verificar Instalación

```powershell
# Desde la carpeta backend, verifica que exista node_modules
dir node_modules

# Debe mostrar muchas carpetas (dependencias instaladas)
```

### 6️⃣ Probar el Servidor

```powershell
# Desde la carpeta backend
node server.js
```

Deberías ver:
```
✅ Conectado a PostgreSQL
🚀 Servidor corriendo en http://localhost:3000
```

Si ves esto, ¡TODO FUNCIONA! 🎉

---

## 🚀 Iniciar la Aplicación (Después de configurar)

### Método 1: Scripts Automatizados (Recomendado)

1. **Doble clic** en `INICIAR_SERVIDOR.bat`
   - Inicia el backend automáticamente
   - Instala dependencias si es necesario
   - **NO cierres esta ventana**

2. **Doble clic** en `ABRIR_APP.bat`
   - Abre la aplicación en tu navegador

### Método 2: Manual

**Terminal 1 - Backend:**
```powershell
cd backend
node server.js
```

**Terminal 2 - Frontend:**
```powershell
# Abre index.html en tu navegador predeterminado
start index.html
```

---

## 🏗️ Estructura de Archivos

```
PP/
├── backend/                      ← Servidor Node.js
│   ├── config/
│   │   └── database.js          ← Conexión a PostgreSQL
│   ├── routes/
│   │   ├── auth.js              ← Login y registro
│   │   ├── cajones.js           ← Gestión de cajones
│   │   ├── tickets.js           ← Gestión de tickets
│   │   └── usuarios.js          ← Gestión de usuarios
│   ├── .env                     ← ⚠️ Configurar aquí tus credenciales
│   ├── server.js                ← Archivo principal del servidor
│   ├── package.json             ← Dependencias del proyecto
│   ├── init_db.sql              ← Datos iniciales (ejecutar en BD)
│   └── node_modules/            ← Se crea al ejecutar npm install
├── css/
│   └── styles.css               ← Estilos de la aplicación
├── js/
│   ├── auth.js                  ← Lógica de login/registro
│   └── parking.js               ← Lógica del estacionamiento
├── index.html                   ← Página de login/registro
├── estacionamiento.html         ← Página principal del estacionamiento
├── INICIAR_SERVIDOR.bat         ← ⭐ Clic para iniciar backend
├── ABRIR_APP.bat                ← ⭐ Clic para abrir aplicación
├── README.md                    ← Documentación completa
├── INICIO_RAPIDO.md             ← Guía rápida de inicio
└── CONFIGURACION_INICIAL.md     ← ⭐ Este archivo
```

---

## 📝 Checklist de Configuración

Marca cada paso cuando lo completes:

- [ ] Node.js instalado y verificado (`node --version`)
- [ ] PostgreSQL instalado y funcionando
- [ ] Base de datos `park_pay_db` creada
- [ ] Estructura de tablas creada (`base postgre.sql`)
- [ ] Datos iniciales insertados (`init_db.sql`)
- [ ] Archivo `backend\.env` configurado con tu contraseña
- [ ] Dependencias instaladas (`npm install` en carpeta backend)
- [ ] Servidor inicia correctamente (`node server.js`)
- [ ] Navegador abre `index.html` correctamente

---

## 🐛 Solución de Problemas

### "npm no se reconoce como comando"
**Causa**: Node.js no está instalado o no está en el PATH
**Solución**: 
1. Instala Node.js desde https://nodejs.org/
2. Reinicia tu computadora
3. Verifica con `node --version`

### "Error de conexión a PostgreSQL"
**Causa**: Credenciales incorrectas o PostgreSQL no está corriendo
**Solución**:
1. Verifica que PostgreSQL esté corriendo (búscalo en servicios de Windows)
2. Revisa el archivo `backend\.env`
3. Prueba conectarte con pgAdmin usando las mismas credenciales

### "Error: Cannot find module 'express'"
**Causa**: Dependencias no instaladas
**Solución**:
```powershell
cd backend
npm install
```

### "Error: relation does not exist"
**Causa**: Las tablas no fueron creadas en la base de datos
**Solución**:
1. Abre pgAdmin
2. Conecta a `park_pay_db`
3. Ejecuta `base postgre.sql`
4. Ejecuta `init_db.sql`

### "Port 3000 is already in use"
**Causa**: Ya hay otro proceso usando el puerto 3000
**Solución**:
```powershell
# Ver qué proceso está usando el puerto
netstat -ano | findstr :3000

# Matar el proceso (reemplaza <PID> con el número que viste)
taskkill /PID <PID> /F
```

---

## ✅ Verificación Final

Después de configurar todo, prueba estos endpoints en tu navegador:

1. **Backend funcionando:**
   - http://localhost:3000
   - Debes ver: `"message": "🚗 API ParkPay funcionando correctamente"`

2. **Cajones disponibles:**
   - http://localhost:3000/api/cajones
   - Debes ver: Lista de 30 cajones en formato JSON

3. **Frontend:**
   - Abre `index.html` en tu navegador
   - Debes ver: Pantalla de login/registro elegante y oscura

---

## 🎓 Conceptos Clave

- **Backend**: Servidor Node.js que maneja la lógica y base de datos
- **Frontend**: Páginas HTML/CSS/JS que ves en el navegador
- **API REST**: Comunicación entre frontend y backend mediante HTTP
- **PostgreSQL**: Base de datos donde se guarda toda la información
- **CRUD**: Create (Crear), Read (Leer), Update (Actualizar), Delete (Eliminar)

---

## 📞 Comandos Útiles

```powershell
# Ver versión de Node.js
node --version

# Ver versión de npm
npm --version

# Limpiar caché de npm (si hay problemas)
npm cache clean --force

# Reinstalar todas las dependencias
cd backend
rmdir /s node_modules
npm install

# Ver procesos en puerto 3000
netstat -ano | findstr :3000

# Iniciar servidor en modo desarrollo (auto-reload)
cd backend
npm run dev
```

---

**¡Una vez completada esta configuración, nunca tendrás que hacerla de nuevo!** 🎉

Simplemente usa `INICIAR_SERVIDOR.bat` y `ABRIR_APP.bat` cada vez que quieras usar la aplicación.
