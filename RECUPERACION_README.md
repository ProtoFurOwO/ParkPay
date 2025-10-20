# 🔐 Sistema de Recuperación de Contraseñas - ParkPay

## ✨ Características Implementadas

### 🛡️ Seguridad
- ✅ **Contraseñas fuertes obligatorias**: Mínimo 6 caracteres, 1 mayúscula, 1 número
- ✅ **Códigos de 6 dígitos** generados aleatoriamente
- ✅ **Expiración automática** de códigos (10 minutos)
- ✅ **Límite de intentos** (máximo 3 intentos fallidos)
- ✅ **No revela** si un email existe o no (seguridad por oscuridad)

### 📧 Sistema de Emails
- ✅ **SendGrid integrado** (100 emails/día gratis)
- ✅ **Diseño HTML profesional** con gradientes y estilos
- ✅ **Modo desarrollo** (sin SendGrid) para pruebas locales
- ✅ **Fallback inteligente** si SendGrid falla
- ✅ **No llega a spam** (IPs con buena reputación)

### 🎨 Interfaz de Usuario
- ✅ **3 pasos intuitivos**: Email → Código → Nueva contraseña
- ✅ **Mensajes claros** de éxito/error/info
- ✅ **Validación en tiempo real** de contraseñas
- ✅ **Diseño responsive** con gradientes modernos
- ✅ **Navegación fluida** entre pasos

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Paso 1     │  │   Paso 2     │  │   Paso 3     │     │
│  │ Ingresar     │→ │ Verificar    │→ │   Crear      │     │
│  │   Email      │  │   Código     │  │   Password   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         ↓                 ↓                  ↓              │
└─────────┼─────────────────┼──────────────────┼─────────────┘
          │                 │                  │
          ↓                 ↓                  ↓
┌─────────────────────────────────────────────────────────────┐
│                      BACKEND API                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ POST /auth/solicitar-recuperacion                    │  │
│  │   • Valida email en BD                               │  │
│  │   • Genera código 6 dígitos                          │  │
│  │   • Guarda en Map con expiración                     │  │
│  │   • Envía email con SendGrid                         │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ POST /auth/verificar-codigo                          │  │
│  │   • Valida código y expiración                       │  │
│  │   • Controla intentos fallidos (máx 3)               │  │
│  │   • Retorna éxito/error                              │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ POST /auth/cambiar-password                          │  │
│  │   • Valida contraseña fuerte                         │  │
│  │   • Hash con bcrypt                                  │  │
│  │   • Actualiza BD                                     │  │
│  │   • Elimina código usado                             │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────┬───────────────────────────────────────────────────┘
          │
          ↓
┌─────────────────────────────────────────────────────────────┐
│                       SENDGRID                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Envío de Email Profesional                           │  │
│  │   • HTML con diseño ParkPay                          │  │
│  │   • Código destacado visualmente                     │  │
│  │   • Advertencia de expiración                        │  │
│  │   • Footer corporativo                               │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Archivos del Sistema

### Frontend
```
📂 PP/
├── recuperar.html              # Interfaz de 3 pasos
├── js/
│   ├── recuperar.js           # Lógica del frontend
│   ├── auth.js                # Validación de contraseñas (actualizado)
│   └── admin-auth.js          # Validación de contraseñas admin (actualizado)
└── index.html                 # Enlace "¿Olvidaste tu contraseña?"
```

### Backend
```
📂 backend/
├── routes/
│   └── auth.js                # 3 endpoints nuevos + función SendGrid
├── .env                       # Variables de entorno (SENDGRID_API_KEY)
├── .env.example              # Plantilla de configuración
└── package.json              # Dependencia: @sendgrid/mail
```

### Documentación
```
📂 PP/
├── SENDGRID_SETUP.md         # Guía completa de configuración
└── RECUPERACION_README.md    # Este archivo
```

---

## 🚀 Uso del Sistema

### Para Usuarios

1. **Olvidé mi contraseña**
   - Ve a https://parkpay.vercel.app
   - Click en "¿Olvidaste tu contraseña?"

