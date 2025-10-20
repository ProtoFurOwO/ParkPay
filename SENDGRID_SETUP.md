# 📧 Guía de Configuración SendGrid - Sistema de Recuperación de Contraseñas

## 🎯 ¿Por qué SendGrid?
- ✅ **100 emails/día GRATIS** (suficiente para recuperación de contraseñas)
- ✅ **No llega a spam** (IPs con buena reputación)
- ✅ **Profesional** (emails con diseño HTML)
- ✅ **Sin código de frontend** (todo en backend por seguridad)

---

## 🚀 Configuración Paso a Paso (15 minutos)

### **Paso 1: Crear Cuenta SendGrid**
1. Ve a: https://sendgrid.com
2. Click en **"Start for Free"**
3. Completa el registro:
   - Email personal
   - Contraseña fuerte
   - Confirma tu email

### **Paso 2: Verificar Email de Remitente (IMPORTANTE)**
1. En el dashboard, ve a: **Settings > Sender Authentication**
2. Click en **"Verify a Single Sender"**
3. Completa el formulario:
   ```
   From Name: ParkPay
   From Email Address: tu_email@gmail.com (o cualquier email tuyo)
   Reply To: tu_email@gmail.com
   Company Address: Cualquier dirección
   ```
4. **Revisa tu email** y click en el enlace de verificación
5. ✅ Espera a que aparezca "Verified" (puede tardar 5 min)

### **Paso 3: Crear API Key**
1. Ve a: **Settings > API Keys**
2. Click en **"Create API Key"**
3. Configuración:
   ```
   API Key Name: ParkPay_Recuperacion
   API Key Permissions: Restricted Access
   ```
4. Expande **"Mail Send"** y marca:
   - ✅ Mail Send (FULL ACCESS)
5. Click en **"Create & View"**
6. **⚠️ COPIA el API Key AHORA** (solo se muestra una vez):
   ```
   SG.xxxxxxxxxxxxxxxxxxxxxxxxx
   ```

### **Paso 4: Configurar en Render**
1. Ve a tu backend en Render: https://dashboard.render.com
2. Selecciona tu servicio **parkpay-backend**
3. Ve a **"Environment"** en el menú izquierdo
4. Click en **"Add Environment Variable"**
5. Agrega estas 2 variables:
   ```
   SENDGRID_API_KEY = SG.tu_api_key_completo_aqui
   SENDGRID_FROM_EMAIL = tu_email_verificado@gmail.com
   ```
6. Click en **"Save Changes"**
7. Render reiniciará automáticamente el servicio

### **Paso 5: Configurar Localmente (Opcional)**
1. Edita `backend/.env`:
   ```bash
   SENDGRID_API_KEY=SG.tu_api_key_aqui
   SENDGRID_FROM_EMAIL=tu_email_verificado@gmail.com
   ```
2. Reinicia el servidor local: `npm start`

---

## 🧪 Probar el Sistema

### **Prueba Local (Sin SendGrid - Modo Desarrollo)**
Si no configuras `SENDGRID_API_KEY`, el código aparece en la consola:
```bash
📧 [MODO DESARROLLO] Código para usuario@email.com: 123456
```

### **Prueba con SendGrid (Producción)**
1. Ve a https://parkpay.vercel.app
2. Click en **"¿Olvidaste tu contraseña?"**
3. Ingresa un email registrado
4. ✅ Deberías recibir el email en ~5 segundos
5. Revisa:
   - ✅ Bandeja de entrada
   - ✅ Carpeta de Spam (por si acaso)
   - ✅ Promociones (Gmail)

---

## 📊 Monitorear Emails Enviados

### **Ver Estadísticas en SendGrid**
1. Ve a: **Activity** en el dashboard
2. Verás:
   - ✅ Emails enviados (Delivered)
   - ❌ Emails rebotados (Bounced)
   - 📨 Emails abiertos (Opened)
   - 🚫 Marcados como spam

### **Límites del Plan Gratuito**
- 📬 **100 emails/día**
- 📅 **Ilimitados contactos**
- 📊 **Estadísticas básicas** (30 días)
- 🆓 **Forever Free** (no expira)

---

## ⚠️ Solución de Problemas

### **Error: "Unauthorized"**
- ✅ Verifica que copiaste el API Key completo
- ✅ El API Key debe empezar con `SG.`
- ✅ Asegúrate de dar permisos "Mail Send"

### **Error: "Email not verified"**
- ✅ Verifica tu email en SendGrid
- ✅ Espera 5-10 minutos después de verificar
- ✅ El email en `SENDGRID_FROM_EMAIL` debe coincidir con el verificado

### **Los emails llegan a spam**
- ✅ Verifica tu dominio (no solo el email) para mejor reputación
- ✅ Configura SPF/DKIM en tu dominio (avanzado)
- ✅ Usa un email corporativo en vez de Gmail

### **No recibo el email**
1. Revisa la consola del servidor en Render:
   ```
   ✅ Email de recuperación enviado a usuario@email.com
   ```
2. Si ves el mensaje, el email se envió correctamente
3. Revisa spam/promociones en tu correo
4. Verifica en SendGrid Activity si fue entregado

---

## 🎓 Para la Presentación

### **Opción 1: Usar Modo Desarrollo (Más Fácil)**
- No configures SendGrid
- Los códigos se muestran en consola
- Explica que en producción usarías SendGrid

### **Opción 2: Usar SendGrid (Más Profesional)**
- Configura SendGrid completo
- Muestra el email recibido en vivo
- Demuestra el diseño HTML profesional

### **Demo Script Sugerido**
```
1. "Aquí tenemos el sistema de recuperación de contraseñas"
2. [Click en "¿Olvidaste tu contraseña?"]
3. [Ingresa email registrado]
4. "El sistema usa SendGrid para envío profesional de emails"
5. [Muestra el email recibido en tu teléfono]
6. "Como ven, el código llega con un diseño profesional"
7. [Ingresa el código de 6 dígitos]
8. "El código expira en 10 minutos por seguridad"
9. [Crea nueva contraseña cumpliendo requisitos]
10. "Y listo, contraseña actualizada exitosamente"
```

---

## 📚 Recursos Adicionales

- 📖 Docs SendGrid: https://docs.sendgrid.com/
- 🎨 Template Editor: https://mc.sendgrid.com/dynamic-templates
- 💰 Pricing: https://sendgrid.com/pricing/
- 🆘 Soporte: https://support.sendgrid.com/

---

## ✅ Checklist Final

Antes de la presentación:
- [ ] SendGrid configurado en Render (o modo desarrollo habilitado)
- [ ] Email de remitente verificado
- [ ] Probado con al menos 2 emails diferentes
- [ ] Verificado que no llega a spam
- [ ] Documentación lista para mostrar
- [ ] Teléfono/laptop extra para mostrar email recibido en tiempo real

---

**¡Éxito en tu presentación! 🎉**
