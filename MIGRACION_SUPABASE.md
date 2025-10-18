# 🚀 Guía de Migración a Supabase - PASO A PASO

## ✅ PASO 1: Configuración Completada

### Archivos de Respaldo Creados:
- ✅ `backend/.env_local` - Configuración de PostgreSQL local
- ✅ `backend/config/database_local.js` - Código para conexión local

### Archivos Actualizados:
- ✅ `backend/.env` - Ahora usa Supabase
- ✅ `backend/config/database.js` - Detecta automáticamente Supabase vs Local

### Conexión Verificada:
```
☁️  Conectando a SUPABASE...
   Host: db.pksregqvhbfnlxpjhglc.supabase.co
   Database: postgres
   User: postgres
✅ Conectado a SUPABASE exitosamente
⏰ Servidor de BD: 2025-10-18T18:55:53.136Z
```

---

## 📋 PASO 2: Migrar Base de Datos a Supabase

### Instrucciones:

1. **Abre Supabase Dashboard:**
   - Ve a: https://supabase.com/dashboard
   - Selecciona tu proyecto `parkpay-db`

2. **Abre el SQL Editor:**
   - Click en `SQL Editor` en el menú lateral izquierdo
   - O ve directamente a: https://supabase.com/dashboard/project/pksregqvhbfnlxpjhglc/sql

3. **Ejecuta el Script de Migración:**
   - Click en `+ New query`
   - Abre el archivo: `PP/supabase_migration.sql`
   - **Copia TODO el contenido** del archivo
   - **Pégalo en el editor de Supabase**
   - Click en `Run` (o presiona Ctrl+Enter)

4. **Verifica que se crearon las tablas:**
   - Click en `Table Editor` en el menú lateral
   - Deberías ver 5 tablas:
     - ✅ Usuarios
     - ✅ Vehiculos
     - ✅ Tarifas (con 4 tarifas)
     - ✅ CajonesEstacionamiento (con 30 cajones)
     - ✅ TicketsEstancia

---

## 🧪 PASO 3: Probar la Aplicación

### 1. Reinicia el Backend (si no está corriendo):
```bash
cd s:\QuintoSemestreCodes\PP\backend
node server.js
```

Deberías ver:
```
☁️  Conectando a SUPABASE...
✅ Conectado a SUPABASE exitosamente
🚀 Servidor corriendo en http://localhost:3000
```

### 2. Abre el Frontend:
```
http://localhost:5500/PP/index.html
```

### 3. Prueba el Registro:
- Crea un nuevo usuario
- Tipo de vehículo: Automóvil
- Placa: TEST-001

### 4. Verifica en Supabase:
- Ve a `Table Editor` > `Usuarios`
- Deberías ver tu nuevo usuario
- Ve a `Vehiculos`
- Deberías ver tu vehículo

---

## 🎨 PASO 4: Habilitar Row Level Security (RLS) - OPCIONAL

Por ahora, las tablas están **sin seguridad** para que funcionen. Si quieres agregar seguridad más adelante:

1. **Deshabilitar RLS temporalmente:**
   ```sql
   -- En SQL Editor de Supabase
   ALTER TABLE Usuarios DISABLE ROW LEVEL SECURITY;
   ALTER TABLE Vehiculos DISABLE ROW LEVEL SECURITY;
   ALTER TABLE Tarifas DISABLE ROW LEVEL SECURITY;
   ALTER TABLE CajonesEstacionamiento DISABLE ROW LEVEL SECURITY;
   ALTER TABLE TicketsEstancia DISABLE ROW LEVEL SECURITY;
   ```

2. **Más adelante puedes configurar políticas de seguridad**
   (Cuando estés listo para producción)

---

## 🔄 Volver a PostgreSQL Local

Si necesitas volver a tu base de datos local:

1. **Renombra archivos:**
   ```bash
   # Respaldar configuración de Supabase
   mv .env .env_supabase
   mv config/database.js config/database_supabase.js
   
   # Restaurar configuración local
   mv .env_local .env
   mv config/database_local.js config/database.js
   ```

2. **Reinicia el servidor**

---

## 📊 Verificar Datos en Supabase

### Queries útiles en SQL Editor:

```sql
-- Ver todos los usuarios
SELECT * FROM Usuarios;

-- Ver todos los vehículos con sus dueños
SELECT 
  v.placa,
  v.tipo,
  u.nombre,
  u.email
FROM Vehiculos v
JOIN Usuarios u ON v.id_usuario = u.id_usuario;

-- Ver todos los cajones por tipo
SELECT 
  tipo,
  COUNT(*) as total,
  SUM(CASE WHEN estado = 'Disponible' THEN 1 ELSE 0 END) as disponibles
FROM CajonesEstacionamiento
GROUP BY tipo;

-- Ver tickets activos
SELECT 
  t.codigo_acceso,
  v.placa,
  c.numero_cajon,
  t.fecha_hora_entrada
FROM TicketsEstancia t
JOIN Vehiculos v ON t.id_vehiculo = v.id_vehiculo
JOIN CajonesEstacionamiento c ON t.id_cajon = c.id_cajon
WHERE t.estado = 'ACTIVO';
```

---

## 🚨 Troubleshooting

### Error: "no pg_hba.conf entry"
**Solución:** Ya está resuelto con `ssl: { rejectUnauthorized: false }` en `database.js`

### Error: "relation does not exist"
**Solución:** Ejecuta el script `supabase_migration.sql` en SQL Editor

### Error: "password authentication failed"
**Solución:** Verifica que la password en `.env` sea exactamente: `Timeshirt#21`
(El # se codifica como %23 en la URL)

### Error: "connect ETIMEDOUT"
**Solución:** Verifica tu conexión a internet, Supabase requiere internet

---

## 📝 Notas Importantes

### ✅ Lo que YA está configurado:
- Conexión SSL a Supabase
- Detección automática (Supabase vs Local)
- Logging mejorado con emojis
- Respaldo de archivos locales

### ⚠️ Lo que falta hacer:
1. Ejecutar el script SQL en Supabase (PASO 2)
2. Probar la aplicación (PASO 3)

### 🎯 Siguiente paso después de esto:
- Configurar API URL en el frontend para producción
- Hostear backend en Render
- Hostear frontend en Netlify/Vercel

---

## 🆘 ¿Necesitas Ayuda?

Si algo no funciona, revisa:
1. ¿Ejecutaste el script SQL completo en Supabase?
2. ¿El servidor muestra "✅ Conectado a SUPABASE"?
3. ¿Las tablas aparecen en Table Editor de Supabase?

**¡Ya casi terminas! Solo falta ejecutar el script SQL en Supabase! 🚀**