2. **Paso 1: Ingresar Email**
   - Escribe tu email registrado
   - Click en "Enviar Código de Recuperación"
   - Espera ~5 segundos

3. **Paso 2: Verificar Código**
   - Revisa tu email (bandeja + spam + promociones)
   - Copia el código de 6 dígitos
   - Ingrésalo en la página
   - Tienes 3 intentos y 10 minutos

4. **Paso 3: Nueva Contraseña**
   - Crea una contraseña fuerte:
     * Mínimo 6 caracteres
     * 1 letra mayúscula
     * 1 número
   - Confirma la contraseña
   - ¡Listo! Ya puedes iniciar sesión

### Para Desarrolladores

#### Modo Desarrollo (Sin SendGrid)
```bash
# No configures SENDGRID_API_KEY en .env
cd backend
npm start

# Los códigos aparecerán en consola:
# 📧 [MODO DESARROLLO] Código para user@email.com: 123456
```

#### Modo Producción (Con SendGrid)
```bash
# Configura en backend/.env:
SENDGRID_API_KEY=SG.tu_api_key_aqui
SENDGRID_FROM_EMAIL=tu_email_verificado@gmail.com

# Reinicia el servidor
npm start

# Los emails se enviarán automáticamente
```

---

## 🔧 Configuración de SendGrid

### Opción A: Desarrollo Local
Ver archivo completo: **`SENDGRID_SETUP.md`**

### Opción B: Producción en Render
1. Ve a https://dashboard.render.com
2. Selecciona tu servicio backend
3. Environment → Add Environment Variable:
   ```
   SENDGRID_API_KEY = SG.xxxxxxxx
   SENDGRID_FROM_EMAIL = tu_email@gmail.com
   ```
4. Save Changes (Render reiniciará automáticamente)

---

## 🧪 Testing

### Test Manual del Flujo Completo
```bash
# 1. Registra un usuario de prueba
POST /api/auth/register
{
  "nombre": "Test",
  "apellido": "Usuario",
  "email": "test@example.com",
  "password": "Test123",
  "tipo": "Automóvil",
  "placa": "TEST-123"
}

# 2. Solicita recuperación
POST /api/auth/solicitar-recuperacion
{
  "email": "test@example.com"
}

# 3. Verifica el código (desde email o consola)
POST /api/auth/verificar-codigo
{
  "email": "test@example.com",
  "codigo": "123456"
}

# 4. Cambia la contraseña
POST /api/auth/cambiar-password
{
  "email": "test@example.com",
  "nueva_password": "Nueva123"
}

# 5. Login con nueva contraseña
POST /api/auth/login
{
  "email": "test@example.com",
  "password": "Nueva123"
}
```

### Test de Seguridad
```bash
# ❌ Contraseña débil rechazada
POST /api/auth/cambiar-password
{ "nueva_password": "abc" }
# Error: "La contraseña debe tener al menos 6 caracteres"

# ❌ Sin mayúscula rechazada
POST /api/auth/cambiar-password
{ "nueva_password": "test123" }
# Error: "La contraseña debe contener al menos una mayúscula"

# ❌ Sin número rechazada
POST /api/auth/cambiar-password
{ "nueva_password": "TestABC" }
# Error: "La contraseña debe contener al menos un número"

# ❌ Código expirado
# Espera 11 minutos después de solicitar
POST /api/auth/verificar-codigo
# Error: "El código ha expirado"

# ❌ Máximo 3 intentos
# Ingresa código incorrecto 3 veces
POST /api/auth/verificar-codigo
# Error: "Demasiados intentos fallidos"
```

---

## 📊 Monitoreo

### Logs en Desarrollo
```bash
# Backend local
npm start

# Verás en consola:
📧 [MODO DESARROLLO] Código para user@email.com: 123456
✅ Email de recuperación enviado a user@email.com
❌ Error al enviar email: [detalles del error]
```

### Logs en Render
1. Ve a tu servicio en Render
2. Click en "Logs" en el menú izquierdo
3. Busca líneas con:
   ```
   ✅ Email de recuperación enviado
   📧 [MODO DESARROLLO] Código
   ❌ Error al enviar email
   ```

### Estadísticas SendGrid
1. Dashboard → Activity
2. Verás:
   - Emails enviados hoy
   - Tasa de entrega
   - Emails abiertos
   - Rebotes/spam

---

## ⚠️ Troubleshooting

### "No me llega el email"
1. ✅ Revisa spam/promociones
2. ✅ Verifica que el email está verificado en SendGrid
3. ✅ Revisa logs de Render (¿dice "enviado"?)
4. ✅ Espera 1-2 minutos (a veces demora)

### "Error al enviar email"
1. ✅ Verifica SENDGRID_API_KEY en Render
2. ✅ El API Key debe empezar con `SG.`
3. ✅ Revisa que el email remitente está verificado
4. ✅ Verifica límite diario (100 emails)

### "Código incorrecto"
1. ✅ El código expira en 10 minutos
2. ✅ Tienes máximo 3 intentos
3. ✅ El código es case-sensitive (todos números)
4. ✅ Copia-pega desde el email (evita errores)

---

## 🎯 Para la Presentación

### Checklist Pre-Presentación
- [ ] SendGrid configurado en Render (o modo desarrollo listo)
- [ ] Probado con tu email personal
- [ ] Email de prueba no está en spam
- [ ] Teléfono/laptop extra para mostrar email recibido
- [ ] Screenshots del email por si no llega en vivo

### Demo Script (3 minutos)
```
1. [Mostrar login] "Tenemos autenticación completa"
2. [Click en "¿Olvidaste tu contraseña?"] "Sistema de recuperación"
3. [Ingresar email] "Usamos SendGrid, servicio profesional"
4. [Mostrar email recibido] "El código llega en segundos"
5. [Explicar diseño] "HTML personalizado con marca ParkPay"
6. [Mostrar expiración] "10 minutos por seguridad"
7. [Ingresar código] "Validación en backend"
8. [Nueva contraseña] "Requisitos: 6 chars, 1 mayúscula, 1 número"
9. [Mostrar validación] "No acepta contraseñas débiles"
10. [Login exitoso] "Sistema completo funcionando"
```

---

## 📈 Estadísticas del Sistema

- **Tiempo de implementación**: ~2 horas
- **Endpoints creados**: 3
- **Archivos modificados**: 7
- **Líneas de código**: ~500
- **Costo mensual**: $0 (100% gratis)
- **Emails/día límite**: 100 (SendGrid)
- **Tiempo de expiración**: 10 minutos
- **Intentos máximos**: 3

---

## 🔮 Mejoras Futuras (Post-Presentación)

1. **Autenticación de 2 factores (2FA)**
   - Código enviado en cada login
   - App authenticator (Google, Microsoft)

2. **Rate limiting**
   - Máximo 5 intentos de recuperación por hora
   - Prevenir abuso del sistema

3. **Notificación de cambio de contraseña**
   - Email automático cuando se cambia password
   - Alerta de seguridad

4. **Historial de accesos**
   - Log de IPs y dispositivos
   - Detección de actividad sospechosa

5. **Recovery tokens en BD**
   - Mover de Map a PostgreSQL
   - Persistencia entre reinicios del servidor

6. **Preguntas de seguridad**
   - Opción alternativa a email
   - ¿Cuál es tu X?

---

## 📚 Referencias

- **SendGrid Docs**: https://docs.sendgrid.com/
- **Bcrypt**: https://www.npmjs.com/package/bcryptjs
- **HTML Email Best Practices**: https://www.emailonacid.com/
- **OWASP Password Guidelines**: https://cheatsheetseries.owasp.org/

---

**Sistema implementado por: ProtoFurOwO**  
**Fecha: 19 de Octubre, 2025**  
**Presentación: 21 de Octubre, 2025** 🎓
